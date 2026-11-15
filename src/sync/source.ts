import { CliError, isCliError } from "@wirecat/cli-base"
import { type Deadline, deadlineMargin } from "@wirecat/cli-core/background"
import type { DocumentSource, SourceChange, SourceContent, SourceFile } from "@wirecat/cli-core/documents"
import { withoutSignedLinks } from "../notion/links.js"
import type {
  NotionDatabase,
  NotionDataSource,
  NotionList,
  NotionPage,
  NotionParent,
  NotionReads,
  NotionUser,
} from "../notion/reads.js"
import { decodeCursor, encodeCursor, type SyncCursor, type SyncPass, type SyncTask } from "./cursor.js"
import { type FrontMatterValue, frontMatter, frontMatterLines, titleOf } from "./front-matter.js"
import { pageText } from "./markdown.js"

/** The folder that stands for everything the token sees, the scope when no folder is chosen. */
export const WORKSPACE_ROOT = "notion-workspace"

const MINUTE = 60_000
/** Notion rounds `last_edited_time` to the minute; a read this soon after an edit may miss another in that minute. */
export const SETTLE_MS = 3 * MINUTE
export const MIN_OVERLAP_MS = 2 * MINUTE
const DEFAULTS = { overlapMs: 10 * MINUTE, walkEveryMs: 24 * 60 * MINUTE, maxRequests: 2000 }
const PAGE_SIZE = 100

export type NotionKind = "workspace" | "page" | "row" | "database"

export interface NotionIdentity {
  id: string
  name?: string
  /** `author`, `editor`, or `property:<name>` for a people property. */
  role: string
}

export interface NotionMetadata {
  kind: NotionKind
  /** Notion's own parent. `parents` holds the container the sync files it under, which differs for a page in a block. */
  parent?: { type: NotionParent["type"]; id: string }
  dataSources?: { id: string; name: string }[]
  createdBy?: string
  lastEditedBy?: string
  /** Set by `content()` only. */
  frontMatter?: Record<string, FrontMatterValue>
  people?: NotionIdentity[]
  missingBlocks?: number
}

export interface NotionFile extends SourceFile {
  providerMetadata: NotionMetadata
}

/**
 * Every page may hold sub-pages, so every page is a folder; a root must be one too. A row stays a plain file: listing
 * the children of every row would cost a request per row.
 */
export const isNotionFolder = (file: NotionFile) => file.providerMetadata.kind !== "row"

/** A page is a folder and a document at once: the engine walks its children and imports its text. */
export const isNotionDocument = (file: NotionFile) => file.providerMetadata.kind === "page"

/** A page may have an empty title, and every catalog entry needs a name. */
export const UNTITLED = "Untitled"

export interface NotionSourceOptions {
  /** Chosen pages and databases; none means everything the token sees. */
  roots?: string[]
  /**
   * What the sync already holds (the state's documents and folders), to tell a missed page from a deleted one. Read
   * once: a source serves one sync run.
   */
  known?: () => Iterable<NotionFile>
  /** How far back each pass reads before the mark; at least two minutes. */
  overlapMs?: number
  walkEveryMs?: number
  /** Requests one `changes()` call may make before it returns what it has and a cursor to go on from. */
  maxRequests?: number
  /** This computer's clock, for the walk schedule only; Notion's timestamps are never compared with it. */
  now?: () => number
  /** An item or a step left out of this sync, and why; the sync went on without it. */
  warn?: (warning: SyncWarning) => void
  /**
   * The run's hard limit: `changes()` stops before it, less its margin and the slowest request so far, and saves the
   * pass for the next sync. Read on `clock`, the wall clock by default.
   */
  deadline?: Deadline
  clock?: () => number
}

export interface SyncWarning {
  id?: string
  code: CliError["code"]
  /** What happened, as a dotted id: `meta.issues` names it. */
  reason: string
  message: string
  retry_after_ms?: number
}

