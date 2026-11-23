import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, expect, it } from "vitest"
import { DATABASE_ID, fakeNotion, notionError, PAGE_ID, PERSON_ID, SOURCE_ID } from "./testing/fake-notion.js"
import { runCli } from "./testing/harness.js"

const TEMPLATE_ID = "7e7e7e7e-0000-4000-8000-000000000071"
const RELATED = "abababab-0000-4000-8000-000000000041"

const configFile = join(process.env.WCNOTION_CONFIG_DIR ?? "", "config.json")
const withPermissions = (permissions: Record<string, string>) => {
  mkdirSync(join(configFile, ".."), { recursive: true })
  writeFileSync(configFile, JSON.stringify({ profiles: { personal: { permissions } } }))
}
afterEach(() => rmSync(configFile, { force: true }))

const text = (content: string) => [{ type: "text", text: { content } }]

it("documents create --into adds a row to the database's one data source, each value typed by its schema", async () => {
  const notion = fakeNotion()
  const made = await runCli(
    [
      "personal",
      "documents",
      "create",
      "--into",
      DATABASE_ID,
      "--title",
      "Test task",
      "--field",
      "Status=Done",
      "--field",
      "Tags=Test tag, Other tag",
      "--field",
      "Due=2026-12-01/2026-12-05",
      "--field",
      "Owner=me, test.person@example.invalid",
      "--field",
      "Done=yes",
      "--field",
      "Estimate=2.5",
      "--field",
      "Notes=Fake note",
    ],
    { notion },
  )
  expect(made.code).toBe(0)
  expect(made.json().item).toMatchObject({
    operation_id: expect.any(String),
    data_source_id: SOURCE_ID,
    template_pending: false,
    page: { title: "Test task" },
  })
  const create = notion.calls.find((call) => call.method === "POST" && call.path === "/v1/pages")
  expect(create?.body).toEqual({
    parent: { type: "data_source_id", data_source_id: SOURCE_ID },
    properties: {
      Status: { status: { name: "Done" } },
      Tags: { multi_select: [{ name: "Test tag" }, { name: "Other tag" }] },
      Due: { date: { start: "2026-12-01", end: "2026-12-05" } },
      Owner: { people: [{ id: PERSON_ID }, { id: PERSON_ID }] },
      Done: { checkbox: true },
      Estimate: { number: 2.5 },
      Notes: { rich_text: text("Fake note") },
      Name: { title: text("Test task") },
    },
  })
  expect(notion.refusals).toEqual([])
})

it("documents create --into takes a template by name, id or default, and says Notion fills the text in after", async () => {
  const notion = fakeNotion({ templates: [{ id: TEMPLATE_ID, name: "Weekly review", is_default: true }] })
  const byName = await runCli(
    ["personal", "documents", "create", "--into", DATABASE_ID, "--title", "T", "--from-template", "weekly review"],
    {
      notion,
    },
  )
  expect(byName.json().item).toMatchObject({ template_pending: true })
  expect(notion.calls.at(-1)?.body).toMatchObject({ template: { type: "template_id", template_id: TEMPLATE_ID } })
  await runCli(
    ["personal", "documents", "create", "--into", DATABASE_ID, "--title", "T", "--from-template", "default"],
    {
      notion,
    },
  )
  expect(notion.calls.at(-1)?.body).toMatchObject({ template: { type: "default" } })
  const missing = await runCli(
    [
      "personal",
      "documents",
      "create",
      "--into",
      DATABASE_ID,
      "--title",
      "T",
      "--from-template",
      "Nothing like it",
      "--json",
    ],
    { notion },
  )
  expect(missing.json()).toMatchObject({ error: { code: "validation_error", reason: "notion.value-invalid" } })
  const both = await runCli(
    [
      "personal",
      "documents",
      "create",
      "--into",
      DATABASE_ID,
      "--from-template",
      "default",
      "--text",
      "Fake",
      "--json",
    ],
    { notion },
  )
  expect(both.json()).toMatchObject({ error: { code: "validation_error" } })
  expect(notion.calls.filter((call) => call.method === "POST" && call.path === "/v1/pages")).toHaveLength(2)
})

