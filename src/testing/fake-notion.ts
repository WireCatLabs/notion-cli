// A strict fake of the Notion API, built from its reference, linked at each route: it refuses an unknown path, query
// parameter, body field, version or token, so a name typed from memory fails a test instead of reaching an account.
// No answer here was captured from a live workspace; docs/dev/DESIGN.md, "Live check", lists what the owner checks.
// Visibly fake data only (WC-TEST-8).

/** Spelled so gitleaks lets it through; never a real token. */
export const FAKE_TOKEN = "wirecatfake0token42"
export const NOTION_VERSION_SENT = "2026-03-11"

export const WORKSPACE_ID = "aaaaaaaa-0000-4000-8000-000000000001"
export const BOT_ID = "bbbbbbbb-0000-4000-8000-000000000002"
export const PAGE_ID = "cccccccc-0000-4000-8000-000000000003"
export const DATABASE_ID = "dddddddd-0000-4000-8000-000000000004"
export const SOURCE_ID = "eeeeeeee-0000-4000-8000-000000000005"

export interface FakeCall {
  method: string
  path: string
  query: Record<string, string>
  body: Record<string, unknown> | undefined
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
  answer: (id: string, call: FakeCall) => Answer
}

export interface FakePage {
  markdown: string
  unknown_block_ids?: string[]
}

export interface FakeNotionOptions {
  /** Pages and blocks by id, as `GET /v1/pages/{id}/markdown` answers them. */
  pages?: Record<string, FakePage>
  /** `users/me` without `bot.workspace_id`, as the docs' own example shows it. */
  noWorkspaceId?: boolean
  owner?: "user" | "workspace"
  /** Each request in turn is answered with the next of these, then normally. */
  failures?: Answer[]
  /** Every request is answered with this. */
  failWith?: Answer
  dataSources?: number
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
    {
      // https://developers.notion.com/reference/get-self
      method: "GET",
      path: /^\/v1\/users\/me$/u,
      query: [],
      answer: () => ({
        status: 200,
        body: {
          object: "user",
          id: BOT_ID,
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
            truncated: unknown.length > 0,
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
    in_trash: false,
    is_locked: false,
    parent: { type: "data_source_id", data_source_id: SOURCE_ID, database_id: DATABASE_ID },
    url: `https://www.notion.so/${id.replaceAll("-", "")}`,
    public_url: null,
    icon: null,
    cover: null,
    properties: { Name: { id: "title", type: "title", title: text("Test row") } },
  })
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

  const refuse = (why: string, answer: Answer) => {
    refusals.push(why)
    return answer
  }

  const answerOf = (call: FakeCall): Answer => {
    if (call.headers.authorization !== `Bearer ${FAKE_TOKEN}`) return notionError(401, "unauthorized")
    if (call.headers["notion-version"] !== NOTION_VERSION_SENT)
      return refuse(`version ${call.headers["notion-version"]}`, notionError(400, "missing_version"))
    const route = routes.find((one) => one.method === call.method && one.path.test(call.path))
    if (!route) return refuse(`${call.method} ${call.path}`, notionError(400, "invalid_request_url"))
    for (const key of Object.keys(call.query))
      if (!route.query.includes(key)) return refuse(`query ${key}`, notionError(400, "validation_error"))
    if (route.body === undefined && call.body !== undefined)
      return refuse(`body on ${call.path}`, notionError(400, "validation_error"))
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
    const call: FakeCall = {
      method: (init.method ?? "GET").toUpperCase(),
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      body: raw === undefined ? undefined : (JSON.parse(raw) as Record<string, unknown>),
      url: url.toString(),
      headers,
    }
    calls.push(call)
    const answer = answerOf(call)
    return new Response(JSON.stringify(answer.body), {
      status: answer.status,
      headers: { "content-type": "application/json", ...answer.headers },
    })
  }

  return { fetch: fetch as typeof globalThis.fetch, calls, refusals, pages }
}

export type FakeNotion = ReturnType<typeof fakeNotion>
