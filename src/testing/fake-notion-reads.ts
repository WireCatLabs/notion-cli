import { CliError } from "@wirecat/cli-base"
import type {
  NotionBlock,
  NotionDatabase,
  NotionDataSource,
  NotionList,
  NotionPage,
  NotionPageMarkdown,
  NotionParent,
  NotionPropertyValue,
  NotionQueryRequest,
  NotionReads,
  NotionSearchRequest,
  NotionSelf,
  NotionTimestampFilter,
} from "../notion/reads.js"

/**
 * An in-memory Notion that answers the read port as the API reference describes it and refuses what Notion refuses.
 * Times are kept exact and served rounded down to the minute, as Notion serves them.
 */

const MINUTE = 60_000
const MAX_PAGE_SIZE = 100
const QUERY_CAP = 10_000

export interface FakePage {
  id: string
  title: string
  parent: NotionParent
  created: number
  edited: number
  trashed?: boolean
  /** False once the page is unshared from the token or deleted for good: Notion then answers 404. */
  shared?: boolean
  /** Listed among its parent's children, yet a read of it answers 404, as a linked database view does. */
  unreadable?: boolean
  markdown?: string
  /** Blocks the Markdown answer leaves out as `<unknown/>`; null is a block the token may not see. */
  unknown?: Record<string, string | null>
  properties?: Record<string, NotionPropertyValue>
  createdBy?: string
  editedBy?: string
}

export interface FakeDatabase {
  id: string
  title: string
  parent: NotionParent
  created: number
  edited: number
  sources: string[]
  trashed?: boolean
  shared?: boolean
  unreadable?: boolean
  /** Shared, yet the token may not read it: Notion answers 403. */
  restricted?: boolean
}

type Method = Exclude<keyof NotionReads, "serverTime">

const notFound = (what: string) => new CliError("not_found", `Could not find ${what}`, { status: 404 })
const invalid = (message: string) => new CliError("validation_error", message, { status: 400 })
const iso = (ms: number) => new Date(Math.floor(ms / MINUTE) * MINUTE).toISOString()

export class FakeNotion implements NotionReads {
  now: number
  readonly pages = new Map<string, FakePage>()
  readonly databases = new Map<string, FakeDatabase>()
  /** Plain blocks (columns, toggles) that hold child pages, by id, with their parent. */
  readonly blocks = new Map<string, NotionParent>()
  /** Pages search leaves out, as Notion's own docs say it may. */
  readonly hiddenFromSearch = new Set<string>()
  /** Results after which search says `request_status: incomplete`, as Notion does at 10,000. */
  searchCap = QUERY_CAP
  /** Whether answers carry a Date header; without one the sync has only Notion's timestamps to go by. */
  dateHeader = true
  readonly calls: Record<Method, number> = {
    self: 0,
    search: 0,
    queryDataSource: 0,
    retrievePage: 0,
    retrieveDatabase: 0,
    retrieveBlock: 0,
    blockChildren: 0,
    pageMarkdown: 0,
  }
  readonly log: { method: Method; id?: string }[] = []
  private readonly failures: { method: Method; error: Error; id?: string }[] = []
  private sortedRows = new Map<string, FakePage[]>()

  constructor(now = Date.parse("2026-11-14T10:00:30.000Z")) {
    this.now = now
  }

  advance(ms: number) {
    this.now += ms
  }

  addPage(page: Omit<FakePage, "created" | "edited"> & { created?: number; edited?: number }) {
    const full = { created: this.now, edited: this.now, shared: true, ...page }
    this.pages.set(page.id, full)
    this.sortedRows.clear()
    return full
  }

  addDatabase(database: Omit<FakeDatabase, "created" | "edited"> & { created?: number }) {
    const full = { created: this.now, edited: this.now, shared: true, ...database }
    this.databases.set(database.id, full)
    return full
  }

  edit(id: string, change: Partial<FakePage> = {}) {
    const page = this.page(id)
    Object.assign(page, change, { edited: this.now })
    this.sortedRows.clear()
  }

  /** The next call of `method` (for that `id`, if given) fails with `error`. */
  failNext(method: Method, error: Error, id?: string) {
    this.failures.push({ method, error, ...(id ? { id } : {}) })
  }

  private enter(method: Method, id?: string) {
    this.calls[method]++
    this.log.push({ method, ...(id ? { id } : {}) })
    const index = this.failures.findIndex(
      (failure) => failure.method === method && (failure.id === undefined || failure.id === id),
    )
    if (index >= 0) {
      const [failure] = this.failures.splice(index, 1)
      throw failure?.error
    }
  }

  page(id: string) {
    const page = this.pages.get(id)
    if (!page) throw new Error(`fake has no page ${id}`)
    return page
  }

  private visible(page: FakePage | FakeDatabase | undefined) {
    return page !== undefined && page.shared !== false
  }

