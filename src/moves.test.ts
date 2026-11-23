import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { DATABASE_ID, DISCUSSION_ID, fakeNotion, notionError, PAGE_ID, SOURCE_ID } from "./testing/fake-notion.js"
import { runCli } from "./testing/harness.js"

const OTHER = "abababab-0000-4000-8000-000000000051"
const COMMENT_ID = "c0c0c0c0-0000-4000-8000-000000000900"

const configFile = join(process.env.WCNOTION_CONFIG_DIR ?? "", "config.json")
const withPermissions = (permissions: Record<string, string>) => {
  mkdirSync(join(configFile, ".."), { recursive: true })
  writeFileSync(configFile, JSON.stringify({ profiles: { personal: { permissions } } }))
}
afterEach(() => rmSync(configFile, { force: true }))

const answering = (asked: string[], reply: string) => (question: string) => {
  asked.push(question)
  return reply
}

const twoPages = () =>
  fakeNotion({ pages: { [PAGE_ID]: { markdown: "# Test page" }, [OTHER]: { markdown: "# Test other" } } })

it("documents move puts a page under another page, or into a database's data source", async () => {
  const notion = twoPages()
  const under = await runCli(["personal", "documents", "move", PAGE_ID, "--parent", OTHER], { notion })
  expect(under.code).toBe(0)
  expect(under.json().item).toMatchObject({
    operation_id: expect.any(String),
    page: { id: PAGE_ID, parent: { type: "page", id: OTHER } },
  })
  expect(notion.calls.at(-1)).toMatchObject({
    method: "POST",
    path: `/v1/pages/${PAGE_ID}/move`,
    body: { parent: { type: "page_id", page_id: OTHER } },
  })
  const into = await runCli(["personal", "documents", "move", PAGE_ID, "--into", DATABASE_ID], { notion })
  expect(into.json().item).toMatchObject({ page: { parent: { type: "data_source", id: SOURCE_ID } } })
  expect(notion.calls.at(-1)?.body).toEqual({ parent: { type: "data_source_id", data_source_id: SOURCE_ID } })
  expect(notion.refusals).toEqual([])
})

it("documents move reads Notion's short answer, and refuses no place, two places or the page itself", async () => {
  const notion = fakeNotion({
    partialAnswers: true,
    pages: { [PAGE_ID]: { markdown: "x" }, [OTHER]: { markdown: "y" } },
  })
  const moved = await runCli(["personal", "documents", "move", PAGE_ID, "--parent", OTHER], { notion })
  expect(moved.code).toBe(0)
  for (const wrong of [[], ["--parent", OTHER, "--into", DATABASE_ID], ["--parent", PAGE_ID]]) {
    const refused = await runCli(["personal", "documents", "move", PAGE_ID, ...wrong, "--json"], { notion })
    expect(refused.json()).toMatchObject({ error: { code: "validation_error" } })
  }
  expect(notion.calls).toHaveLength(1)
})

it("documents rename sets the title by the page's own title property", async () => {
  const notion = fakeNotion()
  const renamed = await runCli(["personal", "documents", "rename", PAGE_ID, "Test renamed"], { notion })
  expect(renamed.code).toBe(0)
  expect(renamed.json().item).toMatchObject({ page: { id: PAGE_ID, title: "Test renamed" } })
  expect(notion.calls.at(-1)).toMatchObject({
    method: "PATCH",
    body: { properties: { Name: { title: [{ type: "text", text: { content: "Test renamed" } }] } } },
  })
  const empty = await runCli(["personal", "documents", "rename", PAGE_ID, " ", "--json"], { notion })
  expect(empty.json()).toMatchObject({ error: { code: "validation_error" } })
})

it("documents update sets an icon and a cover alone, or before the text, and takes them away with none", async () => {
  const notion = fakeNotion()
  const styled = await runCli(
    ["personal", "documents", "update", PAGE_ID, "--emoji", "📌", "--cover", "https://example.com/cover.png"],
    { notion },
  )
  expect(styled.code).toBe(0)
  expect(notion.calls.map(({ method, body }) => ({ method, body }))).toEqual([
    {
      method: "PATCH",
      body: {
        icon: { type: "emoji", emoji: "📌" },
        cover: { type: "external", external: { url: "https://example.com/cover.png" } },
      },
    },
  ])
  const both = await runCli(["personal", "documents", "update", PAGE_ID, "--emoji", "none", "--text", "# Fake"], {
    notion,
  })
  expect(both.code).toBe(0)
  // The values go first; the text is read before it is replaced, so its earlier version is kept.
  const writes = notion.calls.slice(1).filter(({ method }) => method === "PATCH")
  expect(writes.map(({ path, body }) => [path, body?.icon])).toEqual([
    [`/v1/pages/${PAGE_ID}`, null],
    [`/v1/pages/${PAGE_ID}/markdown`, undefined],
  ])
  expect(notion.calls[1]?.method).toBe("PATCH")
  const sent = notion.calls.length
  for (const wrong of [
    ["--emoji", "not an emoji"],
    ["--emoji", "https://example.com/a.png"],
    ["--cover", "📌"],
    ["--cover", "http://example.com/a.png"],
  ]) {
    const refused = await runCli(["personal", "documents", "update", PAGE_ID, ...wrong, "--json"], { notion })
    expect(refused.json()).toMatchObject({ error: { code: "validation_error" } })
  }
  expect(notion.calls).toHaveLength(sent)
})

