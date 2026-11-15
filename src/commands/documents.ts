import { visibleControls } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import { answerEntity, itemOf, outputFor, REMOTE_READ, renderAnswer } from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { withNotion } from "../context.js"
import { IDENTITY } from "../identity.js"
import { notionId } from "../notion/ids.js"
import { type Document, documentSchema } from "../notion/notion.js"

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
