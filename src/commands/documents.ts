import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { CliError, visibleControls } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import { answerEntity, itemOf, outputFor, REMOTE_READ, REMOTE_WRITE, renderAnswer } from "@wirecat/cli-core/cli"
import { type FileTarget, fileVersions, guardedFileWrite } from "@wirecat/cli-core/documents"
import { keepVersionsForDays } from "@wirecat/cli-core/documents/cli"
import { Command, Option } from "commander"
import { DELETE_KEY } from "../config.js"
import { contextOf, withNotion } from "../context.js"
import { IDENTITY } from "../identity.js"
import { profileDir } from "../library.js"
import { notionId } from "../notion/ids.js"
import { type Document, documentSchema, type LiveReads } from "../notion/notion.js"
import { fingerprintOf, type PageChange, type PageWriteOutcome, pageTarget } from "../notion/page-target.js"
import { assignment } from "../notion/properties.js"
import type { LiveWrites, Picture, TextEdit } from "../notion/writes.js"
import { markdownOf, TEXT_OPTIONS, write } from "./writing.js"

const CLI = IDENTITY.command

/** `documents get`: one page live, beside the shared commands that read the local copy. */
export const getCommand = () =>
  answerEntity(
    annotate(new Command("get"), {
      effects: REMOTE_READ,
      offline: false,
      examples: [
        `${CLI} personal documents get https://www.notion.so/Roadmap-0123456789abcdef0123456789abcdef`,
        `${CLI} personal documents get 0123456789abcdef0123456789abcdef --json`,
      ],
    }),
    "document_markdown",
    documentSchema,
  )
    .summary("read one page live from Notion, as Markdown")
    .description(
      "read one page live from Notion as Notion-flavoured Markdown. A page too long for one answer is read in parts; " +
        "a part the token may not see is listed in missing_block_ids, and a page that is not whole answers " +
        "meta.complete false and exits non-zero. Signed file links lose their signature, " +
        "so the output never carries a link that opens the file",
    )
    .argument("<page>", "the page's id or its Notion link")
    .action(async function (this: Command, page: string) {
      const id = notionId(page)
      const { document, issues } = await withNotion(this, (notion) => notion.document(id))
      const output = outputFor(this)
      const missing = document.missing_block_ids.length
      const why =
        missing > 0
          ? `${missing} blocks are missing: not shared with this token, or past what one read fetches`
          : "Notion gave only part of the page"
      renderAnswer(
        this,
        output,
        itemOf(document, {
          ...(issues.length > 0 ? { missing: [{ field: "markdown", why }], meta: { issues } } : {}),
        }),
        // Other members wrote this text; a terminal would run an escape sequence in it (WC-SECR-11).
        (body) => `${visibleControls((body as { item: Document }).item.markdown)}\n`,
      )
      if (issues.length > 0 && output.format !== "json" && output.format !== "jsonl")
        output.renderer.warn(`the page is incomplete: ${why}`)
    })

/** `documents check`: has the page changed since it was read, without the text. */
export const checkCommand = () =>
  annotate(new Command("check"), {
    effects: REMOTE_READ,
    offline: false,
    examples: [
      `${CLI} personal documents check PAGE_ID --expected-fingerprint SHA256`,
      `${CLI} personal documents check https://www.notion.so/Roadmap-0123456789abcdef0123456789abcdef --expected-fingerprint SHA256 --json`,
    ],
  })
    .summary("say whether a Notion page changed since it was read")
    .description(
      "read one page live and say whether its text still has the sha256 documents get answered, without the text. " +
        "changed is true when it differs. A page too long for Notion to give whole has no fingerprint: changed is " +
        "null and the answer is incomplete",
    )
    .argument("<page>", "the page's id or its Notion link")
    .requiredOption("--expected-fingerprint <hash>", "the sha256 documents get answered")
    .action(async function (this: Command, page: string, args: { expectedFingerprint: string }) {
      const id = notionId(page)
      const expected = fingerprintArg(args.expectedFingerprint) as string
      const { document, issues } = await withNotion(this, (notion) => notion.document(id))
      const answer = {
        id: document.id,
        sha256: document.sha256,
        changed: document.sha256 === null ? null : document.sha256 !== expected,
      }
      renderAnswer(
        this,
        outputFor(this),
        itemOf(
          answer,
          issues.length > 0
            ? { missing: [{ field: "sha256", why: "Notion gave only part of the page" }], meta: { issues } }
            : {},
        ),
      )
    })

