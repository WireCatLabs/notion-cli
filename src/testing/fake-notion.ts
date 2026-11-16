// A strict fake of the Notion API, built from its reference, linked at each route: it refuses an unknown path, query
// parameter, body field, version or token, so a name typed from memory fails a test instead of reaching an account.
// No answer here was captured from a live workspace; docs/dev/DESIGN.md, "Live check", lists what the owner checks.
// Visibly fake data only (WC-TEST-8).

import { isCliError } from "@wirecat/cli-base"
import type { NotionQueryRequest, NotionSearchRequest } from "../notion/reads.js"
import type { FakeNotion as FakeWorkspace } from "./fake-notion-reads.js"

/** Spelled so gitleaks lets it through; never a real token. */
export const FAKE_TOKEN = "wirecatfake0token42"
export const NOTION_VERSION_SENT = "2026-03-11"

export const WORKSPACE_ID = "aaaaaaaa-0000-4000-8000-000000000001"
export const BOT_ID = "bbbbbbbb-0000-4000-8000-000000000002"
export const PAGE_ID = "cccccccc-0000-4000-8000-000000000003"
export const DATABASE_ID = "dddddddd-0000-4000-8000-000000000004"
export const SOURCE_ID = "eeeeeeee-0000-4000-8000-000000000005"
export const DISCUSSION_ID = "d0d0d0d0-0000-4000-8000-000000000099"

export interface FakeCall {
  method: string
  path: string
  query: Record<string, string>
  body: Record<string, unknown> | undefined
  /** A multipart body's fields: a file as its name and size, never its bytes. */
  form?: Record<string, string | { name: string; size: number }>
  url: string
  headers: Record<string, string>
}

interface Answer {
  status: number
  body: unknown
  headers?: Record<string, string>
}

interface Route {
  method: string
  path: RegExp
  query: readonly string[]
  /** The body's documented fields; a route without it takes no body. */
  body?: readonly string[]
  /** The multipart form's documented fields, for a route that takes one instead of JSON. */
  form?: readonly string[]
  answer: (id: string, call: FakeCall) => Answer | Promise<Answer>
}

export interface FakePage {
  markdown: string
  unknown_block_ids?: string[]
  /** Notion cut the page at its own limit; by default only when some blocks are unknown. */
  truncated?: boolean
  /** Set by a create's title or a write's trash; a page without one is titled "Test row". */
  title?: string
  in_trash?: boolean
}

export interface FakeNotionOptions {
  /** Pages and blocks by id, as `GET /v1/pages/{id}/markdown` answers them. */
  pages?: Record<string, FakePage>
  /** `users/me` without `bot.workspace_id`, as the docs' own example shows it. */
  noWorkspaceId?: boolean
  owner?: "user" | "workspace"
  /** The token's bot, as another connection to the same workspace has; it takes its own token. */
  botId?: string
  token?: string
  /** Each request in turn is answered with the next of these, then normally. */
  failures?: Answer[]
  /** Every request is answered with this. */
  failWith?: Answer
  dataSources?: number
  /** What a Markdown update answers in `warnings`, as Notion does for a part it changed or left out. */
  updateWarnings?: { code: string; message: string }[]
  /**
   * A whole workspace behind the same strict routes: search, pages, databases, queries and blocks answer from it, so
   * a sync runs against one data model with the request checks of this fake.
   */
  workspace?: FakeWorkspace
  /** Discussions already on PAGE_ID, one comment each, to reply in. */
  discussions?: string[]
}

const text = (content: string) => [
  {
    type: "text",
    text: { content, link: null },
    annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: "default" },
    plain_text: content,
    href: null,
  },
]

/** [Status codes](https://developers.notion.com/reference/status-codes): `{ object: "error", status, code, message }`. */
export const notionError = (
  status: number,
  code: string,
  extra: Record<string, unknown> = {},
  headers = {},
): Answer => ({
  status,
  headers,
  body: {
    object: "error",
    status,
    code,
    message: "Fake message that quotes wirecat-secret-marker",
    request_id: "ffffffff-0000-4000-8000-000000000009",
    ...extra,
  },
})

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

