import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, posix } from "node:path"
import { CliError, isCliError } from "@wirecat/cli-base"
import {
  type FileMirrorOptions,
  fileSyncState,
  fileVersions,
  type Mirror,
  syncFileMirror,
} from "@wirecat/cli-core/documents"
import { describe, expect, it } from "vitest"
import { type MirrorPages, nameOf, notionMirrorTarget } from "./notion/mirror-target.js"

const ROOT = "aaaaaaaa-0000-4000-8000-000000000001"

/**
 * Pages in memory, as Notion keeps them: text written is kept in Notion's own form (`*` bullets become `-`), and a
 * page's Markdown ends with a tag for each page under it.
 */
const fakePages = () => {
  const pages = new Map<string, { parent: string; title: string; body: string; trashed: boolean }>()
  const hidden = new Set<string>()
  const writes: string[] = []
  let next = 0
  const form = (text: string) => text.replaceAll("* ", "- ")
  const kids = (id: string) => [...pages.entries()].filter(([, page]) => page.parent === id && !page.trashed)
  const visible = (id: string) => {
    const page = pages.get(id)
    if (!page || hidden.has(id)) throw new CliError("not_found", `page ${id} not found`)
    return page
  }
  const api: MirrorPages = {
    identity: async () => "space:me",
    inTrash: async (id) => (id === ROOT ? false : visible(id).trashed),
    children: async (id) => kids(id).map(([child, page]) => ({ id: child, title: page.title, editedAt: "2026-11-23" })),
    markdown: async (id) => {
      const body = id === ROOT ? "" : visible(id).body
      const tags = kids(id).map(([child, page]) => `<page url="https://www.notion.so/${child}">${page.title}</page>`)
      return [body, ...tags].filter(Boolean).join("\n")
    },
    create: async (parent, title, markdown) => {
      const id = `page-${++next}`
      pages.set(id, { parent, title, body: form(markdown ?? ""), trashed: false })
      writes.push(`create ${title}`)
      return id
    },
    replace: async (id, markdown) => {
      const page = visible(id)
      const tags = kids(id).map(([child, one]) => `<page url="https://www.notion.so/${child}">${one.title}</page>`)
      page.body = form(tags.reduce((text, tag) => text.replace(tag, ""), markdown).trimEnd())
      writes.push(`replace ${page.title}`)
    },
    trash: async (id) => {
      visible(id).trashed = true
      writes.push(`trash ${visible(id).title}`)
    },
  }
  return {
    api,
    writes,
    add: (parent: string, title: string, body: string) => {
      const id = `page-${++next}`
      pages.set(id, { parent, title, body, trashed: false })
      return id
    },
    edit: (id: string, body: string) => {
      visible(id).body = body
    },
    trash: (id: string) => {
      visible(id).trashed = true
    },
    move: (id: string, parent: string) => {
      visible(id).parent = parent
    },
    hide: (id: string) => hidden.add(id),
    idOf: (title: string) => [...pages.entries()].find(([, page]) => page.title === title)?.[0] as string,
  }
}

const temp = (prefix: string) => mkdtempSync(join(tmpdir(), prefix))
const put = (root: string, path: string, text: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), text)
}
const tree = (root: string) =>
  Object.fromEntries(
    readdirSync(root, { recursive: true, encoding: "utf8" })
      .filter((path) => !path.split("/").some((part) => part.startsWith(".")) && path.endsWith(".md"))
      .map((path) => [posix.normalize(path), readFileSync(join(root, path), "utf8")]),
  )

const setup = (local: Record<string, string> = {}) => {
  const notion = fakePages()
  const root = temp("notion-mirror-local-")
  for (const [path, text] of Object.entries(local)) put(root, path, text)
  const stateDir = temp("notion-mirror-state-")
  const mirror: Mirror = { id: "m1", path: root, folder: ROOT }
  const versions = fileVersions(join(stateDir, "versions"))
  let ops = 0
  const options = (): FileMirrorOptions => ({
    root,
    folder: ROOT,
    target: notionMirrorTarget(notion.api),
    state: fileSyncState(stateDir, mirror, "space:me"),
    versions,
    principal: "space:me",
    remote: "notion",
    guard: (_attempt, act) => act(),
    operationId: () => `op${++ops}`,
    errorOf: (error) => (isCliError(error) ? error : new CliError("provider_error", String(error))),
    assertHeld: () => {},
  })
  return { notion, root, versions, sync: () => syncFileMirror(options()), local: () => tree(root) }
}

