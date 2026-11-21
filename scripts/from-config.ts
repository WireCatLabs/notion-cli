import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { parseCliConfig } from "@wirecat/cli-core/manifest"
import config from "../wirecat.config.ts"

// wirecat.config.ts → src/generated/wirecat-config.ts, what the CLI reads of it at run time: the source and what every
// request sends. src/ cannot import the config itself: it sits outside src/ and the bin is bundled.
const root = join(import.meta.dirname, "..")
const out = join(root, "src/generated/wirecat-config.ts")
if (process.argv.includes("--if-missing") && existsSync(out)) process.exit(0)

const cli = parseCliConfig(config)
if (!cli.source || !cli.api?.headers || !cli.api.pace)
  throw new Error("wirecat.config: notion reads its source, api.headers and api.pace from the config")

// Formatted as scripts/generate.ts formats its files, so lint and --check agree.
const formatted = (content: string) =>
  execFileSync(
    process.execPath,
    [join(root, "node_modules/@biomejs/biome/bin/biome"), "check", "--write", `--stdin-file-path=${out}`],
    { cwd: root, encoding: "utf8", input: content },
  )
const text = formatted(
  [
    "// Generated from wirecat.config.ts by scripts/from-config.ts; run pnpm generate",
    "",
    `export const SOURCE: Readonly<Record<string, unknown>> = ${JSON.stringify(cli.source, null, 2)}`,
    "",
    `export const HEADERS: Readonly<Record<string, string>> = ${JSON.stringify(cli.api.headers, null, 2)}`,
    "",
    // Typed by its value: the Pacer needs the burst the config gives.
    `export const PACES = ${JSON.stringify(cli.api.pace, null, 2)}`,
    "",
  ].join("\n"),
)

if (process.argv.includes("--check")) {
  if (!existsSync(out) || readFileSync(out, "utf8") !== text) {
    process.stderr.write("Generated files are stale: src/generated/wirecat-config.ts; run pnpm generate\n")
    process.exit(1)
  }
} else {
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, text)
}
