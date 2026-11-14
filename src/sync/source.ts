import { CliError, isCliError } from "@wirecat/cli-base"
import type { DocumentSource, SourceChange, SourceContent, SourceFile } from "@wirecat/cli-core/documents"
import type {
  NotionDatabase,
  NotionDataSource,
  NotionPage,
  NotionParent,
  NotionReads,
  NotionUser,
} from "../notion/reads.js"
import { decodeCursor, encodeCursor, type SyncCursor, type SyncPass, type SyncTask } from "./cursor.js"
import { type FrontMatterValue, frontMatter, frontMatterLines, titleOf } from "./front-matter.js"
import { stripSignedLinks } from "./links.js"
import { pageText } from "./markdown.js"

/** The folder that stands for everything the token sees, the scope when no folder is chosen. */
export const WORKSPACE_ROOT = "notion-workspace"

const MINUTE = 60_000
/** Notion rounds `last_edited_time` down to the minute; a read this soon after it may miss an edit in that minute. */
export const SETTLE_MS = 3 * MINUTE
export const MIN_OVERLAP_MS = 2 * MINUTE
const DEFAULTS = { overlapMs: 10 * MINUTE, walkEveryMs: 24 * 60 * MINUTE, maxRequests: 2000 }
const PAGE_SIZE = 100

export type NotionKind = "workspace" | "page" | "row" | "database"

export interface NotionIdentity {
  id: string
  name?: string
  /** `author`, `editor`, or `property:<name>` for a people property. */
  role: string
}

export interface NotionMetadata {
  kind: NotionKind
  /** Notion's own parent. `parents` holds the container the sync files it under, which differs for a page in a block. */
  parent?: { type: NotionParent["type"]; id: string }
  dataSources?: { id: string; name: string }[]
  createdBy?: string
  lastEditedBy?: string
  /** Set by `content()` only. */
  frontMatter?: Record<string, FrontMatterValue>
  people?: NotionIdentity[]
  missingBlocks?: number
}

export interface NotionFile extends SourceFile {
  providerMetadata: NotionMetadata
}

/** Until cli-core plans a page with children as both, only the workspace and databases are walked as folders. */
export const isNotionFolder = (file: NotionFile) =>
  file.providerMetadata.kind === "workspace" || file.providerMetadata.kind === "database"

export interface NotionSourceOptions {
  /** Chosen pages and databases; none means everything the token sees. */
  roots?: string[]
  /** What the sync already holds (the state's documents and folders), to tell a missed page from a deleted one. */
  known?: () => Iterable<NotionFile>
  /** How far back each pass reads before the mark; at least two minutes. */
  overlapMs?: number
  walkEveryMs?: number
  /** Requests one `changes()` call may make before it returns what it has and a cursor to go on from. */
  maxRequests?: number
  now?: () => number
}

const parentId = (parent: NotionParent) => {
  switch (parent.type) {
    case "workspace":
      return WORKSPACE_ROOT
    case "page_id":
      return parent.page_id
    case "data_source_id":
      return parent.data_source_id
    case "database_id":
      return parent.database_id
    case "block_id":
      return parent.block_id
  }
}
const minus = (iso: string, ms: number) => new Date(Date.parse(iso) - ms).toISOString()
const later = (a: string | null, b: string | null) => (!a ? b : !b ? a : Date.parse(a) >= Date.parse(b) ? a : b)
const isNotFound = (error: unknown) => isCliError(error) && error.code === "not_found"
const text = (parts: { plain_text: string }[]) => parts.map((part) => part.plain_text).join("")

interface Listing {
  files: NotionFile[]
  /** Known items confirmed deleted, trashed or unshared by a direct read. */
  gone: string[]
  /** Known items that are still there, under another parent. */
  moved: NotionFile[]
}

