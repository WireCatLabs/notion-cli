import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { fakeNotion, notionError, PAGE_ID } from "./testing/fake-notion.js"
import { runCli } from "./testing/harness.js"

const PAGE_LINK = `https://www.notion.so/test-space/Test-page-${PAGE_ID.replaceAll("-", "")}`
const MIB = 1024 * 1024

const configFile = join(process.env.WCNOTION_CONFIG_DIR ?? "", "config.json")
const withPermissions = (permissions: Record<string, string>) => {
  mkdirSync(join(configFile, ".."), { recursive: true })
  writeFileSync(configFile, JSON.stringify({ profiles: { personal: { permissions } } }))
}
afterEach(() => rmSync(configFile, { force: true }))

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).isFile())

const fileOf = (name: string, bytes: number) => {
  const dir = join(tmpdir(), `notion-upload-${process.pid}-${name}`)
  mkdirSync(dir, { recursive: true })
  const path = join(dir, name)
  writeFileSync(path, Buffer.alloc(bytes, 7))
  return path
}

interface Listed {
  [key: string]: unknown
  items: { id: string; discussion_id: string; text: string; author_name: string | null; parent: unknown }[]
  page: { has_more: boolean; next_cursor?: string }
}

it("comments create starts a discussion, reply answers in it, and list pages through them", async () => {
  const notion = fakeNotion()
  const made = await runCli(["personal", "comments", "create", PAGE_LINK, "--text", "Fake **first** comment"], {
    notion,
  })
  expect(made.code).toBe(0)
  const comment = (made.json().item as { operation_id: string; comment: { id: string; discussion_id: string } }).comment
  expect(made.json().item).toMatchObject({ operation_id: expect.any(String) })
  expect(notion.calls.at(-1)).toMatchObject({
    method: "POST",
    path: "/v1/comments",
    body: { parent: { page_id: PAGE_ID }, markdown: "Fake **first** comment" },
  })
  const replied = await runCli(["personal", "comments", "reply", comment.discussion_id, "--file", "-"], {
    notion,
    stdin: "Fake reply",
  })
  expect(replied.json().item).toMatchObject({ comment: { discussion_id: comment.discussion_id } })
  expect(notion.calls.at(-1)?.body).toEqual({ discussion_id: comment.discussion_id, markdown: "Fake reply" })

  const first = (await runCli(["personal", "comments", "list", PAGE_ID, "--limit", "1"], { notion })).json() as Listed
  expect(first.items).toEqual([
    {
      id: comment.id,
      discussion_id: comment.discussion_id,
      parent: { type: "page_id", id: PAGE_ID },
      author_id: expect.any(String),
      author_name: "Test bot",
      text: "Fake **first** comment",
      attachments: 0,
      created_time: expect.any(String),
      last_edited_time: expect.any(String),
    },
  ])
  expect(first.page.has_more).toBe(true)
  const rest = (
    await runCli(["personal", "comments", "list", PAGE_ID, "--cursor", first.page.next_cursor as string], { notion })
  ).json() as Listed
  expect(rest.items.map((item) => [item.text, item.discussion_id])).toEqual([["Fake reply", comment.discussion_id]])
  expect(notion.refusals).toEqual([])
})

it("comments list says Notion lists only unresolved comments, and a comment needs its text", async () => {
  const help = await runCli(["comments", "list", "--help"])
  expect(help.out.replace(/\s+/gu, " ")).toContain("only unresolved comments")
  const notion = fakeNotion()
  const empty = await runCli(["personal", "comments", "create", PAGE_ID, "--json"], { notion })
  expect(empty.json()).toMatchObject({ error: { code: "validation_error" } })
  expect(notion.calls).toEqual([])
  const note = fileOf("note.md", 0)
  writeFileSync(note, "Fake comment from a file")
  const fromFile = await runCli(["personal", "comments", "create", PAGE_ID, "--file", note, "--json"], { notion })
  expect(fromFile.code).toBe(0)
  expect(notion.calls.at(-1)?.body).toMatchObject({ markdown: "Fake comment from a file" })
})

