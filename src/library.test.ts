import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { CliError, memoryKeyring } from "@wirecat/cli-base"
import { accountFileFor } from "@wirecat/cli-core/cli"
import { documentCommandsContract } from "@wirecat/cli-core/documents/testing"
import { searchNotesQuery } from "@wirecat/cli-core/services"
import { describe, expect, it } from "vitest"
import { NOTION_WORDS } from "./commands/library.js"
import { IDENTITY } from "./identity.js"
import { openStore } from "./library.js"
import type { NotionParent } from "./notion/reads.js"
import { createProgram } from "./program.js"
import { passUnderWay, WORKSPACE_ROOT } from "./sync/source.js"
import { FAKE_TOKEN, fakeNotion } from "./testing/fake-notion.js"
import { FakeNotion } from "./testing/fake-notion-reads.js"
import { runCli, signedIn } from "./testing/harness.js"

const id = (n: number) => `aaaa${String(n).padStart(4, "0")}-0000-4000-8000-000000000000`
const ROADMAP = id(1)
const CHILD = id(2)
const GRANDCHILD = id(3)
const TASKS = id(4)
const SOURCE = id(5)
const ROW = id(6)
const VIEW = id(7)
const LONELY = id(8)
const top: NotionParent = { type: "workspace", workspace: true }
const under = (parent: string): NotionParent => ({ type: "page_id", page_id: parent })
const SIGNED = "https://prod-files-secure.s3.us-west-2.amazonaws.com/w/x.png?X-Amz-Signature=wirecatfake&X-Amz-Date=d"

/** A workspace with a page tree three deep, a database inside a page, and a row. */
const workspace = () => {
  const notion = new FakeNotion()
  notion.addPage({ id: ROADMAP, title: "Roadmap", parent: top, markdown: "quarterly roadmap", createdBy: id(90) })
  notion.addPage({ id: CHILD, title: "Child", parent: under(ROADMAP), markdown: `nested budget ![x](${SIGNED})` })
  notion.addPage({ id: GRANDCHILD, title: "Grandchild", parent: under(CHILD), markdown: "deepest note" })
  notion.addDatabase({ id: TASKS, title: "Tasks", parent: under(ROADMAP), sources: [SOURCE] })
  notion.addPage({
    id: ROW,
    title: "Write the plan",
    parent: { type: "data_source_id", data_source_id: SOURCE, database_id: TASKS },
    properties: { Status: { type: "status", status: { name: "Done" } } },
  })
  notion.addPage({ id: LONELY, title: "Lonely", parent: top, markdown: "a page of its own" })
  return notion
}

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).isFile())

interface Browsed {
  [key: string]: unknown
  items: { id: string; kind: string; url: string; parent: string | null; added: boolean }[]
  page: { mode: string; has_more: boolean; next_cursor?: string }
}

/** One profile against one fake workspace, with a store and state folder of its own. */
const cli = (notion = workspace()) => {
  const dir = mkdtempSync(join(tmpdir(), "notion-library-"))
  const env = { MESSAGING_STORE: join(dir, "wirecat.db"), WCNOTION_STATE_DIR: join(dir, "state") }
  const http = fakeNotion({ workspace: notion })
  const keyring = signedIn()
  const run = (argv: string[]) => runCli(["personal", ...argv, "--json"], { notion: http, keyring, env })
  return { dir, env, notion, http, run }
}

describe("cli-core's documents commands contract over the strict fake", () => {
  for (const c of documentCommandsContract(() => {
    const { run } = cli()
    return {
      program: createProgram(),
      words: NOTION_WORDS,
      run: async (argv) => {
        const ran = await run(argv)
        return { exit: ran.code, stdout: ran.out }
      },
      document: GRANDCHILD,
      word: "deepest",
    }
  }))
    it(c.name, c.run)
})

