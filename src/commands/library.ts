import { CliError, isCliError } from "@wirecat/cli-base"
import { annotate, metaOf } from "@wirecat/cli-base/commands"
import type { NextStep } from "@wirecat/cli-base/standards"
import { type Deadline, progressOf } from "@wirecat/cli-core/background"
import {
  actorOf,
  answerEntity,
  type Body,
  FETCH,
  itemOf,
  listOf,
  outputFor,
  positiveCount,
  REMOTE_READ,
  refuseOffline,
  renderAnswer,
  resolveAISettings,
  writesOwnerFiles,
} from "@wirecat/cli-core/cli"
import { catalogFiles, syncDocuments } from "@wirecat/cli-core/documents"
import {
  addDocumentCommands,
  DOCUMENT_UNTRUSTED,
  type DocumentWords,
  keepVersionsForDays,
  marksUntrusted,
} from "@wirecat/cli-core/documents/cli"
import { modelGateway, modelTarget } from "@wirecat/cli-core/models"
import { Command } from "commander"
import * as v from "valibot"
import { contextOf, notionCallFor, tokenOf } from "../context.js"

import { IDENTITY } from "../identity.js"
import { ingestionOf, knowledgeOf } from "../knowledge.js"
import {
  chosenFolders,
  claimAccount,
  foldersChangedAt,
  knownOf,
  MAX_ENTRIES,
  PROVIDER,
  principalOf,
  reachedOf,
  readSnapshot,
  rootsOf,
  saveFolders,
  saveUserAccess,
  syncState,
  TEXT_LIMIT,
  userAccessOf,
  walkUnderWay,
  withProfileLock,
  withStore,
} from "../library.js"
import { notionId } from "../notion/ids.js"
import { notionSourceFromConfig } from "../sync/from-config.js"
import {
  isNotionDocument,
  isNotionFolder,
  type NotionFile,
  passUnderWay,
  type SyncWarning,
  WORKSPACE_ROOT,
} from "../sync/source.js"
import { VERSION } from "../version.js"
import {
  checkCommand,
  createCommand,
  deleteCommand,
  getCommand,
  moveCommand,
  renameCommand,
  restoreCommand,
  updateCommand,
} from "./documents.js"

type NotionCall = ReturnType<typeof notionCallFor>

const CLI = IDENTITY.command

export const NOTION_WORDS: DocumentWords = {
  app: CLI,
  remote: "notion",
  provider: "Notion",
  source: PROVIDER.name,
  text: {
    documents: "read Notion pages, live or from the local copy",
    documentsList: "list the synced pages and database rows with their Notion links",
    documentArgument: "page id, Notion link, or a search hit's document: ref",
    knowledgeArgument: "page or database id or Notion link in the local copy, or a document:<n> ref",
    catalog: "browse the synced pages and databases offline",
    catalogArgument: "page or database id, or its Notion link",
    treeArgument: "page or database id or link; defaults to the chosen folders, or the whole workspace",
    folders: "choose the Notion pages and databases sync copies; none chosen copies everything the token sees",
    folderArgument: "page or database id, or its Notion link",
    syncLimit: "how many pages to read from Notion in this run",
    identitiesList: "list the creator and last editor Notion shows for a page",
  },
}

const DOCUMENT_REF = /^document:[1-9]\d*$/u

const idOf = (input: string, what = "page") => (input === WORKSPACE_ROOT ? input : notionId(input, what))

const documentRow = (file: NotionFile, reference: string) => ({
  id: file.id,
  name: file.name,
  kind: file.providerMetadata.kind,
  url: file.url,
  parents: file.parents,
  modified_at: file.modifiedAt ?? null,
  created_at: file.createdAt ?? null,
  reference,
})

const BROWSE_LIMIT = 100

const browseRow = v.strictObject({
  id: v.string(),
  name: v.string(),
  kind: v.picklist(["page", "database"]),
  url: v.string(),
  parent: v.nullable(v.string()),
  added: v.boolean(),
})

