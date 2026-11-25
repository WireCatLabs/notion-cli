import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { RunOptions } from "@wirecat/cli-core/cli"
import { mcpOverStdio } from "@wirecat/cli-core/testing"
import { afterEach, expect, it } from "vitest"
import type { ServiceEnvironment } from "./context.js"
import { isRead, notionClient, operationOf } from "./notion/client.js"
import { notionId } from "./notion/ids.js"
import { withoutSignedLinks } from "./notion/links.js"
import { notionPort } from "./notion/port.js"
import { run } from "./program.js"
import {
  DATABASE_ID,
  FAKE_TOKEN,
  fakeNotion,
  notionError,
  PAGE_ID,
  SOURCE_ID,
  WORKSPACE_ID,
} from "./testing/fake-notion.js"
import { runCli, signedIn } from "./testing/harness.js"

const PAGE_LINK = `https://www.notion.so/test-space/Test-page-${PAGE_ID.replaceAll("-", "")}?pvs=4`
const BLOCK = "abababab-0000-4000-8000-000000000011"
const HIDDEN = "acacacac-0000-4000-8000-000000000012"
const SIGNED =
  "https://prod-files-secure.s3.us-west-2.amazonaws.com/space/file/test.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=wirecatfakesignature"

const configFile = join(process.env.WCNOTION_CONFIG_DIR ?? "", "config.json")
const withPermissions = (permissions: Record<string, string>) => {
  mkdirSync(join(configFile, ".."), { recursive: true })
  writeFileSync(configFile, JSON.stringify({ profiles: { personal: { permissions } } }))
}
afterEach(() => rmSync(configFile, { force: true }))

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).isFile())

it("documents get reads a page by its link as Markdown v2, and prints the Markdown to a person", async () => {
  const notion = fakeNotion()
  const got = await runCli(["personal", "documents", "get", PAGE_LINK, "--json"], { notion })
  expect(got.json().item).toEqual({
    id: PAGE_ID,
    markdown: "# Test page\n\nFake text written by Test Person.",
    truncated: false,
    missing_block_ids: [],
    sha256: expect.stringMatching(/^[0-9a-f]{64}$/u),
    signed_links_removed: 0,
  })
  expect(notion.calls.map((call) => call.url)).toEqual([
    `https://api.notion.com/v1/pages/${PAGE_ID}/markdown?markdown_version=v2`,
  ])
  expect(notion.refusals).toEqual([])
  const text = await runCli(["personal", "documents", "get", PAGE_ID], { notion, tty: true })
  expect(text.out).toBe("# Test page\n\nFake text written by Test Person.\n")
})

it("documents get shows a terminal the escape sequences in a page as text, never runs them", async () => {
  const notion = fakeNotion({
    pages: { [PAGE_ID]: { markdown: "Fake \u001b[2J text \u001b]8;;https://example.com\u0007link\u001b]8;;\u0007" } },
  })
  const text = await runCli(["personal", "documents", "get", PAGE_ID], { notion, tty: true })
  expect(text.out).not.toContain("\u001b")
  expect(text.out).toContain("\\x1b[2J")
})

it("documents get fills a truncated page's unknown blocks in place, and lists the ones the token cannot see", async () => {
  const notion = fakeNotion({
    pages: {
      [PAGE_ID]: {
        markdown: `# Long\n\n<unknown url="https://www.notion.so/x#${BLOCK.replaceAll("-", "")}" alt="block"/>\n\nEnd`,
        unknown_block_ids: [BLOCK, HIDDEN],
      },
      [BLOCK]: { markdown: "Fetched part" },
    },
  })
  const got = await runCli(["personal", "documents", "get", PAGE_ID, "--json"], { notion })
  expect(got.code).toBe(6)
  expect(got.json().item).toMatchObject({
    markdown: "# Long\n\nFetched part\n\nEnd",
    truncated: true,
    missing_block_ids: [HIDDEN],
  })
  expect(got.json().missing).toEqual([{ field: "markdown", why: expect.stringContaining("1 blocks") }])
  expect(got.json().meta).toMatchObject({
    complete: false,
    issues: [{ code: "not_found", reason: "notion.not-shared", source: "notion" }],
  })
  expect(notion.calls).toHaveLength(3)

  const person = await runCli(["personal", "documents", "get", PAGE_ID], { notion, tty: true })
  expect(person.code).toBe(6)
  expect(person.out).toContain("Fetched part")
  expect(person.err).toContain("the page is incomplete: 1 blocks are missing")
})

