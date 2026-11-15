import { CliError, isCliError } from "@wirecat/cli-base"
import {
  type SourceContent,
  type SourceIndex,
  type SourceState,
  type SourceStatePort,
  type SourceWalk,
  syncDocuments,
} from "@wirecat/cli-core/documents"
import { documentSourceContract } from "@wirecat/cli-core/documents/testing"
import { beforeEach, describe, expect, it } from "vitest"
import type { NotionParent } from "../notion/reads.js"
import { FakeNotion } from "../testing/fake-notion-reads.js"
import { decodeCursor } from "./cursor.js"
import {
  isNotionDocument,
  isNotionFolder,
  type NotionFile,
  notionSource,
  type SyncWarning,
  WORKSPACE_ROOT,
} from "./source.js"

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const PRINCIPAL = "ws-1:bot-1"
const top: NotionParent = { type: "workspace", workspace: true }
const under = (id: string): NotionParent => ({ type: "page_id", page_id: id })
const row = (database: string, source: string): NotionParent => ({
  type: "data_source_id",
  data_source_id: source,
  database_id: database,
})

/** cli-core's real engine over an in-memory checkpoint and index, as the CLI will run it once L1 and L2 land. */
interface Settings {
  roots?: string[]
  maxRequests?: number
  /** How far this computer's clock is ahead of Notion's. */
  skew?: number
  max?: number
}

const harness = (notion: FakeNotion, settings: Settings = {}) => {
  let state: SourceState<NotionFile> = {
    version: 1,
    principal: PRINCIPAL,
    scope: "",
    folders: {},
    documents: {},
    skipped: [],
  }
  let walk: SourceWalk<NotionFile> | undefined
  const snapshots = new Map<string, SourceContent<NotionFile>>()
  const saved = new Map<string, SourceContent<NotionFile>>()
  const port: SourceStatePort<NotionFile> = {
    read: () => structuredClone(state),
    save: (next) => {
      state = structuredClone(next)
    },
    readWalk: (scope) => (walk?.scope === scope ? structuredClone(walk) : undefined),
    saveWalk: (next) => {
      walk = structuredClone(next)
    },
    removeWalk: () => {
      walk = undefined
    },
    saveSnapshot: (content) => snapshots.set(content.metadata.id, structuredClone(content)),
    removeSnapshot: (id) => snapshots.delete(id),
  }
  const index: SourceIndex<NotionFile> = {
    save: async (_principal, content) => {
      saved.set(content.metadata.id, structuredClone(content))
      return `document:${content.metadata.id}`
    },
    remove: async (_principal, id) => {
      saved.delete(id)
    },
    openPictures: async () => {
      throw new CliError("not_found", "no picture model")
    },
  }
  const roots = settings.roots ?? [WORKSPACE_ROOT]
  const warnings: SyncWarning[] = []
  const reads = { known: 0 }
  const source = notionSource(notion, {
    roots,
    known: () => {
      reads.known++
      return [...Object.values(state.documents).map((doc) => doc.metadata), ...Object.values(state.folders)]
    },
    now: () => notion.now + (settings.skew ?? 0),
    warn: (warning) => warnings.push(warning),
    ...(settings.maxRequests ? { maxRequests: settings.maxRequests } : {}),
  })
  const sync = (rescan = false) =>
    syncDocuments<NotionFile>({
      source,
      index,
      state: port,
      principal: PRINCIPAL,
      roots,
      textLimit: 1_000_000,
      max: settings.max ?? 100_000,
      maxEntries: 100_000,
      isFolder: isNotionFolder,
      isDocument: isNotionDocument,
      skipReason: () => undefined,
      retryable: () => false,
      errorOf: (error) => (isCliError(error) ? error : new CliError("provider_error", String(error))),
      assertHeld: () => undefined,
      storeVersion: "test",
      rescan,
      now: () => notion.now,
    })
  return { source, sync, saved, snapshots, warnings, reads, state: () => state }
}

const workspace = () => {
  const notion = new FakeNotion()
  notion.addPage({ id: "a", title: "Alpha", parent: top, markdown: "alpha v1", createdBy: "u1", editedBy: "u2" })
  notion.addPage({ id: "b", title: "Beta", parent: top, markdown: "beta" })
  notion.addPage({ id: "a1", title: "Alpha child", parent: under("a") })
  notion.addDatabase({ id: "db", title: "Tasks", parent: top, sources: ["ds"] })
  for (const id of ["r1", "r2", "r3"])
    notion.addPage({
      id,
      title: `Task ${id}`,
      parent: row("db", "ds"),
      properties: { Status: { type: "status", status: { name: "Open" } } },
    })
  return notion
}

