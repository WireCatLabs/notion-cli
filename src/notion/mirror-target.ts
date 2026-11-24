import { writeFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { posix } from "node:path"
import { CliError, isCliError } from "@wirecat/cli-base"
import type { Expect, FileTarget, RemoteFile } from "@wirecat/cli-core/documents"
import { UNTITLED } from "../sync/files.js"
import type { LiveReads } from "./notion.js"
import { fingerprintOf } from "./page-target.js"
import type { NotionBlock } from "./reads.js"
import type { LiveWrites } from "./writes.js"

const MD = ".md"

/** The calls a mirror makes, so tests can stand in for Notion with pages in memory. */
export interface MirrorPages {
  /** `workspace:user`, as the profile records its account. */
  identity(): Promise<string>
  /** Whether the page is in Notion's trash; a page this connection cannot see fails with `not_found`. */
  inTrash(id: string): Promise<boolean>
  /** The pages directly under a page, in Notion's order, trashed ones left out. */
  children(id: string): Promise<{ id: string; title: string; editedAt: string }[]>
  /** The page's whole Markdown, as `documents get` shows it; a page Notion gives only in part fails. */
  markdown(id: string): Promise<string>
  create(parent: string, title: string, markdown?: string): Promise<string>
  /** Replaces the whole text; a child page left out of it is refused, never deleted. */
  replace(id: string, markdown: string): Promise<void>
  trash(id: string): Promise<void>
}

export const mirrorPages = (reads: LiveReads, writes: LiveWrites): MirrorPages => ({
  identity: async () => {
    const me = await reads.me()
    return `${me.workspace.id}:${me.user.id}`
  },
  inTrash: async (id) => (await reads.port.retrievePage(id)).in_trash,
  children: async (id) => {
    const pages: NotionBlock[] = []
    let cursor: string | undefined
    do {
      const page = await reads.port.blockChildren(id, cursor)
      for (const block of page.results) if (block.type === "child_page" && !block.in_trash) pages.push(block)
      cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined
    } while (cursor)
    return pages.map((block) => ({
      id: block.id,
      title: block.child_page?.title ?? "",
      editedAt: block.last_edited_time,
    }))
  },
  markdown: async (id) => {
    const { document, issues } = await reads.document(id)
    if (issues.length > 0)
      throw new CliError("provider_error", `page ${id} is too long for Notion to give whole, so it is not mirrored`, {
        reason: "notion.page-not-whole",
      })
    return document.markdown
  },
  create: async (parent, title, markdown) =>
    (await writes.create({ parent, title, ...(markdown === undefined ? {} : { markdown }) })).id,
  replace: async (id, markdown) => {
    await writes.replace(id, markdown, false)
  },
  trash: async (id) => {
    await writes.trash(id, true)
  },
})

/** A page title as one file name: a slash cannot be in one, and a page with no title is Notion's "Untitled". */
export const nameOf = (title: string) => (title.trim() || UNTITLED).replaceAll(/[/\\\0]/gu, "-")

const notFound = (path: string) =>
  new CliError("conflict", `${path} is no longer where the listing saw it`, { reason: "mirror.remote-changed" })

const changed = (path: string) =>
  new CliError("conflict", `${path} changed since it was read`, { reason: "mirror.remote-changed" })

/**
 * The pages under one Notion page as a folder of Markdown files, for cli-core's `syncFileMirror`. A page is
 * `<title>.md`, and the pages under it are in the folder `<title>/`. A remote path is the root page's id joined with
 * that path. Notion keeps a page as blocks and gives back its own Markdown, so the target `rewrites`. Notion has no
 * conditional write: `upload` and `trash` read the page just before they write and refuse another fingerprint; an edit
 * landing after that read is not caught. Only a page in Notion's trash is deleted: one this connection no longer sees
 * may only be unshared, and one moved elsewhere is still there.
 */
export const notionMirrorTarget = (pages: MirrorPages): FileTarget => {
  /** Remote paths, files and folders, to the page each names, from the last listing and this run's writes. */
  const known = new Map<string, string>()
  const remember = (path: string, id: string) => {
    known.set(path, id)
    if (path.endsWith(MD)) known.set(path.slice(0, -MD.length), id)
  }
  const named = async (parent: string, name: string) => {
    const found = (await pages.children(parent)).filter((child) => nameOf(child.title) === name)
    if (found.length > 1)
      throw new CliError("validation_error", `two pages are named ${name} in one place; rename one in Notion`, {
        reason: "notion.mirror-same-name",
      })
    return found[0]?.id
  }
  /** The page a remote path names, as a file (`a/b.md`) or a folder (`a/b`), or undefined when nothing is there. */
  const pageAt = async (path: string): Promise<string | undefined> => {
    const cached = known.get(path)
    if (cached) return cached
    const [root, ...parts] = path.split("/")
    let id = root as string
    for (const [at, part] of parts.entries()) {
      const name = at === parts.length - 1 && part.endsWith(MD) ? part.slice(0, -MD.length) : part
      const child = await named(id, name)
      if (!child) return undefined
      id = child
    }
    remember(path, id)
    return id
  }
  const fingerprint = async (id: string) => fingerprintOf(await pages.markdown(id))
  const described = async (path: string, id: string): Promise<RemoteFile> => {
    const markdown = await pages.markdown(id)
    return {
      path: path.split("/").slice(1).join("/"),
      id,
      size: Buffer.byteLength(markdown, "utf8"),
      sha256: fingerprintOf(markdown),
      modifiedAt: new Date().toISOString(),
    }
  }

  return {
    identity: () => pages.identity(),
    rewrites: true,

    list: async (root, signal, options) => {
      if (await pages.inTrash(root)) return undefined
      const files: RemoteFile[] = []
      let complete = true
      const walk = async (id: string, prefix: string) => {
        const children = await pages.children(id)
        const counts = new Map<string, number>()
        for (const child of children) counts.set(nameOf(child.title), (counts.get(nameOf(child.title)) ?? 0) + 1)
        for (const child of children) {
          if (signal?.aborted) throw new CliError("cancelled", "the listing was cancelled")
          const name = nameOf(child.title)
          // Two pages at one path: neither is mirrored, and neither may look deleted.
          if ((counts.get(name) ?? 0) > 1) {
            complete = false
            continue
          }
          const folder = prefix ? `${prefix}/${name}` : name
          const path = `${folder}${MD}`
          remember(`${root}/${path}`, child.id)
          if (options?.excluded?.(path)) {
            files.push({ path, id: child.id, size: 0, modifiedAt: child.editedAt })
            continue
          }
          let markdown: string
          try {
            markdown = await pages.markdown(child.id)
          } catch (error) {
            if (!isCliError(error) || !["not_found", "provider_error"].includes(error.code)) throw error
            complete = false
            continue
          }
          files.push({
            path,
            id: child.id,
            size: Buffer.byteLength(markdown, "utf8"),
            sha256: fingerprintOf(markdown),
            modifiedAt: child.editedAt,
          })
          await walk(child.id, folder)
        }
      }
      await walk(root, "")
      return { rootId: root, files, complete }
    },

    exists: async (path, _signal, id) => {
      if (!id)
        throw new CliError("provider_error", `cannot tell whether ${path} was deleted without its page id`, {
          reason: "notion.mirror-no-id",
        })
      try {
        return !(await pages.inTrash(id))
      } catch (error) {
        if (isCliError(error) && error.code === "not_found")
          throw new CliError(
            "not_found",
            `page ${id} is not visible to this connection: deleted, or no longer shared`,
            {
              reason: "notion.not-shared",
            },
          )
        throw error
      }
    },

    download: async (path, into) => {
      const id = await pageAt(path)
      if (!id) throw notFound(path)
      writeFileSync(into, await pages.markdown(id), { flag: "wx", mode: 0o600 })
    },

    upload: async (path, from, expect: Expect) => {
      if (!path.endsWith(MD))
        throw new CliError("validation_error", `${posix.basename(path)} is not Markdown; only .md files become pages`, {
          reason: "notion.mirror-not-markdown",
        })
      const text = await readFile(from, "utf8")
      let id: string
      if ("absent" in expect) {
        const parent = await pageAt(posix.dirname(path))
        if (!parent) throw notFound(posix.dirname(path))
        const name = posix.basename(path, MD)
        if (await named(parent, name)) throw changed(path)
        id = await pages.create(parent, name, text)
      } else {
        const found = await pageAt(path)
        if (!found) throw notFound(path)
        id = found
        const now = await pages.markdown(id)
        if (fingerprintOf(now) !== expect.sha256) throw changed(path)
        if (now !== text) await pages.replace(id, text)
      }
      remember(path, id)
      return described(path, id)
    },

    trash: async (path, expect) => {
      const id = await pageAt(path)
      if (!id) throw notFound(path)
      if ((await fingerprint(id)) !== expect.sha256) throw changed(path)
      // Notion trashes a page with every page under it; those go one by one, as their own files are deleted.
      if ((await pages.children(id)).length > 0)
        throw new CliError(
          "validation_error",
          `${path} has pages under it in Notion; delete their files first, and the next sync trashes it`,
          { reason: "notion.mirror-has-children" },
        )
      await pages.trash(id)
      known.delete(path)
      known.delete(path.slice(0, -MD.length))
    },

    ensureFolder: async (path) => {
      const [root, ...parts] = path.split("/")
      let id = root as string
      let at = root as string
      for (const part of parts) {
        at = `${at}/${part}`
        const found = known.get(at) ?? (await named(id, part))
        id = found ?? (await pages.create(id, part))
        remember(at, id)
      }
    },
  }
}