describe("sync over the shared store", () => {
  it("names the profile on a stored hit and keeps the workspace root and databases out of search", async () => {
    const { run, env } = cli()
    expect((await run(["sync"])).code).toBe(0)
    const store = await openStore(env, false)
    try {
      const paths = async (text: string, newest = false) =>
        (await searchNotesQuery(store, { text, limit: 50, timezone: "UTC", ...(newest ? { newest } : {}) })).items.map(
          (hit) => hit.note.path,
        )
      expect(await paths("tasks")).not.toContain(`${TASKS}.md`)
      expect(await paths("workspace")).not.toContain(`${WORKSPACE_ROOT}.md`)
      const changed = await paths("date>2000-01-01", true)
      expect(changed).toContain(`${ROADMAP}.md`)
      expect(changed).not.toContain(`${TASKS}.md`)
      expect(changed).not.toContain(`${WORKSPACE_ROOT}.md`)
      // What a search hit's source is read from: without it a hit says `notes` and the account's store id.
      const hit = (await searchNotesQuery(store, { text: "quarterly", limit: 1, timezone: "UTC" })).items[0]
      const account = (await store.accounts.storedAccounts()).find(({ id }) => String(id) === hit?.note.folderId)
      expect(account?.provider).toBe("notion")
      expect((await store.accounts.profiles()).notion).toEqual({
        personal: { provider: "notion", account: account?.account },
      })
    } finally {
      await store.close()
    }
  })
  it("copies pages under pages, a database in a page and its rows, and search finds them offline", async () => {
    const { run, http } = cli()
    const synced = await run(["sync"])
    expect(synced.code).toBe(0)
    expect(http.refusals).toEqual([])
    const listed = (await run(["documents", "list"])).json() as { items: { id: string; kind: string }[] }
    expect(listed.items.map((item) => item.id).sort()).toEqual([ROADMAP, CHILD, GRANDCHILD, ROW, LONELY].sort())
    const found = (await run(["search", "deepest"])).json() as { item: { hits: { id: string }[] } }
    expect(found.item.hits.map((hit) => hit.id)).toEqual([GRANDCHILD])
    const row = (await run(["search", "Done"])).json() as { item: { hits: { id: string }[] } }
    expect(row.item.hits.map((hit) => hit.id)).toContain(ROW)
    const status = (await run(["status"])).json() as { item: Record<string, unknown> }
    expect(status.item).toMatchObject({
      documents: 5,
      pending: 0,
      scope: "the whole workspace the token sees",
      progress: { job: "sync", profile: "personal", done: 5, state: "complete" },
    })
  })

  it("narrows to a page chosen with folders add, and folders list and remove say what is chosen", async () => {
    const { run } = cli()
    expect((await run(["folders", "list"])).json()).toMatchObject({ items: [{ id: "notion-workspace" }] })
    const added = await run(["folders", "add", `https://www.notion.so/Child-${CHILD.replaceAll("-", "")}`])
    expect(added.json()).toMatchObject({ item: { id: CHILD, name: "Child", added: true } })
    await run(["sync"])
    const listed = (await run(["documents", "list"])).json() as { items: { id: string }[] }
    expect(listed.items.map((item) => item.id).sort()).toEqual([CHILD, GRANDCHILD].sort())
    expect((await run(["folders", "list"])).json()).toMatchObject({ items: [{ id: CHILD }] })
    expect((await run(["folders", "remove", ROADMAP])).json()).toMatchObject({
      error: { reason: "folder.not-chosen" },
    })
    expect((await run(["folders", "remove", CHILD])).json()).toMatchObject({ item: { id: CHILD, removed: true } })
    expect((await run(["folders", "add", ROW])).code).not.toBe(0)
  })

  it("folders browse lists one level live with each item's kind, link and parent, and marks what is added", async () => {
    const { run } = cli()
    await run(["folders", "add", ROADMAP])
    const top = (await run(["folders", "browse"])).json() as Browsed
    expect(top.items.map((item) => [item.id, item.kind, item.parent, item.added]).sort()).toEqual(
      [
        [ROADMAP, "page", null, true],
        [LONELY, "page", null, false],
      ].sort(),
    )
    expect(top.page).toMatchObject({ mode: "cursor", has_more: false })
    const inside = (await run(["folders", "browse", "--parent", ROADMAP])).json() as Browsed
    expect(inside.items.map((item) => [item.id, item.kind, item.parent]).sort()).toEqual(
      [
        [CHILD, "page", ROADMAP],
        [TASKS, "database", ROADMAP],
      ].sort(),
    )
    expect(inside.items.find((item) => item.id === CHILD)?.url).toBe(
      `https://app.notion.com/p/${CHILD.replaceAll("-", "")}`,
    )
    for (const item of inside.items) expect(item.url).toMatch(/^https:\/\//)
    expect((await run(["folders", "browse", "--parent", TASKS])).json()).toMatchObject({ items: [] })
  })

  it("folders browse pages the top with --limit and --cursor, from the pages on to the databases", async () => {
    const notion = workspace()
    notion.addDatabase({ id: id(10), title: "Top table", parent: top, sources: [id(11)] })
    const { run } = cli(notion)
    const seen: [string, string][] = []
    let cursor: string | undefined
    for (let call = 0; call < 10; call++) {
      const level = (await run(["folders", "browse", "--limit", "1", ...(cursor ? ["--cursor", cursor] : [])])).json()
      const { items, page } = level as Browsed
      expect(items.length).toBeLessThanOrEqual(1)
      for (const item of items) seen.push([item.id, item.kind])
      cursor = page.next_cursor
      expect(page.has_more).toBe(cursor !== undefined)
      if (!cursor) break
    }
    expect(seen.sort()).toEqual(
      [
        [ROADMAP, "page"],
        [LONELY, "page"],
        [id(10), "database"],
      ].sort(),
    )
    const other = await run(["folders", "browse", "--parent", ROADMAP, "--cursor", "notion-browse1.e30"])
    expect(other.json()).toMatchObject({ error: { reason: "folder.cursor-invalid" } })
  })

  it("folders browse answers with a cursor once a call has sent its requests, and takes it only for its level", async () => {
    const notion = workspace()
    for (let n = 0; n < 60; n++) {
      notion.addPage({ id: id(100 + n), title: `Hidden ${n}`, parent: top, shared: false })
      notion.addPage({ id: id(200 + n), title: `Shared ${n}`, parent: under(id(100 + n)) })
    }
    const { run } = cli(notion)
    const first = (await run(["folders", "browse"])).json() as Browsed
    expect(first.items.length).toBeLessThan(62)
    expect(first.page.has_more).toBe(true)
    const cursor = first.page.next_cursor as string
    const wrong = await run(["folders", "browse", "--parent", ROADMAP, "--cursor", cursor])
    expect(wrong.json()).toMatchObject({ error: { reason: "folder.cursor-invalid" } })
    const ids = first.items.map((item) => item.id)
    let next: string | undefined = cursor
    while (next) {
      const more = (await run(["folders", "browse", "--cursor", next])).json() as Browsed
      for (const item of more.items) ids.push(item.id)
      next = more.page.next_cursor
    }
    expect(ids.sort()).toEqual([ROADMAP, LONELY, ...Array.from({ length: 60 }, (_, n) => id(200 + n))].sort())
  })

  it("folders browse goes past blocks that hold no page to the column that does", async () => {
    const notion = workspace()
    notion.blocks.set(id(20), under(LONELY))
    notion.addPage({ id: id(21), title: "In a column", parent: { type: "block_id", block_id: id(20) } })
    notion.addPage({ id: id(22), title: "Also in it", parent: { type: "block_id", block_id: id(20) } })
    const { run } = cli(notion)
    const first = (await run(["folders", "browse", "--parent", LONELY, "--limit", "1"])).json() as Browsed
    expect(first.items.map((item) => item.parent)).toEqual([LONELY])
    expect(first.page.has_more).toBe(true)
    const cursor = first.page.next_cursor as string
    const rest = (await run(["folders", "browse", "--parent", LONELY, "--cursor", cursor])).json() as Browsed
    expect([...first.items, ...rest.items].map((item) => item.id).sort()).toEqual([id(21), id(22)].sort())
    expect(rest.page.has_more).toBe(false)
  })

  it("names what Notion would not give in meta.issues and the answer's warnings, and exits 0", async () => {
    const notion = workspace()
    notion.addDatabase({ id: VIEW, title: "Linked view", parent: under(ROADMAP), sources: [id(9)], unreadable: true })
    const { run } = cli(notion)
    const ran = await run(["sync"])
    expect(ran.code).toBe(0)
    const synced = ran.json() as {
      item: { warnings: { id: string; reason: string }[] }
      meta: { issues: unknown[]; complete: boolean }
    }
    expect(synced.meta.complete).toBe(false)
    expect(synced.meta.issues).toContainEqual({
      code: "not_found",
      reason: "notion.child-unreadable",
      source: "notion",
    })
    expect(synced.item.warnings).toContainEqual(
      expect.objectContaining({ id: VIEW, reason: "notion.child-unreadable" }),
    )
  })

  it("finds an edit deep in the tree on the next sync, and keeps no signed link anywhere on disk", async () => {
    const { run, notion, dir } = cli()
    await run(["sync"])
    notion.advance(60 * 60_000)
    notion.edit(GRANDCHILD, { markdown: "deepest note, edited" })
    await run(["sync"])
    const shown = (await run(["documents", "show", GRANDCHILD])).json() as { item: { text: string } }
    expect(shown.item.text).toContain("edited")
    const out = join(dir, "child.md")
    expect((await run(["documents", "export", CHILD, "--output", out])).code).toBe(0)
    for (const file of filesUnder(dir)) expect(readFileSync(file, "latin1"), file).not.toMatch(/X-Amz-|signature=/iu)
  })

  it("syncs right after session start: sign-in and sync name the account the same way", async () => {
    const dir = mkdtempSync(join(tmpdir(), "notion-signin-"))
    const env = { MESSAGING_STORE: join(dir, "wirecat.db"), WCNOTION_STATE_DIR: join(dir, "state") }
    const notion = fakeNotion({ workspace: workspace() })
    const keyring = memoryKeyring()
    const signed = await runCli(["personal", "session", "start", "--json"], { notion, keyring, env, stdin: FAKE_TOKEN })
    expect(signed.code).toBe(0)
    for (const argv of [
      ["search", "roadmap"],
      ["documents", "list"],
      ["catalog", "list"],
    ])
      expect((await runCli(["personal", ...argv, "--json"], { notion, keyring, env })).json()).toMatchObject({
        error: { reason: "profile.not-synced" },
      })
    expect((await runCli(["personal", "sync", "--json"], { notion, keyring, env })).code).toBe(0)
  })

  it("refuses another Notion connection on a profile that holds a copy, at sign-in and at sync", async () => {
    const { run, env, notion, http } = cli()
    await run(["sync"])
    const file = accountFileFor(IDENTITY, "personal", { ...process.env, ...env })
    const before = readFileSync(file, "utf8")
    const other = fakeNotion({ workspace: notion, botId: id(77), token: "wirecatfake0other7" })
    const keyring = memoryKeyring({ "notion-cli:token:personal": FAKE_TOKEN })
    const signIn = await runCli(["personal", "session", "start", "--json"], {
      notion: other,
      keyring,
      env,
      stdin: "wirecatfake0other7",
    })
    expect(signIn.code).not.toBe(0)
    expect(signIn.json()).toMatchObject({ error: { code: "conflict", reason: "profile.other-account" } })
    expect(signIn.json().error).toMatchObject({ message: expect.stringContaining("session start") })
    expect(keyring.entries.get("notion-cli:token:personal")).toBe(FAKE_TOKEN)
    expect(readFileSync(file, "utf8")).toBe(before)
    const otherKeyring = memoryKeyring({ "notion-cli:token:personal": "wirecatfake0other7" })
    const synced = await runCli(["personal", "sync", "--json"], { notion: other, keyring: otherKeyring, env })
    expect(synced.json()).toMatchObject({ error: { reason: "profile.other-account" } })
    expect((await runCli(["personal", "sync", "--json"], { notion: http, keyring, env })).code).toBe(0)
  })

  it("lets one Notion connection be one profile: a second is refused until the first signs out", async () => {
    const dir = mkdtempSync(join(tmpdir(), "notion-profiles-"))
    const env = { MESSAGING_STORE: join(dir, "wirecat.db"), WCNOTION_STATE_DIR: join(dir, "state") }
    const notion = workspace()
    const http = fakeNotion({ workspace: notion })
    const keyring = memoryKeyring({ "notion-cli:token:personal": FAKE_TOKEN, "notion-cli:token:work": FAKE_TOKEN })
    const as = (profile: string, argv: string[], stdin?: string) =>
      runCli([profile, ...argv, "--json"], { notion: http, keyring, env, ...(stdin ? { stdin } : {}) })
    expect((await as("personal", ["sync"])).code).toBe(0)
    const work = await as("work", ["sync"])
    expect(work.json()).toMatchObject({ error: { code: "conflict", reason: "profile.account-taken" } })
    expect(work.json().error).toMatchObject({ message: expect.stringContaining("personal session end") })
    expect((await as("work", ["session", "start"], FAKE_TOKEN)).json()).toMatchObject({
      error: { reason: "profile.account-taken" },
    })
    const hits = async (profile: string) =>
      ((await as(profile, ["search", "quarterly"])).json() as { item: { hits: { id: string }[] } }).item.hits
    expect((await hits("personal")).map((hit) => hit.id)).toEqual([ROADMAP])
    expect((await as("personal", ["session", "end"])).code).toBe(0)
    expect((await as("work", ["session", "start"], FAKE_TOKEN)).code).toBe(0)
    expect((await as("work", ["sync"])).code).toBe(0)
  })

  it("finds a page by the words of its body under the read-only lock right after a sync", async () => {
    const { run, env } = cli()
    await run(["sync"])
    const db = new DatabaseSync(env.MESSAGING_STORE, { readOnly: true })
    const pending = db.prepare("SELECT count(*) AS n FROM document_index_pending").get() as { n: number }
    db.close()
    expect(pending.n).toBe(0)
    const found = await runCli(["personal", "search", "deepest", "--json"], {
      notion: fakeNotion({ workspace: workspace() }),
      env: { ...env, WCNOTION_READ_ONLY: "1" },
    })
    expect((found.json() as { item: { hits: { id: string }[] } }).item.hits.map((hit) => hit.id)).toEqual([GRANDCHILD])
  })

  it("removing the last chosen folder says the next sync copies the whole workspace, and it does", async () => {
    const { run } = cli()
    await run(["folders", "add", CHILD])
    await run(["sync"])
    const removed = await run(["folders", "remove", CHILD])
    expect(removed.code).toBe(0)
    expect(removed.json()).toMatchObject({
      item: { id: CHILD, removed: true },
      next: [{ kind: "command", command: "folders browse" }],
    })
    expect(removed.err).toContain("whole workspace")
    expect((await run(["status"])).json()).toMatchObject({ item: { progress: { state: "partial", total: null } } })
    await run(["sync"])
    const listed = (await run(["documents", "list"])).json() as { items: { id: string }[] }
    expect(listed.items.map((item) => item.id).sort()).toEqual([ROADMAP, CHILD, GRANDCHILD, ROW, LONELY].sort())
  })

  it("status counts what is left from the plan, and is not complete after the folders change", async () => {
    const { run } = cli()
    await run(["sync", "--limit", "2"])
    expect((await run(["status"])).json()).toMatchObject({
      item: { progress: { done: 2, total: 5, remaining: 3, state: "partial" } },
    })
    await run(["sync"])
    expect((await run(["status"])).json()).toMatchObject({
      item: { progress: { done: 5, total: 5, remaining: 0, state: "complete" } },
    })
    await run(["folders", "add", CHILD])
    expect((await run(["status"])).json()).toMatchObject({
      item: { progress: { total: null, remaining: null, state: "partial" } },
    })
  })

  it("first syncs a page with 60 pages under it in one run with the default deadline", async () => {
    const notion = new FakeNotion()
    notion.addPage({ id: id(100), title: "Hub", parent: top, markdown: "hub" })
    for (let n = 0; n < 60; n++)
      notion.addPage({ id: id(200 + n), title: `Leaf ${n}`, parent: under(id(100)), markdown: "leaf" })
    const { run } = cli(notion)
    const ran = await run(["sync", "--limit", "500"])
    expect(ran.code, ran.err).toBe(0)
    expect(ran.json()).toMatchObject({ item: { saved: 61, complete: true }, meta: { complete: true } })
  })

  it("syncs a page with 60 pages under it over several 30 s runs, the pace waiting on the run's clock", async () => {
    const notion = new FakeNotion()
    notion.addPage({ id: id(100), title: "Hub", parent: top, markdown: "hub" })
    for (let n = 0; n < 60; n++)
      notion.addPage({ id: id(200 + n), title: `Leaf ${n}`, parent: under(id(100)), markdown: "leaf" })
    const { run } = cli(notion)
    const first = await run(["sync", "--limit", "500", "--timeout", "30s"])
    expect(first.code, first.err).toBe(0)
    expect(first.json()).toMatchObject({
      item: { complete: false, stopped: "requests" },
      next: [{ command: "sync", safe_to_auto_execute: true }],
    })
    let saved = (first.json() as { item: { saved: number } }).item.saved
    let waits = first.waits.length
    for (let round = 0; round < 3; round++) {
      const again = await run(["sync", "--limit", "500", "--timeout", "10m"])
      expect(again.code, again.err).toBe(0)
      saved += (again.json() as { item: { saved: number } }).item.saved
      waits += again.waits.length
      if ((again.json() as { meta: { complete: boolean } }).meta.complete) break
    }
    expect(saved).toBe(61)
    expect(waits).toBeGreaterThan(0)
    // Each page is read once for its text: the walk knows its kind from the listing, and its parent from the walk.
    expect(notion.calls.retrievePage).toBeLessThanOrEqual(62)
  })

  it("keeps syncing when Notion refuses one block of a page's Markdown (403), with the rest of the text", async () => {
    const notion = new FakeNotion()
    const block = id(50)
    notion.addPage({
      id: ROADMAP,
      title: "Roadmap",
      parent: top,
      markdown: "roadmap <unknown/>",
      unknown: { [block]: "x" },
    })
    notion.addPage({ id: LONELY, title: "Lonely", parent: top, markdown: "lonely v1" })
    const read = notion.pageMarkdown.bind(notion)
    notion.pageMarkdown = async (page: string) => {
      if (page === block) throw new CliError("permission_error", "restricted", { status: 403 })
      return read(page)
    }
    const { run } = cli(notion)
    const first = await run(["sync"])
    expect(first.code, first.out).toBe(0)
    expect((first.json() as { item: { warnings: unknown[] } }).item.warnings).toContainEqual(
      expect.objectContaining({ id: block, code: "permission_error", reason: "notion.left-out" }),
    )
    notion.advance(60 * 60_000)
    notion.edit(LONELY, { markdown: "lonely v2" })
    expect((await run(["sync"])).code).toBe(0)
    const shown = (await run(["documents", "show", LONELY])).json() as { item: { text: string } }
    expect(shown.item.text).toContain("lonely v2")
    const roadmap = (await run(["documents", "show", ROADMAP])).json() as { item: { text: string } }
    expect(roadmap.item.text).toContain("roadmap")
  })

  it("syncs a database whose one data source Notion will not query (404 or 403), and keeps the other's rows", async () => {
    for (const [code, status] of [
      ["not_found", 404],
      ["permission_error", 403],
    ] as const) {
      const notion = new FakeNotion()
      notion.addPage({ id: ROADMAP, title: "Roadmap", parent: top, markdown: "roadmap" })
      notion.addDatabase({ id: TASKS, title: "Tasks", parent: under(ROADMAP), sources: [SOURCE, id(9)] })
      notion.addPage({
        id: ROW,
        title: "Write the plan",
        parent: { type: "data_source_id", data_source_id: SOURCE, database_id: TASKS },
      })
      const query = notion.queryDataSource.bind(notion)
      notion.queryDataSource = async (source: string, body: Parameters<FakeNotion["queryDataSource"]>[1]) => {
        if (source === id(9)) throw new CliError(code, "no", { status })
        return query(source, body)
      }
      const { run } = cli(notion)
      for (const argv of [["sync"], ["sync"], ["sync", "--rescan"]]) {
        const ran = await run([...argv, "--timeout", "10m"])
        expect(ran.code, `${code} ${argv.join(" ")}: ${ran.out}`).toBe(0)
      }
      const listed = (await run(["documents", "list"])).json() as { items: { id: string }[] }
      expect(listed.items.map((item) => item.id)).toContain(ROW)
    }
  })

  it("first syncs a page with 60 child pages over short runs, each ending in time and moving on", async () => {
    const notion = new FakeNotion()
    notion.addPage({ id: id(1), title: "Hub", parent: top, markdown: "hub" })
    for (let c = 0; c < 60; c++)
      notion.addPage({ id: id(100 + c), title: `C${c}`, parent: under(id(1)), markdown: "c" })
    const { run, http } = cli(notion)
    // Each answer takes 150 ms of real time, as cli-core's deadline runs on the wall clock.
    const fetch = http.fetch
    http.fetch = (async (...args: Parameters<typeof globalThis.fetch>) => {
      await new Promise((resolve) => setTimeout(resolve, 150))
      return fetch(...args)
    }) as typeof globalThis.fetch
    const left: number[] = []
    for (let round = 0; round < 3; round++) {
      const ran = await run(["sync", "--timeout", "10s"])
      expect(ran.code, ran.out).toBe(0)
      left.push((ran.json() as { item: { walk?: { folders_left: number } } }).item.walk?.folders_left ?? 0)
    }
    // The first run finds the hub, the second its 60 children; each run after that walks at least one of them.
    expect(left[2]).toBeLessThan(left[1] as number)
    expect(notion.calls.retrievePage).toBeLessThan(60)
  }, 150_000)

  it("walks a big database a page of rows per step over several runs, its walk file keeping where it stopped", async () => {
    const notion = new FakeNotion()
    notion.addDatabase({ id: id(10), title: "Big", parent: top, sources: [id(11)] })
    for (let r = 0; r < 2_500; r++)
      notion.addPage({
        id: id(1000 + r),
        title: `Row ${r}`,
        parent: { type: "data_source_id", data_source_id: id(11), database_id: id(10) },
        created: notion.now - 100 * 60 * 60_000 + r * 1000,
      })
    const { run, env } = cli(notion)
    const file = join(env.WCNOTION_STATE_DIR, "profiles", "personal", "sync", "walk.json")
    const stack = () =>
      existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as { stack: { listing?: string }[] }).stack : undefined
    let runs = 0
    let deepest = 0
    let resumed = false
    do {
      runs++
      const ran = await run(["sync", "--timeout", "10s", "--limit", "10"])
      expect(ran.code, ran.out).toBe(0)
      deepest = Math.max(deepest, stack()?.length ?? 0)
      resumed ||= stack()?.some((entry) => entry.listing !== undefined) ?? false
    } while (stack() && runs < 40)
    expect(stack()).toBeUndefined()
    expect(runs).toBeGreaterThan(1)
    expect(resumed).toBe(true)
    expect(deepest).toBeLessThanOrEqual(2)
  }, 60_000)

  /** Twelve databases synced once; then an hour passes and one row changes, so the next sync has a pass to make. */
  const longPass = async () => {
    const notion = new FakeNotion()
    for (let n = 0; n < 12; n++) {
      notion.addDatabase({ id: id(100 + n), title: `DB ${n}`, parent: top, sources: [id(200 + n)] })
      notion.addPage({
        id: id(300 + n),
        title: `Row ${n}`,
        parent: { type: "data_source_id", data_source_id: id(200 + n), database_id: id(100 + n) },
      })
    }
    const { run, env, http } = cli(notion)
    const complete = (ran: { json: () => Record<string, unknown> }) =>
      (ran.json() as { meta: { complete: boolean } }).meta.complete
    for (let round = 0; round < 10 && !complete(await run(["sync", "--timeout", "10m"])); round++);
    notion.advance(60 * 60_000)
    notion.edit(id(311), { title: "Row 11 edited" })
    const state = () =>
      JSON.parse(readFileSync(join(env.WCNOTION_STATE_DIR, "profiles", "personal", "sync", "state.json"), "utf8")) as {
        cursor: string
        pending?: { cursor: string }
      }
    const cursor = () => state().pending?.cursor ?? state().cursor
    // A slowed answer takes 200 ms of real time, as cli-core's deadline runs on the wall clock.
    const fetch = http.fetch
    const slow = (slowed: (path: string) => boolean) => {
      http.fetch = (async (...args: Parameters<typeof globalThis.fetch>) => {
        if (slowed(String(args[0] instanceof Request ? args[0].url : args[0])))
          await new Promise((resolve) => setTimeout(resolve, 200))
        return fetch(...args)
      }) as typeof globalThis.fetch
    }
    const finish = async () => {
      http.fetch = fetch
      let found = false
      for (let round = 0; round < 6 && !found; round++) {
        const again = await run(["sync", "--timeout", "10m"])
        expect(again.code, again.out).toBe(0)
        const listed = (await run(["documents", "list"])).json() as { items: { name: string }[] }
        found = listed.items.some((item) => item.name === "Row 11 edited")
      }
      expect(found).toBe(true)
    }
    return { run, state, cursor, slow, finish }
  }

  it("stops a long Notion pass before the deadline, says to sync again, and the next syncs finish it", async () => {
    const { run, cursor, slow, finish } = await longPass()
    const before = cursor()
    // Only page reads are slow: the budget measures its slowest step, and one slow listing would leave no time for a
    // page.
    slow((url) => url.includes("/v1/pages/"))
    // cli-core stops 5 s before the deadline, counted from the command's start, and fits one step per 2 s in the rest.
    // 6 s left one second, which a slow Windows start spent before the first step: nothing moved, so no next step.
    // 14 s fits four steps of this incremental sync: the listing of the changes and three page reads, still short of
    // the whole pass.
    const cut = await run(["sync", "--timeout", "14s"])
    expect(cut.code, cut.out).toBe(0)
    expect(cut.json()).toMatchObject({
      item: { complete: false, stopped: expect.stringMatching(/^(requests|deadline)$/) },
      next: [{ command: "sync", args: { timeout: "14s" }, safe_to_auto_execute: true }],
      meta: { complete: false },
    })
    expect((cut.json() as { meta: { duration_ms: number } }).meta.duration_ms).toBeLessThan(14_000)
    expect(cursor()).not.toBe(before)
    expect((cut.json() as { item: { pending: number } }).item.pending).toBeGreaterThan(0)
    await finish()
  }, 40_000)

  it("cuts a slow listing inside Notion's own pass, says to sync again, and the next syncs finish it", async () => {
    const { run, state, slow, finish } = await longPass()
    const before = state().cursor
    slow(() => true)
    // Every answer is slow, so Notion's own listing stops at the deadline with its pass part done: the cursor has moved,
    // no page is saved yet, and only notion knows there is more. 7 to 9 s cut inside the pass; 11 s ends it.
    const cut = await run(["sync", "--timeout", "8s"])
    expect(cut.code, cut.out).toBe(0)
    // The new cursor waits on the engine's pending plan; nothing cli-core counts moved, so its own step is withheld.
    expect(state().cursor).toBe(before)
    expect(passUnderWay(state().pending?.cursor)).toBe(true)
    expect(cut.json()).toMatchObject({
      item: { complete: false, saved: 0, names_only: 0, removed: 0, unchanged: 0 },
      next: [{ command: "sync", args: { limit: 200, timeout: "8s" }, safe_to_auto_execute: true }],
      meta: { complete: false },
    })
    // The pass is not planned to its end, so status gives no total that would read as nearly done.
    const status = (await run(["status"])).json() as { item: { progress: Record<string, unknown> } }
    expect(status.item.progress).toMatchObject({ total: null })
    await finish()
  }, 60_000)

  it("asks Notion who the token is once per sync", async () => {
    const { run, http } = cli()
    await run(["sync"])
    expect(http.calls.filter((call) => call.path === "/v1/users/me")).toHaveLength(1)
  })

  it("counts a profile signed in by WCNOTION_TOKEN as using its connection", async () => {
    const dir = mkdtempSync(join(tmpdir(), "notion-variable-"))
    const env = {
      MESSAGING_STORE: join(dir, "wirecat.db"),
      WCNOTION_STATE_DIR: join(dir, "state"),
      WCNOTION_TOKEN: FAKE_TOKEN,
    }
    const http = fakeNotion({ workspace: workspace() })
    const keyring = memoryKeyring()
    const as = (profile: string, argv: string[]) => runCli([profile, ...argv, "--json"], { notion: http, keyring, env })
    expect((await as("personal", ["sync"])).code).toBe(0)
    const work = await as("work", ["sync"])
    expect(work.json()).toMatchObject({
      error: { reason: "profile.account-taken", message: expect.stringContaining("WCNOTION_TOKEN") },
    })
  })

  it("reads the local copy without Notion, and says to sync when there is none", async () => {
    const { run, http } = cli()
    expect((await run(["documents", "list"])).json()).toMatchObject({
      error: { reason: "profile.not-synced" },
    })
    await run(["sync"])
    const before = http.calls.length
    await run(["documents", "show", ROADMAP])
    await run(["documents", "context", ROADMAP])
    await run(["search", "roadmap"])
    expect(http.calls.length).toBe(before)
  })

  it("documents context names the page's creator under the shared roles", async () => {
    const { run } = cli()
    await run(["sync"])
    const context = (await run(["documents", "context", ROADMAP])).json() as { item: { people: { items: unknown[] } } }
    expect(context.item.people.items).toEqual([
      expect.objectContaining({ remote_id: id(90), provider: "notion", role: "owner", person: null }),
    ])
  })

  it("documents add keeps one page live among the sources added by hand, the same source when added again", async () => {
    const { run } = cli()
    const first = (await run(["documents", "add", LONELY])).json() as { item: { note: { ref: string } } }
    const again = (await run(["documents", "add", LONELY])).json() as { item: { note: { ref: string } } }
    expect(again.item.note.ref).toBe(first.item.note.ref)
  })
})