it("documents create --into refuses a value its property cannot take before it writes anything", async () => {
  const notion = fakeNotion()
  const create = (...set: string[]) =>
    runCli(
      ["personal", "documents", "create", "--into", DATABASE_ID, ...set.flatMap((one) => ["--field", one]), "--json"],
      { notion },
    )
  for (const [value, says] of [
    ["Nope=1", 'no property "Nope"'],
    ["Status=Unknown", 'no status "Unknown"'],
    ["Estimate=many", "takes a number"],
    ["Due=tomorrow", "takes a date"],
    ["Done=maybe", "true or false"],
    ["Score=2", "Notion sets itself"],
    ["Owner=nobody@example.invalid", "no person with that email"],
  ]) {
    const refused = await create(value as string)
    expect(refused.json()).toMatchObject({ error: { code: "validation_error" } })
    expect((refused.json().error as { message: string }).message).toContain(says)
  }
  expect((await create("Done=true", "Done=false")).json()).toMatchObject({ error: { message: "Done is given twice" } })
  const related = Array.from({ length: 101 }, () => RELATED).join(",")
  const schemaless = fakeNotion()
  const many = await runCli(["personal", "documents", "update", PAGE_ID, "--field", `Owner=${related}`, "--json"], {
    notion: schemaless,
  })
  expect(many.json()).toMatchObject({ error: { code: "validation_error" } })
  expect(notion.calls.filter((call) => call.method !== "GET")).toEqual([])
})

it("a row in a database of several data sources needs one of their ids, and none is picked", async () => {
  const notion = fakeNotion({ dataSources: 2 })
  const create = (into: string) =>
    runCli(["personal", "documents", "create", "--into", into, "--title", "T", "--json"], { notion })
  expect((await create(DATABASE_ID)).json()).toMatchObject({
    error: { reason: "notion.data-source-ambiguous", details: { data_source_ids: [SOURCE_ID, expect.any(String)] } },
  })
  expect(notion.calls.filter((call) => call.method === "POST")).toEqual([])
  expect((await create(SOURCE_ID)).code).toBe(0)
  expect(notion.calls.at(-1)?.body).toMatchObject({ parent: { data_source_id: SOURCE_ID } })
})

it("documents update --field changes the named values of a row, and clears one given empty", async () => {
  const notion = fakeNotion()
  const changed = await runCli(
    ["personal", "documents", "update", PAGE_ID, "--field", "Status=Done", "--field", "Due=", "--field", "Tags="],
    { notion },
  )
  expect(changed.code).toBe(0)
  expect(changed.json().item).toMatchObject({ operation_id: expect.any(String), page: { id: PAGE_ID } })
  expect(notion.calls.at(-1)).toMatchObject({
    method: "PATCH",
    path: `/v1/pages/${PAGE_ID}`,
    body: { properties: { Status: { status: { name: "Done" } }, Due: { date: null }, Tags: { multi_select: [] } } },
  })
  const nothing = await runCli(["personal", "documents", "update", PAGE_ID, "--json"], { notion })
  expect(nothing.json()).toMatchObject({ error: { code: "validation_error" } })
})

it("rows list filters by each --filter as the property's type takes it, and lists the rows' values", async () => {
  const notion = fakeNotion()
  const found = await runCli(
    [
      "personal",
      "rows",
      "list",
      DATABASE_ID,
      "--filter",
      "Status=Done",
      "--filter",
      "Due<2026-12-01",
      "--filter",
      "Owner=me",
      "--filter",
      "Tags~Test tag",
      "--filter",
      "Notes=",
      "--json",
    ],
    { notion },
  )
  expect(found.code).toBe(0)
  expect(found.json()).toMatchObject({ items: [{ id: PAGE_ID, title: "Test row", properties: {} }] })
  expect(notion.calls.at(-1)).toMatchObject({
    path: `/v1/data_sources/${SOURCE_ID}/query`,
    body: {
      page_size: 50,
      filter: {
        and: [
          { property: "Status", status: { equals: "Done" } },
          { property: "Due", date: { before: "2026-12-01" } },
          { property: "Owner", people: { contains: "me" } },
          { property: "Tags", multi_select: { contains: "Test tag" } },
          { property: "Notes", rich_text: { is_empty: true } },
        ],
      },
    },
  })
  const one = await runCli(["personal", "rows", "list", DATABASE_ID, "--filter", "Estimate>=3", "--json"], { notion })
  expect(one.code).toBe(0)
  expect(notion.calls.at(-1)?.body).toMatchObject({
    filter: { property: "Estimate", number: { greater_than_or_equal_to: 3 } },
  })
  const wrong = await runCli(["personal", "rows", "list", DATABASE_ID, "--filter", "Status>Done", "--json"], { notion })
  expect(wrong.json()).toMatchObject({ error: { code: "validation_error", details: { operators: ["=", "!="] } } })
  const all = await runCli(["personal", "rows", "list", DATABASE_ID, "--json"], { notion })
  expect(all.code).toBe(0)
  expect(notion.calls.at(-1)?.body).toEqual({ page_size: 50 })
  expect(notion.refusals).toEqual([])
})

