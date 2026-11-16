import { CliError, isCliError } from "@wirecat/cli-base"
import { type Deadline, runBudget } from "@wirecat/cli-core/background"
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
import { decodeCursor, encodeCursor } from "./cursor.js"
import {
  isNotionDocument,
  isNotionFolder,
  type NotionFile,
  notionSource,
  passUnderWay,
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
  /** A run's deadline on a clock of the test's own, which the budget reads. */
  deadline?: () => { deadline: Deadline; now: () => number }
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
  // One source serves one sync run, as the CLI builds it.
  const sourceOf = () =>
    notionSource(notion, {
      roots,
      known: () => {
        reads.known++
        return [...Object.values(state.documents).map((doc) => doc.metadata), ...Object.values(state.folders)]
      },
      now: () => notion.now + (settings.skew ?? 0),
      warn: (warning) => warnings.push(warning),
      ...(settings.maxRequests ? { maxRequests: settings.maxRequests } : {}),
    })
  const run = { source: sourceOf() }
  const sync = (rescan = false) => {
    run.source = sourceOf()
    const timed = settings.deadline?.()
    return syncDocuments<NotionFile>({
      ...(timed ? { budget: runBudget({ deadline: timed.deadline, now: timed.now }), deadline: timed.deadline } : {}),
      source: run.source,
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
  }
  return {
    get source() {
      return run.source
    },
    sourceOf,
    sync,
    saved,
    snapshots,
    warnings,
    reads,
    state: () => state,
    walk: () => walk,
  }
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
      { t: "database", id: "db" },
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

  it("reads what the sync holds once per sync run, not once per listing", async () => {
    const run = harness(notion)
    await run.sync()
    notion.advance(25 * HOUR)
    run.reads.known = 0
    await run.sync(true)
    expect(run.reads.known).toBe(1)
  })

  it("keeps a page's children when Notion refuses to list them (403), and syncs the rest", async () => {
    notion.addPage({ id: "a2", title: "Alpha grandchild", parent: under("a1"), markdown: "deep text" })
    const run = harness(notion)
    await run.sync()
    notion.failNext("blockChildren", new CliError("permission_error", "restricted", { status: 403 }), "a1")
    const result = await run.sync(true)
    expect(result.errors).toEqual([])
    expect(result.removed).toBe(0)
    expect([...run.saved.keys()].sort()).toEqual(["a", "a1", "a2", "b", "r1", "r2", "r3"])
    expect(run.warnings).toContainEqual(
      expect.objectContaining({ id: "a1", code: "permission_error", reason: "notion.left-out" }),
    )
  })

  it("skips a block inside a page whose children Notion will not list (404), and reads the rest", async () => {
    notion.blocks.set("synced", under("a"))
    notion.blocks.set("col", under("a"))
    notion.addPage({ id: "in-col", title: "In a column", parent: { type: "block_id", block_id: "col" } })
    const run = harness(notion)
    notion.failNext("blockChildren", new CliError("not_found", "the original is not shared", { status: 404 }), "synced")
    const first = await run.sync()
    expect(first.errors).toEqual([])
    expect([...run.saved.keys()]).toEqual(expect.arrayContaining(["a", "a1", "in-col"]))
    expect(run.warnings).toContainEqual(expect.objectContaining({ id: "synced", reason: "notion.left-out" }))
    notion.failNext("blockChildren", new CliError("not_found", "the original is not shared", { status: 404 }), "synced")
    const again = await run.sync(true)
    expect(again.removed).toBe(0)
    expect(run.saved.has("in-col")).toBe(true)
  })

  it("keeps a database and its rows when Notion refuses to read it (403); only a 404 removes", async () => {
    const run = harness(notion)
    await run.sync()
    const database = notion.databases.get("db")
    if (database) database.restricted = true
    notion.advance(25 * HOUR)
    const result = await run.sync()
    expect(result.removed).toBe(0)
    expect([...run.saved.keys()]).toEqual(expect.arrayContaining(["r1", "r2", "r3"]))
    expect(run.warnings).toContainEqual(expect.objectContaining({ id: "db", reason: "notion.kept-unconfirmed" }))
    if (database) {
      database.restricted = false
      database.shared = false
    }
    notion.advance(25 * HOUR)
    await run.sync()
    expect(run.saved.has("r1")).toBe(false)
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
    const source = run.sourceOf()
    const first = await source.changes(cursor)
    const partial = decodeCursor(first.cursor)
    expect(partial.pass?.tasks.length).toBeGreaterThan(0)
    expect(partial.mark).toBe(decodeCursor(cursor).mark)
    const searches = notion.calls.search
    let next = first
    for (let round = 0; decodeCursor(next.cursor).pass && round < 10; round++) next = await source.changes(next.cursor)
    expect(notion.calls.search).toBe(searches)
    const done = decodeCursor(next.cursor)
    expect(done.pass).toBeUndefined()
    expect(Date.parse(done.mark as string)).toBeGreaterThan(Date.parse(decodeCursor(cursor).mark as string))
    const all = [first, next].flatMap((page) => page.items.map((item) => item.id))
    expect(all).toContain("r1")
  })

  /** Runs of changes() with a deadline each, on a clock where every Notion request takes `perCall` ms. */
  const timedRuns = async (
    notion: FakeNotion,
    run: ReturnType<typeof harness>,
    { perCall = 1000, ms = 10_000, most = 30 } = {},
  ) => {
    let clock = 0
    const timed = new Proxy(notion, {
      get: (target, name, receiver) => {
        const value = Reflect.get(target, name, receiver)
        if (typeof value !== "function" || name === "serverTime") return value
        return (...args: unknown[]) => {
          clock += perCall
          return value.apply(target, args)
        }
      },
    })
    let cursor = run.state().cursor as string
    const items: { id: string; removed: boolean }[] = []
    let runs = 0
    do {
      clock = 0
      runs++
      const source = notionSource(timed, {
        now: () => notion.now,
        known: () => Object.values(run.state().documents).map((doc) => doc.metadata),
        deadline: { endsAt: ms, ms },
        clock: () => clock,
        warn: (warning) => run.warnings.push(warning),
      })
      const page = await source.changes(cursor)
      expect(clock).toBeLessThanOrEqual(ms)
      items.push(...page.items)
      cursor = page.cursor
    } while (passUnderWay(cursor) && runs < most)
    return { runs, cursor, items, seen: items.map((item) => item.id) }
  }

  it.each([
    ["an hourly pass", HOUR],
    ["the daily full walk", 25 * HOUR],
  ])("stops %s before the run's deadline with the pass saved, and the next runs finish it", async (_, later) => {
    const notion = workspace()
    for (const id of ["db2", "db3", "db4"]) notion.addDatabase({ id, title: id, parent: top, sources: [`${id}-ds`] })
    const run = harness(notion)
    await run.sync()
    notion.advance(later)
    notion.edit("r3", { title: "edited" })
    const walkedAt = decodeCursor(run.state().cursor as string).walkedAt
    const { runs, cursor, seen } = await timedRuns(notion, run)
    expect(runs).toBeGreaterThan(1)
    expect(passUnderWay(cursor)).toBe(false)
    expect(seen).toContain("r3")
    expect(decodeCursor(cursor).walkedAt > walkedAt).toBe(later > 24 * HOUR)
  })

  it("walks a database too big for one run's rows over a few 30 s runs, a page of rows per step, and removes none", async () => {
    const notion = new FakeNotion()
    notion.addDatabase({ id: "db", title: "Big", parent: top, sources: ["ds"] })
    for (let r = 0; r < 3_000; r++)
      notion.addPage({ id: `r${r}`, title: `R${r}`, parent: row("db", "ds"), created: notion.now + r * 1000 })
    const run = harness(notion, { max: 5_000 })
    await run.sync()
    notion.advance(25 * HOUR)
    // A second a request: about 25 fit in a run, and the 30 pages of rows do not.
    const { runs, cursor, items } = await timedRuns(notion, run, { perCall: 1000, ms: 30_000 })
    expect(passUnderWay(cursor)).toBe(false)
    expect(runs).toBeGreaterThan(1)
    expect(runs).toBeLessThan(5)
    expect(items.filter((item) => item.removed)).toEqual([])
  }, 30_000)

  it("goes on by the query's position when more than a page of rows share one minute", async () => {
    const notion = new FakeNotion()
    notion.addDatabase({ id: "db", title: "Dense", parent: top, sources: ["ds"] })
    for (let r = 0; r < 250; r++) notion.addPage({ id: `d${r}`, title: `D${r}`, parent: row("db", "ds") })
    const run = harness(notion)
    await run.sync()
    notion.advance(25 * HOUR)
    notion.edit("d200", { trashed: true })
    const { cursor, items } = await timedRuns(notion, run)
    expect(passUnderWay(cursor)).toBe(false)
    expect(items.filter((item) => item.removed).map((item) => item.id)).toEqual(["d200"])
  })

  it("walks a page with 100 child pages from its listing, without reading each child", async () => {
    const notion = new FakeNotion()
    notion.addPage({ id: "hub", title: "Hub", parent: top })
    for (let c = 0; c < 100; c++) notion.addPage({ id: `c${c}`, title: `C${c}`, parent: under("hub") })
    const run = harness(notion)
    await run.sync()
    notion.advance(25 * HOUR)
    notion.edit("c7", { title: "C7 renamed" })
    const retrieved = notion.calls.retrievePage
    const { runs, cursor, items } = await timedRuns(notion, run, { perCall: 350, ms: 30_000 })
    expect(passUnderWay(cursor)).toBe(false)
    expect(runs).toBeLessThan(5)
    expect(notion.calls.retrievePage).toBe(retrieved)
    expect(items).toContainEqual(
      expect.objectContaining({ id: "c7", file: expect.objectContaining({ name: "C7 renamed" }) }),
    )
    expect(items.filter((item) => item.removed)).toEqual([])
  }, 30_000)

  it("starts a listing again when Notion no longer takes its saved position", async () => {
    const notion = workspace()
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    notion.edit("a", { title: "Alpha renamed" })
    const cursor = decodeCursor(run.state().cursor as string)
    const stale = encodeCursor({
      ...cursor,
      pass: {
        next: cursor.mark,
        startedAt: notion.now,
        walk: false,
        tasks: [{ t: "search", kind: "page", start: "c3RhbGU" }],
      },
    })
    const source = notionSource(notion, {
      now: () => notion.now,
      known: () => Object.values(run.state().documents).map((doc) => doc.metadata),
      warn: (warning) => run.warnings.push(warning),
    })
    const page = await source.changes(stale)
    expect(passUnderWay(page.cursor)).toBe(false)
    expect(page.items).toContainEqual(expect.objectContaining({ id: "a" }))
    expect(run.warnings).toContainEqual(expect.objectContaining({ reason: "notion.listing-restarted" }))
  })

  it("refuses a run too short for one step rather than saving nothing and asking again", async () => {
    const notion = workspace()
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    const source = notionSource(notion, {
      now: () => notion.now,
      known: () => Object.values(run.state().documents).map((doc) => doc.metadata),
      deadline: { endsAt: 4_000, ms: 4_000 },
      clock: () => 0,
    })
    await expect(source.changes(run.state().cursor as string)).rejects.toMatchObject({
      code: "timeout",
      details: { reason: "notion.timeout-too-short" },
    })
  })

  it("finishes a workspace walk that a 0.1.0 sync saved halfway", async () => {
    const notion = workspace()
    const run = harness(notion)
    await run.sync()
    notion.advance(HOUR)
    notion.edit("a", { title: "Alpha renamed" })
    const cursor = decodeCursor(run.state().cursor as string)
    const old = encodeCursor({
      ...cursor,
      pass: { next: cursor.mark, startedAt: notion.now, walk: true, tasks: [{ t: "walk", id: WORKSPACE_ROOT }] },
    })
    const source = notionSource(notion, {
      now: () => notion.now,
      known: () => Object.values(run.state().documents).map((doc) => doc.metadata),
    })
    const page = await source.changes(old)
    expect(passUnderWay(page.cursor)).toBe(false)
    expect(page.items).toContainEqual(expect.objectContaining({ id: "a", removed: false }))
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

  it("lists a database and a page a page at a time, as children() lists them whole", async () => {
    const notion = new FakeNotion()
    notion.addDatabase({ id: "db", title: "Rows", parent: top, sources: ["ds", "ds2"] })
    for (let r = 0; r < 250; r++)
      notion.addPage({ id: `r${r}`, title: `R${r}`, parent: row("db", "ds"), created: notion.now + r * 1000 })
    notion.addPage({ id: "other", title: "Other", parent: row("db", "ds2") })
    notion.addPage({ id: "hub", title: "Hub", parent: top })
    for (let c = 0; c < 150; c++) notion.addPage({ id: `c${c}`, title: `C${c}`, parent: under("hub") })
    const source = notionSource(notion, { now: () => notion.now })
    for (const folder of ["db", "hub"]) {
      const ids: string[] = []
      let cursor: string | undefined
      let calls = 0
      do {
        const page = await source.childrenPage?.(folder, cursor)
        ids.push(...(page?.files ?? []).map((file) => file.id))
        cursor = page?.cursor
        calls++
      } while (cursor)
      expect(calls).toBeGreaterThan(1)
      expect(new Set(ids)).toEqual(new Set((await source.children(folder)).map((file) => file.id)))
    }
  })

  it("lists a folder again from its start when Notion no longer takes the saved position (400), once a run", async () => {
    const notion = new FakeNotion()
    notion.addPage({ id: "hub", title: "Hub", parent: top })
    for (let c = 0; c < 150; c++) notion.addPage({ id: `c${c}`, title: `C${c}`, parent: under("hub") })
    const source = notionSource(notion, { now: () => notion.now })
    const refused = () => new CliError("validation_error", "start_cursor is not valid", { status: 400 })
    notion.failNext("blockChildren", refused())
    // On the first page there is no saved position: the 400 is the answer, and nothing counts as gone.
    await expect(source.childrenPage?.("hub")).rejects.toMatchObject({ code: "validation_error" })
    const first = await source.childrenPage?.("hub")
    notion.failNext("blockChildren", refused())
    await expect(source.childrenPage?.("hub", first?.cursor)).rejects.toMatchObject({
      code: "not_found",
      details: { reason: "notion.listing-stale" },
    })
    // The same folder going stale again in this run is a real refusal: listing it over and over would never end.
    notion.failNext("blockChildren", refused())
    await expect(source.childrenPage?.("hub", first?.cursor)).rejects.toMatchObject({ code: "validation_error" })
    await expect(source.childrenPage?.("hub", "not-a-position")).rejects.toMatchObject({ code: "not_found" })
  })

  it("fails on a block inside a page whose children Notion refuses (400) every time, instead of listing it forever", async () => {
    const notion = new FakeNotion()
    notion.addPage({ id: "p", title: "P", parent: top, markdown: "p" })
    notion.blocks.set("col", under("p"))
    notion.addPage({ id: "q", title: "Q", parent: { type: "block_id", block_id: "col" }, markdown: "q" })
    const original = notion.blockChildren.bind(notion)
    notion.blockChildren = async (id: string, start?: string) => {
      if (id === "col")
        throw new CliError("validation_error", "Block type meeting_notes is not supported", { status: 400 })
      return original(id, start)
    }
    const run = harness(notion, { deadline: () => ({ deadline: { endsAt: 45_000, ms: 45_000 }, now: () => 0 }) })
    let failure: unknown
    for (let runs = 0; runs < 50 && !failure; runs++)
      try {
        if ((await run.sync()).complete) break
      } catch (error) {
        failure = error
      }
    expect(failure).toMatchObject({ code: "validation_error" })
  })

  it("keeps the rows of a data source Notion refuses (403) on a rescan", async () => {
    const notion = new FakeNotion()
    notion.addDatabase({ id: "db", title: "DB", parent: top, sources: ["s1", "s2"] })
    for (const ds of ["s1", "s2"])
      for (let r = 0; r < 5; r++) notion.addPage({ id: `${ds}-${r}`, title: `${ds}-${r}`, parent: row("db", ds) })
    const run = harness(notion)
    await run.sync()
    expect([...run.saved.keys()].filter((key) => key.startsWith("s2"))).toHaveLength(5)
    const original = notion.queryDataSource.bind(notion)
    notion.queryDataSource = async (source: string, body: Parameters<FakeNotion["queryDataSource"]>[1]) => {
      if (source === "s2") throw new CliError("permission_error", "may not query", { status: 403 })
      return original(source, body)
    }
    notion.advance(HOUR)
    for (let runs = 0; runs < 10 && !(await run.sync(runs === 0)).complete; runs++);
    expect([...run.saved.keys()].filter((key) => key.startsWith("s2"))).toHaveLength(5)
    expect(run.warnings).toContainEqual(expect.objectContaining({ id: "s2", reason: "notion.left-out" }))
  })

  it("first syncs a 15,000-row database within MCP's 45 s runs, a page of rows per step, with a walk that stays small", async () => {
    const notion = new FakeNotion()
    notion.addDatabase({ id: "db", title: "Big", parent: top, sources: ["ds"] })
    for (let r = 0; r < 15_000; r++)
      notion.addPage({
        id: `r${r}`,
        title: `R${r}`,
        parent: row("db", "ds"),
        created: notion.now - 300 * HOUR + r * 1000,
      })
    // About 3 requests a second, Notion's pace; cli-core ends a run at its deadline.
    let clock = 0
    const timed = new Proxy(notion, {
      get: (target, name, receiver) => {
        const value = Reflect.get(target, name, receiver)
        if (typeof value !== "function" || name === "serverTime") return value
        return (...args: unknown[]) => {
          clock += 350
          if (clock > 45_000) throw new CliError("timeout", "the command did not finish within 45000ms")
          return value.apply(target, args)
        }
      },
    })
    const run = harness(timed, {
      max: 50,
      deadline: () => {
        clock = 0
        return { deadline: { endsAt: 45_000, ms: 45_000 }, now: () => clock }
      },
    })
    let runs = 0
    let deepest = 0
    do {
      runs++
      await run.sync()
      deepest = Math.max(deepest, run.walk()?.stack.length ?? 0)
    } while (run.walk() && runs < 30)
    expect(run.walk()).toBeUndefined()
    expect(runs).toBeGreaterThan(1)
    expect(deepest).toBeLessThanOrEqual(2)
  }, 30_000)

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
      addNested: async () => {
        notion.advance(HOUR)
        notion.addPage({ id: "a3", title: "Added deep", parent: under("a2"), markdown: "new" })
        return { file: "a3", folder: "a2" }
      },
    }
  }))
    it(c.name, c.run)
})
