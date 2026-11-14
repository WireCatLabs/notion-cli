import { expect, it, vi } from "vitest"
import { runCli } from "../testing/harness.js"

const loaded = vi.hoisted(() => new Set<string>())
vi.mock("../generated/definitions.js", async (original) => {
  loaded.add("definitions")
  return original()
})
vi.mock("../generated/schemas.js", async (original) => {
  loaded.add("schemas")
  return original()
})

it("loads the generated schemas and definitions only when an api command needs them", async () => {
  expect((await runCli(["commands", "--json"])).code).toBe(0)
  expect((await runCli(["api", "list", "--json"])).code).toBe(0)
  expect(loaded).toEqual(new Set())
  expect((await runCli(["api", "show", "post-search", "--json"])).code).toBe(0)
  expect(loaded).toEqual(new Set(["definitions"]))
  expect((await runCli(["personal", "api", "post-search", "--body", "{}", "--json"])).code).toBe(0)
  expect(loaded).toEqual(new Set(["definitions", "schemas"]))
})