export const notionSource = (notion: NotionReads, options: NotionSourceOptions = {}): DocumentSource<NotionFile> => {
  const overlapMs = options.overlapMs ?? DEFAULTS.overlapMs
  if (overlapMs < MIN_OVERLAP_MS) throw new CliError("validation_error", "the sync overlap must be two minutes or more")
  const walkEveryMs = options.walkEveryMs ?? DEFAULTS.walkEveryMs
  const maxRequests = options.maxRequests ?? DEFAULTS.maxRequests
  const roots = options.roots?.length ? options.roots : [WORKSPACE_ROOT]
  const now = options.now ?? Date.now

  let requests = 0
  const reads = new Proxy(notion, {
    get(target, key: keyof NotionReads) {
      const method = target[key]
      return (...args: unknown[]) => {
        requests++
        return (method as (...values: unknown[]) => unknown).apply(target, args)
      }
    },
  })

  const knownFiles = () => new Map([...(options.known?.() ?? [])].map((file) => [file.id, file]))
  // Containers resolved within one call; a page's parent is re-read on the next one, as it may have moved.
  let containers = new Map<string, string>()
  let accessible = new Set<string>()
  const fresh = () => {
    containers = new Map()
    accessible = new Set(knownFiles().keys())
  }

  /** The container a page sits in: its page or database, or the workspace when that parent is out of the token's view. */
  const containerOf = async (parent: NotionParent): Promise<string> => {
    if (parent.type === "workspace") return WORKSPACE_ROOT
    if (parent.type === "data_source_id" || parent.type === "database_id") return parent.database_id
    const id = parentId(parent)
    const cached = containers.get(id)
    if (cached) return cached
    let container: string
    try {
      if (parent.type === "block_id") container = await containerOf((await reads.retrieveBlock(id)).parent)
      else {
        if (!accessible.has(id)) await reads.retrievePage(id)
        container = id
      }
    } catch (error) {
      if (!isNotFound(error)) throw error
      container = WORKSPACE_ROOT
    }
    containers.set(id, container)
    return container
  }

  const versionOf = (edited: string) =>
    Date.parse(edited) + SETTLE_MS > now() ? `${edited}~unsettled~${now()}` : edited

  const pageFile = async (page: NotionPage): Promise<NotionFile> => {
    accessible.add(page.id)
    const row = page.parent.type === "data_source_id" || page.parent.type === "database_id"
    return {
      id: page.id,
      name: titleOf(page.properties),
      mime: "application/vnd.notion.page",
      parents: [await containerOf(page.parent)],
      version: versionOf(page.last_edited_time),
      modifiedAt: page.last_edited_time,
      createdAt: page.created_time,
      url: page.url,
      trashed: page.in_trash,
      canDownload: true,
      providerMetadata: {
        kind: row ? "row" : "page",
        parent: { type: page.parent.type, id: parentId(page.parent) },
        ...(page.created_by ? { createdBy: page.created_by.id } : {}),
        ...(page.last_edited_by ? { lastEditedBy: page.last_edited_by.id } : {}),
      },
    }
  }

  const databaseFile = async (database: NotionDatabase): Promise<NotionFile> => {
    accessible.add(database.id)
    return {
      id: database.id,
      name: text(database.title),
      mime: "application/vnd.notion.database",
      parents: [await containerOf(database.parent)],
      version: database.last_edited_time,
      modifiedAt: database.last_edited_time,
      createdAt: database.created_time,
      url: database.url,
      trashed: database.in_trash,
      canDownload: false,
      providerMetadata: {
        kind: "database",
        parent: { type: database.parent.type, id: parentId(database.parent) },
        dataSources: database.data_sources,
      },
    }
  }

  const workspaceFile = (): NotionFile => ({
    id: WORKSPACE_ROOT,
    name: "Notion workspace",
    mime: "application/vnd.notion.workspace",
    parents: [],
    url: "https://www.notion.so",
    trashed: false,
    canDownload: false,
    providerMetadata: { kind: "workspace" },
  })

  const retrieve = async (id: string, kind?: NotionKind): Promise<NotionFile> => {
    if (id === WORKSPACE_ROOT) return workspaceFile()
    if (kind === "database") return databaseFile(await reads.retrieveDatabase(id))
    try {
      return await pageFile(await reads.retrievePage(id))
    } catch (error) {
      if (kind || !isCliError(error) || !["not_found", "validation_error"].includes(error.code)) throw error
      return databaseFile(await reads.retrieveDatabase(id))
    }
  }

  /** One `created_time` window of a data source; Notion stops a query at 10,000 rows and says so. */
  const rowWindow = async (database: string, source: string, after: string | undefined, since: string | null) => {
    const filters = [
      ...(since ? [{ timestamp: "last_edited_time" as const, last_edited_time: { on_or_after: since } }] : []),
      ...(after ? [{ timestamp: "created_time" as const, created_time: { on_or_after: after } }] : []),
    ]
    const filter = filters.length > 1 ? { and: filters } : filters[0]
    const rows: NotionPage[] = []
    let incomplete = false
    let start: string | undefined
    do {
      const page = await reads.queryDataSource(source, {
        ...(filter ? { filter } : {}),
        sorts: [{ timestamp: "created_time", direction: "ascending" }],
        page_size: PAGE_SIZE,
        ...(start ? { start_cursor: start } : {}),
      })
      for (const result of page.results) rows.push(result)
      if (page.request_status?.type === "incomplete") incomplete = true
      start = page.has_more && page.next_cursor ? page.next_cursor : undefined
    } while (start)
    let next: string | undefined
    if (incomplete) {
      next = rows.at(-1)?.created_time
      if (!next || next === after)
        throw new CliError("validation_error", `database ${database} has more than 10000 rows created in one minute`, {
          reason: "notion.window-too-dense",
          database,
        })
    }
    return { rows, next }
  }

  const allRows = async (database: NotionDatabase) => {
    const files = new Map<string, NotionFile>()
    for (const source of database.data_sources) {
      let after: string | undefined
      do {
        const window = await rowWindow(database.id, source.id, after, null)
        for (const row of window.rows) if (!row.in_trash) files.set(row.id, await pageFile(row))
        after = window.next
      } while (after)
    }
    return [...files.values()]
  }

  const searchAll = async (kind: "page" | "data_source") => {
    const results: (NotionPage | NotionDataSource)[] = []
    let start: string | undefined
    do {
      const page = await reads.search({
        filter: { property: "object", value: kind },
        sort: { timestamp: "last_edited_time", direction: "descending" },
        page_size: PAGE_SIZE,
        ...(start ? { start_cursor: start } : {}),
      })
      for (const result of page.results) results.push(result)
      start = page.has_more && page.next_cursor ? page.next_cursor : undefined
    } while (start)
    return results
  }

  const childPages = async (blockId: string, found: { pages: string[]; databases: string[] }) => {
    let start: string | undefined
    do {
      const page = await reads.blockChildren(blockId, start)
      for (const block of page.results) {
        if (block.in_trash) continue
        if (block.type === "child_page") found.pages.push(block.id)
        else if (block.type === "child_database") found.databases.push(block.id)
        else if (block.has_children) await childPages(block.id, found)
      }
      start = page.has_more && page.next_cursor ? page.next_cursor : undefined
    } while (start)
    return found
  }

  const listed = async (id: string): Promise<NotionFile[]> => {
    if (id === WORKSPACE_ROOT) {
      const pages = (await searchAll("page")) as NotionPage[]
      const sources = (await searchAll("data_source")) as NotionDataSource[]
      for (const page of pages) accessible.add(page.id)
      const databases = new Map<string, NotionDatabase>()
      for (const source of sources) {
        accessible.add(source.parent.database_id)
        if (!databases.has(source.parent.database_id) && !source.in_trash)
          databases.set(source.parent.database_id, await reads.retrieveDatabase(source.parent.database_id))
      }
      const files: NotionFile[] = []
      for (const page of pages) if (!page.in_trash) files.push(await pageFile(page))
      for (const database of databases.values()) if (!database.in_trash) files.push(await databaseFile(database))
      return files.filter((file) => file.parents[0] === WORKSPACE_ROOT)
    }
    const known = knownFiles().get(id)
    const kind = known?.providerMetadata.kind ?? (await retrieve(id)).providerMetadata.kind
    if (kind === "database") return allRows(await reads.retrieveDatabase(id))
    if (kind === "row") return []
    const found = await childPages(id, { pages: [], databases: [] })
    const files: NotionFile[] = []
    for (const page of found.pages) {
      const file = await pageFile(await reads.retrievePage(page))
      if (!file.trashed) files.push(file)
    }
    for (const database of found.databases) {
      const file = await databaseFile(await reads.retrieveDatabase(database))
      if (!file.trashed) files.push(file)
    }
    return files
  }

  /** A container's children, with every known child that did not come back checked directly before it counts as gone. */
  const listChildren = async (id: string): Promise<Listing> => {
    const files = await listed(id)
    const seen = new Set(files.map((file) => file.id))
    const gone: string[] = []
    const moved: NotionFile[] = []
    for (const file of knownFiles().values()) {
      if (file.parents[0] !== id || seen.has(file.id)) continue
      try {
        const current = await retrieve(file.id, file.providerMetadata.kind)
        if (current.trashed) gone.push(file.id)
        else if (current.parents[0] === id) files.push(current)
        else moved.push(current)
      } catch (error) {
        if (!isNotFound(error)) throw error
        gone.push(file.id)
      }
    }
    return { files, gone, moved }
  }

  const sourcesInScope = (cursor: SyncCursor) => {
    const sources = new Map(cursor.sources.map((item) => [item.source, item]))
    for (const file of knownFiles().values())
      for (const source of file.providerMetadata.dataSources ?? [])
        sources.set(source.id, { database: file.id, source: source.id })
    return [...sources.values()]
  }

  const startPass = (cursor: SyncCursor): SyncPass => {
    const walk = now() - cursor.walkedAt >= walkEveryMs
    const tasks: SyncTask[] = [
      { t: "search", kind: "page" },
      { t: "search", kind: "data_source" },
      ...(walk
        ? roots.map((id) => ({ t: "walk" as const, id }))
        : sourcesInScope(cursor).map((item) => ({ t: "rows" as const, ...item }))),
    ]
    return { next: cursor.mark, startedAt: now(), walk, tasks }
  }

  const changes = async (token: string) => {
    const cursor = decodeCursor(token)
    fresh()
    requests = 0
    const pass = cursor.pass ?? startPass(cursor)
    const since = cursor.mark ? minus(cursor.mark, overlapMs) : null
    const known = knownFiles()
    const items = new Map<string, SourceChange<NotionFile>>()
    const emit = (file: NotionFile) => items.set(file.id, { id: file.id, removed: false, file })
    const gone = (id: string) => items.set(id, { id, removed: true })

    const search = async (kind: "page" | "data_source") => {
      let start: string | undefined
      do {
        const page = await reads.search({
          filter: { property: "object", value: kind },
          sort: { timestamp: "last_edited_time", direction: "descending" },
          page_size: PAGE_SIZE,
          ...(start ? { start_cursor: start } : {}),
        })
        start = page.has_more && page.next_cursor ? page.next_cursor : undefined
        for (const result of page.results) {
          if (since && Date.parse(result.last_edited_time) < Date.parse(since)) {
            start = undefined
            break
          }
          // Only what this pass saw before it began counts towards the next mark; later edits must stay inside it.
          if (kind === "page") pass.next = later(pass.next, result.last_edited_time)
          if (result.object === "page") {
            if (result.in_trash) gone(result.id)
            else emit(await pageFile(result))
            continue
          }
          if (result.in_trash) continue
          const database = result.parent.database_id
          const entry = { database, source: result.id }
          if (!cursor.sources.some((item) => item.source === result.id)) cursor.sources.push(entry)
          const file = await databaseFile(await reads.retrieveDatabase(database))
          const before = known.get(database)
          if (file.trashed) gone(database)
          // A database already held is not sent again: the engine walks every folder it is sent, all its rows.
          else if (!before || before.name !== file.name || before.parents[0] !== file.parents[0]) emit(file)
        }
      } while (start)
    }

    const rows = async (task: Extract<SyncTask, { t: "rows" }>) => {
      let window: Awaited<ReturnType<typeof rowWindow>>
      try {
        window = await rowWindow(task.database, task.source, task.after, since)
      } catch (error) {
        if (!isNotFound(error)) throw error
        cursor.sources = cursor.sources.filter((item) => item.source !== task.source)
        try {
          const database = await reads.retrieveDatabase(task.database)
          if (database.in_trash) gone(task.database)
        } catch (inner) {
          if (!isNotFound(inner)) throw inner
          gone(task.database)
        }
        return
      }
      for (const row of window.rows) {
        if (row.in_trash) gone(row.id)
        else emit(await pageFile(row))
      }
      if (window.next) pass.tasks.push({ ...task, after: window.next })
    }

    const walk = async (id: string) => {
      let listing: Listing
      try {
        listing = await listChildren(id)
      } catch (error) {
        if (!isNotFound(error) || roots.includes(id)) throw error
        gone(id)
        return
      }
      for (const file of listing.moved) emit(file)
      for (const file of listing.files) {
        emit(file)
        if (file.providerMetadata.kind === "page" || file.providerMetadata.kind === "database")
          pass.tasks.push({ t: "walk", id: file.id })
        for (const source of file.providerMetadata.dataSources ?? [])
          if (!cursor.sources.some((item) => item.source === source.id))
            cursor.sources.push({ database: file.id, source: source.id })
      }
      for (const id of listing.gone) gone(id)
    }

    while (pass.tasks.length && requests < maxRequests) {
      const task = pass.tasks[0] as SyncTask
      if (task.t === "search") await search(task.kind)
      else if (task.t === "rows") await rows(task)
      else await walk(task.id)
      pass.tasks.shift()
    }
    if (pass.tasks.length) cursor.pass = pass
    else {
      cursor.mark = later(cursor.mark, pass.next)
      if (pass.walk) cursor.walkedAt = pass.startedAt
      delete cursor.pass
    }
    return { items: [...items.values()], cursor: encodeCursor(cursor) }
  }

  const people = (page: NotionPage): NotionIdentity[] => {
    const found = new Map<string, NotionIdentity>()
    const add = (user: NotionUser | undefined, role: string) => {
      if (user) found.set(`${role}:${user.id}`, { id: user.id, ...(user.name ? { name: user.name } : {}), role })
    }
    add(page.created_by, "author")
    add(page.last_edited_by, "editor")
    for (const [name, value] of Object.entries(page.properties))
      if (value.type === "people") for (const user of value.people) add(user, `property:${name}`)
    return [...found.values()]
  }

  return {
    async identity() {
      const self = await reads.self()
      if (!self.bot?.workspace_id)
        throw new CliError("invalid_response", "Notion did not name the token's workspace", {
          reason: "notion.no-workspace",
        })
      return `${self.bot.workspace_id}:${self.id}`
    },
    async metadata(id) {
      fresh()
      return retrieve(id, knownFiles().get(id)?.providerMetadata.kind)
    },
    async children(id) {
      fresh()
      return (await listChildren(id)).files
    },
    async startToken() {
      const top = await reads.search({
        filter: { property: "object", value: "page" },
        sort: { timestamp: "last_edited_time", direction: "descending" },
        page_size: 1,
      })
      const cursor: SyncCursor = { v: 1, mark: top.results[0]?.last_edited_time ?? null, walkedAt: now(), sources: [] }
      return encodeCursor(cursor)
    },
    changes,
    async content(id, maxChars) {
      fresh()
      const page = await reads.retrievePage(id)
      if (page.in_trash) throw new CliError("not_found", "the page is in Notion's trash")
      const file = await pageFile(page)
      const body = await pageText(reads, id)
      const fields = frontMatter(page.properties)
      const metadata: NotionFile = {
        ...file,
        providerMetadata: {
          ...file.providerMetadata,
          frontMatter: fields,
          people: people(page),
          ...(body.missing ? { missingBlocks: body.missing } : {}),
        },
      }
      const searchable = [file.name, ...frontMatterLines(fields), body.markdown].filter(Boolean).join("\n\n")
      if (maxChars !== undefined && searchable.length > maxChars)
        throw new CliError("validation_error", "the page is longer than the text limit", {
          reason: "source.text-limit",
          text_limit: maxChars,
        })
      const content: SourceContent<NotionFile> = {
        metadata,
        markdown: body.markdown,
        text: stripSignedLinks(searchable),
        tabs: [],
      }
      return content
    },
    async bytes() {
      throw new CliError("validation_error", "a Notion page has no file to download")
    },
  }
}
