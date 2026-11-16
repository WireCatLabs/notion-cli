import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, sep } from "node:path"
import { afterEach, expect, it } from "vitest"
import { FAKE_TOKEN, fakeNotion, notionError, PAGE_ID } from "./testing/fake-notion.js"
import { runCli } from "./testing/harness.js"

const CHILD = "abababab-0000-4000-8000-000000000031"
const CHILD_TAG = `<page url="https://www.notion.so/${CHILD.replaceAll("-", "")}">Test child</page>`
const PAGE_LINK = `https://www.notion.so/test-space/Test-page-${PAGE_ID.replaceAll("-", "")}`

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

const answering = (asked: string[], reply: string) => (question: string) => {
  asked.push(question)
  return reply
}

it("documents create makes a page under a page from Markdown v2, its answer with operation_id", async () => {
  const notion = fakeNotion()
  const made = await runCli(
    ["personal", "documents", "create", "--parent", PAGE_LINK, "--title", "Test notes", "--text", "Fake text"],
    { notion },
  )
  expect(made.code).toBe(0)
  expect(made.json().item).toMatchObject({
    operation_id: expect.any(String),
    page: { id: expect.stringMatching(/^f0f0f0f0-/u), title: "Test notes", in_trash: false },
  })
  expect(notion.refusals).toEqual([])
  expect(notion.calls.map(({ method, path, body }) => ({ method, path, body }))).toEqual([
    {
      method: "POST",
      path: "/v1/pages",
      body: {
        parent: { page_id: PAGE_ID },
        properties: { title: { title: [{ type: "text", text: { content: "Test notes" } }] } },
        markdown: "Fake text",
        markdown_version: "v2",
      },
    },
  ])
})

it("documents create reads its text from a file or stdin, and refuses both --text and --file", async () => {
  const notion = fakeNotion()
  const file = join(tmpdir(), "page.md")
  writeFileSync(file, "# Test from file\n\nFake text")
  const fromFile = await runCli(["personal", "documents", "create", "--parent", PAGE_ID, "--file", file], { notion })
  expect(fromFile.json().item).toMatchObject({ page: { title: "Test from file" } })
  const fromStdin = await runCli(["personal", "documents", "create", "--parent", PAGE_ID, "--file", "-"], {
    notion,
    stdin: "# Test from stdin",
  })
  expect(fromStdin.json().item).toMatchObject({ page: { title: "Test from stdin" } })
  const both = await runCli(
    ["personal", "documents", "create", "--parent", PAGE_ID, "--file", file, "--text", "Fake"],
    { notion },
  )
  expect(both.json()).toMatchObject({ error: { code: "validation_error" } })
  expect(notion.calls).toHaveLength(2)
})

it("documents update replaces the page's text; a dropped child page is refused before Notion deletes it", async () => {
  const notion = fakeNotion({ pages: { [PAGE_ID]: { markdown: `# Test page\n\n${CHILD_TAG}` } } })
  const kept = await runCli(
    ["personal", "documents", "update", PAGE_ID, "--text", `# Test page\n\nNew fake text\n\n${CHILD_TAG}`],
    { notion },
  )
  expect(kept.code).toBe(0)
  expect(kept.json().item).toMatchObject({ operation_id: expect.any(String), page: { id: PAGE_ID }, warnings: [] })
  expect(notion.calls.at(-1)?.body).toEqual({
    markdown_version: "v2",
    type: "replace_content",
    replace_content: { new_str: `# Test page\n\nNew fake text\n\n${CHILD_TAG}` },
  })
  const dropped = await runCli(["personal", "documents", "update", PAGE_ID, "--text", "Only fake text"], {
    notion,
  })
  expect(dropped.json()).toMatchObject({
    error: { code: "validation_error", reason: "notion.text-refused" },
  })
  expect(JSON.stringify(dropped.json())).toContain("--allow-deleting-content")
  expect(JSON.stringify(dropped.json())).not.toContain("wirecat-secret-marker")
  expect(notion.pages[PAGE_ID]?.markdown).toContain(CHILD_TAG)
})

it("--allow-deleting-content asks as documents delete does: no sends nothing, yes deletes the child page", async () => {
  const notion = fakeNotion({ pages: { [PAGE_ID]: { markdown: `# Test page\n\n${CHILD_TAG}` } } })
  const argv = ["personal", "documents", "update", PAGE_ID, "--text", "Only fake text", "--allow-deleting-content"]
  const asked: string[] = []
  const no = await runCli(argv, { notion, answer: answering(asked, "n") })
  expect(no.code).not.toBe(0)
  expect(asked).toHaveLength(1)
  expect(asked[0]).toContain("documents.delete")
  expect(notion.calls).toEqual([])
  const yes = await runCli(argv, { notion, answer: answering(asked, "y") })
  expect(yes.code).toBe(0)
  expect(notion.calls.at(-1)?.body).toMatchObject({ replace_content: { allow_deleting_content: true } })
  expect(notion.pages[PAGE_ID]?.markdown).toBe("Only fake text")
})