describe("the knowledge layer and the catalog over the local copy", () => {
  it("tags a page by its search ref and a database through the catalog, and catalog tree nests pages", async () => {
    const { run } = cli()
    await run(["sync"])
    expect((await run(["catalog", "import"])).code).toBe(0)
    const tree = JSON.stringify((await run(["catalog", "tree", ROADMAP])).json())
    expect(tree).toContain(GRANDCHILD)
    expect((await run(["catalog", "show", TASKS])).json()).toMatchObject({ item: { id: TASKS, kind: "folder" } })
    const ref = (
      (await run(["documents", "list"])).json() as { items: { id: string; reference: string }[] }
    ).items.find((item) => item.id === CHILD)?.reference as string
    expect((await run(["tags", "add", ref, "budget"])).code).toBe(0)
    expect((await run(["tags", "list", CHILD])).json()).toMatchObject({ items: [{ tag: "budget" }] })
    expect((await run(["tags", "add", TASKS, "tracker"])).code).toBe(0)
    expect((await run(["tags", "list", TASKS])).json()).toMatchObject({ items: [{ tag: "tracker" }] })
    expect((await run(["tags", "list", LONELY.replace("8", "9")])).json()).toMatchObject({
      error: { reason: "document.not-imported" },
    })
  })

  it("links only a Notion user seen on the page, and only to a known person", async () => {
    const { run } = cli()
    await run(["sync"])
    expect((await run(["identities", "link", ROADMAP, id(91), "person:x"])).json()).toMatchObject({
      error: { reason: "identity.not-seen" },
    })
    expect((await run(["identities", "link", ROADMAP, id(90), "x"])).json()).toMatchObject({
      error: { reason: "identity.target" },
    })
    expect((await run(["identities", "link", ROADMAP, id(90), "person:nobody"])).json()).toMatchObject({
      error: { reason: "identity.no-person" },
    })
  })

  describe("page authors and editors as people", () => {
    const AUTHOR = id(90)
    const EDITOR = id(92)
    const authored = (access: "none" | "names" | "emails" = "emails") => {
      const notion = workspace()
      notion.edit(ROADMAP, { editedBy: EDITOR })
      notion.addUser({ id: AUTHOR, name: "Ada Fake", email: "ada@example.invalid" })
      notion.addUser({ id: EDITOR, name: "Bob Fake", email: "bob@example.invalid" })
      notion.userAccess = access
      return cli(notion)
    }
    const withPeople = async <T>(env: NodeJS.ProcessEnv, fn: (store: Awaited<ReturnType<typeof openStore>>) => T) => {
      const store = await openStore(env, true)
      try {
        return await fn(store)
      } finally {
        await store.close()
      }
    }
    const personWithEmail = (env: NodeJS.ProcessEnv, email: string) =>
      withPeople(env, async (store) => {
        const key = { provider: "fake-mail", account: "fake-account" }
        await store.accounts.saveAccount(key, { name: "Fake mail" })
        await store.people.savePeople(key, [{ id: `mail-${email}`, name: "Mail Fake", email }])
        return (await store.people.personOf({ provider: key.provider, id: `mail-${email}` }))?.uid as string
      })
    const pagesOf = (env: NodeJS.ProcessEnv, uid: string) =>
      withPeople(env, async (store) =>
        (await store.notes.links({ to: `person:${uid}` })).map((link) => ({
          role: link.role,
          provenance: link.provenance,
          from: link.from,
        })),
      )

    it("identities list names the author and editor Notion gives, each asked once a run", async () => {
      const { run, http } = authored()
      await run(["sync"])
      const listed = (await run(["identities", "list", ROADMAP])).json() as {
        item: { items: Record<string, unknown>[] }
      }
      expect(listed.item.items).toEqual([
        expect.objectContaining({ remote_id: AUTHOR, role: "owner", name: "Ada Fake", person: expect.any(Object) }),
        expect.objectContaining({
          remote_id: EDITOR,
          role: "last-editor",
          name: "Bob Fake",
          person: expect.any(Object),
        }),
      ])
      expect(http.calls.filter((call) => call.path === `/v1/users/${AUTHOR}`)).toHaveLength(1)
    })

    it("links the page to the person who has the author's email address", async () => {
      const { run, env } = authored()
      const uid = await personWithEmail(env, "ada@example.invalid")
      await run(["sync"])
      const ref = (
        (await run(["identities", "list", ROADMAP])).json() as { item: { items: { person: { ref: string } }[] } }
      ).item.items[0]?.person.ref
      expect(ref).toBe(`person:${uid}`)
      expect(await pagesOf(env, uid)).toEqual([
        expect.objectContaining({ role: "owner", provenance: "notion:pages.retrieve" }),
      ])
      const related = await withPeople(env, (store) =>
        store.knowledge.listRelations({ about: `person:${uid}`, limit: 10 }),
      )
      expect(JSON.stringify(related)).toContain("notion:pages.retrieve")
    })

    it("identities link joins an editor to a person and moves the page's link to them", async () => {
      const { run, env } = authored("names")
      const uid = await personWithEmail(env, "someone@example.invalid")
      const synced = (await run(["sync"])).json() as { meta: { issues?: { reason: string }[] } }
      expect(synced.meta.issues).toContainEqual(expect.objectContaining({ reason: "notion.no-user-email" }))
      expect(await pagesOf(env, uid)).toEqual([])
      const linked = await run(["identities", "link", ROADMAP, EDITOR, `person:${uid}`])
      expect(linked.code, linked.out).toBe(0)
      expect(await pagesOf(env, uid)).toEqual([expect.objectContaining({ role: "last-editor" })])
    })

    it("a page synced before authors were saved gets them from a plain sync, read again once", async () => {
      const { run, env, notion } = authored()
      const uid = await personWithEmail(env, "ada@example.invalid")
      // Settled: a page edited in the last minutes is read on every sync anyway.
      notion.advance(60 * 60_000)
      await run(["sync"])
      // As 0.5.0 left it: no `authors` in the sync's state, and no link from the page to its people.
      const file = join(env.WCNOTION_STATE_DIR, "profiles", "personal", "sync", "state.json")
      const state = JSON.parse(readFileSync(file, "utf8")) as {
        documents: Record<string, { reference: string; metadata: { providerMetadata: { authors?: string } } }>
      }
      for (const doc of Object.values(state.documents)) delete doc.metadata.providerMetadata.authors
      writeFileSync(file, JSON.stringify(state))
      const held = Object.keys(state.documents).length
      await withPeople(env, (store) =>
        store.notes.replaceFileLinks(String(state.documents[ROADMAP]?.reference).slice("document:".length), []),
      )
      expect(await pagesOf(env, uid)).toEqual([])
      const before = notion.calls.pageMarkdown
      expect((await run(["sync"])).code).toBe(0)
      expect(notion.calls.pageMarkdown - before).toBe(held)
      expect(await pagesOf(env, uid)).toEqual([expect.objectContaining({ role: "owner" })])
      const after = notion.calls.pageMarkdown
      await run(["sync"])
      expect(notion.calls.pageMarkdown).toBe(after)
    })

    it("once the connection may read email addresses, pages read without them get their people", async () => {
      const { run, env, notion } = authored("names")
      const uid = await personWithEmail(env, "ada@example.invalid")
      await run(["sync"])
      expect(await pagesOf(env, uid)).toEqual([])
      notion.userAccess = "emails"
      notion.advance(60 * 60_000)
      notion.edit(LONELY, { title: "Lonely, edited" })
      await run(["sync"])
      await run(["sync"])
      expect(await pagesOf(env, uid)).toEqual([expect.objectContaining({ role: "owner" })])
    })

    it("keeps authors by id when the connection reads no user information, and doctor says so", async () => {
      const { run, http, env } = authored("none")
      const synced = (await run(["sync"])).json() as { meta: { issues?: { reason: string }[] } }
      expect(synced.meta.issues).toContainEqual(expect.objectContaining({ reason: "notion.no-user-information" }))
      expect(
        http.calls.filter((call) => call.path.startsWith("/v1/users/") && call.path !== "/v1/users/me"),
      ).toHaveLength(1)
      const listed = (await run(["identities", "list", ROADMAP])).json() as {
        item: { items: Record<string, unknown>[] }
      }
      expect(listed.item.items).toEqual([
        expect.objectContaining({ remote_id: AUTHOR, person: null }),
        expect.objectContaining({ remote_id: EDITOR, person: null }),
      ])
      const uid = await personWithEmail(env, "someone@example.invalid")
      expect((await run(["identities", "link", ROADMAP, AUTHOR, `person:${uid}`])).code).toBe(0)
      expect(await pagesOf(env, uid)).toEqual([expect.objectContaining({ role: "owner" })])
      const doctor = await runCli(["doctor", "--json"], { notion: http, keyring: signedIn(), env })
      expect(doctor.json()).toMatchObject({ item: { user_information: { personal: "none" } } })
    })
  })

  it("memories extract asks a model only once one is set, and says so", async () => {
    const { run } = cli()
    await run(["sync"])
    const extracted = await run(["memories", "extract", ROADMAP])
    expect(extracted.code).not.toBe(0)
    expect(extracted.out).not.toMatch(/quarterly/u)
  })

  it("refuses to remove the workspace and to show a page the copy does not hold", async () => {
    const { run } = cli()
    await run(["sync"])
    expect((await run(["folders", "remove", "notion-workspace"])).json()).toMatchObject({
      error: { reason: "folder.workspace" },
    })
    expect((await run(["documents", "show", "document:999"])).json()).toMatchObject({
      error: { reason: "document.not-imported" },
    })
  })
})