  private readable(page: FakePage | FakeDatabase | undefined) {
    return this.visible(page) && !page?.unreadable
  }

  serverTime() {
    return this.dateHeader && this.log.length ? this.now : undefined
  }

  private pageJson(page: FakePage): NotionPage {
    return {
      object: "page",
      id: page.id,
      created_time: iso(page.created),
      last_edited_time: iso(page.edited),
      ...(page.createdBy ? { created_by: { object: "user", id: page.createdBy } } : {}),
      ...(page.editedBy ? { last_edited_by: { object: "user", id: page.editedBy } } : {}),
      in_trash: page.trashed ?? false,
      parent: page.parent,
      url: `https://www.notion.so/${page.id.replaceAll("-", "")}`,
      properties: {
        ...page.properties,
        Name: { id: "title", type: "title", title: [{ plain_text: page.title }] },
      },
    }
  }

  private databaseJson(database: FakeDatabase): NotionDatabase {
    return {
      object: "database",
      id: database.id,
      title: [{ plain_text: database.title }],
      parent: database.parent,
      created_time: iso(database.created),
      last_edited_time: iso(database.edited),
      in_trash: database.trashed ?? false,
      url: `https://www.notion.so/${database.id.replaceAll("-", "")}`,
      data_sources: database.sources.map((id) => ({ id, name: database.title })),
    }
  }

  private paginate<T>(key: string, items: T[], request: { start_cursor?: string; page_size?: number }) {
    const size = request.page_size ?? MAX_PAGE_SIZE
    if (!Number.isInteger(size) || size < 1 || size > MAX_PAGE_SIZE) throw invalid("page_size must be 1 to 100")
    let offset = 0
    if (request.start_cursor) {
      const [owner, at] = Buffer.from(request.start_cursor, "base64url").toString().split("|")
      if (owner !== key) throw invalid("start_cursor does not belong to this request")
      offset = Number(at)
    }
    const results = items.slice(offset, offset + size)
    const more = offset + size < items.length
    return {
      results,
      has_more: more,
      next_cursor: more ? Buffer.from(`${key}|${offset + size}`).toString("base64url") : null,
    }
  }

  async self(): Promise<NotionSelf> {
    this.enter("self")
    return { object: "user", id: "bot-1", type: "bot", bot: { workspace_id: "ws-1", owner: { type: "user" } } }
  }

  async search(request: NotionSearchRequest): Promise<NotionList<NotionPage | NotionDataSource>> {
    this.enter("search")
    if (!["page", "data_source"].includes(request.filter?.value))
      throw invalid('filter.value should be "page" or "data_source"')
    if (request.sort?.timestamp !== "last_edited_time") throw invalid("search sorts only by last_edited_time")
    const descending = request.sort.direction === "descending"
    const order = (a: { edited: number; id: string }, b: { edited: number; id: string }) =>
      (descending ? -1 : 1) * (Math.floor(a.edited / MINUTE) - Math.floor(b.edited / MINUTE)) ||
      a.id.localeCompare(b.id)
    let items: (FakePage | NotionDataSource)[]
    if (request.filter.value === "page") {
      items = [...this.pages.values()]
        .filter((page) => this.visible(page) && !page.trashed && !this.hiddenFromSearch.has(page.id))
        .sort(order)
    } else {
      items = [...this.databases.values()]
        .filter((database) => this.visible(database) && !database.trashed)
        .sort(order)
        .flatMap((database) =>
          database.sources.map(
            (id): NotionDataSource => ({
              object: "data_source",
              id,
              parent: { type: "database_id", database_id: database.id },
              last_edited_time: iso(database.edited),
              in_trash: false,
            }),
          ),
        )
    }
    const capped = items.length > this.searchCap
    const page = this.paginate(
      `search:${JSON.stringify([request.filter, request.sort])}`,
      items.slice(0, this.searchCap),
      request,
    )
    return {
      ...page,
      results: page.results.map((item) => ("object" in item ? item : this.pageJson(item))),
      request_status: capped
        ? { type: "incomplete", incomplete_reason: "query_result_limit_reached" }
        : { type: "complete" },
    }
  }

  private matches(filter: NonNullable<NotionQueryRequest["filter"]>, page: FakePage): boolean {
    if ("and" in filter) return filter.and.every((part) => this.matches(part, page))
    const condition = filter as NotionTimestampFilter & Record<string, unknown>
    if ("property" in condition) throw invalid("a timestamp filter takes no property name")
    const keys = Object.keys(condition).sort().join(",")
    if (keys !== ["timestamp", condition.timestamp].sort().join(","))
      throw invalid("a timestamp filter names one timestamp")
    const bound =
      condition.timestamp === "last_edited_time"
        ? condition.last_edited_time.on_or_after
        : (condition as { created_time: { on_or_after: string } }).created_time.on_or_after
    const value = condition.timestamp === "last_edited_time" ? page.edited : page.created
    return Math.floor(value / MINUTE) * MINUTE >= Date.parse(bound)
  }

