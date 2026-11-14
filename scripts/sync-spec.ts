import { createHash } from "node:crypto"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

/** Notion's docs list it under "OpenAPI Specs" in https://developers.notion.com/llms.txt, as `openapi`. */
const SOURCE = "https://developers.notion.com/openapi.json"
const LISTING = "https://developers.notion.com/llms.txt"

const dir = resolve(import.meta.dirname, "../spec/notion")
const response = await fetch(SOURCE)
if (!response.ok) throw new Error(`${SOURCE} answered HTTP ${response.status}`)
const text = await response.text()
const document = JSON.parse(text) as { openapi?: string; info?: { version?: string } }
if (!document.openapi?.startsWith("3.")) throw new Error(`${SOURCE} is not an OpenAPI 3 document`)
writeFileSync(`${dir}/openapi.json`, text)
const provenance = {
  source: SOURCE,
  listed_in: LISTING,
  retrieved_at: new Date().toISOString(),
  sha256: createHash("sha256").update(text).digest("hex"),
  bytes: Buffer.byteLength(text),
  openapi: document.openapi,
  // Not the API version: that is the Notion-Version header each operation pins, read by pnpm generate.
  info_version: document.info?.version,
}
writeFileSync(`${dir}/provenance.json`, `${JSON.stringify(provenance, null, 2)}\n`)
process.stderr.write("Notion's OpenAPI document refreshed; review its diff and run pnpm generate\n")