describe("the Notion source under cli-core's sync engine", () => {
  let notion: FakeNotion
  beforeEach(() => {
    notion = workspace()
  })

  it("names the account by workspace and token bot", async () => {
    expect(await harness(notion).source.identity()).toBe(PRINCIPAL)
  })

  it("syncs everything the token sees when no folder is chosen", async () => {
    const run = harness(notion)
    const result = await run.sync()
    expect(result.errors).toEqual([])
    expect([...run.saved.keys()].sort()).toEqual(["a", "a1", "b", "r1", "r2", "r3"])
    expect(run.saved.get("r1")?.text).toContain("Status: Open")
    expect(run.saved.get("a")?.metadata.providerMetadata.people).toEqual([
      { id: "u1", role: "author" },
      { id: "u2", role: "editor" },
    ])
  })

  it("narrows to a chosen database, and queries no other database later", async () => {
    notion.addDatabase({ id: "other", title: "Other", parent: top, sources: ["other-ds"] })
    const run = harness(notion, { roots: ["db"] })
    await run.sync()
    expect([...run.saved.keys()].sort()).toEqual(["r1", "r2", "r3"])
    notion.advance(HOUR)
    notion.edit("r1", { title: "edited" })
    await run.sync()
    expect(run.saved.get("r1")?.metadata.name).toBe("edited")
    expect(notion.log).not.toContainEqual({ method: "queryDataSource", id: "other-ds" })
  })

  it("lists each database once in a full walk", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(25 * HOUR)
    const before = notion.calls.queryDataSource
    await run.sync()
    expect(notion.calls.queryDataSource - before).toBe(1)
  })

  it("picks up a second edit made in the same minute as the last read", async () => {
    const run = harness(notion)
    notion.advance(5_000)
    notion.edit("a", { markdown: "alpha v2" })
    notion.advance(5_000)
    await run.sync()
    expect(run.saved.get("a")?.markdown).toBe("alpha v2")
    notion.advance(10_000)
    // Still 10:00: Notion serves the same last_edited_time as at the last read.
    notion.edit("a", { markdown: "alpha v3" })
    notion.advance(5_000)
    await run.sync()
    expect(run.saved.get("a")?.markdown).toBe("alpha v3")
  })

  it("does not read a settled page again when nothing changed", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(10 * MINUTE)
    await run.sync()
    const before = notion.calls.pageMarkdown
    notion.advance(MINUTE)
    const result = await run.sync()
    expect(notion.calls.pageMarkdown).toBe(before)
    expect(result.saved).toBe(0)
  })

  it("catches a page search indexes late, inside the overlap", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    notion.addPage({ id: "late", title: "Late", parent: top })
    notion.hiddenFromSearch.add("late")
    notion.advance(MINUTE)
    notion.edit("b", { markdown: "beta v2" })
    await run.sync()
    expect(run.saved.has("late")).toBe(false)
    notion.advance(5 * MINUTE)
    notion.hiddenFromSearch.delete("late")
    await run.sync()
    expect(run.saved.has("late")).toBe(true)
  })

  it("finds through the database query a row search misses", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    notion.hiddenFromSearch.add("r2")
    notion.edit("r2", { title: "Task r2 renamed" })
    await run.sync()
    expect(run.saved.get("r2")?.metadata.name).toBe("Task r2 renamed")
  })

  it("removes a page trashed between walks only at the next walk, after asking Notion for it", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    notion.page("b").trashed = true
    await run.sync()
    expect(run.saved.has("b")).toBe(true)
    notion.advance(25 * HOUR)
    const result = await run.sync()
    expect(result.removed).toBe(1)
    expect(run.saved.has("b")).toBe(false)
    expect(notion.log).toContainEqual({ method: "retrievePage", id: "b" })
  })

  it("removes a page unshared from the token at the next walk", async () => {
    const run = harness(notion)
    await run.sync()
    notion.page("a").shared = false
    notion.advance(25 * HOUR)
    await run.sync()
    expect(run.saved.has("a")).toBe(false)
  })

  it("keeps a top-level page that search leaves out of a walk", async () => {
    const run = harness(notion)
    await run.sync()
    notion.hiddenFromSearch.add("a")
    notion.advance(25 * HOUR)
    const result = await run.sync()
    expect(result.removed).toBe(0)
    expect(run.saved.has("a")).toBe(true)
    notion.advance(MINUTE)
    await run.sync(true)
    expect(run.saved.has("a")).toBe(true)
  })

  it("removes a deleted row at the next walk", async () => {
    const run = harness(notion)
    await run.sync()
    notion.page("r3").shared = false
    notion.advance(25 * HOUR)
    await run.sync()
    expect(run.saved.has("r3")).toBe(false)
    expect(run.saved.has("r1")).toBe(true)
  })

  it("surfaces Notion's 429 as a typed error when nothing was done yet, and loses nothing", async () => {
    const run = harness(notion)
    await run.sync()
    const mark = run.state().cursor
    notion.advance(HOUR)
    notion.edit("r1", { title: "Task r1 v2" })
    notion.failNext("search", new CliError("rate_limited", "slow down", { status: 429, retry_after_ms: 30_000 }))
    const error = await run.sync().catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code: "rate_limited", details: { retry_after_ms: 30_000 } })
    expect(run.state().cursor).toBe(mark)
    await run.sync()
    expect(run.saved.get("r1")?.metadata.name).toBe("Task r1 v2")
  })

  it("ends a pass cut short on a 429 midway, keeps the work done, and goes on next time", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    notion.edit("a", { markdown: "alpha v2" })
    notion.failNext(
      "queryDataSource",
      new CliError("rate_limited", "slow down", { status: 429, retry_after_ms: 30_000 }),
    )
    const result = await run.sync()
    expect(result.errors).toEqual([])
    expect(run.saved.get("a")?.markdown).toBe("alpha v2")
    expect(run.warnings).toContainEqual(expect.objectContaining({ code: "rate_limited", retry_after_ms: 30_000 }))
    expect(decodeCursor(run.state().cursor as string).pass?.tasks).toEqual([
      { t: "rows", database: "db", source: "ds" },
    ])
    const searches = notion.calls.search
    await run.sync()
    expect(notion.calls.search).toBe(searches)
    expect(decodeCursor(run.state().cursor as string).pass).toBeUndefined()
  })

  it("goes on past a database it may not read (403), and says so", async () => {
    notion.addDatabase({ id: "db2", title: "More", parent: top, sources: ["ds2"] })
    notion.addPage({ id: "m1", title: "More 1", parent: row("db2", "ds2") })
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    notion.edit("m1", { title: "More 1 v2" })
    notion.hiddenFromSearch.add("m1")
    notion.failNext("queryDataSource", new CliError("permission_error", "restricted", { status: 403 }))
    await run.sync()
    expect(run.warnings).toContainEqual(expect.objectContaining({ id: "db", code: "permission_error" }))
    expect(run.saved.get("m1")?.metadata.name).toBe("More 1 v2")
    expect(decodeCursor(run.state().cursor as string).pass).toBeUndefined()
  })

  it("keeps what a walk did when it fails midway, and finishes it on the next sync", async () => {
    notion.addDatabase({ id: "db2", title: "More", parent: top, sources: ["ds2"] })
    const run = harness(notion)
    await run.sync()
    notion.advance(25 * HOUR)
    notion.failNext("queryDataSource", new CliError("provider_unavailable", "Notion is down", { status: 503 }))
    await run.sync()
    const cut = decodeCursor(run.state().cursor as string)
    expect(cut.pass?.walk).toBe(true)
    expect(run.warnings).toContainEqual(expect.objectContaining({ code: "provider_unavailable" }))
    await run.sync()
    const done = decodeCursor(run.state().cursor as string)
    expect(done.pass).toBeUndefined()
    expect(done.walkedAt).toBe(cut.pass?.startedAt)
    expect([...run.saved.keys()].sort()).toEqual(["a", "a1", "b", "r1", "r2", "r3"])
  })

  it("does not take a 404 on one child for the parent's removal", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(25 * HOUR)
    notion.failNext("retrievePage", new CliError("not_found", "gone", { status: 404 }), "a1")
    const result = await run.sync()
    expect(result.removed).toBe(0)
    expect(run.saved.has("a")).toBe(true)
  })

  it("keeps a known page Notion refuses to show (403) instead of removing it", async () => {
    const run = harness(notion)
    await run.sync()
    notion.hiddenFromSearch.add("b")
    notion.advance(25 * HOUR)
    notion.failNext("retrievePage", new CliError("permission_error", "restricted", { status: 403 }), "b")
    await run.sync()
    expect(run.saved.has("b")).toBe(true)
    expect(run.warnings).toContainEqual(expect.objectContaining({ id: "b", code: "permission_error" }))
  })

  it("treats a database search lists but Notion will not give as missing from search", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    const database = notion.databases.get("db")
    if (database) database.edited = notion.now
    notion.failNext("retrieveDatabase", new CliError("not_found", "gone", { status: 404 }))
    const result = await run.sync()
    expect(result.errors).toEqual([])
    expect(run.saved.has("r1")).toBe(true)
  })

  it("reads no database outside the chosen folders", async () => {
    notion.addDatabase({ id: "other", title: "Other", parent: top, sources: ["other-ds"] })
    const run = harness(notion, { roots: ["db"] })
    await run.sync()
    notion.advance(HOUR)
    const other = notion.databases.get("other")
    if (other) other.edited = notion.now
    await run.sync()
    expect(notion.log).not.toContainEqual({ method: "retrieveDatabase", id: "other" })
  })

  it("fails loudly when Notion cuts search short, never as a quiet partial list", async () => {
    const run = harness(notion)
    await run.sync()
    notion.searchCap = 2
    notion.advance(HOUR)
    for (const id of ["a", "b", "r1"]) notion.edit(id, { title: `${id} v2` })
    await expect(run.sync()).rejects.toMatchObject({ details: { reason: "notion.search-incomplete" } })
  })

  it("picks up a same-minute edit when this computer's clock runs three minutes ahead", async () => {
    const run = harness(notion, { skew: 3 * MINUTE })
    await run.sync()
    notion.advance(HOUR)
    notion.edit("b", { markdown: "v2" })
    notion.advance(5_000)
    await run.sync()
    notion.advance(5_000)
    notion.edit("b", { markdown: "v3" })
    notion.advance(5 * MINUTE)
    await run.sync()
    expect(run.saved.get("b")?.markdown).toBe("v3")
  })

  it("picks up a same-minute edit without a Date header, from Notion's own timestamps", async () => {
    notion.dateHeader = false
    const run = harness(notion, { skew: 3 * MINUTE })
    await run.sync()
    notion.advance(HOUR)
    notion.edit("b", { markdown: "v2" })
    notion.advance(5_000)
    await run.sync()
    notion.advance(5_000)
    notion.edit("b", { markdown: "v3" })
    notion.advance(5 * MINUTE)
    await run.sync()
    expect(run.saved.get("b")?.markdown).toBe("v3")
  })

  it("strips an image proxy link with a signature inside it on a later sync too", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    notion.edit("a", {
      markdown:
        "![x](https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2Fx.png" +
        "%3FX-Amz-Signature%3Dabc?table=block&id=1)",
    })
    await run.sync()
    expect(run.saved.get("a")?.markdown).toContain("table=block")
    expect(JSON.stringify([[...run.saved.values()], [...run.snapshots.values()]])).not.toMatch(/X-Amz-/i)
  })

  it("reads what the sync holds once per call, not once per listing", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(25 * HOUR)
    run.reads.known = 0
    const calls = { n: 0 }
    for (const name of ["metadata", "children", "changes"] as const) {
      const call = run.source[name] as (id: string) => Promise<unknown>
      ;(run.source as unknown as Record<string, unknown>)[name] = (id: string) => {
        calls.n++
        return call(id)
      }
    }
    await run.sync()
    expect(run.reads.known).toBeGreaterThan(0)
    expect(run.reads.known).toBeLessThanOrEqual(calls.n)
  })

  it("syncs pages under pages, a database in a page, and a page chosen as a folder", async () => {
    notion.addPage({ id: "a2", title: "Alpha grandchild", parent: under("a1"), markdown: "deep text" })
    notion.addDatabase({ id: "inner", title: "Inner", parent: under("a1"), sources: ["inner-ds"] })
    notion.addPage({ id: "ir", title: "Inner row", parent: row("inner", "inner-ds") })
    const whole = harness(notion)
    await whole.sync()
    expect([...whole.saved.keys()].sort()).toEqual(["a", "a1", "a2", "b", "ir", "r1", "r2", "r3"])
    const chosen = harness(notion, { roots: ["a1"] })
    await chosen.sync()
    expect([...chosen.saved.keys()].sort()).toEqual(["a1", "a2", "ir"])
    expect(chosen.saved.get("a2")?.metadata.parents).toEqual(["a1"])
  })

  it("finds an edit and a removal deep under a page, and sends a held page again only when it changed", async () => {
    notion.addPage({ id: "a2", title: "Alpha grandchild", parent: under("a1"), markdown: "v1" })
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    notion.edit("a2", { markdown: "v2" })
    await run.sync()
    expect(run.saved.get("a2")?.markdown).toBe("v2")
    notion.advance(25 * HOUR)
    notion.edit("a1", { trashed: true })
    const before = notion.calls.blockChildren
    await run.sync()
    expect(run.saved.has("a1")).toBe(false)
    expect(run.saved.has("a2")).toBe(false)
    expect(notion.calls.blockChildren - before).toBeLessThanOrEqual(3)
  })

  it("names an untitled page so every entry has a name", async () => {
    notion.addPage({ id: "blank", title: "", parent: top })
    const source = notionSource(notion, { now: () => notion.now })
    expect((await source.metadata("blank")).name).toBe("Untitled")
  })

  it("keeps no signed file link in any stored field", async () => {
    notion.edit("a", {
      markdown: "![x](https://prod-files-secure.s3.us-west-2.amazonaws.com/w/x.png?X-Amz-Signature=s&X-Amz-Date=d)",
      properties: {
        Files: {
          type: "files",
          files: [{ name: "x.png", type: "file", file: { url: "https://h/x?X-Amz-Signature=s" } }],
        },
      },
    })
    const run = harness(notion)
    await run.sync()
    const stored = JSON.stringify([[...run.saved.values()], [...run.snapshots.values()], run.state()])
    expect(stored).not.toMatch(/X-Amz-/)
  })
})