  async queryDataSource(id: string, request: NotionQueryRequest): Promise<NotionList<NotionPage>> {
    this.enter("queryDataSource", id)
    const database = [...this.databases.values()].find((item) => item.sources.includes(id))
    if (!database || !this.visible(database)) throw notFound(`data source ${id}`)
    const sort = request.sorts?.[0]
    if (sort && sort.timestamp !== "created_time") throw new Error("fake sorts rows by created_time only")
    let rows = this.sortedRows.get(id)
    if (!rows) {
      rows = [...this.pages.values()]
        .filter((page) => page.parent.type === "data_source_id" && page.parent.data_source_id === id)
        .sort((a, b) => a.created - b.created || a.id.localeCompare(b.id))
      this.sortedRows.set(id, rows)
    }
    const matching = rows.filter(
      (page) => this.visible(page) && !page.trashed && (!request.filter || this.matches(request.filter, page)),
    )
    const capped = matching.length > QUERY_CAP
    const page = this.paginate(
      `query:${id}:${JSON.stringify([request.filter, request.sorts])}`,
      matching.slice(0, QUERY_CAP),
      request,
    )
    return {
      ...page,
      results: page.results.map((row) => this.pageJson(row)),
      ...(capped
        ? { request_status: { type: "incomplete", incomplete_reason: "query_result_limit_reached" } }
        : { request_status: { type: "complete" } }),
    }
  }

  async retrievePage(id: string): Promise<NotionPage> {
    this.enter("retrievePage", id)
    if (this.databases.has(id)) throw invalid(`${id} is a database, not a page`)
    const page = this.pages.get(id)
    if (!page || !this.readable(page)) throw notFound(`page ${id}`)
    return this.pageJson(page)
  }

  async retrieveDatabase(id: string): Promise<NotionDatabase> {
    this.enter("retrieveDatabase", id)
    const database = this.databases.get(id)
    if (!database || !this.readable(database)) throw notFound(`database ${id}`)
    if (database.restricted) throw new CliError("permission_error", `may not read database ${id}`, { status: 403 })
    return this.databaseJson(database)
  }

  async retrieveBlock(id: string): Promise<NotionBlock> {
    this.enter("retrieveBlock", id)
    const parent = this.blocks.get(id)
    if (!parent) throw notFound(`block ${id}`)
    return { object: "block", id, type: "column", has_children: true, parent }
  }

  async blockChildren(id: string, startCursor?: string): Promise<NotionList<NotionBlock>> {
    this.enter("blockChildren", id)
    const page = this.pages.get(id)
    if (page && !this.visible(page)) throw notFound(`block ${id}`)
    if (!page && !this.blocks.has(id)) throw notFound(`block ${id}`)
    const under = (parent: NotionParent) =>
      (parent.type === "page_id" && parent.page_id === id) || (parent.type === "block_id" && parent.block_id === id)
    const parent: NotionParent = page ? { type: "page_id", page_id: id } : { type: "block_id", block_id: id }
    const children: NotionBlock[] = [
      ...[...this.blocks.entries()]
        .filter(([, owner]) => under(owner))
        .map(([block]): NotionBlock => ({ object: "block", id: block, type: "column", has_children: true, parent })),
      ...[...this.pages.values()]
        .filter((child) => under(child.parent) && child.shared !== false)
        .map(
          (child): NotionBlock => ({
            object: "block",
            id: child.id,
            type: "child_page",
            has_children: true,
            in_trash: child.trashed ?? false,
            parent,
            child_page: { title: child.title },
          }),
        ),
      ...[...this.databases.values()]
        .filter((child) => under(child.parent) && child.shared !== false)
        .map(
          (child): NotionBlock => ({
            object: "block",
            id: child.id,
            type: "child_database",
            has_children: false,
            in_trash: child.trashed ?? false,
            parent,
            child_database: { title: child.title },
          }),
        ),
    ]
    return this.paginate(`children:${id}`, children, { ...(startCursor ? { start_cursor: startCursor } : {}) })
  }

  async pageMarkdown(id: string): Promise<NotionPageMarkdown> {
    this.enter("pageMarkdown", id)
    const page = this.pages.get(id)
    if (page) {
      if (!this.visible(page)) throw notFound(`page ${id}`)
      const unknown = Object.keys(page.unknown ?? {})
      return {
        markdown: page.markdown ?? `# ${page.title}`,
        truncated: unknown.length > 0,
        unknown_block_ids: unknown,
      }
    }
    for (const owner of this.pages.values()) {
      const part = owner.unknown?.[id]
      if (part === undefined) continue
      if (part === null || !this.visible(owner)) throw notFound(`block ${id}`)
      return { markdown: part, truncated: false, unknown_block_ids: [] }
    }
    throw notFound(`block ${id}`)
  }
}