const FIELD =
  "a row's value, as Name=Value. Repeat it for more. Lists (multi-select, people, relations) take values split by " +
  "commas, a person is an email address, a user id or me, a date is 2026-12-01 or a range start/end, and an empty " +
  "value clears it"
const INTO = "the database to add it to: its id or Notion link, or one of its data source ids"

/** `documents create`: a new page under a page, or a new row in a database. */
export const createCommand = () =>
  annotate(new Command("create"), {
    effects: REMOTE_WRITE,
    offline: false,
    examples: [
      `${CLI} personal documents create --parent PAGE_ID --title "Meeting notes" --text "Discussed the roadmap"`,
      `${CLI} personal documents create --into DATABASE_ID --title "Write the plan" --field Status=Open --field Owner=me`,
      `${CLI} personal documents create --into DATABASE_ID --title "Weekly review" --from-template default --dry-run`,
    ],
  })
    .summary("create a Notion page under another page, or a row in a database")
    .description(
      "create a Notion page under another page (--parent), from Notion-flavoured Markdown, or a row in a database " +
        "(--into). With no --title, Notion takes the text's first # heading as the title. A row's --field values are " +
        "checked against the database's properties and sent as each type takes it. A database with several data " +
        "sources takes one of their ids in place of the database. With --from-template, Notion fills the row from that " +
        "template after it answers, so the text is not there yet when this returns: template_pending says so. " +
        "databases show lists the properties, their options and the templates",
    )
    .option("--parent <id>", "the parent page's id or its Notion link")
    .option("--into <id>", INTO)
    .option("--title <title>", "the page's title")
    .addOption(new Option("--field <key=value>", FIELD).argParser(assignment).default([], "none"))
    .option("--from-template <template>", "for a row: default, none, or a template's id or name from databases show")
    .option("--text <text>", TEXT_OPTIONS.text)
    .option("--file <file>", TEXT_OPTIONS.file)
    .action(async function (
      this: Command,
      args: {
        parent?: string
        into?: string
        title?: string
        field?: [string, string][]
        fromTemplate?: string
        text?: string
        file?: string
      },
    ) {
      if ((args.parent === undefined) === (args.into === undefined))
        throw new CliError("validation_error", "give where it goes with --parent for a page, or --into for a row", {
          sent: false,
        })
      if (args.parent !== undefined && ((args.field ?? []).length > 0 || args.fromTemplate !== undefined))
        throw new CliError("validation_error", "--field and --from-template are for a row, created with --into", {
          sent: false,
        })
      const markdown = await markdownOf(this, args, false)
      const output = outputFor(this)
      if (args.into !== undefined) {
        const into = notionId(args.into, "database")
        const { operationId, done } = await write(this, [], (notion) =>
          notion.createRow({
            into,
            fields: args.field ?? [],
            title: args.title,
            template: args.fromTemplate,
            markdown,
          }),
        )
        renderAnswer(this, output, itemOf({ operation_id: operationId, ...done }))
        return
      }
      const parent = notionId(args.parent ?? "")
      const { operationId, done } = await write(this, [], (notion) =>
        notion.create({ parent, title: args.title, ...(markdown === undefined ? {} : { markdown }) }),
      )
      renderAnswer(this, output, itemOf({ operation_id: operationId, page: done }))
    })

/** An icon or a cover as given: `none`, or an https link to an image; an icon also takes one emoji. */
export const pictureOf = (flag: string, value: string | undefined, emoji: boolean): Picture | undefined => {
  if (value === undefined) return undefined
  const text = value.trim()
  if (text === "none") return "none"
  if (!emoji && text.startsWith("https://")) {
    try {
      return { url: new URL(text).toString() }
    } catch {
      // An unparsable link is refused below with the rest.
    }
  }
  if (emoji && text.length > 0 && text.length <= 16 && !/[\s\p{ASCII}]/u.test(text)) return { emoji: text }
  throw new CliError(
    "validation_error",
    `${flag} takes ${emoji ? "one emoji" : "an https link to an image"}, or none to take it away`,
    { sent: false },
  )
}

