import { annotate } from "@wirecat/cli-base/commands"
import { answerEntity, itemOf, outputFor, REMOTE_READ, renderAnswer } from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { withNotion } from "../context.js"
import { IDENTITY } from "../identity.js"
import { notionId } from "../notion/ids.js"
import { type Document, documentSchema } from "../notion/notion.js"

const CLI = IDENTITY.command

const getCommand = () =>
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
        "a part the token may not see is listed in missing_block_ids. Signed file links lose their signature, " +
        "so the output never carries a link that opens the file",
    )
    .argument("<page>", "the page's id or its Notion link")
    .action(async function (this: Command, page: string) {
      const id = notionId(page)
      const found = await withNotion(this, (notion) => notion.document(id))
      renderAnswer(
        this,
        outputFor(this),
        itemOf(found, {
          ...(found.truncated
            ? {
                missing: [
                  {
                    field: "markdown",
                    why: `${found.missing_block_ids.length} blocks are not shared with this token, or past Notion's limit`,
                  },
                ],
              }
            : {}),
        }),
        (body) => `${(body as { item: Document }).item.markdown}\n`,
      )
    })

export const documentsCommand = (): Command =>
  annotate(new Command("documents"), { effects: REMOTE_READ }).description("read Notion pages").addCommand(getCommand())
