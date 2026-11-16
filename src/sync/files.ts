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