describe("changes()", () => {
  it("goes on from where a pass cut short by its request bound stopped, and moves the mark only at the end", async () => {
    const notion = workspace()
    for (const id of ["db2", "db3"]) notion.addDatabase({ id, title: id, parent: top, sources: [`${id}-ds`] })
    const run = harness(notion, { maxRequests: 3 })
    await run.sync()
    notion.advance(HOUR)
    notion.edit("r1", { title: "edited" })
    const cursor = run.state().cursor as string
    const first = await run.source.changes(cursor)
    const partial = decodeCursor(first.cursor)
    expect(partial.pass?.tasks.length).toBeGreaterThan(0)
    expect(partial.mark).toBe(decodeCursor(cursor).mark)
    const searches = notion.calls.search
    let next = first
    for (let round = 0; decodeCursor(next.cursor).pass && round < 10; round++)
      next = await run.source.changes(next.cursor)
    expect(notion.calls.search).toBe(searches)
    const done = decodeCursor(next.cursor)
    expect(done.pass).toBeUndefined()
    expect(Date.parse(done.mark as string)).toBeGreaterThan(Date.parse(decodeCursor(cursor).mark as string))
    const all = [first, next].flatMap((page) => page.items.map((item) => item.id))
    expect(all).toContain("r1")
  })

  it("reads a 25,000-row database whole through the engine, in created_time windows of at most 10,000", async () => {
    const notion = new FakeNotion()
    notion.addDatabase({ id: "big", title: "Big", parent: top, sources: ["big-ds"] })
    const start = notion.now - 100 * HOUR
    // 40 rows a minute: a window of 10,000 ends inside a minute, so the next window reads part of it again.
    for (let i = 0; i < 25_000; i++)
      notion.addPage({
        id: `row-${i}`,
        title: `Row ${i}`,
        parent: row("big", "big-ds"),
        created: start + Math.floor(i / 40) * MINUTE,
      })
    const run = harness(notion, { max: 100 })
    const result = await run.sync()
    expect(result.saved + result.pending).toBe(25_000)
    // Search counts rows too, so its answer at the top of the walk is cut; the rows still all come, by query.
    expect(run.warnings).toContainEqual(expect.objectContaining({ message: expect.stringMatching(/most recently/) }))
    expect(notion.calls.queryDataSource).toBeGreaterThanOrEqual(250)
  }, 20_000)

  it("stops with an error naming the database when more than 10,000 rows share one minute", async () => {
    const notion = new FakeNotion()
    notion.addDatabase({ id: "dense", title: "Dense", parent: top, sources: ["dense-ds"] })
    for (let i = 0; i < 10_001; i++) notion.addPage({ id: `d-${i}`, title: "d", parent: row("dense", "dense-ds") })
    const source = notionSource(notion, { now: () => notion.now })
    await expect(source.children("dense")).rejects.toMatchObject({
      code: "validation_error",
      details: { reason: "notion.window-too-dense", database: "dense" },
    })
  })

  it("files a page that sits in a column under the page that holds the column", async () => {
    const notion = workspace()
    notion.blocks.set("col", under("a"))
    notion.addPage({ id: "in-col", title: "In a column", parent: { type: "block_id", block_id: "col" } })
    const source = notionSource(notion, { now: () => notion.now })
    expect((await source.metadata("in-col")).parents).toEqual(["a"])
    expect((await source.children("a")).map((file) => file.id).sort()).toEqual(["a1", "in-col"])
  })

  it("lists a page's other children when one of them cannot be read, as a linked database view", async () => {
    const notion = workspace()
    notion.addDatabase({ id: "view", title: "Linked view", parent: under("a"), sources: ["view-ds"], unreadable: true })
    const warnings: SyncWarning[] = []
    const source = notionSource(notion, { now: () => notion.now, warn: (warning) => warnings.push(warning) })
    expect((await source.children("a")).map((file) => file.id)).toEqual(["a1"])
    expect(warnings).toContainEqual(expect.objectContaining({ id: "view", code: "not_found" }))
  })

  it("puts a page whose parent the token cannot see at the top of the workspace", async () => {
    const notion = new FakeNotion()
    notion.addPage({ id: "hidden", title: "Hidden", parent: top, shared: false })
    notion.addPage({ id: "shared", title: "Shared", parent: under("hidden") })
    const source = notionSource(notion, { now: () => notion.now })
    expect((await source.children(WORKSPACE_ROOT)).map((file) => file.id)).toEqual(["shared"])
  })

  it("refuses an overlap under two minutes", () => {
    expect(() => notionSource(new FakeNotion(), { overlapMs: MINUTE })).toThrow(/two minutes/)
  })
})