it("documents get says a page Notion cut at its own limit is incomplete, even with no block to fetch", async () => {
  const notion = fakeNotion({ pages: { [PAGE_ID]: { markdown: "# Huge", truncated: true } } })
  const got = await runCli(["personal", "documents", "get", PAGE_ID, "--json"], { notion })
  expect(got.code).toBe(11)
  expect(got.json().item).toMatchObject({ truncated: true, missing_block_ids: [] })
  expect(got.json().meta).toMatchObject({
    complete: false,
    issues: [{ code: "provider_error", reason: "notion.truncated" }],
  })
})

it("documents get of a whole page is complete and exits 0", async () => {
  const got = await runCli(["personal", "documents", "get", PAGE_ID, "--json"], {
    notion: fakeNotion({ pages: { [PAGE_ID]: { markdown: "# Whole" } } }),
  })
  expect(got.code).toBe(0)
  expect(got.json().meta).toMatchObject({ complete: true })
  expect(got.json().meta).not.toHaveProperty("issues")
})

it("documents get cuts the signature from Notion's signed file links", async () => {
  const notion = fakeNotion({
    pages: { [PAGE_ID]: { markdown: `![test](${SIGNED})\n[docs](https://example.com/a?b=c)` } },
  })
  const got = await runCli(["personal", "documents", "get", PAGE_ID, "--json"], { notion })
  expect(got.out).not.toContain("X-Amz-Signature")
  expect(got.out).not.toContain("wirecatfakesignature")
  expect(got.json().item).toMatchObject({
    markdown:
      "![test](https://prod-files-secure.s3.us-west-2.amazonaws.com/space/file/test.png)\n[docs](https://example.com/a?b=c)",
    signed_links_removed: 1,
  })
})

it("documents get refuses what is not a Notion id or link, before any request", async () => {
  const notion = fakeNotion()
  const ran = await runCli(
    ["personal", "documents", "get", "https://example.com/0123456789abcdef0123456789abcdef", "--json"],
    {
      notion,
    },
  )
  expect(ran.json()).toMatchObject({ error: { code: "validation_error", reason: "notion.id-invalid" } })
  expect(notion.calls).toEqual([])
})

it("a page not shared with the token is not_found with the way to share it", async () => {
  const got = await runCli(["personal", "documents", "get", "dededede000040008000000000000013", "--json"])
  expect(got.json()).toMatchObject({ error: { code: "not_found", reason: "notion.not-shared" } })
  expect(got.err).toContain("Connections")
})

it("databases list pages by Notion's cursor, one row per data source with its database", async () => {
  const notion = fakeNotion({ dataSources: 3 })
  const first = await runCli(["personal", "databases", "list", "--limit", "2", "--json"], { notion })
  expect(first.json().items).toEqual([
    {
      id: DATABASE_ID,
      data_source_id: SOURCE_ID,
      title: "Test database 1",
      last_edited_time: "2026-01-03T04:05:00.000Z",
    },
    expect.objectContaining({ title: "Test database 2" }),
  ])
  expect(first.json().page).toMatchObject({ has_more: true })
  const cursor = (first.json().page as { next_cursor: string }).next_cursor
  const second = await runCli(["personal", "databases", "list", "--limit", "2", "--cursor", cursor, "--json"], {
    notion,
  })
  expect(second.json().items).toEqual([expect.objectContaining({ title: "Test database 3" })])
  expect(second.json().page).toMatchObject({ has_more: false })
  expect(notion.calls.map((call) => call.body)).toEqual([
    { filter: { property: "object", value: "data_source" }, page_size: 2 },
    { filter: { property: "object", value: "data_source" }, page_size: 2, start_cursor: cursor },
  ])
  expect(notion.refusals).toEqual([])
})

