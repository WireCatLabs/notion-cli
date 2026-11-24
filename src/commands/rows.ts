import { annotate } from "@wirecat/cli-base/commands"
import {
  answerEntity,
  commandPath,
  listOf,
  outputFor,
  positiveCount,
  REMOTE_READ,
  renderAnswer,
} from "@wirecat/cli-core/cli"
import { DOCUMENT_UNTRUSTED, marksUntrusted } from "@wirecat/cli-core/documents/cli"
import { Command, Option } from "commander"
import { withNotion } from "../context.js"
import { IDENTITY } from "../identity.js"
import { notionId } from "../notion/ids.js"
import { rowSchema } from "../notion/notion.js"
import { type Condition, condition } from "../notion/properties.js"

const CLI = IDENTITY.command

/** Notion's page size: a default of 100, which is also its most ([pagination](https://developers.notion.com/reference/pagination)). */
const LARGEST_PAGE = 100
const DEFAULT_PAGE = 50

const listCommand = () =>
  answerEntity(
    annotate(new Command("list"), {
      effects: REMOTE_READ,
      offline: false,
      examples: [
        `${CLI} personal rows list DATABASE_ID --filter Status=Open`,
        `${CLI} personal rows list DATABASE_ID --filter "Due<2026-12-01" --filter Owner=me --json`,
        `${CLI} personal rows list DATABASE_ID --filter "Tags~Backend" --limit 20`,
      ],
    }),
    "notion_row",
    rowSchema,
  )
    .summary("list a Notion database's rows live, filtered by their values")
    .description(
      "list a Notion database's rows live, with their values as the local copy keeps them. Each --filter is " +
        "Name, an operator and a value, and a row must match every one. = and != compare, and with an empty value " +
        "ask whether it is empty. > >= < <= compare numbers and dates. ~ and !~ ask whether text or a list holds the " +
        "value. A people value takes me, an email address or a user id",
    )
    .argument("<database>", "the database's id or Notion link, or one of its data source ids")
    .addOption(
      new Option("--filter <query>", "a condition such as Status=Open or Due<2026-12-01. Repeat it for more")
        .argParser(condition)
        .default([], "none"),
    )
    .option(
      "--limit <n>",
      `at most this many, up to ${LARGEST_PAGE} (${DEFAULT_PAGE} if not given)`,
      positiveCount("--limit"),
    )
    .option("--cursor <cursor>", "go on from where the last page stopped, as page.next gives it")
    .action(async function (this: Command, database: string) {
      const {
        filter = [],
        limit = DEFAULT_PAGE,
        cursor,
      } = this.opts<{
        filter?: Condition[]
        limit?: number
        cursor?: string
      }>()
      const size = Math.min(limit, LARGEST_PAGE)
      const id = notionId(database, "database")
      const found = await withNotion(this, (notion) =>
        notion.rows({ database: id, conditions: filter, limit: size, cursor }),
      )
      renderAnswer(
        this,
        outputFor(this),
        listOf(commandPath(this), {
          items: found.items,
          limit: size,
          has_more: found.hasMore,
          paging: "cursor",
          ...(found.cursor === undefined ? {} : { cursor: found.cursor }),
          args: { database: id },
        }),
      )
    })

/** `rows list`: a database's rows with their values, live; documents create and update write them. */
export const rowsCommand = (): Command =>
  annotate(new Command("rows"), { effects: REMOTE_READ })
    .description("list a Notion database's rows live, with their values")
    .addCommand(marksUntrusted(listCommand(), DOCUMENT_UNTRUSTED))
