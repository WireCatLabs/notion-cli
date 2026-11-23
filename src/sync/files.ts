import type { CliError } from "@wirecat/cli-base"
import type { Deadline } from "@wirecat/cli-core/background"
import type { SourceFile } from "@wirecat/cli-core/documents"
import type { NotionParent } from "../notion/reads.js"
import type { FrontMatterValue } from "./front-matter.js"

/** The folder that stands for everything the token sees, the scope when no folder is chosen. */
export const WORKSPACE_ROOT = "notion-workspace"

export const parentId = (parent: NotionParent) => {
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

export type NotionKind = "workspace" | "page" | "row" | "database"

export interface NotionIdentity {
  id: string
  name?: string
  /** Only for an author or editor, and only when the connection may read email addresses. */
  email?: string
  bot?: boolean
  /** `author`, `editor`, or `property:<name>` for a people property. */
  role: string
}

/** What the connection may read of users, as the first lookup in a run found it. */
export type UserAccess = "none" | "names" | "emails"

/** A page's comments were read, or the connection may not read comments. */
export type CommentAccess = "read" | "refused"

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
  /** What the read could learn of its authors; a page read before 0.6.0 has none and is read again. */
  authors?: UserAccess
  missingBlocks?: number
  /** Whether the read could list the page's comments; a page read before 0.8.0 has none and is read again. */
  comments?: CommentAccess
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

export const workspaceFile = (): NotionFile => ({
  id: WORKSPACE_ROOT,
  name: "Notion workspace",
  mime: "application/vnd.notion.workspace",
  parents: [],
  url: "",
  trashed: false,
  canDownload: false,
  providerMetadata: { kind: "workspace" },
})

export interface NotionSourceOptions {
  /** Chosen pages and databases; none means everything the token sees. */
  roots?: string[]
  /**
   * What the sync already holds (the state's documents and folders), to tell a missed page from a deleted one. Read
   * once: a source serves one sync run.
   */
  known?: () => Iterable<NotionFile>
  /**
   * What the sync has met but does not hold yet: the folders and files of a walk an earlier run stopped, and the pending
   * plan. Only their kind and that the token reached them count, so a later run does not ask Notion again. Read once.
   */
  reached?: () => Iterable<NotionFile>
  /**
   * What the connection may read of users now, as the last run learned it: a page read with less is read again for
   * its authors (src/sync/from-config.ts).
   */
  access?: () => UserAccess | undefined
  /** How far back each pass reads before the mark; at least two minutes. */
  overlapMs?: number
  walkEveryMs?: number
  /** Requests one `changes()` call may make before it returns what it has and a cursor to go on from. */
  maxRequests?: number
  /** This computer's clock, for the walk schedule only; Notion's timestamps are never compared with it. */
  now?: () => number
  /** Called once a run has learned what it may read of users. */
  userAccess?: (access: UserAccess) => void
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

export interface Listing {
  files: NotionFile[]
  /** Known items confirmed deleted, trashed or unshared by a direct read. */
  gone: string[]
  /** Known items that are still there, under another parent. */
  moved: NotionFile[]
}

/** A database's data sources as a set, as Notion may list them in any order. */
export const sourceIds = (file: NotionFile | undefined) =>
  file?.providerMetadata.dataSources
    ?.map((item) => item.id)
    .sort()
    .join()
