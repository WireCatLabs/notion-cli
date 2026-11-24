import { createProgram } from "./command-program.ts"

const GENERATED =
  "generated from Notion's OpenAPI document; src/commands/api.test.ts drives the shared executor through " +
  "retrieve-a-page, post-search and delete-a-block, and scripts/notion-spec.test.ts checks the generation"

type Node = { name(): string; commands: readonly Node[]; options: readonly { long?: string }[] }
const api = (createProgram() as unknown as Node).commands.find((command) => command.name() === "api")
const generatedOptions = [
  ...new Set(
    (api?.commands ?? [])
      .filter((command) => !["list", "show"].includes(command.name()))
      .flatMap((command) => command.options.map((option) => option.long ?? "")),
  ),
].filter((name) => name && name !== "--help")

const SHARED_MCP =
  "cli-core's appMcpCommand; its app-mcp-command and mcp-server-command tests drive it, and src/mcp.test.ts runs " +
  "this CLI's own server, config, revoke and refusals"
const SHARED_REPORTS = "cli-core's appDoctorCommand; its app-mcp-command test creates and shows a report"
const LONG_RUNNING = `starts an HTTP server or a background process that runs until stopped; ${SHARED_MCP}`

const MODEL =
  "needs a downloaded meaning model or a configured model provider; cli-core's documents kit tests the shared command " +
  "with a fake model, and no test here downloads one"

const SHARED_CHANGES =
  "cli-core's shared changes command, tested with its paging and window in cli-core's documents history tests; " +
  "src/library.test.ts drives --since and --event over a real sync"

const SHARED_MEETINGS =
  "cli-core's shared meetings command, tested in cli-core's src/meetings/cli; notion supplies only the store and " +
  "the meeting notes source (src/meetings.test.ts)"
const meetingsUntested: [string, string[]][] = [
  ["meetings export", ["", "--format", "--output", "--transcript-id"]],
  ["meetings list", ["--backend", "--page"]],
  ["meetings people", ["", "--cursor", "--limit", "--max-read-bytes", "--scan-limit"]],
  ["meetings repair", ["", "--yes"]],
  ["meetings show", ["--backend"]],
  ["meetings sync", ["--lookback-days", "--rescan"]],
  ["meetings transcript", ["--history"]],
  ["events list", [""]],
]

const SHARED_MIRRORS =
  "cli-core's shared file mirror group (fileMirrorsCommand), tested in cli-core's src/cli/documents/file-mirrors and " +
  "file-conflicts tests; notion supplies only the target, its keys and add's page (src/mirrors.test.ts, " +
  "src/mirror-target.test.ts)"
const mirrorsUntested: [string, string[]][] = [
  ["mirrors add", ["--ignore"]],
  ["mirrors status", [""]],
  ["mirrors preview", ["", "--keep"]],
  ["mirrors sync", ["--keep", "--allow-deletions", "--allow-replacements", "--replace", "--repin"]],
  ["mirrors watch", ["", "--every"]],
  ["mirrors update", ["", "--ignore", "--clear"]],
  ["mirrors remove", [""]],
  ["mirrors versions list", [""]],
  ["mirrors versions restore", [""]],
  ["mirrors conflicts list", [""]],
  ["mirrors conflicts show", [""]],
  ["mirrors conflicts resolve", ["", "--keep", "--file"]],
]

export const UNTESTED: { command: string; option?: string; reason: string }[] = [
  ...mirrorsUntested.flatMap(([command, options]) =>
    options.map((option) => ({ command, ...(option ? { option } : {}), reason: SHARED_MIRRORS })),
  ),
  ...meetingsUntested.flatMap(([command, options]) =>
    options.map((option) => ({ command, ...(option ? { option } : {}), reason: SHARED_MEETINGS })),
  ),
  ...["--until", "--limit", "--page"].map((option) => ({ command: "changes", option, reason: SHARED_CHANGES })),
  { command: "sync", option: "--embed", reason: MODEL },
  { command: "memories extract", reason: MODEL },
  ...["--scope", "--tab", "--yes"].map((option) => ({ command: "memories extract", option, reason: MODEL })),
  { command: "api *", reason: GENERATED },
  ...generatedOptions.map((option) => ({ command: "api *", option, reason: GENERATED })),
  {
    command: "",
    option: "--help-all",
    reason: "Commander answers before any command runs, so the trace never sees it; contracts/help.snap covers help",
  },
  {
    command: "",
    option: "--version",
    reason: "Commander answers before any command runs, so the trace never sees it; `pnpm version:check` checks it",
  },
  {
    command: "mcp server start",
    reason:
      "starts a detached `mcp serve --http` from the built entry; cli-core tests mcpServerCommand, and the background run was checked by hand against dist/",
  },
  {
    command: "mcp server start",
    option: "--port",
    reason:
      "starts a detached `mcp serve --http` from the built entry; cli-core tests mcpServerCommand, and the background run was checked by hand against dist/",
  },
  {
    command: "mcp server start",
    option: "--public-url",
    reason:
      "starts a detached `mcp serve --http` from the built entry; cli-core tests mcpServerCommand, and the background run was checked by hand against dist/",
  },
  {
    command: "mcp server stop",
    reason:
      "stops the detached server that `mcp server start` wrote a pid file for; cli-core tests mcpServerCommand, and no live scenario starts a server to stop",
  },
  ...["--http", "--port", "--public-url"].map((option) => ({ command: "mcp serve", option, reason: LONG_RUNNING })),
  { command: "doctor reports show", reason: SHARED_REPORTS },
  { command: "doctor reports create", reason: SHARED_REPORTS },
  { command: "doctor reports create", option: "--run", reason: SHARED_REPORTS },
  { command: "doctor reports create", option: "--output", reason: SHARED_REPORTS },
  { command: "mcp server status", reason: LONG_RUNNING },
  { command: "mcp server status", option: "--profiles", reason: LONG_RUNNING },
  { command: "mcp revoke", option: "--profiles", reason: SHARED_MCP },
  ...[undefined, "--allow-writes", "--permission"].map((option) => ({
    command: "mcp add",
    ...(option ? { option } : {}),
    reason: `writes Codex's or Claude Code's own MCP settings; ${SHARED_MCP}`,
  })),
  ...[undefined, "--permission"].map((option) => ({
    command: "mcp check",
    ...(option ? { option } : {}),
    reason: `starts the installed CLI as a child process, as the agent would; ${SHARED_MCP}`,
  })),
]
