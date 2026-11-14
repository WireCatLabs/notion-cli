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

/** The read port src/notion/reads.ts names, over the SDK: the same client, pace, retries and error mapping as the commands. */
export const notionPort = (client: Client): NotionReads => ({
  self: async () => kind<NotionSelf>("user", await mapped(() => client.users.me({}))),
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
