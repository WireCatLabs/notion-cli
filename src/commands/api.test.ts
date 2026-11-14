import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { checkApiBody, type RunOptions } from "@wirecat/cli-core/cli"
import { afterEach, describe, expect, it } from "vitest"
import type { ServiceEnvironment } from "../context.js"
import { operations } from "../generated/manifest.js"
import { NOTION_VERSION } from "../generated/metadata.js"
import { schemas } from "../generated/schemas.js"
import { NOTION_VERSION as CLIENT_VERSION, isRead } from "../notion/client.js"
import { READ_POSTS } from "../notion/read-posts.js"
import { run } from "../program.js"
import { FAKE_TOKEN } from "../testing/fake-notion.js"
import { signedIn } from "../testing/harness.js"

const PAGE = "00000000-0000-4000-8000-0000000000a1"
const BLOCK = "00000000-0000-4000-8000-0000000000b1"
const BLOCKED_BLOCK = "00000000-0000-4000-8000-0000000000b2"
const DOWN_PAGE = "00000000-0000-4000-8000-000000000503"

interface Call {
  method: string
  url: string
  body?: unknown
}

/**
 * Notion as its reference pages describe these three routes, and nothing else: an unknown route, a missing token or
 * a version other than the pinned one is refused the way Notion refuses it, so a request typed from memory fails here.
 */
const fakeNotion = () => {
  const calls: Call[] = []
  const refuse = (status: number, code: string) =>
    Response.json({ object: "error", status, code, message: "Fake refusal quoting secret-page-title" }, { status })
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(String(input))
    const headers = new Headers(init?.headers)
    const method = init?.method ?? "GET"
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
    calls.push({ method, url: url.toString(), ...(body === undefined ? {} : { body }) })
    if (url.host !== "api.notion.com") return refuse(400, "invalid_request_url")
    if (headers.get("authorization") !== `Bearer ${FAKE_TOKEN}`) return refuse(401, "unauthorized")
    if (headers.get("notion-version") !== "2026-03-11") return refuse(400, "missing_version")
    const route = `${method} ${url.pathname}`
    if (route === `GET /v1/pages/${PAGE}`)
      return Response.json({ object: "page", id: PAGE, in_trash: false, properties: {} })
    if (route === "GET /v1/pages/00000000-0000-4000-8000-000000000404") return refuse(404, "object_not_found")
    if (route === "POST /v1/search")
      return Response.json({
        object: "list",
        results: [],
        next_cursor: null,
        has_more: false,
        type: "page_or_data_source",
      })
    if (route === `DELETE /v1/blocks/${BLOCK}`) return Response.json({ object: "block", id: BLOCK, in_trash: true })
    if (route === `DELETE /v1/blocks/${BLOCKED_BLOCK}`)
      return Response.json(
        {
          object: "error",
          status: 429,
          code: "rate_limited",
          message: "blocked",
          additional_data: { rate_limit_reason: "public_api_request_blocked" },
        },
        { status: 429 },
      )
    if (route === `GET /v1/pages/${DOWN_PAGE}`) return refuse(503, "service_unavailable")
    return refuse(400, "invalid_request_url")
  }
  return { fetch, calls }
}

const configFile = join(process.env.WCNOTION_CONFIG_DIR ?? "", "config.json")
const withPermissions = (permissions: Record<string, string>) => {
  mkdirSync(join(configFile, ".."), { recursive: true })
  writeFileSync(configFile, JSON.stringify({ profiles: { personal: { permissions } } }))
}
afterEach(() => rmSync(configFile, { force: true }))

// biome-ignore lint/suspicious/noExplicitAny: an answer's shape is what each test checks
type Answer = Record<string, any>

const notion = async (argv: string[], service = fakeNotion(), answer?: (question: string) => string | null) => {
  const out: string[] = []
  const err: string[] = []
  const options: RunOptions & ServiceEnvironment = {
    streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
    tty: false,
    keyring: signedIn(),
    fetch: service.fetch,
    sleep: async () => {},
    ...(answer ? { answer } : {}),
  }
  const code = await run(argv, options)
  const text = out.join("") || err.join("")
  return { code, calls: service.calls, text, json: () => JSON.parse(text.trim()) as Answer }
}

