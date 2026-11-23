import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { mirrorKeys } from "./commands/mirrors.js"
import { fakeNotion, PAGE_ID } from "./testing/fake-notion.js"
import { runCli } from "./testing/harness.js"

const configFile = join(process.env.WCNOTION_CONFIG_DIR ?? "", "config.json")
const withPermissions = (permissions: Record<string, string>) => {
  mkdirSync(join(configFile, ".."), { recursive: true })
  writeFileSync(configFile, JSON.stringify({ profiles: { personal: { permissions } } }))
}
afterEach(() => rmSync(configFile, { force: true }))

const folder = () => mkdtempSync(join(tmpdir(), "notion-mirror-"))

it("mirrors add saves a page as the folder's remote side, and mirrors list shows it", async () => {
  const notion = fakeNotion()
  const local = folder()
  const added = await runCli(["personal", "mirrors", "add", PAGE_ID, local, "--json"], { notion })
  expect(added.code).toBe(0)
  const id = (added.json().item as { id: string }).id
  expect(added.json().item).toEqual({ id, path: local, folder: PAGE_ID, ignore: [], added: true })
  const listed = await runCli(["personal", "mirrors", "list", "--json"], { notion })
  expect(listed.json().items).toEqual([{ id, path: local, folder: PAGE_ID, ignore: [] }])
})

it("mirrors add refuses a page in Notion's trash", async () => {
  const notion = fakeNotion({ pages: { [PAGE_ID]: { markdown: "", in_trash: true } } })
  const added = await runCli(["personal", "mirrors", "add", PAGE_ID, folder(), "--json"], { notion })
  expect(added.code).not.toBe(0)
  expect(added.json().error).toMatchObject({ reason: "mirror.not-folder" })
})

it("mirrors sync makes a page under the mirrored page from a new local Markdown file", async () => {
  const notion = fakeNotion()
  const local = folder()
  writeFileSync(join(local, "Plan.md"), "First step\n")
  const id = (
    (await runCli(["personal", "mirrors", "add", PAGE_ID, local, "--json"], { notion })).json().item as {
      id: string
    }
  ).id
  const synced = await runCli(["personal", "mirrors", "sync", id, "--json"], { notion })
  expect(synced.json().items).toEqual([expect.objectContaining({ id, uploaded: ["Plan.md"] })])
  const made = notion.calls.find((call) => call.method === "POST" && call.path === "/v1/pages")
  expect(made?.body).toMatchObject({ parent: { page_id: PAGE_ID }, markdown: "First step\n" })
})

it("mirrors sync refuses to create a page when the profile denies the call that creates one", async () => {
  withPermissions({ "api.post-page": "deny" })
  const notion = fakeNotion()
  const local = folder()
  writeFileSync(join(local, "Plan.md"), "First step\n")
  const id = (
    (await runCli(["personal", "mirrors", "add", PAGE_ID, local, "--json"], { notion })).json().item as {
      id: string
    }
  ).id
  const synced = await runCli(["personal", "mirrors", "sync", id, "--json"], { notion })
  expect(synced.code).not.toBe(0)
  expect(synced.out).toContain('"code":"permission_error"')
  expect(notion.calls.some((call) => call.method === "POST" && call.path === "/v1/pages")).toBe(false)
})

it("a local file given Notion's own text after an upload asks for no key, so a push never asks twice", () => {
  expect(mirrorKeys({ action: "update", side: "local" })).toEqual([])
  expect(mirrorKeys({ action: "delete", side: "local" })).toEqual(["documents.delete"])
  expect(mirrorKeys({ action: "delete", side: "remote" })).toEqual(["api.patch-page", "documents.delete"])
  expect(mirrorKeys({ action: "update", side: "remote" })).toEqual(["api.update-page-markdown"])
})
