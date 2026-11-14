import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { brokenKeyring, memoryKeyring } from "@wirecat/cli-base"
import { ProfileTokenStore } from "@wirecat/cli-core/cli"
import { afterEach, expect, it } from "vitest"
import { IDENTITY } from "./identity.js"
import { BOT_ID, FAKE_TOKEN, fakeNotion, NOTION_VERSION_SENT, WORKSPACE_ID } from "./testing/fake-notion.js"
import { runCli } from "./testing/harness.js"

/** Notion's own CLI keeps its tokens under the service `notion-cli`, one account per workspace id. */
const NTN_ENTRY = `notion-cli:${WORKSPACE_ID}`
const configFile = join(process.env.WCNOTION_CONFIG_DIR ?? "", "config.json")
afterEach(() => rmSync(configFile, { force: true }))

it("session start reads the token from stdin, checks it with users/me, and keeps it under token:<profile>", async () => {
  const keyring = memoryKeyring()
  const notion = fakeNotion()
  const started = await runCli(["personal", "session", "start", "--json"], { keyring, notion, stdin: FAKE_TOKEN })
  expect(started.code).toBe(0)
  expect(started.json().item).toEqual({
    profile: "personal",
    state: "saved",
    stored_in: "keyring",
    verified: true,
    workspace: { id: WORKSPACE_ID, name: "Test Workspace" },
    user: { id: BOT_ID, name: "Test Connection", type: "bot", owner: "user" },
  })
  expect(keyring.entries.get("notion-cli:token:personal")).toBe(FAKE_TOKEN)
  expect(notion.calls.map((call) => `${call.method} ${call.path}`)).toEqual(["GET /v1/users/me"])
  expect(notion.calls[0]?.headers["notion-version"]).toBe(NOTION_VERSION_SENT)
  expect(notion.refusals).toEqual([])
})

it("session status, list and end; end leaves Notion's own CLI's entry in the same keyring service", async () => {
  const keyring = memoryKeyring({ [NTN_ENTRY]: "ntn-own-fake-entry" })
  await runCli(["personal", "session", "start", "--json"], { keyring, stdin: FAKE_TOKEN })
  const status = await runCli(["personal", "session", "status", "--check", "--json"], { keyring })
  expect(status.json().item).toMatchObject({
    state: "saved",
    token_from: "keyring",
    verified: true,
    workspace: { id: WORKSPACE_ID },
  })
  const listed = await runCli(["session", "list", "--json"], { keyring })
  expect(listed.json().items).toEqual([{ profile: "personal", signed_in: true, token_from: "keyring" }])
  expect((await runCli(["personal", "session", "end", "--json"], { keyring })).code).toBe(0)
  expect((await runCli(["personal", "session", "status", "--json"], { keyring })).json().item).toMatchObject({
    state: "missing",
  })
  expect([...keyring.entries.keys()]).toEqual([NTN_ENTRY])
  expect(keyring.entries.get(NTN_ENTRY)).toBe("ntn-own-fake-entry")
})

it("NOTION_TOKEN, which Notion's own MCP server reads, signs no profile in; WCNOTION_TOKEN does", async () => {
  const notion = fakeNotion()
  const keyring = memoryKeyring()
  const env = { NOTION_TOKEN: FAKE_TOKEN }
  mkdirSync(join(configFile, ".."), { recursive: true })
  writeFileSync(configFile, JSON.stringify({ profiles: { personal: {} } }))
  const ignored = await runCli(["personal", "documents", "get", "cccccccc000040008000000000000003", "--json"], {
    keyring,
    notion,
    env,
  })
  expect(ignored.json()).toMatchObject({ error: { code: "authentication_error", reason: "session.missing" } })
  expect(notion.calls).toEqual([])
  const status = await runCli(["personal", "session", "status", "--json"], {
    keyring,
    env: { WCNOTION_TOKEN: FAKE_TOKEN },
  })
  expect(status.json().item).toMatchObject({ state: "saved", token_from: "environment" })
})

it("session start --credential-storage file keeps the token in a private file instead of the keyring", async () => {
  const keyring = memoryKeyring()
  const started = await runCli(["personal", "session", "start", "--credential-storage", "file", "--json"], {
    keyring,
    stdin: FAKE_TOKEN,
  })
  expect(started.json().item).toMatchObject({ stored_in: "file" })
  expect((await runCli(["personal", "session", "status", "--json"], { keyring })).json().item).toMatchObject({
    token_from: "file",
  })
  expect((await runCli(["personal", "session", "end", "--json"], { keyring })).json().item).toMatchObject({
    ended: expect.arrayContaining(["file"]),
  })
})

it("session start without a working keyring keeps the token in a private file, and says so on stderr", async () => {
  const keyring = brokenKeyring()
  const started = await runCli(["personal", "session", "start", "--json"], { keyring, stdin: FAKE_TOKEN })
  expect(started.json().item).toMatchObject({ stored_in: "file" })
  expect(started.err).toContain("keyring")
  expect(new ProfileTokenStore({ app: IDENTITY, keyring }).signedIn("personal")).toBe(true)
  expect((await runCli(["personal", "session", "end", "--json"], { keyring })).code).toBe(0)
  expect(new ProfileTokenStore({ app: IDENTITY, keyring }).signedIn("personal")).toBe(false)
})

it("session start refuses a storage it does not know, before asking for the token", async () => {
  const { code, err } = await runCli(["personal", "session", "start", "--credential-storage", "vault", "--json"])
  expect(code).toBe(2)
  expect(err).toContain("--credential-storage takes keyring or file")
})

it("session start keeps nothing when Notion refuses the token, and never repeats Notion's message", async () => {
  const keyring = memoryKeyring()
  const refused = await runCli(["personal", "session", "start", "--json"], { keyring, stdin: "wrong0token" })
  expect(refused.json()).toMatchObject({ error: { code: "authentication_error", reason: "notion.token-refused" } })
  expect(refused.err).not.toContain("wirecat-secret-marker")
  expect(refused.err).not.toContain("wrong0token")
  expect([...keyring.entries.keys()]).toEqual([])
})

it("session start refuses a users/me answer that names no workspace, and keeps nothing", async () => {
  const keyring = memoryKeyring()
  const started = await runCli(["personal", "session", "start", "--json"], {
    keyring,
    notion: fakeNotion({ noWorkspaceId: true }),
    stdin: FAKE_TOKEN,
  })
  expect(started.json()).toMatchObject({ error: { code: "invalid_response", reason: "notion.invalid-response" } })
  expect([...keyring.entries.keys()]).toEqual([])
})

it("session start --offline refuses before asking for the token", async () => {
  const notion = fakeNotion()
  const ran = await runCli(["--offline", "personal", "session", "start", "--json"], { notion, stdin: FAKE_TOKEN })
  expect(ran.code).toBe(5)
  expect(notion.calls).toEqual([])
})
