import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { CliError, memoryKeyring } from "@wirecat/cli-base"
import { accountFileFor } from "@wirecat/cli-core/cli"
import { documentCommandsContract } from "@wirecat/cli-core/documents/testing"
import { describe, expect, it } from "vitest"
import { NOTION_WORDS } from "./commands/library.js"
import { IDENTITY } from "./identity.js"
import type { NotionParent } from "./notion/reads.js"
import { createProgram } from "./program.js"
import { passUnderWay } from "./sync/source.js"
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

  it("folders browse lists one level live, and marks what is chosen", async () => {
    const { run } = cli()
    await run(["folders", "add", ROADMAP])
    const top = (await run(["folders", "browse"])).json() as { items: { id: string; chosen: boolean }[] }
    expect(top.items.map((item) => [item.id, item.chosen]).sort()).toEqual(
      [
        [ROADMAP, true],
        [LONELY, false],
      ].sort(),
    )
    const inside = (await run(["folders", "browse", "--parent", ROADMAP])).json() as { items: { id: string }[] }
    expect(inside.items.map((item) => item.id).sort()).toEqual([CHILD, TASKS].sort())
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
      const ran = await run(["sync", "--timeout", "8s"])
      expect(ran.code, ran.out).toBe(0)
      left.push((ran.json() as { item: { walk?: { folders_left: number } } }).item.walk?.folders_left ?? 0)
    }
    // The first run finds the hub, the second its 60 children; each run after that walks at least one of them.
    expect(left[2]).toBeLessThan(left[1] as number)
    expect(notion.calls.retrievePage).toBeLessThan(60)
  }, 150_000)

  it("stops a long Notion pass before the deadline, says to sync again, and the next syncs finish it", async () => {
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
    const cursor = () => {
      const state = JSON.parse(
        readFileSync(join(env.WCNOTION_STATE_DIR, "profiles", "personal", "sync", "state.json"), "utf8"),
      ) as { cursor: string; pending?: { cursor: string } }
      return state.pending?.cursor ?? state.cursor
    }
    const before = cursor()
    // Each answer takes 200 ms of real time, as cli-core's deadline runs on the wall clock.
    const fetch = http.fetch
    http.fetch = (async (...args: Parameters<typeof globalThis.fetch>) => {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return fetch(...args)
    }) as typeof globalThis.fetch
    const cut = await run(["sync", "--timeout", "6s"])
    expect(cut.code, cut.out).toBe(0)
    expect(cut.json()).toMatchObject({
      item: { complete: false },
      next: [{ command: "sync", args: { timeout: "6s" }, safe_to_auto_execute: true }],
      meta: { complete: false },
    })
    expect(cursor()).not.toBe(before)
    expect(passUnderWay(cursor())).toBe(true)
    http.fetch = fetch
    let found = false
    for (let round = 0; round < 6 && !found; round++) {
      const again = await run(["sync", "--timeout", "10m"])
      expect(again.code, again.out).toBe(0)
      const listed = (await run(["documents", "list"])).json() as { items: { name: string }[] }
      found = listed.items.some((item) => item.name === "Row 11 edited")
    }
    expect(found).toBe(true)
  }, 40_000)

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