const parentId = (parent: NotionParent) => {
  switch (parent.type) {
    case "workspace":
      return WORKSPACE_ROOT
    case "page_id":
      return parent.page_id
    case "data_source_id":
      return parent.data_source_id
    case "database_id":
      return parent.database_id
    case "block_id":
      return parent.block_id
  }
}
const minus = (iso: string, ms: number) => new Date(Date.parse(iso) - ms).toISOString()
const later = (a: string | null, b: string | null) => (!a ? b : !b ? a : Date.parse(a) >= Date.parse(b) ? a : b)
const isNotFound = (error: unknown) => isCliError(error) && error.code === "not_found"
/** Answers about one item, not the sync: a linked database view answers 404 by design, a restricted page 403. */
const isItemError = (error: unknown) =>
  isCliError(error) && (error.code === "not_found" || error.code === "permission_error")
const text = (parts: { plain_text: string }[]) => parts.map((part) => part.plain_text).join("")

interface Listing {
  files: NotionFile[]
  /** Known items confirmed deleted, trashed or unshared by a direct read. */
  gone: string[]
  /** Known items that are still there, under another parent. */
  moved: NotionFile[]
}

const OUT_OF_TIME = new Error("the run's deadline is near")

/** Whether a Notion pass is still under way: the next `changes()` goes on with its tasks. */
export const passUnderWay = (token: string | undefined) => token !== undefined && decodeCursor(token).pass !== undefined