const dataSource = (id: string, title: string) => ({
  object: "data_source",
  id,
  title: text(title),
  description: [],
  parent: { type: "database_id", database_id: DATABASE_ID },
  database_parent: { type: "page_id", page_id: PAGE_ID },
  created_time: "2026-01-02T03:04:00.000Z",
  last_edited_time: "2026-01-03T04:05:00.000Z",
  in_trash: false,
  archived: false,
  properties: {
    Name: { id: "title", name: "Name", type: "title", title: {} },
    Status: {
      id: "s%3Ab",
      name: "Status",
      type: "status",
      status: {
        options: [
          { id: "1", name: "Not started", color: "default" },
          { id: "2", name: "Done", color: "green" },
        ],
        groups: [],
      },
    },
    Tags: {
      id: "t%3Ag",
      name: "Tags",
      type: "multi_select",
      multi_select: { options: [{ id: "3", name: "Test tag", color: "blue" }] },
    },
  },
})

const NOTION_CODES: Record<string, [number, string]> = {
  not_found: [404, "object_not_found"],
  validation_error: [400, "validation_error"],
  permission_error: [403, "restricted_resource"],
  rate_limited: [429, "rate_limited"],
  provider_unavailable: [503, "service_unavailable"],
}

/** The workspace's answer, or its refusal as Notion's error body. */
const fromWorkspace = async (read: () => Promise<unknown>): Promise<Answer> => {
  try {
    return { status: 200, body: await read() }
  } catch (error) {
    if (!isCliError(error)) throw error
    const [status, code] = NOTION_CODES[error.code] ?? [500, "internal_server_error"]
    return notionError(typeof error.details.status === "number" ? error.details.status : status, code)
  }
}

const workspaceRoutes = (workspace: FakeWorkspace): Route[] => [
  {
    method: "POST",
    path: /^\/v1\/search$/u,
    query: [],
    body: ["query", "filter", "sort", "start_cursor", "page_size"],
    answer: (_, { body }) =>
      fromWorkspace(async () => ({
        object: "list",
        ...(await workspace.search(body as unknown as NotionSearchRequest)),
      })),
  },
  {
    method: "GET",
    path: new RegExp(`^/v1/pages/(${UUID})/markdown$`, "u"),
    query: ["markdown_version", "include_transcript"],
    answer: (id, { query }) =>
      query.markdown_version !== "v2"
        ? notionError(400, "validation_error")
        : fromWorkspace(async () => ({ object: "page_markdown", id, ...(await workspace.pageMarkdown(id)) })),
  },
  {
    method: "GET",
    path: new RegExp(`^/v1/pages/(${UUID})$`, "u"),
    query: ["filter_properties"],
    answer: (id) => fromWorkspace(() => workspace.retrievePage(id)),
  },
  {
    method: "GET",
    path: new RegExp(`^/v1/databases/(${UUID})$`, "u"),
    query: [],
    answer: (id) => fromWorkspace(() => workspace.retrieveDatabase(id)),
  },
  {
    method: "POST",
    path: new RegExp(`^/v1/data_sources/(${UUID})/query$`, "u"),
    query: ["filter_properties"],
    body: ["filter", "sorts", "start_cursor", "page_size"],
    answer: (id, { body }) =>
      fromWorkspace(async () => ({
        object: "list",
        ...(await workspace.queryDataSource(id, (body ?? {}) as NotionQueryRequest)),
      })),
  },
  {
    method: "GET",
    path: new RegExp(`^/v1/blocks/(${UUID})$`, "u"),
    query: [],
    answer: (id) => fromWorkspace(() => workspace.retrieveBlock(id)),
  },
  {
    method: "GET",
    path: new RegExp(`^/v1/blocks/(${UUID})/children$`, "u"),
    query: ["start_cursor", "page_size"],
    answer: (id, { query }) =>
      fromWorkspace(async () => ({ object: "list", ...(await workspace.blockChildren(id, query.start_cursor)) })),
  },
]