const EDITS =
  'parts of the text to change where they are, as JSON: [{"old": "text on the page now", "new": "its new text"}], ' +
  'up to 100. Each old text must be on the page once, or add "all": true to change every place it is'

const FINGERPRINT =
  "the page's sha256 from documents get or documents check; the write is refused when the page changed since"

/** `--payload`: the parts of a targeted edit, each checked before anything is read or sent. */
export const editsOf = (payload: string): TextEdit[] => {
  const refused = (why: string) =>
    new CliError("validation_error", `--payload ${why}`, { param: "--payload", sent: false })
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    throw refused("is not JSON")
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 100)
    throw refused("takes a list of 1 to 100 edits")
  return parsed.map((part: unknown, index) => {
    const edit = part as Record<string, unknown>
    const keys = typeof part === "object" && part !== null ? Object.keys(edit) : []
    if (
      keys.some((key) => !["old", "new", "all"].includes(key)) ||
      typeof edit.old !== "string" ||
      edit.old === "" ||
      typeof edit.new !== "string" ||
      (edit.all !== undefined && typeof edit.all !== "boolean")
    )
      throw refused(`edit ${index + 1}: give "old" (not empty) and "new" as text, and "all" only as true or false`)
    return { old: edit.old, new: edit.new, ...(edit.all === true ? { all: true } : {}) }
  })
}

const fingerprintArg = (value: string | undefined) => {
  if (value === undefined) return undefined
  const hash = value.trim().toLowerCase()
  if (!/^[0-9a-f]{64}$/u.test(hash))
    throw new CliError("validation_error", "--expected-fingerprint takes the sha256 documents get answered", {
      param: "--expected-fingerprint",
      sent: false,
    })
  return hash
}

/** The page's text written through cli-core's guarded write: checked at its fingerprint, the replaced text kept. */
const guardedText = async (
  command: Command,
  reads: LiveReads,
  writes: LiveWrites,
  id: string,
  change: PageChange,
  expected: string | undefined,
  markdown: string | undefined,
) => {
  const { env, profile, settings } = contextOf(command)
  const outcome: PageWriteOutcome = { warnings: [] }
  const target = pageTarget(reads, writes, change, outcome)
  let fingerprint = expected
  if (fingerprint === undefined) {
    // A whole replace without a fingerprint still keeps the text it replaces, read just now.
    const { document, issues } = await reads.document(id)
    if (issues.length > 0) {
      const done = await writes.replace(id, markdown ?? "", change.allowDeleting)
      return { id: done.id, warnings: [...done.warnings, "earlier_text_not_kept"], sha256: null, replaced: null }
    }
    fingerprint = fingerprintOf(document.markdown)
  }
  const versions = fileVersions(join(profileDir(env, profile), "versions"), Date.now, keepVersionsForDays(settings))
  const folder = mkdtempSync(join(tmpdir(), "wcnotion-update-"))
  try {
    const from = join(folder, "text")
    writeFileSync(from, markdown ?? "", { mode: 0o600 })
    const done = await guardedFileWrite({
      target: target as FileTarget,
      versions,
      path: id,
      from,
      expected: fingerprint,
      reread: `${CLI} ${profile} documents get ${id}`,
    })
    return {
      id: done.file.id,
      warnings: outcome.warnings,
      sha256: done.file.sha256 ?? null,
      replaced: done.replaced
        ? { sha256: done.replaced.sha256, kept_at: join(versions.dir ?? "", "objects", done.replaced.sha256) }
        : null,
    }
  } finally {
    rmSync(folder, { recursive: true, force: true })
  }
}