describe("every shared command over one synced copy", () => {
  it("syncs with a limit and again from scratch, and pages lists and searches", async () => {
    const { run } = cli()
    const first = (await run(["sync", "--limit", "2"])).json() as { item: { saved: number; pending: number } }
    expect(first.item).toMatchObject({ saved: 2, pending: 3 })
    expect((await run(["sync"])).json()).toMatchObject({ item: { pending: 0 } })
    expect((await run(["sync", "--rescan"])).json()).toMatchObject({ item: { pending: 0 } })
    const page = (await run(["documents", "list", "--limit", "2", "--page", "2"])).json() as { items: unknown[] }
    expect(page.items).toHaveLength(2)
    const found = (await run(["search", "roadmap", "--limit", "1", "--page", "1", "--exact"])).json() as {
      item: { hits: { id: string }[] }
    }
    expect(found.item.hits.map((hit) => hit.id)).toEqual([ROADMAP])
    expect((await run(["documents", "add", LONELY, "--title", "Kept", "--subject", "person:1"])).code).not.toBe(2)
  })

  it("keeps notes, memories, facts, relationships and catalog tags on a synced page", async () => {
    const { run } = cli()
    await run(["sync"])
    await run(["catalog", "import"])
    const ok = async (argv: string[]) => {
      const ran = await run(argv)
      expect(ran.code, `${argv.join(" ")}: ${ran.out}${ran.err}`).toBe(0)
      return ran.json() as { item: Record<string, unknown>; items: Record<string, unknown>[] }
    }
    expect((await ok(["catalog", "list", "--limit", "5", "--page", "1"])).items.length).toBeGreaterThan(0)
    expect((await ok(["catalog", "search", "Roadmap", "--limit", "5", "--page", "1"])).items.length).toBeGreaterThan(0)
    await ok(["catalog", "tree", "--depth", "1"])
    await ok(["catalog", "tags", "add", TASKS, "tracker"])
    expect((await ok(["catalog", "tags", "list", TASKS])).items).toEqual([{ tag: "tracker" }])
    await ok(["catalog", "tags", "remove", TASKS, "tracker"])

    const note = (await ok(["notes", "add", ROADMAP, "check the dates", "--title", "Dates"])).item as { ref: string }
    await ok(["notes", "list", ROADMAP, "--limit", "5", "--page", "1"])
    const shown = (await ok(["notes", "show", ROADMAP, note.ref])).item as { revision: number }
    await ok(["notes", "edit", ROADMAP, note.ref, "dates checked", "--revision", String(shown.revision)])
    await ok(["notes", "remove", ROADMAP, note.ref])

    const memory = (
      await ok(["memories", "add", ROADMAP, "Planned by quarter", "--scope", "work", "--kind", "summary"])
    ).item as { ref: string }
    await ok(["memories", "add", ROADMAP, "Planned by half", "--scope", "work", "--supersedes", memory.ref])
    await ok(["memories", "list", ROADMAP, "--limit", "5"])
    await ok(["memories", "show", ROADMAP, memory.ref])
    await ok(["memories", "confirm", ROADMAP, memory.ref])
    await ok(["memories", "stale", ROADMAP, memory.ref])
    await ok(["memories", "search", ROADMAP, "quarter"])

    const decision = (
      await ok([
        "facts",
        "add",
        ROADMAP,
        "Roadmap approved",
        "--type",
        "decision",
        "--scope",
        "work",
        "--occurred-time",
        "2026-11-01",
      ])
    ).item as { ref: string }
    const moved = (
      await ok(["facts", "add", ROADMAP, "Roadmap moved", "--type", "decision", "--supersedes", decision.ref])
    ).item as { ref: string }
    await ok(["facts", "list", ROADMAP, "--limit", "5"])
    await ok(["facts", "show", ROADMAP, decision.ref])
    await ok(["facts", "confirm", ROADMAP, moved.ref])
    await ok(["facts", "reverse", ROADMAP, moved.ref])

    const link = (
      await ok(["relationships", "add", ROADMAP, decision.ref, "--kind", "about", "--role", "plan", "--reason", "same"])
    ).item as { id: string }
    await ok(["relationships", "list", ROADMAP])
    await ok(["relationships", "remove", ROADMAP, String(link.id)])
    await ok(["identities", "list", ROADMAP])
  })
})