it("documents update reports Notion's warnings by their code, never Notion's message", async () => {
  const notion = fakeNotion({ updateWarnings: [{ code: "unsupported_tag", message: "wirecat-secret-marker" }] })
  const updated = await runCli(["personal", "documents", "update", PAGE_ID, "--text", "Fake <x/>"], { notion })
  expect(updated.json().item).toMatchObject({ warnings: ["unsupported_tag"] })
  const person = await runCli(["personal", "documents", "update", PAGE_ID, "--text", "Fake <x/>"], {
    notion,
    tty: true,
  })
  expect(person.err).toContain("unsupported_tag")
  expect(person.out + person.err + updated.out).not.toContain("wirecat-secret-marker")
})

it("documents update takes its text from stdin, and without any text is refused before any request", async () => {
  const notion = fakeNotion()
  const none = await runCli(["personal", "documents", "update", PAGE_ID], { notion })
  expect(none.json()).toMatchObject({ error: { code: "validation_error" } })
  expect(notion.calls).toEqual([])
  const piped = await runCli(["personal", "documents", "update", PAGE_ID, "--file", "-"], {
    notion,
    stdin: "Fake piped",
  })
  expect(piped.code).toBe(0)
  expect(notion.pages[PAGE_ID]?.markdown).toBe("Fake piped")
})

it("documents delete asks first and moves the page to the trash; restore brings it back without asking", async () => {
  const notion = fakeNotion()
  const asked: string[] = []
  const no = await runCli(["personal", "documents", "delete", PAGE_ID], { notion, answer: answering(asked, "n") })
  expect(no.code).not.toBe(0)
  expect(notion.calls).toEqual([])
  const yes = await runCli(["personal", "documents", "delete", PAGE_ID], { notion, answer: answering(asked, "y") })
  expect(yes.code).toBe(0)
  expect(asked).toHaveLength(2)
  expect(asked[1]).toContain("documents.delete")
  expect(yes.json().item).toMatchObject({ operation_id: expect.any(String), page: { id: PAGE_ID, in_trash: true } })
  expect(notion.calls.at(-1)).toMatchObject({ method: "PATCH", path: `/v1/pages/${PAGE_ID}`, body: { in_trash: true } })
  const restored = await runCli(["personal", "documents", "restore", PAGE_ID], { notion })
  expect(restored.json().item).toMatchObject({ page: { id: PAGE_ID, in_trash: false } })
  expect(notion.calls.at(-1)?.body).toEqual({ in_trash: false })
  expect(asked).toHaveLength(2)
  expect(notion.refusals).toEqual([])
})

it("documents delete with nobody to ask needs the owner's yes; an allow in the profile lets it through", async () => {
  const notion = fakeNotion()
  const headless = await runCli(["personal", "documents", "delete", PAGE_ID, "--json"], { notion })
  expect(headless.json()).toMatchObject({ error: { code: "confirmation_required" } })
  expect(notion.calls).toEqual([])
  withPermissions({ "documents.delete": "allow" })
  const allowed = await runCli(["personal", "documents", "delete", PAGE_ID, "--json"], { notion })
  expect(allowed.code).toBe(0)
  expect(notion.calls).toHaveLength(1)
})

it("--dry-run names the write's permission and the API key it also checks, and sends nothing", async () => {
  const notion = fakeNotion()
  const preview = await runCli(["personal", "documents", "delete", PAGE_ID, "--dry-run", "--json"], { notion })
  expect(preview.code).toBe(0)
  const text = JSON.stringify(preview.json())
  expect(text).toContain("documents.delete")
  expect(text).toContain("api.patch-page")
  const update = await runCli(["personal", "documents", "update", PAGE_ID, "--text", "Fake", "--dry-run", "--json"], {
    notion,
  })
  expect(JSON.stringify(update.json())).toContain("--allow-deleting-content")
  expect(notion.calls).toEqual([])
})