describe("content()", () => {
  it("fills in truncated blocks and counts the ones the token may not see", async () => {
    const notion = new FakeNotion()
    notion.addPage({
      id: "p",
      title: "P",
      parent: top,
      markdown:
        'start\n<unknown url="https://www.notion.so/p#aaaa-1111" alt="x"/>\n<unknown url="https://www.notion.so/p#bbbb2222" alt="y"/>',
      unknown: { "aaaa-1111": "filled in", bbbb2222: null },
    })
    const content = await notionSource(notion, { now: () => notion.now }).content("p")
    expect(content.markdown).toContain("filled in")
    expect(content.markdown).toContain("bbbb2222")
    expect(content.metadata.providerMetadata.missingBlocks).toBe(1)
  })

  it("refuses a page longer than the text limit with the limit attached, and a trashed page as not found", async () => {
    const notion = new FakeNotion()
    notion.addPage({ id: "long", title: "L", parent: top, markdown: "x".repeat(500) })
    notion.addPage({ id: "gone", title: "G", parent: top, trashed: true })
    const source = notionSource(notion, { now: () => notion.now })
    await expect(source.content("long", 100)).rejects.toMatchObject({ details: { text_limit: 100 } })
    await expect(source.content("gone")).rejects.toMatchObject({ code: "not_found" })
    expect(new TextDecoder().decode(await source.bytes("long"))).toBe("x".repeat(500))
  })
})

describe.each([
  ["the whole workspace", WORKSPACE_ROOT],
  ["a page chosen as a folder", "a"],
])("cli-core's documents source contract over the strict fake, from %s", (_, root) => {
  for (const c of documentSourceContract(() => {
    const notion = workspace()
    notion.addPage({ id: "a2", title: "", parent: under("a1"), markdown: "deep" })
    return {
      source: notionSource(notion, { now: () => notion.now }),
      root,
      isFolder: isNotionFolder,
      isDocument: isNotionDocument,
      missing: "absent",
      change: async () => {
        notion.advance(HOUR)
        notion.edit("a2", { markdown: "deep v2" })
      },
    }
  }))
    it(c.name, c.run)
})
