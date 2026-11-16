import { closeSync, constants, fstatSync, openSync, readFileSync, realpathSync } from "node:fs"
import { resolve } from "node:path"
import { CliError, visibleControls } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import {
  answerEntity,
  bufferedInput,
  commandPath,
  itemOf,
  MAX_BUFFERED_INPUT,
  outputFor,
  REMOTE_READ,
  REMOTE_WRITE,
  renderAnswer,
  terminalAsker,
} from "@wirecat/cli-core/cli"
import { guardedWrite, guardFor, keyedGuard, levelFor, newOperationId, refusedPlace } from "@wirecat/cli-core/sends"
import { Command } from "commander"
import { DELETE_KEY, PAGE_WRITE_KEYS, permissions } from "../config.js"
import { contextOf, notionWritesFor, tokenOf, withNotion } from "../context.js"
import { IDENTITY } from "../identity.js"
import { notionId } from "../notion/ids.js"
import { type Document, documentSchema } from "../notion/notion.js"
import type { LiveWrites } from "../notion/writes.js"

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

/**
 * Every page write's one path, as the template's sample (WC-PERM-13): the level of the command's key and of each
 * extra key refuses or asks once, the send journal records the attempt and never its content (WC-PERM-17), and the
 * answer carries `operation_id` (WC-OUT-10). cli-core has already answered `--dry-run` and refused under
 * `WCNOTION_READ_ONLY`. Never retried: a write that got no answer is `outcome_unknown` (WC-LIFE-9).
 */
const write = async <T>(command: Command, extra: readonly string[], act: (notion: LiveWrites) => Promise<T>) => {
  const context = contextOf(command)
  const { settings, env, renderer } = context
  const path = commandPath(command)
  const key = path.replaceAll(" ", ".")
  const token = tokenOf(command)
  const operationId = newOperationId()
  const levelOf = (one: string) => levelFor(settings.permissions, one, permissions.defaults).level
  const guard = keyedGuard(
    (ask) =>
      guardFor(
        IDENTITY,
        // Notion limits its own rate, so this guard keeps the levels and the journal, not a send cap.
        { ...settings, sendsPerHour: Number.MAX_SAFE_INTEGER, permissionDefaults: permissions.defaults },
        renderer.warn,
        env,
        ask,
      ),
    terminalAsker(command),
    levelOf,
    [...(PAGE_WRITE_KEYS[path] ?? []), ...extra],
  )
  const request = { chatId: null, kind: "edit" as const, key, operationId }
  guard.refuse(request)
  try {
    const done = await guardedWrite(guard, request, () =>
      context.run((events) => act(notionWritesFor(command, token, events))),
    )
    return { operationId, done }
  } catch (error) {
    if (error instanceof CliError && error.code === "outcome_unknown")
      throw new CliError("outcome_unknown", error.message, { ...error.details, operation_id: operationId })
    throw error
  }
}

/** Kernel and device files: /proc/self/environ holds the token's variable. */
const SYSTEM_FILES = /^\/(proc|sys|dev)(\/|$)/u

const realOf = (path: string) => {
  try {
    return realpathSync(path)
  } catch {
    return undefined
  }
}

const refusedFile = (file: string) =>
  new CliError(
    "validation_error",
    `${file} is not read: only a regular file goes to Notion, never a link, a system file, a credential file, a ` +
      "browser profile or a WireCat folder",
    { reason: "file.refused-place", sent: false },
  )

/**
 * One open, then every check on what was opened: a link as the last part is refused (O_NOFOLLOW), so the path
 * cannot be swapped between the check and the read, and a FIFO does not block the open (O_NONBLOCK). An agent steered
 * by a page's text must not publish a key, the process's environment or another tool's settings into Notion. The
 * /proc, /sys and /dev check and the regular-file check go once cli-core's refusedPlace has them (cli-core #3014).
 */
const readOwnFile = (file: string, env: NodeJS.ProcessEnv): string => {
  const outside = (path: string | undefined) =>
    path !== undefined && (SYSTEM_FILES.test(path) || refusedPlace(path, IDENTITY, env))
  if (outside(resolve(file)) || outside(realOf(file))) throw refusedFile(file)
  let fd: number
  try {
    fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0))
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === "ELOOP" || code === "EMLINK") throw refusedFile(file)
    throw new CliError("validation_error", `${file}: ${code === "ENOENT" ? "no such file" : "it cannot be read"}`, {
      sent: false,
    })
  }
  try {
    // On Linux the open descriptor names the file it really is, whatever happened to the path since the check.
    const opened = process.platform === "linux" ? realOf(`/proc/self/fd/${fd}`) : undefined
    if (!fstatSync(fd).isFile() || outside(opened)) throw refusedFile(file)
    return readFileSync(fd, "utf8")
  } finally {
    closeSync(fd)
  }
}

