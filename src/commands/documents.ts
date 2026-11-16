import { visibleControls } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import { answerEntity, itemOf, outputFor, REMOTE_READ, REMOTE_WRITE, renderAnswer } from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { DELETE_KEY } from "../config.js"
import { withNotion } from "../context.js"
import { IDENTITY } from "../identity.js"
import { notionId } from "../notion/ids.js"
import { type Document, documentSchema } from "../notion/notion.js"
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