const BROWSE_HELP = `
Each item, one level of the tree (--json prints them under "items"):
  id      page or database id to pass to --parent or to folders add
  name    its title in Notion
  kind    page or database; a database lists no folders inside, as its rows are not folders
  url     its Notion link
  parent  the --parent given, or null at the top of the workspace
  added   whether sync already copies it (folders add)
The top of the workspace holds its top-level pages and databases, and those whose parent the token cannot see.
A level comes a page at a time: when page.has_more is true, run it again with --cursor from page.next_cursor.
A page can come back with fewer items than --limit, or none, and still have more.`

/** An issue names its source and why; the id and the words stay in the answer's `warnings`. */
const issuesOf = (warnings: SyncWarning[]) => {
  const seen = new Set<string>()
  return warnings.flatMap((warning) => {
    const key = `${warning.code}:${warning.reason}`
    if (seen.has(key)) return []
    seen.add(key)
    return [{ code: warning.code, reason: warning.reason, source: PROVIDER.name }]
  })
}

const errorOf = (error: unknown) =>
  isCliError(error) ? error : new CliError("provider_error", "a Notion read failed", { reason: "notion.failed" })

/**
 * cli-core's shared `folders`, `sync`, `status`, `documents`, `search`, `catalog` and knowledge groups over Notion and
 * the shared store, with notion's own `folders browse`, `documents get` and `documents add`. The ports take no command,
 * so each run's command is caught as it starts; an MCP server builds the tree anew for every call.
 */