/** `documents update`: the page's whole text replaced or parts of it edited, a row's values, its icon or cover set. */
export const updateCommand = () =>
  annotate(new Command("update"), {
    effects: REMOTE_WRITE,
    offline: false,
    examples: [
      `${CLI} personal documents update PAGE_ID --file notes.md`,
      `${CLI} personal documents update PAGE_ID --payload '[{"old":"Due Friday","new":"Due Monday"}]' --expected-fingerprint SHA256`,
      `${CLI} personal documents update ROW_ID --field Status=Done --field "Tags=Urgent, Backend" --emoji 📌`,
    ],
  })
    .summary("change a Notion page's text in place or whole, a row's values, its icon or cover")
    .description(
      "change parts of a Notion page's text where they are (--payload), replace its whole text with " +
        "Notion-flavoured Markdown, change a database row's values with --field, or set the page's icon (--emoji) and " +
        "cover. With --expected-fingerprint, the sha256 documents get answered, the page is read again just before " +
        "the write and the write is refused when it changed: Notion has no conditional write, so an edit landing " +
        "after that read is not caught. --payload needs it. Every text write keeps the text it replaces in the " +
        "profile's local versions, and answers the new sha256. A value not named keeps what it had, and a list given " +
        "replaces the whole list. A child page or database whose tag the new text leaves out is refused unless " +
        "--allow-deleting-content is given, which asks as documents delete does. Values, icon and cover are set " +
        "first in one request, then the text",
    )
    .argument("<page>", "the page's id or its Notion link")
    .option("--text <text>", TEXT_OPTIONS.text)
    .option("--file <file>", TEXT_OPTIONS.file)
    .option("--payload <json>", EDITS)
    .option("--expected-fingerprint <hash>", FINGERPRINT)
    .addOption(new Option("--field <key=value>", FIELD).argParser(assignment).default([], "none"))
    .option("--emoji <emoji>", "the page's icon, one emoji, or none to take it away")
    .option("--cover <link>", "the page's cover, an https link to an image, or none to take it away")
    .option("--allow-deleting-content", "let Notion delete the child pages and databases the new text leaves out")
    .action(async function (
      this: Command,
      page: string,
      args: {
        text?: string
        file?: string
        payload?: string
        expectedFingerprint?: string
        field?: [string, string][]
        emoji?: string
        cover?: string
        allowDeletingContent?: boolean
      },
    ) {
      const id = notionId(page)
      const icon = pictureOf("--emoji", args.emoji, true)
      const cover = pictureOf("--cover", args.cover, false)
      const fields = args.field ?? []
      const expected = fingerprintArg(args.expectedFingerprint)
      const edits = args.payload === undefined ? undefined : editsOf(args.payload)
      if (edits && (args.text !== undefined || args.file !== undefined))
        throw new CliError("validation_error", "give --payload or the new text, not both", { sent: false })
      if (edits && expected === undefined)
        throw new CliError(
          "validation_error",
          `--payload needs --expected-fingerprint: read the page first with ${CLI} <profile> documents get ${page}`,
          { param: "--expected-fingerprint", sent: false },
        )
      const patched = icon !== undefined || cover !== undefined || fields.length > 0
      // The values go first, so a text refused at its fingerprint would leave them changed.
      if (patched && expected !== undefined)
        throw new CliError(
          "validation_error",
          "--expected-fingerprint and --payload change the text only: set --field, --emoji or --cover in a run of " +
            "their own",
          { sent: false },
        )
      const markdown = edits ? undefined : await markdownOf(this, args, !patched)
      if (expected !== undefined && !edits && markdown === undefined)
        throw new CliError("validation_error", "--expected-fingerprint guards a text write: give the text too", {
          sent: false,
        })
      const allow = args.allowDeletingContent === true
      const extra = [...(allow ? [DELETE_KEY] : []), ...(patched ? ["api.patch-page"] : [])]
      const change: PageChange = edits
        ? { kind: "edit", edits, allowDeleting: allow }
        : { kind: "replace", allowDeleting: allow }
      const { operationId, done } = await write(this, extra, async (notion, reads) => {
        const set = patched
          ? await notion.patch(id, { fields, ...(icon ? { icon } : {}), ...(cover ? { cover } : {}) })
          : undefined
        const text =
          markdown === undefined && !edits
            ? undefined
            : await guardedText(this, reads, notion, id, change, expected, markdown)
        return { set, text }
      })
      const output = outputFor(this)
      const warnings = done.text?.warnings ?? []
      const missed = warnings.filter((code) => code === "no_match").length
      // Notion applied the text but left part of it out or changed it; its codes say what kind, never whose text.
      if (warnings.length > 0 && output.format !== "json" && output.format !== "jsonl")
        output.renderer.warn(`Notion changed or left out part of the text: ${warnings.join(", ")}`)
      const answer = {
        operation_id: operationId,
        page: done.set ?? { id: done.text?.id ?? id },
        warnings,
        ...(done.text ? { sha256: done.text.sha256, replaced: done.text.replaced } : {}),
      }
      renderAnswer(
        this,
        output,
        itemOf(
          answer,
          missed > 0
            ? {
                missing: [{ field: "warnings", why: `${missed} edits matched nothing on the page and were not made` }],
                meta: { issues: [{ code: "provider_error", reason: "notion.edit-partial", source: "notion" }] },
              }
            : {},
        ),
      )
    })