it("move, rename and an icon check the API operations they send, and stop at a deny before any request", async () => {
  const notion = twoPages()
  withPermissions({ "api.move-page": "deny" })
  const move = ["personal", "documents", "move", PAGE_ID, "--parent", OTHER, "--json"]
  expect((await runCli(move, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  withPermissions({ "api.patch-page": "deny" })
  const rename = ["personal", "documents", "rename", PAGE_ID, "Test", "--json"]
  expect((await runCli(rename, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  const icon = ["personal", "documents", "update", PAGE_ID, "--emoji", "📌", "--json"]
  expect((await runCli(icon, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  rmSync(configFile)
  const preview = await runCli([...move, "--dry-run"], { notion })
  expect(JSON.stringify(preview.json())).toContain("api.move-page")
  expect(notion.calls).toEqual([])
})

it("a move Notion failed on is outcome_unknown, and the page's own refusal keeps its code", async () => {
  // The first answer is the database read, which a data source id is not: then the id is the data source.
  const notion = fakeNotion({
    failures: [notionError(404, "object_not_found"), notionError(503, "service_unavailable")],
  })
  const lost = await runCli(["personal", "documents", "move", PAGE_ID, "--into", SOURCE_ID, "--json"], {
    notion,
  })
  expect(lost.json()).toMatchObject({
    error: { code: "outcome_unknown", details: { operation_id: expect.any(String) } },
  })
  const refused = fakeNotion({ failures: [notionError(404, "object_not_found"), notionError(400, "validation_error")] })
  const database = await runCli(["personal", "documents", "move", PAGE_ID, "--into", SOURCE_ID, "--json"], {
    notion: refused,
  })
  expect(database.json()).toMatchObject({ error: { code: "validation_error" } })
})

it("comments edit changes a comment this connection posted and keeps its earlier text in the answer", async () => {
  const notion = fakeNotion({ discussions: [DISCUSSION_ID] })
  const edited = await runCli(["personal", "comments", "edit", COMMENT_ID, "--text", "Fake **fixed** text"], {
    notion,
  })
  expect(edited.code).toBe(0)
  expect(edited.json().item).toMatchObject({
    operation_id: expect.any(String),
    comment: { id: COMMENT_ID, discussion_id: DISCUSSION_ID },
    previous_text: "Fake earlier comment",
  })
  expect(notion.calls.at(-1)).toMatchObject({
    method: "PATCH",
    path: `/v1/comments/${COMMENT_ID}`,
    body: { markdown: "Fake **fixed** text", markdown_version: "v2" },
  })
  const short = fakeNotion({ discussions: [DISCUSSION_ID], partialAnswers: true })
  const partial = await runCli(["personal", "comments", "edit", COMMENT_ID, "--file", "-"], {
    notion: short,
    stdin: "Fake from stdin",
  })
  expect(short.calls.at(-1)?.body).toMatchObject({ markdown: "Fake from stdin" })
  expect(partial.json().item).toMatchObject({ comment: { id: COMMENT_ID, discussion_id: DISCUSSION_ID } })
})

it("comments delete asks first, deletes a comment this connection posted, and answers its text", async () => {
  const notion = fakeNotion({ discussions: [DISCUSSION_ID], partialAnswers: true })
  const asked: string[] = []
  const no = await runCli(["personal", "comments", "delete", COMMENT_ID], { notion, answer: answering(asked, "n") })
  expect(no.code).not.toBe(0)
  expect(notion.calls).toEqual([])
  const yes = await runCli(["personal", "comments", "delete", COMMENT_ID], { notion, answer: answering(asked, "y") })
  expect(yes.code).toBe(0)
  expect(asked.at(-1)).toContain("documents.delete")
  expect(yes.json().item).toMatchObject({ comment: { id: COMMENT_ID }, previous_text: "Fake earlier comment" })
  expect(notion.calls.at(-1)).toMatchObject({ method: "DELETE", path: `/v1/comments/${COMMENT_ID}` })
  expect(notion.comments).toEqual([])
  expect(notion.refusals).toEqual([])
})

it("someone else's comment is refused before Notion is asked to change or delete it", async () => {
  const notion = fakeNotion({ discussions: [DISCUSSION_ID], othersComments: true })
  withPermissions({ "documents.delete": "allow", "api.delete-a-comment": "allow" })
  for (const command of [
    ["edit", COMMENT_ID, "--text", "Fake"],
    ["delete", COMMENT_ID],
  ]) {
    const refused = await runCli(["personal", "comments", ...command, "--json"], { notion })
    expect(refused.json()).toMatchObject({ error: { code: "permission_error", reason: "notion.not-own-comment" } })
  }
  expect(notion.calls.filter((call) => call.method !== "GET")).toEqual([])
})

it("comments delete stops at a deny on documents.delete or on the raw call, and --dry-run sends nothing", async () => {
  const notion = fakeNotion({ discussions: [DISCUSSION_ID] })
  const remove = ["personal", "comments", "delete", COMMENT_ID, "--json"]
  for (const key of ["documents.delete", "api.delete-a-comment", "comments.delete"]) {
    withPermissions({ "documents.delete": "allow", "api.delete-a-comment": "allow", [key]: "deny" })
    expect((await runCli(remove, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  }
  withPermissions({ "api.update-a-comment": "deny" })
  const edit = ["personal", "comments", "edit", COMMENT_ID, "--text", "Fake", "--json"]
  expect((await runCli(edit, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  rmSync(configFile)
  const preview = await runCli([...remove, "--dry-run"], { notion })
  expect(JSON.stringify(preview.json())).toContain("api.delete-a-comment")
  expect(notion.calls).toEqual([])
})