describe("notion api", () => {
  it("reads a page with the pinned Notion-Version and no flag for it", async () => {
    const result = await notion(["personal", "api", "retrieve-a-page", "--page-id", PAGE, "--json"])
    expect(result.code).toBe(0)
    expect(result.json().item).toMatchObject({ object: "page", id: PAGE })
    expect(result.calls).toEqual([{ method: "GET", url: `https://api.notion.com/v1/pages/${PAGE}` }])
    expect(NOTION_VERSION).toBe(CLIENT_VERSION)
    const flagged = await notion(["personal", "api", "retrieve-a-page", "--page-id", PAGE, "--notion-version", "x"])
    expect(flagged.code).toBe(2)
  })

  it("searches with a POST that only reads, and says not_found without repeating Notion's message", async () => {
    const found = await notion(["personal", "api", "post-search", "--body", '{"query":"Plan"}', "--json"])
    expect(found.code).toBe(0)
    expect(found.calls[0]).toMatchObject({ method: "POST", body: { query: "Plan" } })
    expect(found.json().item).not.toHaveProperty("operation_id")
    const missing = await notion([
      "personal",
      "api",
      "retrieve-a-page",
      "--page-id",
      "00000000-0000-4000-8000-000000000404",
      "--json",
    ])
    expect(missing.json()).toMatchObject({ error: { code: "not_found", reason: "notion.not-shared" } })
    expect(missing.text).not.toContain("secret-page-title")
  })

  it("asks before deleting; no sends nothing, yes sends it once with an operation_id", async () => {
    const service = fakeNotion()
    const asked: string[] = []
    const answering = (reply: string) => (question: string) => {
      asked.push(question)
      return reply
    }
    const no = await notion(["personal", "api", "delete-a-block", "--block-id", BLOCK], service, answering("n"))
    expect(no.code).not.toBe(0)
    expect(service.calls).toEqual([])
    const yes = await notion(["personal", "api", "delete-a-block", "--block-id", BLOCK], service, answering("y"))
    expect(yes.code).toBe(0)
    expect(asked).toHaveLength(2)
    expect(service.calls).toEqual([{ method: "DELETE", url: `https://api.notion.com/v1/blocks/${BLOCK}` }])
    const agreed = await notion(["personal", "api", "delete-a-block", "--block-id", BLOCK, "--yes", "--json"], service)
    expect(agreed.json().item).toMatchObject({ operation_id: expect.any(String), result: { in_trash: true } })
    expect(service.calls).toHaveLength(2)
  })

  it("sends nothing under --dry-run, a deny, or an invalid body", async () => {
    const service = fakeNotion()
    const preview = await notion(
      ["personal", "api", "delete-a-block", "--block-id", BLOCK, "--dry-run", "--json"],
      service,
    )
    expect(preview.code).toBe(0)
    withPermissions({ "api.retrieve-a-page": "deny" })
    expect((await notion(["personal", "api", "retrieve-a-page", "--page-id", PAGE, "--json"], service)).code).toBe(5)
    rmSync(configFile)
    const invalid = await notion(["personal", "api", "post-search", "--body", '{"sort":"sideways"}', "--json"], service)
    expect(invalid.code).toBe(2)
    expect(service.calls).toEqual([])
  })

  it("has no api call, whose own key would differ from the one its operation checks", async () => {
    const service = fakeNotion()
    const called = await notion(
      ["personal", "api", "call", "retrieve-a-page", "--params", `{"page_id":"${PAGE}"}`, "--json"],
      service,
    )
    expect(called.code).toBe(2)
    expect(service.calls).toEqual([])
  })

  it("keeps Notion's refusal of a blocked connection on a write instead of calling it outcome_unknown", async () => {
    const service = fakeNotion()
    const refused = await notion(
      ["personal", "api", "delete-a-block", "--block-id", BLOCKED_BLOCK, "--yes", "--json"],
      service,
    )
    expect(refused.json()).toMatchObject({ error: { code: "permission_error", reason: "notion.blocked" } })
    expect(service.calls).toHaveLength(1)
  })

  it("records every attempt of a retried read in the run, not one request", async () => {
    const service = fakeNotion()
    const down = await notion(["personal", "api", "retrieve-a-page", "--page-id", DOWN_PAGE, "--json"], service)
    expect(down.code).not.toBe(0)
    expect(service.calls).toHaveLength(4)
    const listed = await notion(["runs", "list", "--limit", "50", "--json"])
    const id = listed.json().items.find((one: { argv: string[] }) => one.argv.includes(DOWN_PAGE)).run_id as string
    const shown = await notion(["runs", "show", id, "--json"])
    const attempts = JSON.stringify(shown.json()).match(/GET \/v1\/pages\/:id/gu) ?? []
    expect(attempts.length).toBeGreaterThanOrEqual(4)
  })

  it("lists and shows without calling Notion", async () => {
    const service = fakeNotion()
    const listed = await notion(["api", "list", "--json"], service)
    expect(listed.json().items).toHaveLength(61)
    expect(listed.json().items).toContainEqual(
      expect.objectContaining({ command: "delete-a-block", effect: "destructive" }),
    )
    const deleting = await notion(["api", "list", "effect:destructive", "--json=command"], service)
    expect(deleting.json().items.map((one: { command: string }) => one.command)).toEqual([
      "delete-a-block",
      "delete-a-comment",
      "delete-view",
      "delete-view-query",
      "delete-agent",
    ])
    const shown = await notion(["api", "show", "post-search", "--json"], service)
    expect(shown.json().item).toMatchObject({ notion_version: "2026-03-11", request_schema: expect.any(Object) })
    const oauth = await notion(["api", "show", "create-a-token", "--json"], service)
    expect(oauth.json()).toMatchObject({ error: { code: "not_found", message: expect.stringContaining("OAuth") } })
    expect(service.calls).toEqual([])
  })

  it("marks as reads exactly the POSTs the client may send again", () => {
    const readPosts = operations
      .filter((one) => one.effect === "read" && one.binding.kind === "http" && one.binding.method === "POST")
      .map((one) => [one.id, one.binding.kind === "http" ? one.binding.path : ""])
    expect(Object.fromEntries(readPosts)).toEqual(
      Object.fromEntries(Object.entries(READ_POSTS).map(([id, { path }]) => [id, path])),
    )
    for (const [, path] of readPosts)
      expect(isRead("POST", new URL(`https://api.notion.com${String(path).replace(/\{[^}]+\}/gu, PAGE)}`))).toBe(true)
  })

  it("accepts the request bodies Notion's reference pages show, after the spec was rewritten for the adapter", () => {
    const text = (content: string) => [{ type: "text", text: { content } }]
    const bodies: Record<string, unknown> = {
      "post-page": {
        parent: { data_source_id: PAGE },
        properties: { Name: { title: text("Plan") }, Status: { status: { name: "Done" } } },
        children: [{ object: "block", type: "paragraph", paragraph: { rich_text: text("Hello") } }],
      },
      "patch-block-children": {
        children: [
          {
            type: "toggle",
            toggle: {
              rich_text: text("More"),
              children: [{ type: "bulleted_list_item", bulleted_list_item: { rich_text: text("One") } }],
            },
          },
        ],
      },
      "post-database-query": {
        filter: {
          and: [
            { property: "Status", status: { equals: "Done" } },
            { timestamp: "last_edited_time", last_edited_time: { on_or_after: "2026-11-01T00:00:00Z" } },
          ],
        },
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        page_size: 100,
      },
      "update-page-markdown": { type: "replace_content", replace_content: { new_str: "# Plan\n\nDone." } },
    }
    for (const [command, body] of Object.entries(bodies)) {
      const operation = operations.find((one) => one.command === command)
      expect(operation, command).toBeDefined()
      if (operation) expect(() => checkApiBody(operation, JSON.stringify(body), schemas), command).not.toThrow()
    }
  })
})
