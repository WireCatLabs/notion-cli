import { defineCli } from "@wirecat/cli-core/manifest"

export default defineCli({
  identity: {
    command: "notion",
    package: "@wirecat/notion-cli",
    prefix: "WCNOTION",
    service: "Notion",
    owner: "WireCatLabs",
  },
  spec: { kind: "openapi", from: "https://developers.notion.com/openapi.json" },
  auth: { preset: "token" },
  category: "files",
  api: {
    // Every request names the API version (https://developers.notion.com/reference/versioning).
    headers: { "notion-version": "2026-03-11" },
    // 180 a minute per connection on the lower plan; data source queries "about 3 requests per second per
    // connection" (https://developers.notion.com/reference/request-limits).
    pace: { perMinute: 170, burst: 10, operations: { "post-database-query": { perMinute: 170, burst: 3 } } },
  },
  source: {
    provider: "notion",
    identity: { operation: "get-self", id: ["bot.workspace_id", "id"] },
    reads: {
      self: { operation: "get-self" },
      user: { operation: "get-user", path: { user_id: "{id}" } },
      search: { operation: "post-search" },
      query: { operation: "post-database-query", path: { data_source_id: "{id}" } },
      page: { operation: "retrieve-a-page", path: { page_id: "{id}" } },
      database: { operation: "retrieve-database", path: { database_id: "{id}" } },
      block: { operation: "retrieve-a-block", path: { block_id: "{id}" } },
      blocks: {
        operation: "get-block-children",
        path: { block_id: "{id}" },
        query: { page_size: 100, start_cursor: "{cursor}" },
      },
      markdown: { operation: "retrieve-page-markdown", path: { page_id: "{id}" }, query: { markdown_version: "v2" } },
    },
    // Pages read before notion saved their authors (0.5.0 and older) are read once more; src/sync/from-config.ts
    // narrows it to pages and rows and adds those read with less user information than the connection gives now.
    reread: { missing: "authors" },
  },
})