/** The page's new text: `--text`, or `--file`, where `-` is stdin. */
const markdownOf = async (command: Command, args: { text?: string; file?: string }, required: boolean) => {
  if (args.text !== undefined && args.file !== undefined)
    throw new CliError("validation_error", "give the text with --text or --file, not both", { sent: false })
  if (args.text !== undefined) return args.text
  if (args.file === "-") {
    const { environment } = contextOf(command)
    const input = await bufferedInput(environment.stdin ?? process.stdin, {
      maxBytes: MAX_BUFFERED_INPUT,
      ...(environment.signal ? { signal: environment.signal } : {}),
    })
    return input.toString("utf8")
  }
  if (args.file !== undefined) return readOwnFile(args.file, contextOf(command).env)
  if (required)
    throw new CliError("validation_error", "give the page's new text with --text or --file", { sent: false })
  return undefined
}

const TEXT_OPTIONS = {
  text: "the text, as Notion-flavoured Markdown",
  file: "read the text from this file; - reads stdin",
}

/** `documents create`: a new page under a page the token can see. */
export const createCommand = () =>
  annotate(new Command("create"), {
    effects: REMOTE_WRITE,
    offline: false,
    examples: [
      `${CLI} personal documents create --parent PAGE_ID --title "Meeting notes" --text "Discussed the roadmap"`,
      `${CLI} personal documents create --parent https://www.notion.so/Projects-0123456789abcdef0123456789abcdef --file notes.md`,
      `${CLI} personal documents create --parent PAGE_ID --file notes.md --dry-run`,
    ],
  })
    .summary("create a Notion page under another page")
    .description(
      "create a Notion page under another page, from Notion-flavoured Markdown. With no --title, Notion takes the " +
        "text's first # heading as the title",
    )
    .requiredOption("--parent <id>", "the parent page's id or its Notion link")
    .option("--title <title>", "the page's title")
    .option("--text <text>", TEXT_OPTIONS.text)
    .option("--file <file>", TEXT_OPTIONS.file)
    .action(async function (this: Command, args: { parent: string; title?: string; text?: string; file?: string }) {
      const parent = notionId(args.parent)
      const markdown = await markdownOf(this, args, false)
      const { operationId, done } = await write(this, [], (notion) =>
        notion.create({ parent, title: args.title, ...(markdown === undefined ? {} : { markdown }) }),
      )
      renderAnswer(this, outputFor(this), itemOf({ operation_id: operationId, page: done }))
    })

/** `documents update`: the page's whole text replaced. */
export const updateCommand = () =>
  annotate(new Command("update"), {
    effects: REMOTE_WRITE,
    offline: false,
    examples: [
      `${CLI} personal documents update PAGE_ID --file notes.md`,
      `${CLI} personal documents update PAGE_ID --text "# Plan" --dry-run`,
      `${CLI} personal documents update PAGE_ID --file page.md --allow-deleting-content`,
    ],
  })
    .summary("replace a Notion page's text")
    .description(
      "replace a Notion page's whole text with Notion-flavoured Markdown. A child page or database whose tag the new " +
        "text leaves out is refused unless --allow-deleting-content is given, which asks as documents delete does",
    )
    .argument("<page>", "the page's id or its Notion link")
    .option("--text <text>", TEXT_OPTIONS.text)
    .option("--file <file>", TEXT_OPTIONS.file)
    .option("--allow-deleting-content", "let Notion delete the child pages and databases the new text leaves out")
    .action(async function (
      this: Command,
      page: string,
      args: { text?: string; file?: string; allowDeletingContent?: boolean },
    ) {
      const id = notionId(page)
      const markdown = (await markdownOf(this, args, true)) ?? ""
      const allow = args.allowDeletingContent === true
      const { operationId, done } = await write(this, allow ? [DELETE_KEY] : [], (notion) =>
        notion.replace(id, markdown, allow),
      )
      const output = outputFor(this)
      // Notion applied the text but left part of it out or changed it; its codes say what kind, never whose text.
      if (done.warnings.length > 0 && output.format !== "json" && output.format !== "jsonl")
        output.renderer.warn(`Notion changed or left out part of the text: ${done.warnings.join(", ")}`)
      renderAnswer(this, output, itemOf({ operation_id: operationId, page: { id: done.id }, warnings: done.warnings }))
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