it("databases list title: asks Notion's search for titles with those words", async () => {
  const notion = fakeNotion({ dataSources: 3 })
  const found = await runCli(["personal", "databases", "list", `title:"database 2"`, "--json"], { notion })
  expect(found.json().items).toEqual([expect.objectContaining({ title: "Test database 2" })])
  expect(notion.calls[0]?.body).toMatchObject({ query: "database 2" })
})

it("marks database titles, property names, options and row titles in a scheduled agent's run", async () => {
  const MARK = "0123456789abcdef"
  const env = { WCNOTION_READ_ONLY: "1", WCNOTION_UNTRUSTED_MARK: MARK }
  const marked = (text: string) => new RegExp(`^⟦untrusted:${MARK} source=[^⟧]+⟧${text}⟦/untrusted:${MARK}⟧$`)
  const read = async (argv: string[]) => {
    const ran = await runCli(["personal", ...argv, "--json"], { notion: fakeNotion(), env })
    expect(ran.code, ran.err).toBe(0)
    return ran.json() as { item: Record<string, unknown>; items: Record<string, unknown>[] }
  }
  const [database] = (await read(["databases", "list"])).items
  expect(database?.title).toMatch(marked("Test database.*"))
  expect(database?.data_source_id).toBe(SOURCE_ID)
  const shown = (await read(["databases", "show", DATABASE_ID])).item as {
    title: string
    description: string
    data_sources: { title: string; properties: { name: string; type: string; options?: string[] }[] }[]
  }
  expect(shown.title).toMatch(marked("Test database"))
  expect(shown.description).toMatch(marked("Fake description"))
  const status = shown.data_sources[0]?.properties.find((property) => property.type === "status")
  expect(status?.name).toMatch(marked("Status"))
  expect(status?.options?.[0]).toMatch(marked("Not started"))
  const [row] = (await read(["rows", "list", DATABASE_ID])).items
  expect(row?.title).toMatch(marked(".+"))
})

it("databases show gives each data source's id and properties, with select and status options", async () => {
  const notion = fakeNotion()
  const shown = await runCli(["personal", "databases", "show", DATABASE_ID.replaceAll("-", ""), "--json"], { notion })
  expect(shown.json().item).toEqual({
    id: DATABASE_ID,
    title: "Test database",
    description: "Fake description",
    url: `https://www.notion.so/${DATABASE_ID.replaceAll("-", "")}`,
    parent: { type: "page_id", id: PAGE_ID },
    is_inline: false,
    in_trash: false,
    created_time: "2026-01-02T03:04:00.000Z",
    last_edited_time: "2026-01-03T04:05:00.000Z",
    data_sources: [
      {
        id: SOURCE_ID,
        title: "Test database 1",
        templates: [],
        properties: [
          { id: "title", name: "Name", type: "title" },
          { id: "s%3Ab", name: "Status", type: "status", options: ["Not started", "Done"] },
          { id: "t%3Ag", name: "Tags", type: "multi_select", options: ["Test tag"] },
          { id: "d%3Au", name: "Due", type: "date" },
          { id: "o%3Aw", name: "Owner", type: "people" },
          { id: "d%3Ao", name: "Done", type: "checkbox" },
          { id: "e%3As", name: "Estimate", type: "number" },
          { id: "n%3Ao", name: "Notes", type: "rich_text" },
          { id: "s%3Ac", name: "Score", type: "formula" },
        ],
      },
    ],
  })
  expect(notion.calls.map((call) => call.path)).toEqual([
    `/v1/databases/${DATABASE_ID}`,
    `/v1/data_sources/${SOURCE_ID}`,
    `/v1/data_sources/${SOURCE_ID}/templates`,
  ])
})

