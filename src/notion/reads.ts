/**
 * The reads the incremental sync needs from Notion, and nothing more. The real client implements it; the sync's tests
 * implement it with a strict fake. Shapes are the subset of Notion's own JSON (API version 2026-03-11) the sync reads,
 * so an implementation passes Notion's answers through instead of converting them.
 *
 * Errors, after the implementation's own retries and pacing:
 * - `CliError("not_found")` for 404 `object_not_found`: deleted for good, or not shared with this token. Notion does
 *   not say which, and the sync treats both as gone.
 * - `CliError("permission_error")` for 403 `restricted_resource`.
 * - `CliError("rate_limited", …, { retry_after_ms })` for a 429 or 529 the implementation stopped retrying.
 * - `CliError("validation_error")` for a 400, for example a start cursor Notion no longer accepts.
 * - A list answer cut at Notion's 10,000-result cap carries `request_status.type: "incomplete"`; search too.
 *
 * Endpoint pages: https://developers.notion.com/reference/post-search, /query-a-data-source, /retrieve-a-page,
 * /retrieve-a-database, /retrieve-a-block, /get-block-children, /retrieve-page-markdown, /get-self, /get-user,
 * /list-comments.
 */

export interface NotionUser {
  object: "user"
  id: string
  /** Partial users carry only the id. */
  name?: string | null
}

/**
 * A whole user. `person.email` is there only when the connection may read user information including email addresses
 * (https://developers.notion.com/reference/capabilities).
 */
export interface NotionUserDetail extends NotionUser {
  type?: "person" | "bot"
  person?: { email?: string }
}

export type NotionParent =
  | { type: "workspace"; workspace: true }
  | { type: "page_id"; page_id: string }
  | { type: "data_source_id"; data_source_id: string; database_id: string }
  | { type: "database_id"; database_id: string }
  | { type: "block_id"; block_id: string }

export interface NotionRichText {
  plain_text: string
  href?: string | null
}

export interface NotionDate {
  start: string
  end?: string | null
  time_zone?: string | null
}

interface NotionFileValue {
  name: string
  type?: "file" | "external" | "file_upload"
  file?: { url: string; expiry_time?: string }
  external?: { url: string }
}

/**
 * A value as a page or a query row carries it (https://developers.notion.com/reference/page-property-values). Notion
 * adds types over time, so a reader must expect a `type` outside this list and skip it.
 */
export type NotionPropertyValue = { id?: string } & (
  | { type: "title"; title: NotionRichText[] }
  | { type: "rich_text"; rich_text: NotionRichText[] }
  | { type: "number"; number: number | null }
  | { type: "select"; select: { name: string } | null }
  | { type: "status"; status: { name: string } | null }
  | { type: "multi_select"; multi_select: { name: string }[] }
  | { type: "date"; date: NotionDate | null }
  | { type: "people"; people: NotionUser[] }
  | { type: "files"; files: NotionFileValue[] }
  | { type: "checkbox"; checkbox: boolean }
  | { type: "url"; url: string | null }
  | { type: "email"; email: string | null }
  | { type: "phone_number"; phone_number: string | null }
  | { type: "formula"; formula: NotionFormula }
  | { type: "relation"; relation: { id: string }[]; has_more?: boolean }
  | { type: "rollup"; rollup: NotionRollup }
  | { type: "created_time"; created_time: string }
  | { type: "last_edited_time"; last_edited_time: string }
  | { type: "created_by"; created_by: NotionUser }
  | { type: "last_edited_by"; last_edited_by: NotionUser }
  | { type: "unique_id"; unique_id: { number: number | null; prefix: string | null } }
  | { type: "verification"; verification: { state: string; verified_by?: NotionUser | null } | null }
  | { type: "place"; place: { name?: string | null; address?: string | null } | null }
  | { type: "button"; button: Record<string, never> }
)

export type NotionFormula =
  | { type: "string"; string: string | null }
  | { type: "number"; number: number | null }
  | { type: "boolean"; boolean: boolean | null }
  | { type: "date"; date: NotionDate | null }

export type NotionRollup =
  | { type: "number"; number: number | null }
  | { type: "date"; date: NotionDate | null }
  | { type: "array"; array: NotionPropertyValue[] }
  | { type: "incomplete" | "unsupported" }

export interface NotionPage {
  object: "page"
  id: string
  created_time: string
  /** Notion rounds it to the minute (not checked live). */
  last_edited_time: string
  created_by?: NotionUser
  last_edited_by?: NotionUser
  in_trash: boolean
  parent: NotionParent
  url: string
  properties: Record<string, NotionPropertyValue>
}