/** `documents move`: a page under another page, or into a database as a row. */
export const moveCommand = () =>
  annotate(new Command("move"), {
    effects: REMOTE_WRITE,
    offline: false,
    examples: [
      `${CLI} personal documents move PAGE_ID --parent OTHER_PAGE_ID`,
      `${CLI} personal documents move PAGE_ID --into DATABASE_ID`,
      `${CLI} personal documents move PAGE_ID --into DATA_SOURCE_ID --dry-run`,
    ],
  })
    .summary("move a Notion page under another page or into a database")
    .description(
      "move a Notion page, with the pages under it, under another page (--parent) or into a database (--into). A " +
        "database with several data sources takes one of their ids in place of the database, as databases show " +
        "lists them. Notion moves no database, and no page to the top of the workspace. The next sync files the " +
        "page at its new place",
    )
    .argument("<page>", "the page's id or its Notion link")
    .option("--parent <id>", "the page to move it under: its id or its Notion link")
    .option("--into <id>", "the database to move it into: its id or Notion link, or one of its data source ids")
    .action(async function (this: Command, page: string, args: { parent?: string; into?: string }) {
      const id = notionId(page)
      if ((args.parent === undefined) === (args.into === undefined))
        throw new CliError("validation_error", "give where it goes with --parent or with --into", { sent: false })
      const destination =
        args.parent !== undefined ? { page: notionId(args.parent) } : { into: notionId(args.into ?? "", "database") }
      if ("page" in destination && destination.page === id)
        throw new CliError("validation_error", "a page cannot be moved under itself", { sent: false })
      const { operationId, done } = await write(this, [], (notion) => notion.move(id, destination))
      renderAnswer(this, outputFor(this), itemOf({ operation_id: operationId, page: done }))
    })

/** `documents rename`: a page's or a row's title. */
export const renameCommand = () =>
  annotate(new Command("rename"), {
    effects: REMOTE_WRITE,
    offline: false,
    examples: [
      `${CLI} personal documents rename PAGE_ID "Roadmap 2027"`,
      `${CLI} personal documents rename PAGE_ID "Roadmap 2027" --dry-run`,
    ],
  })
    .summary("rename a Notion page or database row")
    .description("give a Notion page or database row a new title. Its text, icon and place stay as they are")
    .argument("<page>", "the page's id or its Notion link")
    .argument("<title>", "the new title")
    .action(async function (this: Command, page: string, title: string) {
      const id = notionId(page)
      if (title.trim() === "") throw new CliError("validation_error", "give the new title", { sent: false })
      const { operationId, done } = await write(this, [], (notion) => notion.patch(id, { title }))
      renderAnswer(this, outputFor(this), itemOf({ operation_id: operationId, page: done }))
    })

const trashCommand = (name: "delete" | "restore", inTrash: boolean) =>
  annotate(new Command(name), {
    effects: REMOTE_WRITE,
    offline: false,
    examples: [`${CLI} personal documents ${name} PAGE_ID`, `${CLI} personal documents ${name} PAGE_ID --dry-run`],
  })
    .argument("<page>", "the page's id or its Notion link")
    .action(async function (this: Command, page: string) {
      const id = notionId(page)
      const { operationId, done } = await write(this, [], (notion) => notion.trash(id, inTrash))
      renderAnswer(this, outputFor(this), itemOf({ operation_id: operationId, page: done }))
    })

/** `documents delete`: to Notion's trash, from where `documents restore` brings it back. */
export const deleteCommand = () =>
  trashCommand("delete", true)
    .summary("move a Notion page to the trash")
    .description(
      "move a Notion page, with the pages under it, to Notion's trash; documents restore brings it back. Notion's API " +
        "deletes nothing for good. Asks first, as the profile's documents.delete permission says",
    )

/** `documents restore`: back from Notion's trash. */
export const restoreCommand = () =>
  trashCommand("restore", false)
    .summary("bring a Notion page back from the trash")
    .description("bring a Notion page back from Notion's trash, where documents delete put it")
