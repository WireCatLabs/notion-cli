import { type Configuration, commandPermissions, settingsFor } from "@wirecat/cli-core/cli"
import { operations } from "./generated/manifest.js"
import { IDENTITY } from "./identity.js"

/** Deleting child pages through an update is a delete, so it asks as `documents delete` does. */
export const DELETE_KEY = "documents.delete"

/**
 * The generated operation each page write sends, so denying `api.<operation>` cannot be got round through
 * `documents …`, as gcal-cli does for its event writes.
 */
export const PAGE_WRITE_KEYS: Record<string, readonly string[]> = {
  "documents create": ["api.post-page"],
  "documents update": ["api.update-page-markdown"],
  "documents delete": ["api.patch-page"],
  "documents restore": ["api.patch-page"],
}

/**
 * The raw operations whose body can trash a page, block, database or data source, or let a Markdown update delete
 * child pages, so `documents.delete: deny` holds over `api` too. Found in Notion's OpenAPI document by the body fields
 * `in_trash` and `allow_deleting_content`.
 */
export const TRASHING_OPERATIONS = [
  "patch-page",
  "update-page-markdown",
  "update-a-block",
  "update-database",
  "update-a-data-source",
] as const
const TRASHES = "the body sets in_trash true or allow_deleting_content true"

/** A raw call's body that deletes: `in_trash: true`, or a Markdown update that allows deleting content. */
export const deletesByBody = (operation: string, body: unknown): boolean => {
  if (!(TRASHING_OPERATIONS as readonly string[]).includes(operation) || !body || typeof body !== "object") return false
  const fields = body as Record<string, unknown>
  const update = typeof fields.type === "string" ? fields[fields.type] : undefined
  return (
    fields.in_trash === true ||
    (!!update && typeof update === "object" && (update as Record<string, unknown>).allow_deleting_content === true)
  )
}

/** Each command is checked against its own path (`notes.list`); add the keys a command checks inside itself. */
export const permissions = commandPermissions({
  alsoChecks: (path) => {
    const keys = PAGE_WRITE_KEYS[path.join(" ")] ?? []
    if (path.join(" ") === "documents update")
      return [...keys, { key: DELETE_KEY, when: "with --allow-deleting-content" }]
    if (path[0] === "api" && (TRASHING_OPERATIONS as readonly string[]).includes(path[1] ?? ""))
      return [{ key: DELETE_KEY, when: TRASHES }]
    return keys
  },
  defaults: {
    // As gcal-cli and drive-cli: a page is created and changed freely, a page to the trash asks first. Over MCP `ask`
    // goes ahead (cli-core's rule), so `deny` is what stops an agent.
    [DELETE_KEY]: "ask",
    // A generated API operation that deletes asks first at a terminal, as above.
    ...Object.fromEntries(
      operations
        .filter((operation) => operation.effect === "destructive")
        .map((operation) => [`api.${operation.command}`, "ask"]),
    ),
  },
})

export const configuration: Configuration = settingsFor(IDENTITY, { permissions })