export interface NotionDataSource {
  object: "data_source"
  id: string
  /** An externally synced source can sit under another source; both forms name the database. */
  parent:
    | { type: "database_id"; database_id: string }
    | { type: "data_source_id"; data_source_id: string; database_id: string }
  last_edited_time: string
  in_trash: boolean
}

export interface NotionDatabase {
  object: "database"
  id: string
  title: NotionRichText[]
  parent: NotionParent
  created_time: string
  last_edited_time: string
  in_trash: boolean
  url: string
  data_sources: { id: string; name: string }[]
}

export interface NotionBlock {
  object: "block"
  id: string
  type: string
  has_children: boolean
  in_trash?: boolean
  parent: NotionParent
  created_time: string
  last_edited_time: string
  created_by?: NotionUser
  last_edited_by?: NotionUser
  child_page?: { title: string }
  child_database?: { title: string }
}

export interface NotionList<T> {
  results: T[]
  next_cursor: string | null
  has_more: boolean
  /** `incomplete` on every page of a query Notion cut at 10,000 results. */
  request_status?: { type: "complete" | "incomplete"; incomplete_reason?: string }
}

export interface NotionSearchRequest {
  filter: { property: "object"; value: "page" | "data_source" }
  sort: { timestamp: "last_edited_time"; direction: "ascending" | "descending" }
  start_cursor?: string
  page_size?: number
}

export type NotionTimestampFilter =
  | { timestamp: "last_edited_time"; last_edited_time: { on_or_after: string } }
  | { timestamp: "created_time"; created_time: { on_or_after: string } }

export interface NotionQueryRequest {
  filter?: NotionTimestampFilter | { and: NotionTimestampFilter[] }
  sorts?: { timestamp: "created_time" | "last_edited_time"; direction: "ascending" | "descending" }[]
  start_cursor?: string
  page_size?: number
}

export interface NotionPageMarkdown {
  /** Markdown v2 (`markdown_version=v2`). */
  markdown: string
  truncated: boolean
  /** Truncated and unshared blocks alike; a re-fetch of an unshared one is a 404. */
  unknown_block_ids: string[]
}

/**
 * An unresolved comment ([comment object](https://developers.notion.com/reference/comment-object)); Notion lists no
 * resolved one ([list comments](https://developers.notion.com/reference/list-comments)).
 */
export interface NotionComment {
  object: "comment"
  id: string
  discussion_id: string
  created_time: string
  created_by: NotionUser
  rich_text: NotionRichText[]
  display_name?: { resolved_name?: string | null }
}

/** The token's bot user; a personal access token has one too, owned by the person who made it. */
export interface NotionSelf {
  object: "user"
  id: string
  type: "bot" | "person"
  name?: string | null
  bot?: { workspace_id?: string; workspace_name?: string | null; owner?: { type: "workspace" | "user" } }
}

export interface NotionReads {
  /** `GET /v1/users/me`. */
  self(): Promise<NotionSelf>
  /** `GET /v1/users/{id}`; 403 when the connection may not read user information. */
  retrieveUser(id: string): Promise<NotionUserDetail>
  /** `POST /v1/search`, without a text query. */
  search(request: NotionSearchRequest): Promise<NotionList<NotionPage | NotionDataSource>>
  /** `POST /v1/data_sources/{id}/query`. */
  queryDataSource(id: string, request: NotionQueryRequest): Promise<NotionList<NotionPage>>
  /** `GET /v1/pages/{id}`. A trashed page answers with `in_trash: true`. */
  retrievePage(id: string): Promise<NotionPage>
  /** `GET /v1/databases/{id}`, with its data sources. */
  retrieveDatabase(id: string): Promise<NotionDatabase>
  /** `GET /v1/blocks/{id}`, to climb from a page whose parent is a block to the page that holds it. */
  retrieveBlock(id: string): Promise<NotionBlock>
  /** `GET /v1/blocks/{id}/children`, one page of up to 100. */
  blockChildren(id: string, startCursor?: string): Promise<NotionList<NotionBlock>>
  /** `GET /v1/pages/{id}/markdown?markdown_version=v2`; a block id fetches that block's subtree. */
  pageMarkdown(id: string): Promise<NotionPageMarkdown>
  /** `GET /v1/comments?block_id={id}`, one page of up to 100; 403 when the connection may not read comments. */
  comments(id: string, startCursor?: string): Promise<NotionList<NotionComment>>
  /**
   * Notion's clock: the `Date` header of its latest answer, in milliseconds, or undefined before any answer. Not a
   * request. The sync compares Notion's timestamps with it, never with this computer's clock.
   */
  serverTime?(): number | undefined
}
