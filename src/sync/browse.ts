import { CliError } from "@wirecat/cli-base"
import type { DocumentSource } from "@wirecat/cli-core/documents"
import { type BrowsePosition, decodeBrowsePosition, encodeBrowsePosition, encodeListPosition } from "./cursor.js"
import { type NotionFile, WORKSPACE_ROOT } from "./files.js"

/**
 * Requests one `folders browse` call starts a new page of Notion's answer within; a page of search can add about 50
 * more, for the parents and databases of its 25 results. Desktop waits a minute, and Notion takes about 3 a second.
 */
const REQUESTS = 30
/** Search results per page: each may cost a read of its parent page or of its database. */
const SEARCH_PAGE = 25

/** One level of `folders browse`: its pages and databases, where the next call goes on, and whether search was cut. */
export interface BrowseLevel {
  files: NotionFile[]
  cursor?: string
  cut: boolean
}

export type NotionSource = DocumentSource<NotionFile> & {
  browse(parent: string, limit: number, cursor?: string): Promise<BrowseLevel>
}

export interface BrowsePorts {
  retrieve(id: string): Promise<NotionFile>
  childrenPage(id: string, token: string): Promise<{ files: NotionFile[]; cursor?: string }>
  topPage(
    kind: "page" | "data_source",
    start: string | undefined,
    size: number,
  ): Promise<{ files: NotionFile[]; next: string | null; cut: boolean }>
  requests(): number
}

type At = BrowsePosition["at"]

/** One page of Notion's answer: its pages and databases, and where the next page starts. */
const batchOf = async (ports: BrowsePorts, parent: string, at: At): Promise<BrowseLevel & { next?: At }> => {
  if (at.k === "list") {
    const page = await ports.childrenPage(parent, at.position)
    // A walk's listing holds the known pages in the trash, which are no choice for folders add.
    const files = page.files.filter((file) => !file.trashed)
    return { files, ...(page.cursor ? { next: { k: "list", position: page.cursor } } : {}), cut: false }
  }
  const page = await ports.topPage(at.kind, at.start, SEARCH_PAGE)
  const next: At | undefined = page.next
    ? { ...at, start: page.next }
    : at.kind === "page"
      ? { k: "search", kind: "data_source" }
      : undefined
  return { files: page.files, ...(next ? { next } : {}), cut: page.cut }
}

const firstOf = async (ports: BrowsePorts, parent: string): Promise<BrowsePosition | undefined> => {
  if (parent === WORKSPACE_ROOT) return { parent, at: { k: "search", kind: "page" }, skip: 0 }
  const file = await ports.retrieve(parent)
  if (file.trashed) throw new CliError("not_found", "that page or database is in Notion's trash")
  // A database's children are its rows, and a row is not a folder.
  if (file.providerMetadata.kind === "database") return undefined
  const blocks = encodeListPosition({ k: "blocks", blocks: [{ id: parent }], seen: [] })
  return { parent, at: { k: "list", position: blocks }, skip: 0 }
}

/**
 * Up to `limit` folders of one level. `has_more` follows Notion's own cursor, not how many folders a page held: a page
 * of blocks can name none and the next many. A call stops after its request budget with what it has and a cursor.
 */
export const browseLevel = async (
  ports: BrowsePorts,
  parent: string,
  limit: number,
  cursor?: string,
): Promise<BrowseLevel> => {
  let position = cursor === undefined ? await firstOf(ports, parent) : decodeBrowsePosition(cursor, parent)
  if (position && (position.at.k === "search") !== (parent === WORKSPACE_ROOT))
    throw new CliError("validation_error", "--cursor is not one folders browse gave for this --parent", {
      reason: "folder.cursor-invalid",
    })
  const files: NotionFile[] = []
  let cut = false
  const most = ports.requests() + REQUESTS
  while (position) {
    const batch = await batchOf(ports, parent, position.at)
    cut ||= batch.cut
    const rest = batch.files.slice(position.skip)
    const room = limit - files.length
    for (const file of rest.slice(0, room)) files.push(file)
    if (rest.length > room)
      return { files, cut, cursor: encodeBrowsePosition({ ...position, skip: position.skip + room }) }
    if (!batch.next) break
    position = { parent, at: batch.next, skip: 0 }
    if (files.length === limit || ports.requests() >= most)
      return { files, cut, cursor: encodeBrowsePosition(position) }
  }
  return { files, cut }
}