it("a 429 is waited out for its Retry-After and sent again, a search too; the run never really sleeps", async () => {
  const notion = fakeNotion({
    failures: [
      notionError(
        429,
        "rate_limited",
        { additional_data: { rate_limit_reason: "public_api_request_rate_limit" } },
        { "retry-after": "2" },
      ),
    ],
  })
  const listed = await runCli(["personal", "databases", "list", "--json"], { notion })
  expect(listed.code).toBe(0)
  expect(listed.waits).toContain(2000)
  expect(notion.calls).toHaveLength(2)
})

it("rate limits that outlast the retries end as rate_limited with Notion's reason", async () => {
  const notion = fakeNotion({
    failWith: notionError(
      429,
      "rate_limited",
      { additional_data: { rate_limit_reason: "public_api_space_request_rate_limit" } },
      { "retry-after": "1" },
    ),
  })
  const got = await runCli(["personal", "documents", "get", PAGE_ID, "--json"], { notion })
  expect(got.json()).toMatchObject({
    error: {
      code: "rate_limited",
      reason: "notion.rate-limited",
      details: { rate_limit_reason: "public_api_space_request_rate_limit" },
    },
  })
  expect(notion.calls).toHaveLength(4)
})

it("a blocked connection is a permission error that says retrying will not help", async () => {
  const notion = fakeNotion({
    failWith: notionError(429, "rate_limited", {
      additional_data: { rate_limit_reason: "public_api_request_blocked" },
    }),
  })
  const got = await runCli(["personal", "databases", "show", DATABASE_ID, "--json"], { notion })
  expect(got.json()).toMatchObject({ error: { code: "permission_error", reason: "notion.blocked" } })
  expect(notion.calls).toHaveLength(1)
})

it.each([
  [notionError(403, "restricted_resource"), "permission_error", "notion.restricted"],
  [notionError(409, "conflict_error"), "conflict", "notion.conflict"],
  [notionError(400, "validation_error"), "validation_error", "notion.refused"],
  [notionError(406, "row_limit_exceeded"), "provider_error", "provider.refused"],
  [notionError(503, "service_unavailable"), "provider_unavailable", "notion.unavailable"],
  [{ status: 502, body: "<html>bad gateway</html>" }, "provider_unavailable", "notion.unavailable"],
])("Notion's %o is %s (%s), and its message is never repeated", async (failure, code, reason) => {
  const got = await runCli(["personal", "documents", "get", PAGE_ID, "--json"], {
    notion: fakeNotion({ failWith: failure }),
  })
  expect(got.json()).toMatchObject({ error: { code, reason } })
  expect(got.err).not.toContain("wirecat-secret-marker")
})

it("an answer without the documented shape is invalid_response", async () => {
  const got = await runCli(["personal", "documents", "get", PAGE_ID, "--json"], {
    notion: fakeNotion({ failWith: { status: 200, body: { object: "page_markdown", id: PAGE_ID } } }),
  })
  expect(got.json()).toMatchObject({ error: { code: "invalid_response", reason: "notion.invalid-response" } })
})

it("a deny on a read stops it before any request", async () => {
  withPermissions({ "documents.get": "deny" })
  const notion = fakeNotion()
  const got = await runCli(["personal", "documents", "get", PAGE_ID, "--json"], { notion })
  expect(got.code).toBe(5)
  expect(notion.calls).toEqual([])
})

it("--offline refuses a read that needs Notion", async () => {
  const notion = fakeNotion()
  expect((await runCli(["--offline", "personal", "databases", "list", "--json"], { notion })).code).toBe(5)
  expect(notion.calls).toEqual([])
})

it("a recorded run is named after its command and keeps the path's shape, never a page id", async () => {
  const got = await runCli(["--record", "personal", "documents", "get", PAGE_ID, "--json"])
  const runId = String((got.json().meta as Record<string, unknown>).run_id)
  expect(runId).toContain("documents")
  const shown = await runCli(["runs", "show", runId, "--json"])
  const item = shown.json().item as { operations: string[]; events: unknown[] }
  expect(item.operations).toEqual(["GET /v1/pages/:id/markdown"])
  expect(JSON.stringify(item.events)).not.toContain(PAGE_ID)
})

