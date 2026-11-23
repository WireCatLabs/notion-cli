import { isCliError } from "@wirecat/cli-base"
import type { NotionReads } from "../notion/reads.js"
import type { CommentAccess, SyncWarning } from "./files.js"

/** A page's comments read for its searchable text, 100 a page; past this many the oldest are kept. */
const COMMENT_PAGES = 10

/**
 * A page's open comments as lines of its searchable text, one per comment with its author and day; none adds nothing,
 * so a page without comments keeps its hash. Notion lists only unresolved comments, so a comment that leaves the list
 * was resolved or deleted, and the next read of the page drops it from the text.
 */
export const pageComments = (reads: Pick<NotionReads, "comments">, warn: (warning: SyncWarning) => void) => {
  /** Comments are off by default in a connection's capabilities: one refusal is said once, and none is asked again. */
  let refused = false
  return async (id: string): Promise<{ text?: string; comments: CommentAccess }> => {
    if (refused) return { comments: "refused" }
    const lines: string[] = []
    let cursor: string | undefined
    let pages = 0
    try {
      do {
        const page = await reads.comments(id, cursor)
        for (const comment of page.results) {
          const author = comment.display_name?.resolved_name || comment.created_by.name || comment.created_by.id
          const said = comment.rich_text.map((part) => part.plain_text).join("")
          lines.push(`${author}, ${comment.created_time.slice(0, 10)}: ${said}`)
        }
        cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined
        pages++
      } while (cursor && pages < COMMENT_PAGES)
    } catch (error) {
      if (!isCliError(error) || (error.code !== "permission_error" && error.code !== "not_found")) throw error
      if (error.code === "permission_error") {
        refused = true
        warn({
          code: "permission_error",
          reason: "notion.comments-unread",
          message:
            'comments were left out of the local copy: turn on "Read comments" in the connection\'s capabilities. ' +
            "A page synced now gets its comments the next time it changes in Notion",
        })
      }
      return { comments: refused ? "refused" : "read" }
    }
    return { comments: "read", ...(lines.length ? { text: `Comments:\n${lines.join("\n")}` } : {}) }
  }
}
