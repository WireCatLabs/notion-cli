import type { Client } from "@notionhq/client"
import { CliError } from "@wirecat/cli-base"
import { mapped, NOTION } from "./errors.js"
import type {
  NotionBlock,
  NotionDatabase,
  NotionDataSource,
  NotionList,
  NotionPage,
  NotionPageMarkdown,
  NotionReads,
  NotionSelf,
  NotionUserDetail,
} from "./reads.js"

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null

/**
 * Notion's own JSON passes through, as the port asks; only the `object` it must be is checked, so an answer of
 * another kind fails here instead of deep in the sync.
 */
const kind = <T>(object: string | readonly string[], value: unknown): T => {
  const wanted = typeof object === "string" ? [object] : object
  if (isObject(value) && wanted.includes(String(value.object))) return value as T
  throw new CliError("invalid_response", `${NOTION}'s answer does not have the documented shape`, {
    reason: "notion.invalid-response",
  })
}

const list = <T>(items: string | readonly string[], value: unknown): NotionList<T> => {
  const page = kind<{ results?: unknown; has_more?: unknown; next_cursor?: unknown }>("list", value)
  if (!Array.isArray(page.results) || typeof page.has_more !== "boolean")
    throw new CliError("invalid_response", `${NOTION}'s list does not have the documented shape`, {
      reason: "notion.invalid-response",
    })
  for (const result of page.results) kind(items, result)
  return value as NotionList<T>
}

/**
 * Notion's clock, from the Date header of its latest answer. The sync compares Notion's timestamps with it, since
 * this computer's clock can be minutes off. Pass `observe` as the client's `onAnswer`.
 */
export const notionClock = () => {
  let last: number | undefined
  return {
    observe: (response: Response) => {
      const time = Date.parse(response.headers.get("date") ?? "")
      if (Number.isFinite(time)) last = time
    },
    time: () => last,
  }
}

/** The read port src/notion/reads.ts names, over the SDK: the same client, pace, retries and error mapping as the commands. */
export const notionPort = (client: Client, clock?: ReturnType<typeof notionClock>): NotionReads => ({
  ...(clock ? { serverTime: clock.time } : {}),
  self: async () => kind<NotionSelf>("user", await mapped(() => client.users.me({}))),
  retrieveUser: async (id) =>
    kind<NotionUserDetail>("user", await mapped(() => client.users.retrieve({ user_id: id }))),
  search: async (request) =>
    list<NotionPage | NotionDataSource>(["page", "data_source"], await mapped(() => client.search({ ...request }))),
  queryDataSource: async (id, request) =>
    list<NotionPage>("page", await mapped(() => client.dataSources.query({ data_source_id: id, ...request }))),
  retrievePage: async (id) => kind<NotionPage>("page", await mapped(() => client.pages.retrieve({ page_id: id }))),
  retrieveDatabase: async (id) =>
    kind<NotionDatabase>("database", await mapped(() => client.databases.retrieve({ database_id: id }))),
  retrieveBlock: async (id) => kind<NotionBlock>("block", await mapped(() => client.blocks.retrieve({ block_id: id }))),
  blockChildren: async (id, startCursor) =>
    list<NotionBlock>(
      "block",
      await mapped(() =>
        client.blocks.children.list({
          block_id: id,
          page_size: 100,
          ...(startCursor ? { start_cursor: startCursor } : {}),
        }),
      ),
    ),
  pageMarkdown: async (id) => {
    const answer = kind<NotionPageMarkdown & { object: string }>(
      "page_markdown",
      await mapped(() => client.pages.retrieveMarkdown({ page_id: id, markdown_version: "v2" })),
    )
    return { markdown: answer.markdown, truncated: answer.truncated, unknown_block_ids: answer.unknown_block_ids }
  },
})

/** A call the source manifest names in wirecat.config.ts `source.reads`, filled with an id or a cursor. */
export type NamedRead = (name: string, slots?: { id?: string; cursor?: string }, body?: unknown) => Promise<unknown>

/**
 * The same port over the calls wirecat.config.ts names, sent by cli-core's `api` request path: the sync's every
 * request is one the config lists. The fixed values the SDK added (page size, Markdown version) are in those calls.
 */
export const manifestPort = (read: NamedRead, serverTime?: () => number | undefined): NotionReads => ({
  ...(serverTime ? { serverTime } : {}),
  self: async () => kind<NotionSelf>("user", await read("self")),
  retrieveUser: async (id) => kind<NotionUserDetail>("user", await read("user", { id })),
  search: async (request) =>
    list<NotionPage | NotionDataSource>(["page", "data_source"], await read("search", {}, request)),
  queryDataSource: async (id, request) => list<NotionPage>("page", await read("query", { id }, request)),
  retrievePage: async (id) => kind<NotionPage>("page", await read("page", { id })),
  retrieveDatabase: async (id) => kind<NotionDatabase>("database", await read("database", { id })),
  retrieveBlock: async (id) => kind<NotionBlock>("block", await read("block", { id })),
  blockChildren: async (id, startCursor) =>
    list<NotionBlock>("block", await read("blocks", { id, ...(startCursor ? { cursor: startCursor } : {}) })),
  pageMarkdown: async (id) => {
    const answer = kind<NotionPageMarkdown & { object: string }>("page_markdown", await read("markdown", { id }))
    return { markdown: answer.markdown, truncated: answer.truncated, unknown_block_ids: answer.unknown_block_ids }
  },
})