describe("account remove", () => {
  const documents = async (env: NodeJS.ProcessEnv) => {
    const store = await openStore(env, false)
    try {
      return (await searchNotesQuery(store, { text: "date>2000-01-01", limit: 50, timezone: "UTC" })).items.length
    } finally {
      await store.close()
    }
  }

  it("forgets the token and keeps the copy with --keep-data, deletes it and the profile's folder with --delete-data", async () => {
    const dir = mkdtempSync(join(tmpdir(), "notion-remove-"))
    const env = { MESSAGING_STORE: join(dir, "wirecat.db"), WCNOTION_STATE_DIR: join(dir, "state") }
    const notion = fakeNotion({ workspace: workspace() })
    const keyring = memoryKeyring()
    const run = (argv: string[], stdin?: string) =>
      runCli(["personal", ...argv, "--json"], { notion, keyring, env, ...(stdin ? { stdin } : {}) })
    const token = () => keyring.get(IDENTITY.appName, "token:personal")

    expect((await run(["session", "start"], FAKE_TOKEN)).code).toBe(0)
    expect((await run(["sync"])).code).toBe(0)
    const synced = await documents(env)
    expect(synced).toBeGreaterThan(0)

    const dry = await run(["account", "remove", "--delete-data", "--dry-run"])
    expect(dry.code, dry.err).toBe(0)
    expect(token()).toBe(FAKE_TOKEN)
    expect(await documents(env)).toBe(synced)

    const kept = await run(["account", "remove", "--keep-data", "--yes"])
    expect(kept.code, kept.err).toBe(0)
    expect(kept.json().item).toMatchObject({ data: "kept", revoked: null })
    expect(token()).toBeNull()
    expect(await documents(env)).toBe(synced)

    expect((await run(["session", "start"], FAKE_TOKEN)).code).toBe(0)
    const deleted = await run(["account", "remove", "--delete-data", "--yes"])
    expect(deleted.code, deleted.err).toBe(0)
    expect(token()).toBeNull()
    expect(await documents(env)).toBe(0)
    expect(existsSync(join(dir, "state", "profiles", "personal"))).toBe(false)
  })
})
