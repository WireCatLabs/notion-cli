import { annotate } from "@wirecat/cli-base/commands"
import {
  answerEntity,
  commandPath,
  itemOf,
  listOf,
  outputFor,
  positiveCount,
  REMOTE_READ,
  REMOTE_WRITE,
  renderAnswer,
  secretInput,
} from "@wirecat/cli-core/cli"
import { marksUntrusted } from "@wirecat/cli-core/documents/cli"
import { Command, Option } from "commander"
import { withNotion } from "../context.js"
import { IDENTITY } from "../identity.js"
import { notionId } from "../notion/ids.js"
import { commentSchema } from "../notion/notion.js"
import { markdownOf, write } from "./writing.js"

const CLI = IDENTITY.command

/** Notion's page size: a default of 100, which is also its most ([pagination](https://developers.notion.com/reference/pagination)). */
const LARGEST_PAGE = 100
const DEFAULT_PAGE = 50

const listCommand = () =>
  answerEntity(
    annotate(new Command("list"), {
      effects: REMOTE_READ,
      offline: false,
      examples: [`${CLI} personal comments list PAGE_ID`, `${CLI} personal comments list PAGE_ID --limit 20 --json`],
    }),
    "notion_comment",
    commentSchema,
  )
    .summary("list the open comments on a Notion page or block, live")
    .description(
      "list the comments on a Notion page or block, live. Notion's API lists only unresolved comments: a resolved " +
        "discussion is not shown. Reply to one with comments reply and its discussion_id",
    )
    .argument("<page>", "the page's or block's id, or its Notion link")
    .option(
      "--limit <n>",
      `at most this many, up to ${LARGEST_PAGE}; ${DEFAULT_PAGE} if not given`,
      positiveCount("--limit"),
    )
    .option("--cursor <cursor>", "go on from where the last page stopped; page.next gives it")
    .action(async function (this: Command, page: string) {
      const block = notionId(page)
      const { limit = DEFAULT_PAGE, cursor } = this.opts<{ limit?: number; cursor?: string }>()
      const size = Math.min(limit, LARGEST_PAGE)
      const found = await withNotion(this, (notion) => notion.comments({ block, limit: size, cursor }))
      renderAnswer(
        this,
        outputFor(this),
        listOf(commandPath(this), {
          items: found.items,
          limit: size,
          has_more: found.hasMore,
          paging: "cursor",
          ...(found.cursor === undefined ? {} : { cursor: found.cursor }),
          args: { page: block },
        }),
      )
    })

/** The comment's text never reaches a run record, whatever the owner's `record_input`. */
const withText = (command: Command) =>
  command
    .addOption(secretInput(new Option("--text <text>", "the comment, as Markdown: bold, italic, code, links")))
    .option("--file <file>", "read the comment from this file; - reads stdin")

const COMMENT = "the comment's text"

const createCommand = () =>
  withText(
    annotate(new Command("create"), {
      effects: REMOTE_WRITE,
      offline: false,
      examples: [
        `${CLI} personal comments create PAGE_ID --text "Looks good"`,
        `${CLI} personal comments create PAGE_ID --file note.md --dry-run`,
      ],
    })
      .summary("comment on a Notion page")
      .description(
        "start a discussion on a Notion page with a comment. Notion keeps inline Markdown only: bold, italic, " +
          "strikethrough, code and links",
      )
      .argument("<page>", "the page's id or its Notion link"),
  ).action(async function (this: Command, page: string, args: { text?: string; file?: string }) {
    const id = notionId(page)
    const markdown = (await markdownOf(this, args, true, COMMENT)) ?? ""
    const { operationId, done } = await write(this, [], (notion) => notion.comment({ page: id }, markdown))
    renderAnswer(this, outputFor(this), itemOf({ operation_id: operationId, comment: done }))
  })

const replyCommand = () =>
  withText(
    annotate(new Command("reply"), {
      effects: REMOTE_WRITE,
      offline: false,
      examples: [`${CLI} personal comments reply DISCUSSION_ID --text "Done"`],
    })
      .summary("reply in a Notion discussion")
      .description(
        "add a comment to a discussion that comments list shows, by its discussion_id. It checks comments.create " +
          "too, so denying that stops replies as well",
      )
      .argument("<discussion>", "the discussion_id from comments list"),
  ).action(async function (this: Command, discussion: string, args: { text?: string; file?: string }) {
    const id = notionId(discussion, "discussion")
    const markdown = (await markdownOf(this, args, true, COMMENT)) ?? ""
    const { operationId, done } = await write(this, [], (notion) => notion.comment({ discussion: id }, markdown))
    renderAnswer(this, outputFor(this), itemOf({ operation_id: operationId, comment: done }))
  })

const editCommand = () =>
  withText(
    annotate(new Command("edit"), {
      effects: REMOTE_WRITE,
      offline: false,
      examples: [`${CLI} personal comments edit COMMENT_ID --text "Fixed the link"`],
    })
      .summary("change a comment this connection posted")
      .description(
        "change the text of a comment this connection posted, by its id from comments list. Notion lets a " +
          "connection change only its own comments. The answer keeps the text it had in previous_text",
      )
      .argument("<comment>", "the comment's id from comments list"),
  ).action(async function (this: Command, comment: string, args: { text?: string; file?: string }) {
    const id = notionId(comment, "comment")
    const markdown = (await markdownOf(this, args, true, COMMENT)) ?? ""
    const { operationId, done } = await write(this, [], (notion) => notion.editComment(id, markdown))
    renderAnswer(this, outputFor(this), itemOf({ operation_id: operationId, ...done }))
  })

const deleteCommand = () =>
  annotate(new Command("delete"), {
    effects: REMOTE_WRITE,
    offline: false,
    examples: [`${CLI} personal comments delete COMMENT_ID`, `${CLI} personal comments delete COMMENT_ID --dry-run`],
  })
    .summary("delete a comment this connection posted")
    .description(
      "delete a comment this connection posted, by its id from comments list. Notion keeps no deleted comment, so " +
        "this asks first, as the profile's documents.delete permission says, and the answer keeps its text in " +
        "previous_text",
    )
    .argument("<comment>", "the comment's id from comments list")
    .action(async function (this: Command, comment: string) {
      const id = notionId(comment, "comment")
      const { operationId, done } = await write(this, [], (notion) => notion.deleteComment(id))
      renderAnswer(this, outputFor(this), itemOf({ operation_id: operationId, ...done }))
    })

/** `comments list|create|reply|edit|delete`: Notion's comments, live. */
export const commentsCommand = () =>
  annotate(new Command("comments"), { effects: REMOTE_READ })
    .description("read and write the comments on Notion pages, live")
    .addCommand(marksUntrusted(listCommand(), ["text", "author_name"]))
    .addCommand(createCommand())
    .addCommand(replyCommand())
    .addCommand(editCommand())
    .addCommand(deleteCommand())
