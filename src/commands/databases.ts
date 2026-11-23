import { annotate } from "@wirecat/cli-base/commands"
import {
  answerEntity,
  commandPath,
  itemOf,
  listOf,
  outputFor,
  positiveCount,
  queryTerms,
  REMOTE_READ,
  renderAnswer,
  termField,
  withQuery,
} from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { withNotion } from "../context.js"
import { IDENTITY } from "../identity.js"
import { notionId } from "../notion/ids.js"
import { databaseRowSchema, databaseSchema } from "../notion/notion.js"

const CLI = IDENTITY.command

/** Notion's page size: a default of 100, which is also its most ([pagination](https://developers.notion.com/reference/pagination)). */
const LARGEST_PAGE = 100
const DEFAULT_PAGE = 50

/** Notion's search matches its `query` against titles ([search](https://developers.notion.com/reference/post-search)). */
const DATABASES_QUERY = {
  entity: "database",
  backend: "native",
  fields: [termField("title", "txt", "title:Roadmap")],
} as const

const listCommand = () =>
  withQuery(
    answerEntity(
      annotate(new Command("list"), {
        effects: REMOTE_READ,
        offline: false,
        examples: [
          `${CLI} personal databases list`,
          `${CLI} personal databases list title:Roadmap --json=id,data_source_id,title`,
        ],
      }),
      "database",
      databaseRowSchema,
    ),
    DATABASES_QUERY,
  )
    .summary("list the databases this token can see, live, one row per data source")
    .description(
      "list the databases this token can see, live from Notion's search: one row for each data source, with the " +
        "database it belongs to. Notion's search can lag behind a new database by a few minutes",
    )
    .option(
      "--limit <n>",
      `at most this many, up to ${LARGEST_PAGE}; ${DEFAULT_PAGE} if not given`,
      positiveCount("--limit"),
    )
    .option("--cursor <cursor>", "go on from where the last page stopped; page.next gives it")
    .action(async function (this: Command, words: string[]) {
      const title = queryTerms(words, DATABASES_QUERY, commandPath(this)).get("title")
      const { limit = DEFAULT_PAGE, cursor } = this.opts<{ limit?: number; cursor?: string }>()
      const size = Math.min(limit, LARGEST_PAGE)
      const found = await withNotion(this, (notion) => notion.databases({ limit: size, cursor, title }))
      renderAnswer(
        this,
        outputFor(this),
        listOf(commandPath(this), {
          items: found.items,
          limit: size,
          has_more: found.hasMore,
          paging: "cursor",
          ...(found.cursor === undefined ? {} : { cursor: found.cursor }),
          ...(words.length ? { args: { query: words.join(" ") } } : {}),
        }),
      )
    })

const showCommand = () =>
  answerEntity(
    annotate(new Command("show"), {
      effects: REMOTE_READ,
      offline: false,
      examples: [
        `${CLI} personal databases show 0123456789abcdef0123456789abcdef`,
        `${CLI} personal databases show https://www.notion.so/0123456789abcdef0123456789abcdef --json`,
      ],
    }),
    "database",
    databaseSchema,
  )
    .summary("show one database live: its data sources, their ids and properties")
    .description(
      "show one database live from Notion: its title, where it sits, and each of its data sources with its id, its " +
        "properties with the options of each select and status, and its templates, which documents create --template " +
        "takes. A query of the database names a data source id",
    )
    .argument("<database>", "the database's id or its Notion link")
    .action(async function (this: Command, database: string) {
      const id = notionId(database, "database")
      renderAnswer(this, outputFor(this), itemOf(await withNotion(this, (notion) => notion.database(id))))
    })

export const databasesCommand = (): Command =>
  annotate(new Command("databases"), { effects: REMOTE_READ })
    .description("read Notion databases and their data sources")
    .addCommand(listCommand())
    .addCommand(showCommand())
