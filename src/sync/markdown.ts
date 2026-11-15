import { type CliError, isCliError } from "@wirecat/cli-base"
import { withoutSignedLinks } from "../notion/links.js"
import type { NotionReads } from "../notion/reads.js"

const UNKNOWN_TAG = /<unknown\b[^>]*\/>/g
const bare = (id: string) => id.replaceAll("-", "").toLowerCase()
/** A truncated page names at most 100 unknown blocks per answer; their subtrees can be truncated again. */
const MAX_DEPTH = 3

export interface PageText {
  markdown: string
  /** Blocks Notion would not give: not shared with this token, or still truncated after the re-fetches. */
  missing: number
}

/** A block left out of the text: unshared (404), or one the token may not read (403). */
export type SkippedBlock = (id: string, code: CliError["code"]) => void

const expand = async (
  reads: NotionReads,
  markdown: string,
  unknown: string[],
  depth: number,
  skipped: SkippedBlock,
): Promise<PageText> => {
  if (!unknown.length || depth >= MAX_DEPTH) return { markdown, missing: unknown.length }
  let missing = 0
  const parts = new Map<string, string>()
  for (const id of unknown) {
    try {
      const block = await reads.pageMarkdown(id)
      const inner = await expand(reads, block.markdown, block.unknown_block_ids, depth + 1, skipped)
      parts.set(bare(id), inner.markdown)
      missing += inner.missing
    } catch (error) {
      // Notion's list mixes truncated blocks with unshared ones, and only the re-fetch tells them apart. The page
      // itself was read, so its failure must not leave this function: the sync would hold it, or drop it, for good.
      if (!isCliError(error) || (error.code !== "not_found" && error.code !== "permission_error")) throw error
      skipped(id, error.code)
      missing++
    }
  }
  const replaced = markdown.replace(UNKNOWN_TAG, (tag) => {
    const flat = bare(tag)
    for (const [id, part] of parts) if (flat.includes(id)) return part
    return tag
  })
  return { markdown: replaced, missing }
}

export const pageText = async (
  reads: NotionReads,
  id: string,
  skipped: SkippedBlock = () => undefined,
): Promise<PageText> => {
  const page = await reads.pageMarkdown(id)
  const full = await expand(reads, page.markdown, page.unknown_block_ids, 0, skipped)
  return { markdown: withoutSignedLinks(full.markdown).text, missing: full.missing }
}