it("the token reaches no address, output, run record or file, whatever the outcome", async () => {
  const notion = fakeNotion({ pages: { [PAGE_ID]: { markdown: `![x](${SIGNED})` } } })
  const runs = [
    await runCli(["--record", "personal", "documents", "get", PAGE_ID, "--json"], { notion }),
    await runCli(["--record", "personal", "databases", "list", "--json"], { notion }),
    await runCli(["personal", "documents", "get", PAGE_ID, "--json"], {
      notion: fakeNotion({ failWith: notionError(401, "unauthorized") }),
    }),
  ]
  for (const ran of runs) expect(ran.out + ran.err).not.toContain(FAKE_TOKEN)
  for (const call of notion.calls) expect(call.url).not.toContain(FAKE_TOKEN)
  const folders = [...new Set([process.env.HOME ?? "", tmpdir()])]
  const written = folders.flatMap(filesUnder).map((path) => readFileSync(path, "utf8"))
  expect(written.some((text) => text.includes("GET /v1/pages/:id/markdown"))).toBe(true)
  expect(written.filter((text) => text.includes(FAKE_TOKEN) || text.includes("wirecatfakesignature"))).toEqual([])
})

it("mcp serve reads a page for an agent", async () => {
  const notion = fakeNotion()
  const options: RunOptions & ServiceEnvironment = {
    tty: false,
    keyring: signedIn(),
    fetch: notion.fetch,
    sleep: async () => {},
  }
  const mcp = await mcpOverStdio((streams) => run(["personal", "mcp", "serve"], { ...options, ...streams }))
  try {
    const got = await mcp.call("notion_read", { command: "documents get", arguments: { page: PAGE_ID } })
    expect(got.body).toMatchObject({ item: { id: PAGE_ID, markdown: expect.stringContaining("Test page") } })
  } finally {
    expect(await mcp.close()).toBe(0)
  }
})

it("ids: a dashed or compact id, or the last id in a Notion link's path; never the view in ?v=", () => {
  expect(notionId(PAGE_ID.toUpperCase())).toBe(PAGE_ID)
  expect(notionId(`https://www.notion.so/${DATABASE_ID.replaceAll("-", "")}?v=${SOURCE_ID.replaceAll("-", "")}`)).toBe(
    DATABASE_ID,
  )
  const peek = `https://www.notion.so/ws/${DATABASE_ID.replaceAll("-", "")}?v=${SOURCE_ID.replaceAll("-", "")}&p=${PAGE_ID.replaceAll("-", "")}&pm=s`
  expect(notionId(peek)).toBe(PAGE_ID)
  expect(notionId(peek, "database")).toBe(DATABASE_ID)
  expect(() => notionId(`http://www.notion.so/${PAGE_ID.replaceAll("-", "")}`)).toThrow()
  expect(() => notionId("not an id")).toThrow()
})

it("reads: GET, search and data source queries may be sent again; nothing else", () => {
  const at = (path: string) => new URL(`https://api.notion.com${path}`)
  expect(isRead("GET", at("/v1/users/me"))).toBe(true)
  expect(isRead("POST", at("/v1/search"))).toBe(true)
  expect(isRead("POST", at(`/v1/data_sources/${SOURCE_ID}/query`))).toBe(true)
  expect(isRead("POST", at("/v1/pages"))).toBe(false)
  expect(isRead("PATCH", at(`/v1/pages/${PAGE_ID}/markdown`))).toBe(false)
  expect(operationOf("GET", at(`/v1/blocks/${PAGE_ID.replaceAll("-", "")}/children`))).toBe(
    "GET /v1/blocks/:id/children",
  )
})