it("databases show gives each data source's templates, the default one marked", async () => {
  const notion = fakeNotion({ templates: [{ id: TEMPLATE_ID, name: "Weekly review", is_default: true }] })
  const shown = await runCli(["personal", "databases", "show", DATABASE_ID, "--json"], { notion })
  expect(shown.json().item).toMatchObject({
    data_sources: [{ templates: [{ id: TEMPLATE_ID, name: "Weekly review", is_default: true }] }],
  })
  expect(notion.calls.at(-1)).toMatchObject({ path: `/v1/data_sources/${SOURCE_ID}/templates` })
})

it("row writes go through their permissions, the API keys they send, --dry-run and the lock", async () => {
  const notion = fakeNotion()
  const create = ["personal", "documents", "create", "--into", DATABASE_ID, "--title", "T", "--json"]
  const update = ["personal", "documents", "update", PAGE_ID, "--field", "Done=true", "--json"]
  withPermissions({ "documents.create": "deny" })
  expect((await runCli(create, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  withPermissions({ "documents.update": "deny" })
  expect((await runCli(update, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  withPermissions({ "api.post-page": "deny" })
  expect((await runCli(create, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  withPermissions({ "api.patch-page": "deny" })
  expect((await runCli(update, { notion })).json()).toMatchObject({ error: { code: "permission_error" } })
  rmSync(configFile)
  const preview = await runCli([...create, "--dry-run"], { notion })
  expect(preview.code).toBe(0)
  expect(JSON.stringify(preview.json())).toContain("api.post-page")
  const locked = await runCli(update, { notion, env: { WCNOTION_READ_ONLY: "1" } })
  expect(locked.code).toBe(5)
  expect(notion.calls).toEqual([])
})

it("a row write Notion failed on is outcome_unknown, a failed read before it keeps its own code and writes nothing", async () => {
  const failedRead = fakeNotion({ failWith: notionError(404, "object_not_found") })
  const read = await runCli(["personal", "documents", "update", PAGE_ID, "--field", "Done=true", "--json"], {
    notion: failedRead,
  })
  expect(read.json()).toMatchObject({ error: { code: "not_found" } })
  expect(failedRead.calls).toHaveLength(1)
  const unsure = fakeNotion({
    failures: [
      { status: 200, body: { object: "database", data_sources: [{ id: SOURCE_ID }] } },
      { status: 200, body: { object: "data_source", properties: {} } },
      notionError(503, "service_unavailable"),
    ],
  })
  const write = await runCli(["personal", "documents", "create", "--into", DATABASE_ID, "--json"], { notion: unsure })
  expect(write.json()).toMatchObject({
    error: { code: "outcome_unknown", details: { operation_id: expect.any(String) } },
  })
})

it("rows list pages with --limit and --cursor and takes a data source id, and a row takes its text or a title", async () => {
  const notion = fakeNotion()
  const queried = await runCli(
    ["personal", "rows", "list", SOURCE_ID, "--limit", "5", "--cursor", "fake-cursor", "--json"],
    { notion },
  )
  expect(queried.code).toBe(0)
  expect(notion.calls.at(-1)).toMatchObject({
    path: `/v1/data_sources/${SOURCE_ID}/query`,
    body: { page_size: 5, start_cursor: "fake-cursor" },
  })
  const file = join(process.env.WCNOTION_CONFIG_DIR ?? "", "..", "row.md")
  writeFileSync(file, "Fake row text")
  const made = await runCli(
    ["personal", "documents", "create", "--into", DATABASE_ID, "--title", "T", "--file", file],
    { notion },
  )
  expect(made.code).toBe(0)
  expect(notion.calls.at(-1)?.body).toMatchObject({ markdown: "Fake row text", markdown_version: "v2" })
  const renamed = await runCli(["personal", "documents", "rename", PAGE_ID, "Test new title"], { notion })
  expect(renamed.json().item).toMatchObject({ page: { title: "Test new title" } })
  expect(notion.calls.at(-1)?.body).toEqual({ properties: { Name: { title: text("Test new title") } } })
  const page = await runCli(
    ["personal", "documents", "create", "--parent", PAGE_ID, "--field", "Done=true", "--json"],
    { notion },
  )
  expect(page.json()).toMatchObject({ error: { code: "validation_error" } })
  const nowhere = await runCli(["personal", "documents", "create", "--title", "T", "--json"], { notion })
  expect(nowhere.json()).toMatchObject({ error: { code: "validation_error" } })
})
