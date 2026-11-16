import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { changesAuthorityAt, type RunOptions, readsOverMcpAt } from "@wirecat/cli-core/cli"
import { mcpOverStdio, ownCatalogue } from "@wirecat/cli-core/testing"
import { expect, it } from "vitest"
import { permissions } from "./config.js"
import type { ServiceEnvironment } from "./context.js"
import { IDENTITY } from "./identity.js"
import { createProgram, run } from "./program.js"
import { fakeNotion, PAGE_ID } from "./testing/fake-notion.js"
import { runCli, signedIn } from "./testing/harness.js"

it("mcp serve offers search, read and write, and runs a command through the CLI", async () => {
  const mcp = await mcpOverStdio((streams) => run(["personal", "mcp", "serve"], { tty: false, ...streams }))
  try {
    expect((await mcp.tools()).sort()).toEqual(["notion_read", "notion_tools_search", "notion_write"])
    const doctor = await mcp.call("notion_read", { command: "doctor" })
    expect(doctor.body).toMatchObject({ item: { version: IDENTITY.version } })
  } finally {
    expect(await mcp.close()).toBe(0)
  }
})

it("pins this CLI's own commands an agent can find, as reads or writes", async () => {
  const program = createProgram()
  const options = {
    includeUnavailable: true,
    exclude: [["mcp"]],
    authority: changesAuthorityAt(program),
    fetchOnly: readsOverMcpAt(program),
    permissions,
  }
  await expect(`${JSON.stringify(ownCatalogue(program, options), null, 2)}\n`).toMatchFileSnapshot(
    "../contracts/mcp-catalogue.json",
  )
})

it("mcp serve refuses a --permission that names no command, and a --profiles this computer lacks", async () => {
  const unknown = await runCli(["personal", "mcp", "serve", "--permission", "documents.nope=deny"])
  expect(unknown.code).toBe(2)
  expect(unknown.err).toContain("documents.nope")
  const missing = await runCli(["mcp", "serve", "--profiles", "nope"])
  expect(missing.code).toBe(2)
  expect(missing.err).toContain("nope")
})

it("mcp config prints an entry that serves the named profile, or every profile only when told", async () => {
  const one = await runCli(["personal", "mcp", "config", "--permission", "documents.get=deny", "--json"])
  const entry = one.json().item as { config: { mcpServers: Record<string, { args: string[] }> } }
  expect(entry.config.mcpServers["notion-personal"]?.args.slice(-5)).toEqual([
    "personal",
    "mcp",
    "serve",
    "--permission",
    "documents.get=deny",
  ])
  const all = await runCli(["mcp", "config", "--profiles", "all", "--json"])
  expect(JSON.stringify(all.json())).toContain('"--profiles","all"')
})

it("mcp revoke answers for the profile it names", async () => {
  const revoked = await runCli(["personal", "mcp", "revoke", "--json"])
  expect(revoked.code).toBe(0)
  expect(revoked.json().item).toMatchObject({ profile: "personal" })
})

it("doctor --online answers even when npm cannot be reached", async () => {
  const online = await runCli(["doctor", "--online", "--json"])
  expect(online.code).toBe(0)
  expect(online.json().item).toMatchObject({ version: IDENTITY.version, online: expect.any(Object) })
})

it("a denied command is offered as unavailable and refused before any request (WC-PERM-23)", async () => {
  const file = join(process.env.WCNOTION_CONFIG_DIR ?? "", "config.json")
  mkdirSync(join(file, ".."), { recursive: true })
  writeFileSync(file, JSON.stringify({ profiles: { personal: { permissions: { "documents.get": "deny" } } } }))
  const service = fakeNotion()
  const options: RunOptions & ServiceEnvironment = { tty: false, keyring: signedIn(), fetch: service.fetch }
  const mcp = await mcpOverStdio((streams) => run(["personal", "mcp", "serve"], { ...options, ...streams }))
  try {
    const found = await mcp.call("notion_tools_search", { query: "documents get" })
    expect(found.body).toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({
          command: "documents get",
          availability: expect.objectContaining({ available: false }),
        }),
      ]),
    })
    const listed = await mcp.call("notion_read", { command: "documents get", arguments: { page: PAGE_ID } })
    expect(listed.isError).toBe(true)
    expect(JSON.stringify(listed.body)).toContain("permission_error")
    expect(service.calls).toEqual([])
  } finally {
    expect(await mcp.close()).toBe(0)
    rmSync(file, { force: true })
  }
})

it("mcp serve offers the shared documents commands by what they read and write", async () => {
  const mcp = await mcpOverStdio((streams) =>
    run(["personal", "mcp", "serve"], { tty: false, keyring: signedIn(), fetch: fakeNotion().fetch, ...streams }),
  )
  try {
    const writes = async (query: string) => {
      const found = (await mcp.call("notion_tools_search", { query })).body as {
        items: { command: string; writes: boolean }[]
      }
      return Object.fromEntries(found.items.map((item) => [item.command, item.writes]))
    }
    expect(await writes("tags")).toMatchObject({ "tags add": true, "tags list": false })
    expect(await writes("sync")).toMatchObject({ sync: false, "folders remove": true })
    expect(await writes("folders")).toMatchObject({ "folders add": true, "folders browse": false })
    expect(await writes("documents")).toMatchObject({ "documents list": false, "documents get": false })
    const listed = await mcp.call("notion_read", { command: "folders list" })
    expect(listed.body).toMatchObject({ items: [{ id: "notion-workspace" }] })
    expect(JSON.stringify((await mcp.call("notion_read", { command: "tags add" })).body)).toMatch(/notion_write|write/u)
  } finally {
    expect(await mcp.close()).toBe(0)
  }
})

it("an agent writes pages through the write tool; a delete at ask goes ahead there, at deny it is refused", async () => {
  const notion = fakeNotion()
  const options: RunOptions & ServiceEnvironment = { tty: false, keyring: signedIn(), fetch: notion.fetch }
  const mcp = await mcpOverStdio((streams) => run(["personal", "mcp", "serve"], { ...options, ...streams }))
  try {
    const viaRead = await mcp.call("notion_read", { command: "documents restore", arguments: { page: PAGE_ID } })
    expect(viaRead.isError).toBe(true)
    expect(notion.calls).toEqual([])
    const restored = await mcp.call("notion_write", { command: "documents restore", arguments: { page: PAGE_ID } })
    expect(restored.body).toMatchObject({ item: { page: { id: PAGE_ID, in_trash: false } } })
    const deleted = await mcp.call("notion_write", { command: "documents delete", arguments: { page: PAGE_ID } })
    expect(deleted.body).toMatchObject({ item: { page: { id: PAGE_ID, in_trash: true } } })
  } finally {
    expect(await mcp.close()).toBe(0)
  }
  const denied = await mcpOverStdio((streams) =>
    run(["personal", "mcp", "serve", "--permission", "documents.delete=deny"], { ...options, ...streams }),
  )
  try {
    const refused = await denied.call("notion_write", { command: "documents delete", arguments: { page: PAGE_ID } })
    expect(refused.isError).toBe(true)
    expect(JSON.stringify(refused.body)).toContain("permission_error")
    expect(notion.calls).toHaveLength(2)
  } finally {
    expect(await denied.close()).toBe(0)
  }
})