/** Notion, answering through `fetch`. `calls` holds every request; `refusals` every one it turned away and why. */
export const fakeNotion = (options: FakeNotionOptions = {}) => {
  const pages: Record<string, FakePage> = options.pages ?? {
    [PAGE_ID]: { markdown: "# Test page\n\nFake text written by Test Person." },
  }
  const calls: FakeCall[] = []
  const refusals: string[] = []
  const failures = [...(options.failures ?? [])]
  const sources = Array.from({ length: options.dataSources ?? 1 }, (_, index) =>
    index === 0 ? SOURCE_ID : `eeeeeeee-0000-4000-8000-00000000010${index}`,
  )

  const routes: Route[] = [
    ...(options.workspace ? workspaceRoutes(options.workspace) : []),
    {
      // https://developers.notion.com/reference/get-self
      method: "GET",
      path: /^\/v1\/users\/me$/u,
      query: [],
      answer: () => ({
        status: 200,
        body: {
          object: "user",
          id: options.botId ?? BOT_ID,
          name: "Test Connection",
          avatar_url: null,
          type: "bot",
          bot: {
            owner:
              options.owner === "workspace"
                ? { type: "workspace", workspace: true }
                : { type: "user", user: { object: "user", id: "99999999-0000-4000-8000-000000000099" } },
            workspace_name: "Test Workspace",
            ...(options.noWorkspaceId ? {} : { workspace_id: WORKSPACE_ID }),
            workspace_limits: { max_file_upload_size_in_bytes: 5242880 },
          },
        },
      }),
    },
    {
      // https://developers.notion.com/reference/retrieve-page-markdown
      method: "GET",
      path: new RegExp(`^/v1/pages/(${UUID})/markdown$`, "u"),
      query: ["markdown_version", "include_transcript"],
      answer: (id, { query }) => {
        if (query.markdown_version !== "v2") return notionError(400, "validation_error")
        const page = pages[id]
        if (!page) return notionError(404, "object_not_found")
        const unknown = page.unknown_block_ids ?? []
        return {
          status: 200,
          body: {
            object: "page_markdown",
            id,
            markdown: page.markdown,
            truncated: page.truncated ?? unknown.length > 0,
            unknown_block_ids: unknown,
          },
        }
      },
    },
    {
      // https://developers.notion.com/reference/post-search
      method: "POST",
      path: /^\/v1\/search$/u,
      query: [],
      body: ["query", "filter", "sort", "start_cursor", "page_size"],
      answer: (_, { body = {} }) => {
        const filter = body.filter as { property?: unknown; value?: unknown } | undefined
        if (filter && (filter.property !== "object" || !["page", "data_source"].includes(String(filter.value))))
          return notionError(400, "validation_error")
        const size = Number(body.page_size ?? 100)
        if (!Number.isInteger(size) || size < 1 || size > 100) return notionError(400, "validation_error")
        const all =
          filter?.value === "page" ? [] : sources.map((id, index) => dataSource(id, `Test database ${index + 1}`))
        const start = body.start_cursor === undefined ? 0 : sources.indexOf(String(body.start_cursor))
        if (start < 0) return notionError(400, "validation_error")
        const matching = all.filter(
          (one) => body.query === undefined || one.title[0]?.plain_text.includes(String(body.query)),
        )
        const results = matching.slice(start, start + size)
        const next = sources[start + size]
        return {
          status: 200,
          body: { object: "list", results, next_cursor: next ?? null, has_more: next !== undefined },
        }
      },
    },
    {
      // https://developers.notion.com/reference/retrieve-a-database
      method: "GET",
      path: new RegExp(`^/v1/databases/(${UUID})$`, "u"),
      query: [],
      answer: (id) =>
        id !== DATABASE_ID
          ? notionError(404, "object_not_found")
          : {
              status: 200,
              body: {
                object: "database",
                id,
                title: text("Test database"),
                description: text("Fake description"),
                parent: { type: "page_id", page_id: PAGE_ID },
                is_inline: false,
                database_type: null,
                in_trash: false,
                is_locked: false,
                show_data_source_title: false,
                created_time: "2026-01-02T03:04:00.000Z",
                last_edited_time: "2026-01-03T04:05:00.000Z",
                data_sources: sources.map((source, index) => ({ id: source, name: `Test database ${index + 1}` })),
                icon: null,
                cover: null,
                url: `https://www.notion.so/${id.replaceAll("-", "")}`,
                public_url: null,
              },
            },
    },
    {
      // https://developers.notion.com/reference/retrieve-a-data-source
      method: "GET",
      path: new RegExp(`^/v1/data_sources/(${UUID})$`, "u"),
      query: [],
      answer: (id) => {
        const index = sources.indexOf(id)
        return index < 0
          ? notionError(404, "object_not_found")
          : { status: 200, body: dataSource(id, `Test database ${index + 1}`) }
      },
    },
  ]

  const page = (id: string) => ({
    object: "page",
    id,
    created_time: "2026-01-02T03:04:00.000Z",
    last_edited_time: "2026-01-03T04:05:00.000Z",
    created_by: { object: "user", id: BOT_ID },
    last_edited_by: { object: "user", id: BOT_ID },
    in_trash: pages[id]?.in_trash ?? false,
    is_locked: false,
    parent: { type: "data_source_id", data_source_id: SOURCE_ID, database_id: DATABASE_ID },
    url: `https://www.notion.so/${id.replaceAll("-", "")}`,
    public_url: null,
    icon: null,
    cover: null,
    properties: { Name: { id: "title", type: "title", title: text(pages[id]?.title ?? "Test row") } },
  })
  let created = 0
  const block = (id: string) => ({
    object: "block",
    id,
    parent: { type: "page_id", page_id: PAGE_ID },
    type: "child_page",
    has_children: false,
    in_trash: false,
    created_time: "2026-01-02T03:04:00.000Z",
    last_edited_time: "2026-01-03T04:05:00.000Z",
    child_page: { title: "Test child" },
  })
  routes.push(
    {
      // https://developers.notion.com/reference/retrieve-a-page
      method: "GET",
      path: new RegExp(`^/v1/pages/(${UUID})$`, "u"),
      query: ["filter_properties"],
      answer: (id) => (id in pages ? { status: 200, body: page(id) } : notionError(404, "object_not_found")),
    },
    {
      // https://developers.notion.com/reference/patch-page, https://developers.notion.com/reference/trash-page
      method: "PATCH",
      path: new RegExp(`^/v1/pages/(${UUID})$`, "u"),
      query: [],
      body: ["properties", "icon", "cover", "in_trash", "is_locked"],
      answer: (id, { body = {} }) => {
        const held = pages[id]
        if (!held) return notionError(404, "object_not_found")
        if (body.in_trash !== undefined && typeof body.in_trash !== "boolean")
          return notionError(400, "validation_error")
        if (typeof body.in_trash === "boolean") held.in_trash = body.in_trash
        return { status: 200, body: page(id) }
      },
    },
    {
      // https://developers.notion.com/reference/post-page, with Markdown as in
      // https://developers.notion.com/guides/data-apis/working-with-markdown-content
      method: "POST",
      path: /^\/v1\/pages$/u,
      query: [],
      body: [
        "parent",
        "properties",
        "icon",
        "cover",
        "content",
        "children",
        "markdown",
        "allow_async",
        "markdown_version",
        "template",
        "position",
        "notifications",
      ],
      answer: (_, { body = {} }) => {
        const parent = body.parent as { page_id?: unknown } | undefined
        if (typeof parent?.page_id !== "string" || !new RegExp(`^${UUID}$`, "u").test(parent.page_id))
          return notionError(400, "validation_error")
        if (!pages[parent.page_id] || pages[parent.page_id]?.in_trash) return notionError(404, "object_not_found")
        if (body.markdown_version !== undefined && (body.markdown === undefined || body.markdown_version !== "v2"))
          return notionError(400, "validation_error")
        const markdown = typeof body.markdown === "string" ? body.markdown : ""
        const named = (body.properties as { title?: { title?: { text?: { content?: string } }[] } } | undefined)?.title
          ?.title?.[0]?.text?.content
        const heading = /^# (.+)$/mu.exec(markdown)?.[1]
        created += 1
        const id = `f0f0f0f0-0000-4000-8000-${String(created).padStart(12, "0")}`
        pages[id] = { markdown, title: named ?? heading ?? "" }
        return { status: 200, body: page(id) }
      },
    },
    {
      // https://developers.notion.com/reference/update-page-markdown: a child page or database whose tag the new
      // text leaves out is refused unless the update allows deleting it.
      method: "PATCH",
      path: new RegExp(`^/v1/pages/(${UUID})/markdown$`, "u"),
      query: [],
      body: [
        "allow_async",
        "markdown_version",
        "type",
        "insert_content",
        "replace_content_range",
        "update_content",
        "replace_content",
      ],
      answer: (id, { body = {} }) => {
        const held = pages[id]
        if (!held) return notionError(404, "object_not_found")
        const replace = body.replace_content as { new_str?: unknown; allow_deleting_content?: unknown } | undefined
        if (body.markdown_version !== "v2" || body.type !== "replace_content" || typeof replace?.new_str !== "string")
          return notionError(400, "validation_error")
        const children = held.markdown.match(/<(page|database)\b[^>]*>.*?<\/\1>/gsu) ?? []
        const dropped = children.filter((tag) => !(replace.new_str as string).includes(tag))
        if (dropped.length > 0 && replace.allow_deleting_content !== true) return notionError(400, "validation_error")
        held.markdown = replace.new_str
        const warnings = options.updateWarnings ?? []
        return {
          status: 200,
          body: {
            object: "page_markdown",
            id,
            markdown: held.markdown,
            truncated: false,
            unknown_block_ids: [],
            ...(warnings.length > 0 ? { warnings } : {}),
          },
        }
      },
    },
    {
      // https://developers.notion.com/reference/query-a-data-source
      method: "POST",
      path: new RegExp(`^/v1/data_sources/(${UUID})/query$`, "u"),
      query: ["filter_properties"],
      body: ["filter", "sorts", "start_cursor", "page_size"],
      answer: (id) =>
        sources.includes(id)
          ? { status: 200, body: { object: "list", results: [page(PAGE_ID)], next_cursor: null, has_more: false } }
          : notionError(404, "object_not_found"),
    },
    {
      // https://developers.notion.com/reference/retrieve-a-block
      method: "GET",
      path: new RegExp(`^/v1/blocks/(${UUID})$`, "u"),
      query: [],
      answer: (id) => ({ status: 200, body: block(id) }),
    },
    {
      // https://developers.notion.com/reference/get-block-children
      method: "GET",
      path: new RegExp(`^/v1/blocks/(${UUID})/children$`, "u"),
      query: ["start_cursor", "page_size"],
      answer: () => ({
        status: 200,
        body: {
          object: "list",
          results: [block("abababab-0000-4000-8000-000000000021")],
          next_cursor: null,
          has_more: false,
        },
      }),
    },
  )

  const MIB = 1024 * 1024
  const comments: { id: string; discussion_id: string; page: string; markdown: string }[] = (
    options.discussions ?? []
  ).map((discussion, index) => ({
    id: `c0c0c0c0-0000-4000-8000-${String(900 + index).padStart(12, "0")}`,
    discussion_id: discussion,
    page: PAGE_ID,
    markdown: "Fake earlier comment",
  }))
  const commentJson = (comment: (typeof comments)[number]) => ({
    object: "comment",
    id: comment.id,
    parent: { type: "page_id", page_id: comment.page },
    discussion_id: comment.discussion_id,
    created_time: "2026-01-02T03:04:00.000Z",
    last_edited_time: "2026-01-02T03:04:00.000Z",
    created_by: { object: "user", id: BOT_ID },
    rich_text: text(comment.markdown),
    display_name: { type: "integration", resolved_name: "Test bot" },
  })
  const TYPES: Record<string, string> = {
    png: "image/png",
    pdf: "application/pdf",
    txt: "text/plain",
    mp4: "video/mp4",
  }
  const uploads = new Map<
    string,
    { filename: string; parts: number | undefined; sent: Map<number, number>; status: string; attached: boolean }
  >()
  const uploadJson = (id: string) => {
    const upload = uploads.get(id)
    const extension = upload?.filename.split(".").at(-1) ?? ""
    return {
      object: "file_upload",
      id,
      created_time: "2026-01-02T03:04:00.000Z",
      last_edited_time: "2026-01-02T03:04:00.000Z",
      expiry_time: "2026-01-02T04:04:00.000Z",
      in_trash: false,
      status: upload?.status,
      filename: upload?.filename,
      content_type: TYPES[extension] ?? "application/octet-stream",
      content_length: [...(upload?.sent.values() ?? [])].reduce((sum, size) => sum + size, 0),
      upload_url: `https://api.notion.com/v1/file_uploads/${id}/send`,
    }
  }
  routes.push(
    {
      // https://developers.notion.com/reference/list-comments: the unresolved comments of a page or block.
      method: "GET",
      path: /^\/v1\/comments$/u,
      query: ["block_id", "start_cursor", "page_size"],
      answer: (_, { query }) => {
        if (!query.block_id || !(query.block_id in pages)) return notionError(404, "object_not_found")
        const size = Number(query.page_size ?? 100)
        if (!Number.isInteger(size) || size < 1 || size > 100) return notionError(400, "validation_error")
        const all = comments.filter((comment) => comment.page === query.block_id)
        const from = Number(query.start_cursor ?? 0)
        const more = from + size < all.length
        return {
          status: 200,
          body: {
            object: "list",
            results: all.slice(from, from + size).map(commentJson),
            next_cursor: more ? String(from + size) : null,
            has_more: more,
            type: "comment",
            comment: {},
          },
        }
      },
    },
    {
      // https://developers.notion.com/reference/create-a-comment: exactly one target and exactly one body format.
      method: "POST",
      path: /^\/v1\/comments$/u,
      query: [],
      body: ["parent", "discussion_id", "rich_text", "markdown", "markdown_version", "attachments", "display_name"],
      answer: (_, { body = {} }) => {
        const parent = body.parent as { page_id?: unknown } | undefined
        if ((parent === undefined) === (body.discussion_id === undefined)) return notionError(400, "validation_error")
        if ((body.rich_text === undefined) === (typeof body.markdown !== "string"))
          return notionError(400, "validation_error")
        const thread = comments.find((comment) => comment.discussion_id === body.discussion_id)
        const page = typeof parent?.page_id === "string" ? parent.page_id : thread?.page
        if (!page || !(page in pages)) return notionError(404, "object_not_found")
        const n = String(comments.length + 1).padStart(12, "0")
        const comment = {
          id: `c0c0c0c0-0000-4000-8000-${n}`,
          discussion_id: thread?.discussion_id ?? `d0d0d0d0-0000-4000-8000-${n}`,
          page,
          markdown: body.markdown as string,
        }
        comments.push(comment)
        return { status: 200, body: commentJson(comment) }
      },
    },
    {
      // https://developers.notion.com/reference/create-file: a name with an extension; parts only in multi_part.
      method: "POST",
      path: /^\/v1\/file_uploads$/u,
      query: [],
      body: ["mode", "filename", "content_type", "number_of_parts", "external_url"],
      answer: (_, { body = {} }) => {
        const multi = body.mode === "multi_part"
        if (typeof body.filename !== "string" || !body.filename.includes("."))
          return notionError(400, "validation_error")
        if (body.mode !== undefined && body.mode !== "single_part" && !multi)
          return notionError(400, "validation_error")
        if (multi !== (typeof body.number_of_parts === "number")) return notionError(400, "validation_error")
        const id = `a0a0a0a0-0000-4000-8000-${String(uploads.size + 1).padStart(12, "0")}`
        uploads.set(id, {
          filename: body.filename,
          parts: multi ? (body.number_of_parts as number) : undefined,
          sent: new Map(),
          status: "pending",
          attached: false,
        })
        return { status: 200, body: uploadJson(id) }
      },
    },
    {
      // https://developers.notion.com/reference/upload-file: one part of 5 to 20 MB, the last smaller; 20 MB whole.
      method: "POST",
      path: new RegExp(`^/v1/file_uploads/(${UUID})/send$`, "u"),
      query: [],
      form: ["file", "part_number"],
      answer: (id, { form = {} }) => {
        const upload = uploads.get(id)
        if (!upload) return notionError(404, "object_not_found")
        const file = form.file
        if (typeof file !== "object" || upload.status !== "pending") return notionError(400, "validation_error")
        if (upload.parts === undefined) {
          if (form.part_number !== undefined || file.size > 20 * MIB) return notionError(400, "validation_error")
          upload.sent.set(1, file.size)
          upload.status = "uploaded"
        } else {
          const part = Number(form.part_number)
          if (!Number.isInteger(part) || part < 1 || part > upload.parts) return notionError(400, "validation_error")
          if (file.size > 20 * MIB || (part < upload.parts && file.size < 5 * MIB))
            return notionError(400, "validation_error")
          upload.sent.set(part, file.size)
        }
        return { status: 200, body: uploadJson(id) }
      },
    },
    {
      // https://developers.notion.com/reference/complete-file-upload: every part sent first.
      method: "POST",
      path: new RegExp(`^/v1/file_uploads/(${UUID})/complete$`, "u"),
      query: [],
      body: [],
      answer: (id) => {
        const upload = uploads.get(id)
        if (!upload) return notionError(404, "object_not_found")
        if (upload.parts === undefined || upload.sent.size !== upload.parts) return notionError(400, "validation_error")
        upload.status = "uploaded"
        return { status: 200, body: uploadJson(id) }
      },
    },
    {
      // https://developers.notion.com/reference/patch-block-children, with a file upload as in
      // https://developers.notion.com/guides/data-apis/uploading-small-files
      method: "PATCH",
      path: new RegExp(`^/v1/blocks/(${UUID})/children$`, "u"),
      query: [],
      body: ["children", "after", "position", "notifications"],
      answer: (id, { body = {} }) => {
        if (!(id in pages)) return notionError(404, "object_not_found")
        const children = body.children as Record<string, { type?: string; file_upload?: { id?: string } }>[]
        const block = children?.[0] as (Record<string, unknown> & { type?: string }) | undefined
        const type = block?.type ?? ""
        const media = block?.[type] as { type?: string; file_upload?: { id?: string } } | undefined
        const upload = uploads.get(media?.file_upload?.id ?? "")
        if (children.length !== 1 || !["image", "video", "audio", "pdf", "file"].includes(type))
          return notionError(400, "validation_error")
        if (media?.type !== "file_upload" || upload?.status !== "uploaded") return notionError(400, "validation_error")
        upload.attached = true
        const created = { object: "block", id: "b1b1b1b1-0000-4000-8000-000000000001", type, has_children: false }
        return { status: 200, body: { object: "list", results: [created], next_cursor: null, has_more: false } }
      },
    },
  )

  const refuse = (why: string, answer: Answer) => {
    refusals.push(why)
    return answer
  }

  const answerOf = async (call: FakeCall): Promise<Answer> => {
    if (call.headers.authorization !== `Bearer ${options.token ?? FAKE_TOKEN}`) return notionError(401, "unauthorized")
    if (call.headers["notion-version"] !== NOTION_VERSION_SENT)
      return refuse(`version ${call.headers["notion-version"]}`, notionError(400, "missing_version"))
    const route = routes.find((one) => one.method === call.method && one.path.test(call.path))
    if (!route) return refuse(`${call.method} ${call.path}`, notionError(400, "invalid_request_url"))
    for (const key of Object.keys(call.query))
      if (!route.query.includes(key)) return refuse(`query ${key}`, notionError(400, "validation_error"))
    if (route.body === undefined && call.body !== undefined)
      return refuse(`body on ${call.path}`, notionError(400, "validation_error"))
    if ((route.form === undefined) !== (call.form === undefined))
      return refuse(`form on ${call.path}`, notionError(400, "validation_error"))
    for (const key of Object.keys(call.form ?? {}))
      if (!route.form?.includes(key)) return refuse(`form ${key}`, notionError(400, "validation_error"))
    for (const key of Object.keys(call.body ?? {}))
      if (!route.body?.includes(key)) return refuse(`body ${key}`, notionError(400, "validation_error"))
    const failure = options.failWith ?? failures.shift()
    if (failure) return failure
    return route.answer(route.path.exec(call.path)?.[1] ?? "", call)
  }

  const fetch = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.hostname !== "api.notion.com") throw new TypeError(`fake Notion does not serve ${url.hostname}`)
    if (init.redirect !== "error") refusals.push(`redirect ${String(init.redirect)}`)
    const headers = Object.fromEntries(new Headers(init.headers).entries())
    const raw = typeof init.body === "string" ? init.body : undefined
    const form =
      init.body instanceof FormData
        ? Object.fromEntries(
            [...init.body.entries()].map(([key, value]) => [
              key,
              typeof value === "string" ? value : { name: value.name, size: value.size },
            ]),
          )
        : undefined
    const call: FakeCall = {
      method: (init.method ?? "GET").toUpperCase(),
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      body: raw === undefined ? undefined : (JSON.parse(raw) as Record<string, unknown>),
      ...(form ? { form } : {}),
      url: url.toString(),
      headers,
    }
    calls.push(call)
    const answer = await answerOf(call)
    const workspace = options.workspace
    const date: Record<string, string> = workspace?.dateHeader ? { date: new Date(workspace.now).toUTCString() } : {}
    return new Response(JSON.stringify(answer.body), {
      status: answer.status,
      headers: { "content-type": "application/json", ...date, ...answer.headers },
    })
  }

  return { fetch: fetch as typeof globalThis.fetch, calls, refusals, pages, comments, uploads }
}

export type FakeNotion = ReturnType<typeof fakeNotion>