export const libraryCommands = (): Command[] => {
  const holder = new Command(CLI)
  let running: Command | undefined
  const command = () => {
    if (!running) throw new CliError("configuration_error", "a shared documents port ran outside a command")
    return running
  }
  const context = () => contextOf(command())
  const env = () => context().env
  const profile = () => context().profile
  const state = () => syncState(env(), profile(), principalOf(env(), profile())).read()
  let warnings: SyncWarning[] = []
  let next: NextStep[] | undefined

  const syncAgain = (limit: number): NextStep => {
    const timeout = command().optsWithGlobals().timeout
    return {
      kind: "command",
      step: "sync.run",
      command: "sync",
      args: { limit, ...(timeout === undefined ? {} : { timeout }) },
      why: "the sync stopped before the end of its pass; running it again goes on from there",
      safe_to_auto_execute: true,
    }
  }

  const output = (body: Body) => {
    const issues = issuesOf(warnings)
    const answer = {
      ...body,
      ...(next && !body.next?.length ? { next } : {}),
      ...(issues.length ? { meta: { ...body.meta, issues: [...(body.meta?.issues ?? []), ...issues] } } : {}),
    }
    renderAnswer(command(), outputFor(command()), answer)
  }

  const imported = (input: string) => {
    const held = syncState(env(), profile(), "").read()
    const id = DOCUMENT_REF.test(input)
      ? Object.entries(held.documents).find(([, doc]) => doc.reference === input)?.[0]
      : idOf(input)
    const doc = id ? held.documents[id] : undefined
    const snapshot = id && doc ? readSnapshot(env(), profile(), id) : undefined
    if (!id || !doc || !snapshot)
      throw new CliError("not_found", "this page is not in the selected profile's local copy", {
        reason: "document.not-imported",
      })
    return { id, ref: doc.reference, hash: doc.hash, snapshot, metadata: documentRow(doc.metadata, doc.reference) }
  }

  /** The document a knowledge command names: a synced page, or a database the catalog holds. */
  const refOf = async (store: Parameters<typeof ingestionOf>[0], principal: string, input: string) => {
    if (DOCUMENT_REF.test(input)) return input
    const id = idOf(input)
    const held = syncState(env(), profile(), principal).read().documents[id]
    if (held) return held.reference
    const entry = await ingestionOf(store).catalog.get(principal, id)
    if (entry) return entry.ref
    throw new CliError("not_found", "this page or database is not in the selected profile's local copy", {
      reason: "document.not-imported",
    })
  }

  /** A write to the local copy holds the sync's lock; a read does not wait for a sync to end. */
  const locked = <T>(write: boolean, fn: (assertHeld: () => void) => Promise<T>) =>
    write ? withProfileLock(env(), profile(), fn) : fn(() => undefined)
  const writes = () => metaOf(command()).effects?.local === "write"
  const decider = () => {
    const actor = actorOf(command())
    return actor === "owner" ? ("owner" as const) : { bot: actor, reason: `asked by ${actor} through ${CLI}` }
  }

  const sourceFor = (notion: NotionCall, held = false, deadline?: Deadline) =>
    notionSourceFromConfig(notion.call, {
      serverTime: notion.serverTime,
      roots: rootsOf(env(), profile()),
      userAccess: (access) => saveUserAccess(env(), profile(), access),
      access: () => userAccessOf(env(), profile()),
      ...(held
        ? {
            known: () => knownOf(syncState(env(), profile(), "").read()),
            reached: () => reachedOf(env(), profile(), syncState(env(), profile(), "").read()),
          }
        : {}),
      warn: (warning) => warnings.push(warning),
      ...(deadline ? { deadline } : {}),
    })

  /** One Notion run: the token read first, every request inside cli-core's run (WC-LIFE-15). */
  const withNotionReads = <T>(body: (notion: NotionCall) => Promise<T>) => {
    const token = tokenOf(command())
    return context().run((events) => body(notionCallFor(command(), token, events)))
  }

  const documents = addDocumentCommands<unknown>(holder, {
    words: NOTION_WORDS,
    output,
    folders: {
      add: async (input) => {
        const id = notionId(input)
        const file = await withNotionReads((reads) => sourceFor(reads).metadata(id))
        if (file.trashed || !["page", "database"].includes(file.providerMetadata.kind))
          throw new CliError("validation_error", "choose a page or a database the token can see", {
            reason: "folder.not-a-folder",
          })
        const roots = chosenFolders(env(), profile())
        if (!roots.includes(file.id)) saveFolders(env(), profile(), [...roots, file.id])
        return { id: file.id, name: file.name }
      },
      list: (filter) =>
        rootsOf(env(), profile())
          .filter((id) => filter.id === undefined || filter.id === id)
          .map((id) => ({ id })),
      remove: (input) => {
        if (input === WORKSPACE_ROOT)
          throw new CliError("validation_error", "the whole workspace is synced when no folder is chosen", {
            reason: "folder.workspace",
          })
        const id = notionId(input)
        const roots = chosenFolders(env(), profile())
        if (!roots.includes(id))
          throw new CliError("not_found", `${id} is not a chosen folder; folders list shows them`, {
            reason: "folder.not-chosen",
          })
        const left = roots.filter((root) => root !== id)
        saveFolders(env(), profile(), left)
        if (!left.length) {
          outputFor(command()).renderer.warn(
            "no folder is chosen now, so the next sync copies the whole workspace the token sees",
          )
          next = [
            {
              kind: "command",
              step: "folders.browse",
              command: "folders browse",
              args: {},
              why: "the next sync copies the whole workspace; choose a page or database to keep it narrow",
              safe_to_auto_execute: true,
            },
          ]
        }
        return id
      },
      browse: (folders) => {
        answerEntity(
          annotate(folders.command("browse"), {
            effects: REMOTE_READ,
            offline: false,
            examples: [
              `${CLI} personal folders browse`,
              `${CLI} personal folders browse --parent PAGE_ID --json`,
              `${CLI} personal folders browse --limit 20 --cursor CURSOR`,
            ],
          }),
          "notion_folder",
          browseRow,
        )
          .summary("list Notion pages and databases one level at a time, live")
          .description("list Notion pages and databases one level at a time, live, to choose one for folders add")
          .option("--parent <id>", "page id or Notion link to list inside; the top of the workspace without it")
          .option("--limit <n>", `at most this many; ${BROWSE_LIMIT} if not given`, positiveCount("--limit"))
          .option(
            "--cursor <cursor>",
            "go on from where the last page stopped; page.next gives it, with the same --parent",
          )
          .addHelpText("after", BROWSE_HELP)
          .action(async (args: { parent?: string; limit?: number; cursor?: string }) => {
            const parent = args.parent === undefined ? WORKSPACE_ROOT : notionId(args.parent)
            const limit = args.limit ?? BROWSE_LIMIT
            const chosen = new Set(chosenFolders(env(), profile()))
            const level = await withNotionReads((reads) => sourceFor(reads).browse(parent, limit, args.cursor))
            const items = level.files
              .filter((file) => file.providerMetadata.kind === "page" || file.providerMetadata.kind === "database")
              .map((file) => ({
                id: file.id,
                name: file.name,
                kind: file.providerMetadata.kind,
                url: file.url,
                parent: args.parent === undefined ? null : parent,
                added: chosen.has(file.id),
              }))
            output(
              listOf("folders browse", {
                items,
                limit,
                has_more: level.cursor !== undefined,
                paging: "cursor",
                ...(level.cursor ? { cursor: level.cursor } : {}),
                args: args.parent === undefined ? {} : { parent },
                ...(level.cut
                  ? {
                      missing: [
                        {
                          field: "items",
                          why: "Notion's search gave only its 10,000 most recently edited results; older top-level pages or databases may be missing",
                        },
                      ],
                    }
                  : {}),
              }),
            )
          })
      },
    },
    sync: {
      diagnostic: (text) => outputFor(command()).streams.diagnostic(text),
      profile,
      maxEntries: MAX_ENTRIES,
      sync: async ({ limit, rescan, embed, budget, deadline }) => {
        refuseOffline(command(), "Notion")
        warnings = []
        const name = profile()
        const roots = rootsOf(env(), name)
        const result = await withNotionReads(async (reads) => {
          const source = sourceFor(reads, true, deadline)
          const live = await source.identity()
          claimAccount(env(), name, live, context().tokens)
          return withProfileLock(env(), name, (assertHeld) =>
            withStore(env(), true, async (store) => {
              const ingestion = ingestionOf(store)
              const synced = await syncDocuments<NotionFile>({
                source,
                index: {
                  ...ingestion,
                  openPictures: async () => {
                    throw new CliError("not_found", "a Notion page has no picture to search")
                  },
                },
                state: syncState(env(), name, live),
                principal: live,
                profile: name,
                roots,
                textLimit: TEXT_LIMIT,
                max: limit,
                maxEntries: MAX_ENTRIES,
                isFolder: isNotionFolder,
                isDocument: isNotionDocument,
                skipReason: () => undefined,
                retryable: () => false,
                errorOf,
                assertHeld,
                storeVersion: VERSION,
                keepVersionsForDays: keepVersionsForDays(context().settings),
                ...(context().environment.signal ? { signal: context().environment.signal } : {}),
                ...(rescan ? { rescan } : {}),
                ...(budget ? { budget } : {}),
                ...(deadline ? { deadline } : {}),
              })
              if (!embed) return synced
              const { embedNotes } = await import("@wirecat/cli-core/services")
              return { ...synced, embeddings: await embedNotes(store, { maxChunks: 600, env: env(), command: CLI }) }
            }),
          )
        })
        // The engine counts a round of changes as done; Notion's own pass may still have tasks for the next sync.
        // A cut listing leaves its cursor on the engine's pending plan until the plan's pages are saved.
        const held = syncState(env(), name, "").read()
        const underWay = passUnderWay(held.pending?.cursor ?? held.cursor)
        // As cli-core's own step: a page that keeps failing would make "sync again" an endless loop.
        if (underWay && !result.errors.length) next = [syncAgain(limit)]
        return {
          ...result,
          ...(underWay ? { complete: false } : {}),
          warnings: warnings.map(({ id, code, reason, message }) => ({ id: id ?? null, code, reason, message })),
        }
      },
      status: () => {
        const name = profile()
        const held = syncState(env(), name, "").read()
        const documents = Object.keys(held.documents).length
        const pending = held.pending?.jobs.length ?? 0
        const queued = new Set(held.pending?.jobs.map((job) => job.id))
        const done = Object.keys(held.documents).filter((id) => !queued.has(id)).length
        const changed = foldersChangedAt(env(), name)
        // Until the plan is made, or while Notion's own pass goes on, nothing says how much is left.
        const unplanned =
          walkUnderWay(env(), name) ||
          passUnderWay(held.pending?.cursor ?? held.cursor) ||
          (changed !== undefined && (!held.lastSync || Date.parse(changed) > Date.parse(held.lastSync)))
        return {
          profile: name,
          selected_folders: chosenFolders(env(), name),
          scope: chosenFolders(env(), name).length ? "chosen folders" : "the whole workspace the token sees",
          documents,
          pending,
          skipped: held.skipped.map(({ id, reason }) => ({ id, reason })),
          last_sync: held.lastSync ?? null,
          progress: progressOf({
            job: "sync",
            profile: name,
            done,
            ...(unplanned || (!held.lastSync && !held.pending) ? {} : { total: done + pending }),
            ...(held.lastSync ? { updatedAt: held.lastSync } : {}),
            complete: Boolean(held.lastSync) && !held.pending && !unplanned,
          }),
          coverage: "pages, pages under pages and database rows, as Notion Markdown; files inside pages are not copied",
          remote_checked: false,
        }
      },
    },
    history: {
      run: (fn) => {
        const principal = principalOf(env(), profile())
        return withStore(env(), false, (store) => fn(ingestionOf(store).history, principal))
      },
      id: (input) => idOf(input),
    },
    documents: {
      list: (query, page) => {
        const principal = principalOf(env(), profile())
        return withStore(env(), false, async (store) => {
          const found = await knowledgeOf(store, principal).documents(principal, query, page)
          const held = state().documents
          return {
            items: found.items.map((note) => {
              const id = (note.path ?? "").replace(/\.md$/u, "")
              const doc = held[id]
              return doc ? documentRow(doc.metadata, doc.reference) : { id, name: note.title, reference: note.ref }
            }),
            hasMore: found.hasMore,
          }
        })
      },
      document: (input) => {
        const { id, metadata, snapshot } = imported(input)
        return { id, metadata, snapshot }
      },
      lastSync: () => syncState(env(), profile(), "").read().lastSync,
    },
    search: {
      search: (query, options) => {
        const principal = principalOf(env(), profile())
        return withStore(env(), false, async (store) => {
          const folder = await ingestionOf(store).collection(principal, false)
          if (!folder) return { query, by: "words", hits: [], has_more: false }
          const { searchNotes } = await import("@wirecat/cli-core/services")
          const { items, hasMore, nextOffset, ...rest } = await searchNotes(store, query, {
            ...options,
            folderIds: [folder.id],
            env: env(),
            command: CLI,
          })
          return {
            ...rest,
            hits: items.map((hit) => ({ id: (hit.path ?? "").replace(/\.md$/u, ""), ...hit })),
            has_more: hasMore,
            ...(nextOffset === undefined ? {} : { next_offset: nextOffset }),
          }
        })
      },
      // The whole workspace is the scope when no folder is chosen, so there is always something chosen.
      imported: () => ({
        profile: profile(),
        chosen: true,
        documents: Object.keys(syncState(env(), profile(), "").read().documents).length,
      }),
    },
    catalog: {
      run: (fn, write) => {
        const principal = principalOf(env(), profile())
        return withStore(env(), write, (store) =>
          locked(write, async (assertHeld) => {
            const ingestion = ingestionOf(store)
            assertHeld()
            const value = await fn(
              {
                catalog: {
                  import: (account) =>
                    ingestion.catalog.import(
                      account,
                      catalogFiles(syncState(env(), profile(), account).read(), rootsOf(env(), profile())),
                    ),
                  get: (account, id) => ingestion.catalog.get(account, id),
                  list: (account, query) => ingestion.catalog.list(account, query),
                },
                knowledge: knowledgeOf(store, principal),
              },
              principal,
            )
            assertHeld()
            return value
          }),
        )
      },
      id: (input) => idOf(input),
      roots: () => rootsOf(env(), profile()),
    },
    knowledge: {
      run: (input, fn) => {
        const write = writes()
        const principal = principalOf(env(), profile())
        return withStore(env(), write, (store) =>
          locked(write, async (assertHeld) => {
            const ref = await refOf(store, principal, input)
            assertHeld()
            const value = await fn(knowledgeOf(store, principal), principal, ref)
            assertHeld()
            return value
          }),
        )
      },
      document: (input) => {
        const { id, ref, hash, snapshot } = imported(input)
        return { id, ref, hash, snapshot }
      },
      complete: () => {
        const { values } = resolveAISettings(IDENTITY.envPrefix, [], env())
        const variables = env()
        return modelGateway({
          resolve: (purpose) => modelTarget(values, purpose),
          // Called only by `memories extract`, which the owner or an agent runs on purpose.
          consent: () => true,
          key: (provider) =>
            variables[`${IDENTITY.envPrefix}_${provider.toUpperCase()}_API_KEY`] ??
            variables[`${provider.toUpperCase()}_API_KEY`],
          ...(context().environment.signal ? { signal: context().environment.signal } : {}),
        }).complete
      },
      author: () => {
        const actor = actorOf(command())
        return actor === "owner" ? "owner" : { bot: actor, kind: "agent" }
      },
      decider,
    },
  })
  documents.addCommand(marksUntrusted(getCommand(), ["markdown"])).addCommand(checkCommand())
  documents.addCommand(createCommand()).addCommand(updateCommand()).addCommand(deleteCommand())
  documents.addCommand(restoreCommand()).addCommand(moveCommand()).addCommand(renameCommand())
  annotate(documents.command("add"), {
    effects: FETCH,
    mcp: false,
    offline: false,
    examples: [
      `${CLI} personal documents add https://www.notion.so/Roadmap-0123456789abcdef0123456789abcdef`,
      `${CLI} personal documents add PAGE_ID --subject person:PERSON_UID`,
    ],
  })
    .summary("keep one Notion page's text in memory, read live, without syncing a folder")
    .description(
      "read one page live and keep its text among the sources added by hand, where memo and search all find it; " +
        "adding it again keeps its new text as the next revision",
    )
    .argument("<page>", "the page's id or its Notion link")
    .option("--title <title>", "the title to keep it under; the page's own when omitted")
    .option(
      "--subject <ref>",
      "a person, organization, project, task or meeting it is about; repeat to add more",
      (value: string, previous: string[] = []) => [...previous, value],
    )
    .action(async (input: string, args: { title?: string; subject?: string[] }) => {
      const id = notionId(input)
      const content = await withNotionReads((reads) => sourceFor(reads).content(id, TEXT_LIMIT))
      const added = await withStore(env(), true, (store) =>
        store.notes.saveAddedSource({
          kind: "page",
          text: content.text,
          read: content.text ? "extracted" : "no-text",
          title: args.title ?? content.metadata.name,
          url: content.metadata.url,
          sourceKey: `notion:${id}`,
          ...(args.subject ? { subjects: args.subject } : {}),
          by: decider(),
        }),
      )
      output(itemOf(added))
    })
  const find = (group: Command, name: string) => group.commands.find((one) => one.name() === name) as Command
  const folders = find(holder, "folders")
  // Choosing a folder changes what the next sync keeps and removes, so an agent asks for it through the write tool.
  writesOwnerFiles(find(folders, "add"))
  marksUntrusted(annotate(find(folders, "browse"), { partial: true }), DOCUMENT_UNTRUSTED)
  for (const group of holder.commands)
    group.hook("preAction", (_group, action) => {
      running = action
      warnings = []
      next = undefined
    })
  return [...holder.commands]
}