export const notionSource = (notion: NotionReads, options: NotionSourceOptions = {}): DocumentSource<NotionFile> => {
  const overlapMs = options.overlapMs ?? DEFAULTS.overlapMs
  if (overlapMs < MIN_OVERLAP_MS) throw new CliError("validation_error", "the sync overlap must be two minutes or more")
  const walkEveryMs = options.walkEveryMs ?? DEFAULTS.walkEveryMs
  const maxRequests = options.maxRequests ?? DEFAULTS.maxRequests
  const roots = options.roots?.length ? options.roots : [WORKSPACE_ROOT]
  const now = options.now ?? Date.now

  const warn = options.warn ?? (() => undefined)
  const clock = options.clock ?? Date.now
  const deadline = options.deadline
  const margin = deadline ? deadlineMargin(deadline) : 0

  let requests = 0
  /** Set while `changes()` runs: a request that could end past the deadline is not sent. */
  let timed = false
  let slowest = 0
  const counted =
    <A extends unknown[], R>(call: (...args: A) => Promise<R>) =>
    async (...args: A) => {
      const started = clock()
      if (timed && deadline && started + slowest + margin >= deadline.endsAt) throw OUT_OF_TIME
      requests++
      try {
        return await call.apply(notion, args)
      } finally {
        slowest = Math.max(slowest, clock() - started)
      }
    }
  const reads: NotionReads = {
    self: counted(notion.self),
    search: counted(notion.search),
    queryDataSource: counted(notion.queryDataSource),
    retrievePage: counted(notion.retrievePage),
    retrieveDatabase: counted(notion.retrieveDatabase),
    retrieveBlock: counted(notion.retrieveBlock),
    blockChildren: counted(notion.blockChildren),
    pageMarkdown: counted(notion.pageMarkdown),
  }

  // The state the engine holds does not change while the source lists, and parsing it costs as much as a request.
  let held: Map<string, NotionFile> | undefined
  let known = new Map<string, NotionFile>()
  // Containers resolved within one call; a page's parent is re-read on the next one, as it may have moved.
  let containers = new Map<string, string>()
  let accessible = new Set<string>()
  let newestSeen = Number.NEGATIVE_INFINITY
  const fresh = () => {
    held ??= new Map([...(options.known?.() ?? [])].map((file) => [file.id, file]))
    known = held
    containers = new Map()
    accessible = new Set(known.keys())
  }
  /** Notion's time: its Date header, or failing that the newest edit it has shown, which is never later than it. */
  const notionNow = () => Math.max(notion.serverTime?.() ?? Number.NEGATIVE_INFINITY, newestSeen)

  /** The container a page sits in: its page or database, or the workspace when that parent is out of the token's view. */
  const containerOf = async (parent: NotionParent): Promise<string> => {
    if (parent.type === "workspace") return WORKSPACE_ROOT
    if (parent.type === "data_source_id" || parent.type === "database_id") return parent.database_id
    const id = parentId(parent)
    const cached = containers.get(id)
    if (cached) return cached
    let container: string
    try {
      if (parent.type === "block_id") container = await containerOf((await reads.retrieveBlock(id)).parent)
      else {
        if (!accessible.has(id)) await reads.retrievePage(id)
        container = id
      }
    } catch (error) {
      if (!isItemError(error)) throw error
      container = WORKSPACE_ROOT
    }
    containers.set(id, container)
    return container
  }

  const versionOf = (edited: string) => {
    newestSeen = Math.max(newestSeen, Date.parse(edited))
    return Date.parse(edited) + SETTLE_MS > notionNow() ? `${edited}~unsettled~${now()}` : edited
  }

  const pageFile = async (page: NotionPage): Promise<NotionFile> => {
    accessible.add(page.id)
    const row = page.parent.type === "data_source_id" || page.parent.type === "database_id"
    return {
      id: page.id,
      name: titleOf(page.properties).trim() || UNTITLED,
      mime: "application/vnd.notion.page",
      parents: [await containerOf(page.parent)],
      version: versionOf(page.last_edited_time),
      modifiedAt: page.last_edited_time,
      createdAt: page.created_time,
      url: page.url,
      trashed: page.in_trash,
      canDownload: true,
      providerMetadata: {
        kind: row ? "row" : "page",
        parent: { type: page.parent.type, id: parentId(page.parent) },
        ...(page.created_by ? { createdBy: page.created_by.id } : {}),
        ...(page.last_edited_by ? { lastEditedBy: page.last_edited_by.id } : {}),
      },
    }
  }

  const databaseFile = async (database: NotionDatabase): Promise<NotionFile> => {
    accessible.add(database.id)
    return {
      id: database.id,
      name: text(database.title).trim() || UNTITLED,
      mime: "application/vnd.notion.database",
      parents: [await containerOf(database.parent)],
      version: database.last_edited_time,
      modifiedAt: database.last_edited_time,
      createdAt: database.created_time,
      url: database.url,
      trashed: database.in_trash,
      canDownload: false,
      providerMetadata: {
        kind: "database",
        parent: { type: database.parent.type, id: parentId(database.parent) },
        dataSources: database.data_sources,
      },
    }
  }

  const workspaceFile = (): NotionFile => ({
    id: WORKSPACE_ROOT,
    name: "Notion workspace",
    mime: "application/vnd.notion.workspace",
    parents: [],
    url: "",
    trashed: false,
    canDownload: false,
    providerMetadata: { kind: "workspace" },
  })

  const retrieve = async (id: string, kind?: NotionKind): Promise<NotionFile> => {
    if (id === WORKSPACE_ROOT) return workspaceFile()
    if (kind === "database") return databaseFile(await reads.retrieveDatabase(id))
    try {
      return await pageFile(await reads.retrievePage(id))
    } catch (error) {
      if (kind || !isCliError(error) || !["not_found", "validation_error"].includes(error.code)) throw error
      return databaseFile(await reads.retrieveDatabase(id))
    }
  }

  /** One `created_time` window of a data source; Notion stops a query at 10,000 rows and says so. */
  const rowWindow = async (database: string, source: string, after: string | undefined, since: string | null) => {
    const filters = [
      ...(since ? [{ timestamp: "last_edited_time" as const, last_edited_time: { on_or_after: since } }] : []),
      ...(after ? [{ timestamp: "created_time" as const, created_time: { on_or_after: after } }] : []),
    ]
    const filter = filters.length > 1 ? { and: filters } : filters[0]
    const rows: NotionPage[] = []
    let incomplete = false
    let start: string | undefined
    do {
      const page = await reads.queryDataSource(source, {
        ...(filter ? { filter } : {}),
        sorts: [{ timestamp: "created_time", direction: "ascending" }],
        page_size: PAGE_SIZE,
        ...(start ? { start_cursor: start } : {}),
      })
      for (const result of page.results) rows.push(result)
      if (page.request_status?.type === "incomplete") incomplete = true
      start = page.has_more && page.next_cursor ? page.next_cursor : undefined
    } while (start)
    let next: string | undefined
    if (incomplete) {
      next = rows.at(-1)?.created_time
      if (!next || next === after)
        throw new CliError("validation_error", `database ${database} has more than 10000 rows created in one minute`, {
          reason: "notion.window-too-dense",
          database,
        })
    }
    return { rows, next }
  }

  /**
   * Every row of a database. A data source Notion will not query is left out with a warning: its rows the sync holds
   * are each read directly before any counts as gone.
   */
  const allRows = async (database: NotionDatabase) => {
    const files = new Map<string, NotionFile>()
    for (const source of database.data_sources) {
      let after: string | undefined
      try {
        do {
          const window = await rowWindow(database.id, source.id, after, null)
          for (const row of window.rows) if (!row.in_trash) files.set(row.id, await pageFile(row))
          after = window.next
        } while (after)
      } catch (error) {
        if (!isItemError(error)) throw error
        warn({
          id: source.id,
          code: (error as CliError).code,
          reason: "notion.left-out",
          message: `a data source of database ${database.id} was left out: Notion would not query it`,
        })
      }
    }
    return [...files.values()]
  }

  const searchPage = (kind: "page" | "data_source", start: string | undefined) =>
    reads.search({
      filter: { property: "object", value: kind },
      sort: { timestamp: "last_edited_time", direction: "descending" },
      page_size: PAGE_SIZE,
      ...(start ? { start_cursor: start } : {}),
    })
  const isCut = (page: NotionList<unknown>) => page.request_status?.type === "incomplete"

  /**
   * Everything search gives, for the top of a walk. Search counts database rows too, so a workspace past 10,000 pages
   * and rows always gets a cut answer; failing here would stop every walk, and with it every deletion check.
   */
  const searchAll = async (kind: "page" | "data_source") => {
    const results: (NotionPage | NotionDataSource)[] = []
    let start: string | undefined
    do {
      const page = await searchPage(kind, start)
      for (const result of page.results) results.push(result)
      start = page.has_more && page.next_cursor ? page.next_cursor : undefined
      if (isCut(page))
        warn({
          code: "provider_error",
          reason: "notion.search-capped",
          message: `Notion's search gave only the ${results.length} most recently edited ${kind}s; a top-level one it left out is found once it is edited`,
        })
    } while (start)
    return results
  }

  /**
   * A database, or why Notion will not give it: `gone` on a 404 (search entries can be stale, a linked view always
   * answers so), `unreadable` on a 403, which says nothing about whether it is still there.
   */
  const readDatabase = async (id: string): Promise<NotionDatabase | "gone" | "unreadable"> => {
    try {
      return await reads.retrieveDatabase(id)
    } catch (error) {
      if (!isItemError(error)) throw error
      if (isNotFound(error)) {
        warn({ id, code: "not_found", reason: "notion.database-unreadable", message: "a database could not be read" })
        return "gone"
      }
      warn({
        id,
        code: (error as CliError).code,
        reason: "notion.kept-unconfirmed",
        message: "kept as it was: Notion would not show the database",
      })
      return "unreadable"
    }
  }
  const isGone = (database: NotionDatabase | "gone" | "unreadable") =>
    database === "gone" || (database !== "unreadable" && database.in_trash)

  const childPages = async (blockId: string, found: { pages: string[]; databases: string[] }) => {
    let start: string | undefined
    do {
      let page: Awaited<ReturnType<NotionReads["blockChildren"]>>
      try {
        page = await reads.blockChildren(blockId, start)
      } catch (error) {
        // The known children it hides are read one by one before any counts as gone.
        if (!isItemError(error)) throw error
        warn({
          id: blockId,
          code: (error as CliError).code,
          reason: "notion.left-out",
          message: "the blocks inside were left out of this sync: Notion would not list them",
        })
        return found
      }
      for (const block of page.results) {
        if (block.in_trash) continue
        if (block.type === "child_page") found.pages.push(block.id)
        else if (block.type === "child_database") found.databases.push(block.id)
        else if (block.has_children) await childPages(block.id, found)
      }
      start = page.has_more && page.next_cursor ? page.next_cursor : undefined
    } while (start)
    return found
  }

  const listed = async (id: string): Promise<NotionFile[]> => {
    if (id === WORKSPACE_ROOT) {
      const pages = (await searchAll("page")) as NotionPage[]
      const sources = (await searchAll("data_source")) as NotionDataSource[]
      for (const page of pages) accessible.add(page.id)
      const databases = new Map<string, NotionDatabase>()
      for (const source of sources) {
        const id = source.parent.database_id
        accessible.add(id)
        if (databases.has(id) || source.in_trash) continue
        const database = await readDatabase(id)
        if (typeof database === "object") databases.set(id, database)
      }
      const files: NotionFile[] = []
      for (const page of pages) if (!page.in_trash) files.push(await pageFile(page))
      for (const database of databases.values()) if (!database.in_trash) files.push(await databaseFile(database))
      return files.filter((file) => file.parents[0] === WORKSPACE_ROOT)
    }
    const kind = known.get(id)?.providerMetadata.kind ?? (await retrieve(id)).providerMetadata.kind
    if (kind === "database") {
      const database = await readDatabase(id)
      return typeof database === "object" ? allRows(database) : []
    }
    if (kind === "row") return []
    const found = await childPages(id, { pages: [], databases: [] })
    const files: NotionFile[] = []
    const child = async (id: string, read: () => Promise<NotionFile>) => {
      try {
        const file = await read()
        if (!file.trashed) files.push(file)
      } catch (error) {
        if (!isItemError(error)) throw error
        warn({
          id,
          code: (error as CliError).code,
          reason: "notion.child-unreadable",
          message: "a child Notion would not give was left out",
        })
      }
    }
    for (const page of found.pages) await child(page, async () => pageFile(await reads.retrievePage(page)))
    for (const database of found.databases)
      await child(database, async () => databaseFile(await reads.retrieveDatabase(database)))
    return files
  }

  /** Known items missing from a listing, each read directly: gone only on 404 or the trash, kept on any doubt. */
  const confirm = async (missing: NotionFile[], container: string, listing: Listing) => {
    for (const file of missing) {
      try {
        const current = await retrieve(file.id, file.providerMetadata.kind)
        if (current.trashed) listing.gone.push(file.id)
        else if (current.parents[0] === container) listing.files.push(current)
        else listing.moved.push(current)
      } catch (error) {
        if (isNotFound(error)) listing.gone.push(file.id)
        else if (isItemError(error)) {
          listing.files.push(file)
          warn({
            id: file.id,
            code: (error as CliError).code,
            reason: "notion.kept-unconfirmed",
            message: "kept as it was: Notion would not say",
          })
        } else throw error
      }
    }
  }

  /** A container's children, with every known child that did not come back checked directly before it counts as gone. */
  const listChildren = async (id: string): Promise<Listing> => {
    const listing: Listing = { files: await listed(id), gone: [], moved: [] }
    const seen = new Set(listing.files.map((file) => file.id))
    await confirm(
      [...known.values()].filter((file) => file.parents[0] === id && !seen.has(file.id)),
      id,
      listing,
    )
    return listing
  }

  const sourcesInScope = (cursor: SyncCursor) => {
    const sources = new Map(cursor.sources.map((item) => [item.source, item]))
    for (const file of known.values())
      for (const source of file.providerMetadata.dataSources ?? [])
        sources.set(source.id, { database: file.id, source: source.id })
    return [...sources.values()]
  }

  const startPass = (cursor: SyncCursor): SyncPass => {
    const walk = now() - cursor.walkedAt >= walkEveryMs
    if (walk && roots.includes(WORKSPACE_ROOT)) {
      // The workspace is listed by search a page at a time, so that a walk too long for one run goes on in the next.
      const top = [...known.values()].filter((file) => file.parents[0] === WORKSPACE_ROOT).map((file) => file.id)
      const tasks: SyncTask[] = [
        { t: "search", kind: "page", full: true },
        { t: "search", kind: "data_source", full: true },
        ...roots.filter((id) => id !== WORKSPACE_ROOT).map((id) => ({ t: "walk" as const, id })),
        { t: "confirm", container: WORKSPACE_ROOT, ids: top },
      ]
      return { next: cursor.mark, startedAt: now(), walk, tasks }
    }
    const tasks: SyncTask[] = [
      { t: "search", kind: "page" },
      { t: "search", kind: "data_source" },
      ...(walk
        ? roots.map((id) => ({ t: "walk" as const, id }))
        : sourcesInScope(cursor).map((item) => ({ t: "rows" as const, ...item }))),
    ]
    return { next: cursor.mark, startedAt: now(), walk, tasks }
  }

  const changes = async (token: string) => {
    const cursor = decodeCursor(token)
    fresh()
    requests = 0
    const pass = cursor.pass ?? startPass(cursor)
    const since = cursor.mark ? minus(cursor.mark, overlapMs) : null
    const items = new Map<string, SourceChange<NotionFile>>()
    const emit = (file: NotionFile) => items.set(file.id, { id: file.id, removed: false, file })
    const gone = (id: string) => items.set(id, { id, removed: true })
    // The engine walks every folder it is sent, all its rows, so a database it already holds is not sent again.
    const unheld = (file: NotionFile) => {
      const before = known.get(file.id)
      return !before || before.name !== file.name || before.parents[0] !== file.parents[0]
    }
    let confirmed = 0
    // A confirm task stays last: it reads directly only what the rest of the pass did not show.
    const queue = (task: SyncTask) => {
      const last = pass.tasks.at(-1)
      if (last?.t === "confirm") pass.tasks.splice(-1, 0, task)
      else pass.tasks.push(task)
    }
    const shown = (id: string) => {
      for (const task of pass.tasks) if (task.t === "confirm") task.ids = task.ids.filter((item) => item !== id)
    }
    const addSource = (database: string, source: string) => {
      if (!cursor.sources.some((item) => item.source === source)) cursor.sources.push({ database, source })
    }

    // One page of the answer per task, so that a pass cut short by the deadline goes on from the page it reached.
    const search = async (task: Extract<SyncTask, { t: "search" }>) => {
      const { kind } = task
      const page = await searchPage(kind, task.start)
      let start = page.has_more && page.next_cursor ? page.next_cursor : undefined
      if (task.full) {
        await searchTop(page)
        if (isCut(page))
          warn({
            code: "provider_error",
            reason: "notion.search-capped",
            message: `Notion's search gave only the most recently edited ${kind}s; a top-level one it left out is found once it is edited`,
          })
        if (start) pass.tasks.splice(1, 0, { ...task, start })
        return
      }
      let reachedMark = false
      for (const result of page.results) {
        if (since && Date.parse(result.last_edited_time) < Date.parse(since)) {
          start = undefined
          reachedMark = true
          break
        }
        // Only what this pass saw before it began counts towards the next mark; later edits must stay inside it.
        if (kind === "page") pass.next = later(pass.next, result.last_edited_time)
        if (result.object === "page") {
          emit(await pageFile(result))
          continue
        }
        const id = result.parent.database_id
        // A database outside the chosen folders is not read; one inside them is held already, or comes by a walk.
        if (!roots.includes(WORKSPACE_ROOT) && !known.has(id)) continue
        if (!pass.tasks.some((item) => item.t === "database" && item.id === id)) queue({ t: "database", id })
      }
      // Search has no time filter to split a cut answer by, so edits past the cut fail the sync instead of passing.
      if (isCut(page) && !reachedMark)
        throw new CliError("provider_error", `Notion cut the search for edited ${kind}s short`, {
          reason: "notion.search-incomplete",
          ...(page.request_status?.incomplete_reason
            ? { incomplete_reason: page.request_status.incomplete_reason }
            : {}),
        })
      if (start) pass.tasks.splice(1, 0, { t: "search", kind, start })
    }

    const searchTop = async (page: NotionList<NotionPage | NotionDataSource>) => {
      for (const result of page.results) {
        if (result.in_trash) continue
        if (result.object === "data_source") {
          const id = result.parent.database_id
          const queued = pass.tasks.find((item) => item.t === "database" && item.id === id)
          if (queued?.t === "database") queued.walk = true
          else queue({ t: "database", id, walk: true })
          continue
        }
        pass.next = later(pass.next, result.last_edited_time)
        if (result.parent.type !== "workspace") continue
        const file = await pageFile(result)
        shown(file.id)
        if (changedPage(file)) emit(file)
        queue({ t: "walk", id: file.id })
      }
    }

    const database = async (task: Extract<SyncTask, { t: "database" }>) => {
      const found = await readDatabase(task.id)
      if (typeof found !== "object") return
      const file = await databaseFile(found)
      if (file.trashed) gone(task.id)
      else if (unheld(file)) emit(file)
      if (task.walk && !file.trashed && file.parents[0] === WORKSPACE_ROOT) {
        shown(file.id)
        queue({ t: "walk", id: file.id })
      }
    }

    const confirmEach = async (task: Extract<SyncTask, { t: "confirm" }>) => {
      while (task.ids.length) {
        const file = known.get(task.ids[0] as string)
        if (file) {
          const listing: Listing = { files: [], gone: [], moved: [] }
          await confirm([file], task.container, listing)
          for (const found of [...listing.files, ...listing.moved]) if (unheld(found)) emit(found)
          for (const id of listing.gone) gone(id)
        }
        task.ids.shift()
        confirmed++
      }
    }

    const rows = async (task: Extract<SyncTask, { t: "rows" }>) => {
      let window: Awaited<ReturnType<typeof rowWindow>>
      try {
        window = await rowWindow(task.database, task.source, task.after, task.full ? null : since)
      } catch (error) {
        if (!isNotFound(error)) throw error
        cursor.sources = cursor.sources.filter((item) => item.source !== task.source)
        if (isGone(await readDatabase(task.database))) gone(task.database)
        return
      }
      const seen = new Set<string>()
      for (const row of window.rows) {
        seen.add(row.id)
        emit(await pageFile(row))
      }
      if (task.full) {
        // A window covers the rows created from its start up to the next window's start; a known row of that span
        // the window did not return is read directly before it counts as gone.
        const from = task.after ? Date.parse(task.after) : Number.NEGATIVE_INFINITY
        const to = window.next ? Date.parse(window.next) : Number.POSITIVE_INFINITY
        const missing = [...known.values()].filter((file) => {
          const created = Date.parse(file.createdAt ?? "")
          return (
            file.providerMetadata.kind === "row" &&
            file.providerMetadata.parent?.id === task.source &&
            !seen.has(file.id) &&
            created >= from &&
            created < to
          )
        })
        const listing: Listing = { files: [], gone: [], moved: [] }
        await confirm(missing, task.database, listing)
        for (const file of [...listing.files, ...listing.moved]) emit(file)
        for (const id of listing.gone) gone(id)
      }
      if (window.next) queue({ ...task, after: window.next })
    }

    const walkDatabase = async (id: string) => {
      const database = await readDatabase(id)
      if (database === "unreadable") return
      if (database === "gone" || database.in_trash) {
        if (!roots.includes(id)) gone(id)
        return
      }
      for (const source of database.data_sources) {
        addSource(id, source.id)
        queue({ t: "rows", database: id, source: source.id, full: true })
      }
    }

    // The engine walks again every folder it is sent, so a held page is sent only when Notion changed it.
    const changedPage = (file: NotionFile) => unheld(file) || known.get(file.id)?.version !== file.version

    const walk = async (id: string) => {
      const kind =
        id === WORKSPACE_ROOT
          ? "workspace"
          : (known.get(id)?.providerMetadata.kind ?? (await retrieve(id)).providerMetadata.kind)
      if (kind === "database") return walkDatabase(id)
      if (kind === "row") return
      const listing = await listChildren(id)
      for (const file of listing.moved) emit(file)
      for (const file of listing.files) {
        const page = file.providerMetadata.kind === "page"
        if (page ? changedPage(file) : unheld(file)) emit(file)
        if (page || file.providerMetadata.kind === "database") queue({ t: "walk", id: file.id })
      }
      for (const gid of listing.gone) gone(gid)
    }

    let done = 0
    timed = true
    try {
      while (pass.tasks.length && requests < maxRequests) {
        const task = pass.tasks[0] as SyncTask
        try {
          if (task.t === "search") await search(task)
          else if (task.t === "database") await database(task)
          else if (task.t === "confirm") await confirmEach(task)
          else if (task.t === "rows") await rows(task)
          else await walk(task.id)
        } catch (error) {
          // The task is done again from its start next time: what it emitted is sent twice, which the engine allows.
          if (error === OUT_OF_TIME) {
            // cli-core ends the command at the deadline, so a run that saves nothing would only be asked again.
            if (!done && !confirmed)
              throw new CliError(
                "timeout",
                "the time left was too short for one step of the Notion sync; run it again with a longer --timeout",
                { reason: "notion.timeout-too-short" },
              )
            break
          }
          const failure = isCliError(error) ? error : new CliError("provider_error", String(error))
          const id =
            task.t === "rows" ? task.database : task.t === "database" || task.t === "walk" ? task.id : undefined
          if (isItemError(failure)) {
            warn({
              ...(id ? { id } : {}),
              code: failure.code,
              reason: "notion.left-out",
              message: `left out of this sync: ${failure.message}`,
            })
            pass.tasks.shift()
            done++
            continue
          }
          // With nothing done yet the error is the answer; otherwise the work so far is kept and the next sync goes on.
          if (!done) throw failure
          warn({
            ...(id ? { id } : {}),
            code: failure.code,
            reason: "notion.stopped-early",
            message: `the sync stopped here and goes on next time: ${failure.message}`,
            ...(typeof failure.details.retry_after_ms === "number"
              ? { retry_after_ms: failure.details.retry_after_ms }
              : {}),
          })
          break
        }
        pass.tasks.shift()
        done++
      }
    } finally {
      timed = false
    }
    if (pass.tasks.length) cursor.pass = pass
    else {
      cursor.mark = later(cursor.mark, pass.next)
      if (pass.walk) cursor.walkedAt = pass.startedAt
      delete cursor.pass
    }
    return { items: [...items.values()], cursor: encodeCursor(cursor) }
  }

  const people = (page: NotionPage): NotionIdentity[] => {
    const found = new Map<string, NotionIdentity>()
    const add = (user: NotionUser | undefined, role: string) => {
      if (user) found.set(`${role}:${user.id}`, { id: user.id, ...(user.name ? { name: user.name } : {}), role })
    }
    add(page.created_by, "author")
    add(page.last_edited_by, "editor")
    for (const [name, value] of Object.entries(page.properties))
      if (value.type === "people") for (const user of value.people) add(user, `property:${name}`)
    return [...found.values()]
  }

  const content = async (id: string, maxChars?: number): Promise<SourceContent<NotionFile>> => {
    containers = new Map()
    const page = await reads.retrievePage(id)
    if (page.in_trash) throw new CliError("not_found", "the page is in Notion's trash")
    const file = await pageFile(page)
    const body = await pageText(reads, id, (block, code) => {
      if (code === "permission_error")
        warn({
          id: block,
          code,
          reason: "notion.left-out",
          message: `a block of page ${id} was left out of its text: the token may not read it`,
        })
    })
    const fields = frontMatter(page.properties)
    const metadata: NotionFile = {
      ...file,
      providerMetadata: {
        ...file.providerMetadata,
        frontMatter: fields,
        people: people(page),
        ...(body.missing ? { missingBlocks: body.missing } : {}),
      },
    }
    const searchable = [file.name, ...frontMatterLines(fields), body.markdown].filter(Boolean).join("\n\n")
    if (maxChars !== undefined && searchable.length > maxChars)
      throw new CliError("validation_error", "the page is longer than the text limit", {
        reason: "source.text-limit",
        text_limit: maxChars,
      })
    return { metadata, markdown: body.markdown, text: withoutSignedLinks(searchable).text, tabs: [] }
  }

  let account: Promise<string> | undefined
  const identity = async () => {
    const self = await reads.self()
    if (!self.bot?.workspace_id)
      throw new CliError("invalid_response", "Notion did not name the token's workspace", {
        reason: "notion.no-workspace",
      })
    return `${self.bot.workspace_id}:${self.id}`
  }

  return {
    // One sync run asks once: the CLI checks the account before it takes the lock, and the engine asks again.
    identity() {
      account ??= identity()
      return account
    },
    async metadata(id) {
      fresh()
      return retrieve(id, known.get(id)?.providerMetadata.kind)
    },
    async children(id) {
      fresh()
      return (await listChildren(id)).files
    },
    async startToken() {
      const top = await reads.search({
        filter: { property: "object", value: "page" },
        sort: { timestamp: "last_edited_time", direction: "descending" },
        page_size: 1,
      })
      const cursor: SyncCursor = { v: 1, mark: top.results[0]?.last_edited_time ?? null, walkedAt: now(), sources: [] }
      return encodeCursor(cursor)
    },
    changes,
    content,
    // A page has no file of its own; its Markdown is the nearest thing to one.
    bytes: async (id) => new TextEncoder().encode((await content(id)).markdown),
  }
}