it("a deny on the write, on the API operation it sends, or the read-only lock, stops it before any request", async () => {
  const notion = fakeNotion()
  const create = ["personal", "documents", "create", "--parent", PAGE_ID, "--text", "Fake", "--json"]
  withPermissions({ "documents.create": "deny" })
  expect((await runCli(create, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  withPermissions({ "api.post-page": "deny" })
  expect((await runCli(create, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  rmSync(configFile)
  const locked = await runCli(create, { notion, env: { WCNOTION_READ_ONLY: "1" } })
  expect(locked.code).toBe(5)
  expect(notion.calls).toEqual([])
})

it("a write Notion failed on or answered unreadably is outcome_unknown with its operation_id, sent once", async () => {
  const failed = fakeNotion({ failures: [notionError(503, "service_unavailable")] })
  const lost = await runCli(["personal", "documents", "restore", PAGE_ID, "--json"], { notion: failed })
  expect(lost.json()).toMatchObject({
    error: { code: "outcome_unknown", details: { operation_id: expect.any(String) } },
  })
  expect(failed.calls).toHaveLength(1)
  const garbled = fakeNotion({ failures: [{ status: 200, body: { object: "list" } }] })
  const unread = await runCli(["personal", "documents", "restore", PAGE_ID, "--json"], { notion: garbled })
  expect(unread.json()).toMatchObject({ error: { code: "outcome_unknown" } })
  const refused = fakeNotion({ failures: [notionError(400, "validation_error")] })
  const create = ["personal", "documents", "create", "--parent", PAGE_ID, "--json"]
  expect((await runCli(create, { notion: refused })).json()).toMatchObject({ error: { code: "validation_error" } })
})

it("a page not shared with the token is not_found, and the write is journaled by its key, never its text", async () => {
  const notion = fakeNotion()
  const missing = await runCli(["personal", "documents", "restore", "abababab-0000-4000-8000-000000000099", "--json"], {
    notion,
  })
  expect(missing.json()).toMatchObject({ error: { code: "not_found", reason: "notion.not-shared" } })
  await runCli(["personal", "documents", "update", PAGE_ID, "--text", "Fake private wirecat-text-marker"], {
    notion,
  })
  const files = [...new Set([process.env.HOME ?? "", tmpdir()])].flatMap(filesUnder)
  // The run record keeps the words typed unless record_input is off; the send journal never keeps the text.
  const journal = files.filter((path) => path.includes(`${sep}sends${sep}`)).map((path) => readFileSync(path, "utf8"))
  expect(journal.some((text) => text.includes("documents.update"))).toBe(true)
  expect(journal.filter((text) => text.includes("wirecat-text-marker"))).toEqual([])
  expect(files.map((path) => readFileSync(path, "utf8")).filter((text) => text.includes(FAKE_TOKEN))).toEqual([])
})

it("raw API writes that trash or allow deleting content check documents.delete too; deny stops them", async () => {
  const notion = fakeNotion()
  withPermissions({ "documents.delete": "deny" })
  const trash = ["personal", "api", "patch-page", "--page-id", PAGE_ID, "--body", '{"in_trash":true}', "--json"]
  expect((await runCli(trash, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  const markdown = JSON.stringify({
    type: "replace_content",
    replace_content: { new_str: "Fake", allow_deleting_content: true },
  })
  const drop = ["personal", "api", "update-page-markdown", "--page-id", PAGE_ID, "--body", markdown, "--json"]
  expect((await runCli(drop, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  expect(notion.calls).toEqual([])
  const restore = ["personal", "api", "patch-page", "--page-id", PAGE_ID, "--body", '{"in_trash":false}', "--json"]
  expect((await runCli(restore, { notion })).code).toBe(0)
  expect(notion.calls).toHaveLength(1)
})

it("a credential file is never read into a page", async () => {
  const notion = fakeNotion()
  const key = join(process.env.HOME ?? "", ".ssh", "id_ed25519")
  mkdirSync(join(key, ".."), { recursive: true })
  writeFileSync(key, "wirecat fake key")
  const refused = await runCli(["personal", "documents", "create", "--parent", PAGE_ID, "--file", key, "--json"], {
    notion,
  })
  expect(refused.json()).toMatchObject({ error: { code: "validation_error", reason: "file.refused-place" } })
  expect(notion.calls).toEqual([])
})

it("documents.delete deny stops every raw call that deletes: erase, archive, a removed property, a deleted block", async () => {
  withPermissions({ "documents.delete": "deny", "api.delete-a-block": "allow" })
  const source = "eeeeeeee-0000-4000-8000-000000000005"
  for (const [operation, flag, id, body] of [
    ["patch-page", "--page-id", PAGE_ID, '{"erase_content":true}'],
    ["patch-page", "--page-id", PAGE_ID, '{"is_archived":true}'],
    ["update-a-block", "--block-id", PAGE_ID, '{"in_trash":true}'],
    ["update-a-data-source", "--data-source-id", source, '{"properties":{"Status":null}}'],
    ["delete-a-block", "--block-id", PAGE_ID, undefined],
    ["delete-a-comment", "--comment-id", PAGE_ID, undefined],
  ] as const) {
    const notion = fakeNotion()
    const argv = ["personal", "api", operation, flag, id, ...(body ? ["--body", body] : []), "--json"]
    const ran = await runCli(argv, { notion })
    expect(ran.json(), `${operation} ${body ?? ""}`).toMatchObject({ error: { code: "permission_error" } })
    expect(notion.calls).toEqual([])
  }
})

it.runIf(process.platform === "linux")(
  "a system file, such as the process's environment, is never read into a page",
  async () => {
    const notion = fakeNotion()
    for (const file of ["/proc/self/environ", "/dev/null"]) {
      const ran = await runCli(["personal", "documents", "create", "--parent", PAGE_ID, "--file", file, "--json"], {
        notion,
        env: { WIRECAT_REVIEW_MARKER: "wirecat-env-marker" },
      })
      expect(ran.json(), file).toMatchObject({ error: { code: "validation_error", reason: "file.refused-place" } })
    }
    const link = join(tmpdir(), "environ-link.md")
    rmSync(link, { force: true })
    symlinkSync("/proc/self/environ", link)
    const linked = await runCli(["personal", "documents", "create", "--parent", PAGE_ID, "--file", link, "--json"], {
      notion,
    })
    expect(linked.json()).toMatchObject({ error: { reason: "file.refused-place" } })
    expect(notion.calls).toEqual([])
  },
)
