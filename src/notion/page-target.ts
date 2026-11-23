import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { CliError, isCliError } from "@wirecat/cli-base"
import type { FileTarget, RemoteFile } from "@wirecat/cli-core/documents"
import { withoutSignedLinks } from "./links.js"
import type { LiveReads } from "./notion.js"
import type { LiveWrites, TextEdit } from "./writes.js"

/** The fingerprint `documents get` answers and `--expected-fingerprint` takes: the sha256 of the text as shown. */
export const fingerprintOf = (markdown: string) => createHash("sha256").update(markdown, "utf8").digest("hex")

/** How a guarded write changes the page: the whole text, or parts of it where they are. */
export type PageChange =
  | { kind: "replace"; allowDeleting: boolean }
  | { kind: "edit"; edits: readonly TextEdit[]; allowDeleting: boolean }

export interface PageWriteOutcome {
  warnings: string[]
}

const cutPage = (id: string) =>
  new CliError(
    "validation_error",
    `page ${id} is too long for Notion to give whole, so it has no fingerprint and cannot be written at one`,
    { reason: "notion.page-not-whole", sent: false },
  )

/**
 * One Notion page as the `FileTarget` cli-core's `guardedFileWrite` writes through: the path is the page's id and the
 * content is its Markdown as `documents get` shows it. Notion has no conditional write, so `upload` reads the page
 * again just before it sends and refuses another fingerprint; an edit landing after that read is not caught.
 */
export const pageTarget = (
  reads: LiveReads,
  writes: LiveWrites,
  change: PageChange,
  outcome: PageWriteOutcome,
): Pick<FileTarget, "exists" | "download" | "upload"> => {
  const whole = async (id: string) => {
    const { document, issues } = await reads.document(id)
    if (issues.length > 0) throw cutPage(id)
    return document.markdown
  }
  return {
    exists: async (id) => {
      try {
        return !(await reads.port.retrievePage(id)).in_trash
      } catch (error) {
        if (isCliError(error) && error.code === "not_found") return false
        throw error
      }
    },
    download: async (id, into) => {
      writeFileSync(into, await whole(id), { mode: 0o600 })
    },
    upload: async (id, from, expect): Promise<RemoteFile> => {
      const text = await whole(id)
      if (!("sha256" in expect) || fingerprintOf(text) !== expect.sha256)
        throw new CliError("conflict", `page ${id} changed since it was read`, { reason: "mirror.remote-changed" })
      if (change.kind === "edit") applyEdits(text, change.edits)
      const done =
        change.kind === "replace"
          ? await writes.replace(id, readFileSync(from, "utf8"), change.allowDeleting)
          : await writes.edit(id, change.edits, change.allowDeleting)
      outcome.warnings = done.warnings
      const shown = done.markdown === undefined ? undefined : withoutSignedLinks(done.markdown).text
      return {
        path: id,
        id: done.id,
        size: shown === undefined ? 0 : Buffer.byteLength(shown, "utf8"),
        ...(shown === undefined ? {} : { sha256: fingerprintOf(shown) }),
        modifiedAt: new Date().toISOString(),
      }
    },
  }
}

/**
 * The page's text after the edits, each applied in turn as Notion applies them. A part whose `old` is not in the text,
 * or is there more than once without `all`, is refused here with nothing sent: Notion would apply the other parts and
 * only warn about it, leaving the page half edited.
 */
export const applyEdits = (markdown: string, edits: readonly TextEdit[]) => {
  let text = markdown
  edits.forEach((edit, index) => {
    const found = text.split(edit.old).length - 1
    if (found === 0 || (found > 1 && !edit.all))
      throw new CliError(
        "validation_error",
        found === 0
          ? `edit ${index + 1}: its old text is not on the page as it is now; nothing was sent`
          : `edit ${index + 1}: its old text is on the page ${found} times; make it longer to name one place, or set ` +
              `"all": true; nothing was sent`,
        { reason: found === 0 ? "notion.edit-no-match" : "notion.edit-many-matches", param: "--payload", sent: false },
      )
    text = text.replaceAll(edit.old, () => edit.new)
  })
  return text
}
