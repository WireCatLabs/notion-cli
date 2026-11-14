import { CliError } from "@wirecat/cli-base"

const DASHED = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu
const COMPACT = /^[0-9a-f]{32}$/iu
const IN_PATH = /([0-9a-f]{32})(?:[^0-9a-f]|$)/giu
const NOTION_HOSTS = /(^|\.)(notion\.so|notion\.site|notion\.com)$/u

const dashed = (hex: string) =>
  `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase()

/**
 * A page or database id from what a person copies: the id, with or without dashes, or its Notion link. In a link the
 * id is the last 32 hex characters of the path; `?v=` names a view, never the database. A page opened over a
 * database, `…/<database>?v=<view>&p=<page>`, is the page in `p=`, and the database is the one in the path.
 */
export const notionId = (input: string, what = "page"): string => {
  const text = input.trim()
  if (DASHED.test(text)) return text.toLowerCase()
  if (COMPACT.test(text)) return dashed(text)
  let url: URL | undefined
  try {
    url = new URL(text)
  } catch {
    url = undefined
  }
  if (url && url.protocol === "https:" && NOTION_HOSTS.test(url.hostname)) {
    const peek = url.searchParams.get("p")?.replaceAll("-", "")
    if (what === "page" && peek && COMPACT.test(peek)) return dashed(peek)
    const found = [...url.pathname.matchAll(IN_PATH)].at(-1)?.[1]
    if (found) return dashed(found)
  }
  throw new CliError("validation_error", `give the ${what}'s id or its Notion link, such as https://www.notion.so/…`, {
    reason: "notion.id-invalid",
  })
}
