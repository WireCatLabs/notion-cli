import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  adaptOpenApi,
  coverageGenerator,
  definitionsGenerator,
  generate,
  manifestGenerator,
  typesGenerator,
  valibotGenerator,
  writeArtifacts,
} from "@wirecat/cli-base/codegen"
import { READ_POSTS } from "../src/notion/read-posts.ts"
import { normalizeNotionSpec } from "./notion-spec.ts"

const root = resolve(import.meta.dirname, "..")
const text = readFileSync(`${root}/spec/notion/openapi.json`, "utf8")
const provenance = JSON.parse(readFileSync(`${root}/spec/notion/provenance.json`, "utf8")) as {
  source: string
  sha256: string
}
if (createHash("sha256").update(text).digest("hex") !== provenance.sha256)
  throw new Error("spec/notion/openapi.json does not match provenance.json; run pnpm spec:sync")
const { document, version, excluded, counts } = normalizeNotionSpec(JSON.parse(text))
const model = adaptOpenApi(document, { sourceUrl: provenance.source, sourceRevision: provenance.sha256 })
const read = (reason: string) => ({ effect: "read" as const, reason })
const artifacts = generate(
  model,
  [
    typesGenerator({ path: "src/generated/types.ts" }),
    valibotGenerator({ path: "src/generated/schemas.ts", typesImport: "./types.js" }),
    manifestGenerator({ path: "src/generated/manifest.ts" }),
    definitionsGenerator({ path: "src/generated/definitions.ts" }),
    coverageGenerator({
      path: "docs/dev/API_COVERAGE.md",
      title: "Notion API coverage",
      command: (op) => `notion <profile> api ${op.command}`,
    }),
  ],
  {
    banner: ["Source: spec/notion/openapi.json, verified by provenance.json", "Run: pnpm generate"],
    overrides: Object.fromEntries(Object.entries(READ_POSTS).map(([id, { reason }]) => [id, read(reason)])),
  },
)
const coverage = artifacts.find((artifact) => artifact.path === "docs/dev/API_COVERAGE.md")
if (coverage)
  coverage.content += [
    "",
    "## Not generated",
    "",
    "| Operation | Why |",
    "|---|---|",
    ...excluded.map(({ id, reason }) => `| \`${id}\` | ${reason} |`),
    "",
  ].join("\n")
artifacts.push({
  path: "src/generated/metadata.ts",
  content: `export const NOTION_VERSION = ${JSON.stringify(version)}\n\nexport const excluded = ${JSON.stringify(excluded, null, 2)}\n`,
})
const format = (path: string, content: string) =>
  path.endsWith(".ts")
    ? execFileSync(
        process.execPath,
        [`${root}/node_modules/@biomejs/biome/bin/biome`, "check", "--write", `--stdin-file-path=${path}`],
        { cwd: root, encoding: "utf8", input: content, maxBuffer: 64 * 1024 * 1024 },
      )
    : content
const stale = writeArtifacts(artifacts, { root, check: process.argv.includes("--check"), format })
if (process.argv.includes("--check") && stale.length) {
  process.stderr.write(`Generated files are stale: ${stale.join(", ")}; run pnpm generate\n`)
  process.exitCode = 1
}
process.stderr.write(
  `${model.operations.length} operations generated, ${excluded.length} left out, Notion-Version ${version}; normalized: ${JSON.stringify(counts)}\n`,
)