it("comments and uploads go through their permissions, the API keys they send, --dry-run and the lock", async () => {
  const notion = fakeNotion()
  const create = ["personal", "comments", "create", PAGE_ID, "--text", "Fake", "--json"]
  const reply = ["personal", "comments", "reply", PAGE_ID, "--text", "Fake", "--json"]
  const upload = ["personal", "files", "upload", fileOf("photo.png", 1000), "--parent", PAGE_ID, "--json"]
  withPermissions({ "comments.create": "deny" })
  expect((await runCli(create, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  expect((await runCli(reply, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  withPermissions({ "api.create-a-comment": "deny" })
  expect((await runCli(create, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  withPermissions({ "files.upload": "deny" })
  expect((await runCli(upload, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  withPermissions({ "api.patch-block-children": "deny" })
  expect((await runCli(upload, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  rmSync(configFile)
  const preview = await runCli([...upload, "--dry-run"], { notion })
  expect(preview.code).toBe(0)
  expect(JSON.stringify(preview.json())).toContain("files.upload")
  expect(JSON.stringify((await runCli([...create, "--dry-run"], { notion })).json())).toContain("comments.create")
  const locked = await runCli(create, { notion, env: { WCNOTION_READ_ONLY: "1" } })
  expect(locked.code).toBe(5)
  expect(notion.calls).toEqual([])
})

it("a comment's text reaches neither the run record nor the send journal", async () => {
  const notion = fakeNotion()
  const made = await runCli(
    ["personal", "comments", "create", PAGE_ID, "--text", "Fake private wirecat-comment-marker", "--record"],
    { notion },
  )
  expect(made.code).toBe(0)
  const files = [...new Set([process.env.HOME ?? "", tmpdir()])].flatMap(filesUnder)
  const texts = files.map((path) => readFileSync(path, "utf8"))
  expect(texts.some((text) => text.includes("comments.create"))).toBe(true)
  expect(texts.some((text) => text.includes("comments create"))).toBe(true)
  expect(texts.filter((text) => text.includes("wirecat-comment-marker"))).toEqual([])
})

it("files upload sends a small file in one part and adds it to the page as a block of its kind", async () => {
  const notion = fakeNotion()
  const done = await runCli(["personal", "files", "upload", fileOf("photo.png", 1000), "--parent", PAGE_LINK], {
    notion,
  })
  expect(done.code).toBe(0)
  expect(done.json().item).toMatchObject({
    operation_id: expect.any(String),
    page: { id: PAGE_ID },
    upload: { filename: "photo.png", content_type: "image/png", size: 1000, parts: 1 },
    block: { type: "image" },
  })
  expect(notion.calls.map(({ method, path, body, form }) => ({ method, path, body, form }))).toEqual([
    { method: "POST", path: "/v1/file_uploads", body: { filename: "photo.png" }, form: undefined },
    {
      method: "POST",
      path: expect.stringMatching(/\/send$/u),
      body: undefined,
      form: { file: { name: "photo.png", size: 1000 } },
    },
    {
      method: "PATCH",
      path: `/v1/blocks/${PAGE_ID}/children`,
      body: { children: [{ type: "image", image: { type: "file_upload", file_upload: { id: expect.any(String) } } }] },
      form: undefined,
    },
  ])
  expect(notion.refusals).toEqual([])
})

it("files upload sends a file over 20 MB in parts of 10 MB, completes it, then adds it to the page", async () => {
  const notion = fakeNotion()
  const done = await runCli(["personal", "files", "upload", fileOf("big.pdf", 21 * MIB), "--parent", PAGE_ID], {
    notion,
  })
  expect(done.code).toBe(0)
  expect(done.json().item).toMatchObject({ upload: { parts: 3, size: 21 * MIB }, block: { type: "pdf" } })
  expect(notion.calls[0]?.body).toEqual({ mode: "multi_part", number_of_parts: 3, filename: "big.pdf" })
  expect(notion.calls.slice(1, 4).map((call) => call.form)).toEqual([
    { file: { name: "big.pdf", size: 10 * MIB }, part_number: "1" },
    { file: { name: "big.pdf", size: 10 * MIB }, part_number: "2" },
    { file: { name: "big.pdf", size: MIB }, part_number: "3" },
  ])
  expect(notion.calls[4]?.path).toMatch(/\/complete$/u)
  expect(notion.refusals).toEqual([])
})

it("files upload refuses a link before any request, and a send Notion failed on is outcome_unknown", async () => {
  const target = fileOf("real.txt", 10)
  const link = join(tmpdir(), `notion-upload-link-${process.pid}.txt`)
  rmSync(link, { force: true })
  symlinkSync(target, link)
  const notion = fakeNotion()
  const refused = await runCli(["personal", "files", "upload", link, "--parent", PAGE_ID, "--json"], { notion })
  expect(refused.json()).toMatchObject({ error: { reason: "file.refused-place" } })
  expect(notion.calls).toEqual([])
  const failed = fakeNotion({ failures: [{ status: 200, body: { object: "file_upload" } }] })
  const lost = await runCli(["personal", "files", "upload", target, "--parent", PAGE_ID, "--json"], { notion: failed })
  expect(lost.json()).toMatchObject({
    error: { code: "outcome_unknown", details: { operation_id: expect.any(String) } },
  })
  const broken = fakeNotion({ failures: [notionError(400, "validation_error")] })
  const bad = await runCli(["personal", "files", "upload", target, "--parent", PAGE_ID, "--json"], { notion: broken })
  expect(bad.json()).toMatchObject({ error: { code: "validation_error" } })
})