describe("a Notion mirror", () => {
  it("sends a folder of Markdown as pages under pages, takes Notion's form back, and then has nothing to do", async () => {
    const context = setup({ "Plan.md": "* one\n", "Plan/Step.md": "* first\n", "Notes.md": "notes\n" })
    const first = await context.sync()
    expect(first).toMatchObject({ conflicts: [], errors: [], unknown: [] })
    expect(first.uploaded.sort()).toEqual(["Notes.md", "Plan.md", "Plan/Step.md"])
    expect(context.notion.writes).toEqual(["create Notes", "create Plan", "create Step"])
    // Step was added under Plan after Plan was sent, so Plan's page now ends with its tag.
    expect(await context.sync()).toMatchObject({ downloaded: ["Plan.md"], conflicts: [] })
    const step = context.notion.idOf("Step")
    expect(context.local()).toEqual({
      "Notes.md": "notes\n",
      "Plan.md": `- one\n\n<page url="https://www.notion.so/${step}">Step</page>`,
      "Plan/Step.md": "- first\n",
    })
    context.notion.writes.length = 0
    expect(await context.sync()).toMatchObject({ uploaded: [], downloaded: [], unchanged: 3 })
    expect(context.notion.writes).toEqual([])
  })

  it("takes an edit made in Notion, and sends a local edit checked just before the write", async () => {
    const context = setup({ "a.md": "one\n" })
    await context.sync()
    context.notion.edit(context.notion.idOf("a"), "one, in Notion")
    expect(await context.sync()).toMatchObject({ downloaded: ["a.md"] })
    put(context.root, "a.md", "one, here")
    expect(await context.sync()).toMatchObject({ uploaded: ["a.md"], conflicts: [] })
    expect(context.notion.writes.at(-1)).toBe("replace a")
  })

  it("moves the local file to the mirror's trash when its page is in Notion's trash, its text kept", async () => {
    const context = setup({ "a.md": "one\n" })
    await context.sync()
    context.notion.trash(context.notion.idOf("a"))
    const result = await context.sync()
    expect(result.trashed).toEqual([{ path: "a.md", side: "local" }])
    expect(context.local()).toEqual({})
    expect(context.versions.list("a.md").at(-1)).toMatchObject({ event: "deleted", available: true })
  })

  it("leaves the local file alone when its page was moved elsewhere or is no longer shared", async () => {
    const context = setup({ "moved.md": "one\n", "unshared.md": "two\n" })
    await context.sync()
    const elsewhere = context.notion.add("bbbbbbbb-0000-4000-8000-000000000002", "Elsewhere", "")
    context.notion.move(context.notion.idOf("moved"), elsewhere)
    const unshared = context.notion.idOf("unshared")
    context.notion.move(unshared, elsewhere)
    context.notion.hide(unshared)
    const result = await context.sync()
    expect(result.trashed).toEqual([])
    expect(result.unknown.map((one) => one.path).sort()).toEqual(["moved.md", "unshared.md"])
    expect(Object.keys(context.local()).sort()).toEqual(["moved.md", "unshared.md"])
  })

  it("trashes the page of a deleted file, and keeps a page with pages under it until their files go", async () => {
    const context = setup({ "a.md": "one\n", "Plan.md": "plan\n", "Plan/Step.md": "step\n" })
    await context.sync()
    await context.sync()
    rmSync(join(context.root, "a.md"))
    rmSync(join(context.root, "Plan.md"))
    const result = await context.sync()
    expect(result.trashed).toEqual([{ path: "a.md", side: "remote" }])
    expect(result.errors).toEqual([
      expect.objectContaining({ path: "Plan.md", message: expect.stringMatching(/pages under it/u) }),
    ])
    expect(context.notion.writes.filter((write) => write.startsWith("trash"))).toEqual(["trash a"])
  })

  it("mirrors neither of two pages with one title, and takes neither as deleted", async () => {
    const context = setup({ "Twin.md": "one\n" })
    await context.sync()
    context.notion.add(ROOT, "Twin", "the other one")
    const result = await context.sync()
    expect(result.unknown).toEqual([expect.objectContaining({ path: "Twin.md", side: "remote" })])
    expect(context.local()).toEqual({ "Twin.md": "one\n" })
  })

  it("sends no file but Markdown", async () => {
    const context = setup({ "picture.png": "png" })
    const result = await context.sync()
    expect(result.errors).toEqual([
      expect.objectContaining({ path: "picture.png", message: expect.stringMatching(/only \.md/u) }),
    ])
    expect(context.notion.writes).toEqual([])
    expect(existsSync(join(context.root, "picture.png"))).toBe(true)
  })
})

describe("nameOf", () => {
  it("makes a page title one file name", () => {
    expect(nameOf("Q1 / Q2 plan")).toBe("Q1 - Q2 plan")
    expect(nameOf("  ")).toBe("Untitled")
  })
})