it("links: a signed link loses its query; a link with no signature stays as it is", () => {
  const notionFile =
    "https://file.notion.so/f/f/space/file/x.pdf?table=block&id=1&expirationTimestamp=1&signature=wcfake"
  expect(withoutSignedLinks(`a ${SIGNED} b ${notionFile} c https://example.com/?q=1`)).toEqual({
    text: "a https://prod-files-secure.s3.us-west-2.amazonaws.com/space/file/test.png b https://file.notion.so/f/f/space/file/x.pdf c https://example.com/?q=1",
    removed: 2,
  })
})

it("links: the signature goes whatever the file is called and however the link is written", () => {
  const s3 = "https://prod-files-secure.s3.us-west-2.amazonaws.com/space/file"
  const query = "?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=FAKE%2F20261114&X-Amz-Signature=wcfakesig"
  const encoded = encodeURIComponent(`${s3}/a.png${query}`)
  const cases: [string, string][] = [
    [`![](${s3}/Screenshot%20(2).png${query})`, `![](${s3}/Screenshot%20(2).png)`],
    [`[file](${s3}/Slava's%20notes.pdf${query})`, `[file](${s3}/Slava's%20notes.pdf)`],
    [`<${s3}/a[1].png${query}>`, `<${s3}/a[1].png>`],
    [`<image source="${s3}/a.png${query.replaceAll("&", "&amp;")}"/>`, `<image source="${s3}/a.png"/>`],
    [
      `![](https://www.notion.so/image/${encoded}?table=block&id=1)`,
      `![](https://www.notion.so/image/${encodeURIComponent(`${s3}/a.png`)}?table=block&id=1)`,
    ],
    [
      `[x](https://file.notion.so/f/f/x.pdf?expirationTimestamp=1&signature=wcfake)`,
      "[x](https://file.notion.so/f/f/x.pdf)",
    ],
  ]
  for (const [text, clean] of cases) expect(withoutSignedLinks(text)).toEqual({ text: clean, removed: 1 })
  expect(withoutSignedLinks("is it?yes, and https://example.com/a?b=c").removed).toBe(0)
})

it("the read port passes Notion's own JSON through, over the same client, and maps a 404 to not_found", async () => {
  const notion = fakeNotion({ pages: { [PAGE_ID]: { markdown: "# Port" } } })
  const port = notionPort(notionClient({ token: FAKE_TOKEN, fetch: notion.fetch }))
  expect((await port.self()).bot?.workspace_id).toBe(WORKSPACE_ID)
  const search = await port.search({
    filter: { property: "object", value: "data_source" },
    sort: { timestamp: "last_edited_time", direction: "descending" },
  })
  expect(search.results[0]).toMatchObject({ object: "data_source", id: SOURCE_ID })
  const rows = await port.queryDataSource(SOURCE_ID, {
    filter: { timestamp: "last_edited_time", last_edited_time: { on_or_after: "2026-01-01T00:00:00.000Z" } },
    page_size: 100,
  })
  expect(rows.results[0]).toMatchObject({ object: "page", id: PAGE_ID })
  expect(await port.retrievePage(PAGE_ID)).toMatchObject({ object: "page", in_trash: false })
  expect(await port.retrieveDatabase(DATABASE_ID)).toMatchObject({ data_sources: [{ id: SOURCE_ID }] })
  expect(await port.retrieveBlock(BLOCK)).toMatchObject({ object: "block", type: "child_page" })
  expect((await port.blockChildren(PAGE_ID, "abc")).results).toHaveLength(1)
  expect(await port.pageMarkdown(PAGE_ID)).toEqual({ markdown: "# Port", truncated: false, unknown_block_ids: [] })
  await expect(port.retrievePage(HIDDEN)).rejects.toMatchObject({
    code: "not_found",
    details: { reason: "notion.not-shared" },
  })
  expect(notion.refusals).toEqual([])
  expect(notion.calls.find((call) => call.path.endsWith("/query"))?.body).toMatchObject({ page_size: 100 })
})
