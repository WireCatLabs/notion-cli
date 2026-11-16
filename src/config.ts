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
 * The raw operations whose body can delete, so `documents.delete: deny` holds over `api` too. Found by scanning
 * Notion's OpenAPI document for body fields that trash, erase, archive or remove: `in_trash` (pages, blocks, databases,
 * data sources), `erase_content` and `is_archived` (pages; what `is_archived` does is undocumented, so it counts as a
 * delete), `allow_deleting_content` (Markdown updates), and a data source property set to `null`, which removes it
 * with its values ([update a data source](https://developers.notion.com/reference/update-a-data-source)).
 */
export const TRASHING_OPERATIONS = [
  "patch-page",
  "update-page-markdown",
  "update-a-block",
  "update-database",
  "update-a-data-source",
] as const
const TRASHES = "the body trashes, erases, archives or removes content"

/** Every operation that deletes by its method (a block, which may be a page, a comment, a view): always a delete. */
export const DELETING_OPERATIONS: readonly string[] = operations
  .filter((operation) => operation.effect === "destructive")
  .map((operation) => operation.command)

/** One call that runs up to 100 agent operations, a delete among them. */
const AGENT_BATCH = "agent-batch"

const DELETING_FIELDS = ["in_trash", "erase_content", "is_archived", "archived"]

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

/** A raw call that deletes: by its operation, or by a body that trashes, erases, archives or removes content. */
export const deletesByBody = (operation: string, body: unknown): boolean => {
  if (DELETING_OPERATIONS.includes(operation)) return true
  if (operation === AGENT_BATCH)
    return (
      isObject(body) &&
      Array.isArray(body.operations) &&
      body.operations.some((one) => isObject(one) && one.action === "delete")
    )
  if (!(TRASHING_OPERATIONS as readonly string[]).includes(operation) || !isObject(body)) return false
  const update = typeof body.type === "string" ? body[body.type] : undefined
  return (
    DELETING_FIELDS.some((field) => body[field] === true) ||
    (isObject(update) && update.allow_deleting_content === true) ||
    (operation === "update-a-data-source" &&
      isObject(body.properties) &&
      Object.values(body.properties).some((property) => property === null))
  )
}

/** Each command is checked against its own path (`notes.list`); add the keys a command checks inside itself. */
export const permissions = commandPermissions({
  alsoChecks: (path) => {
    const keys = PAGE_WRITE_KEYS[path.join(" ")] ?? []
    if (path.join(" ") === "documents update")
      return [...keys, { key: DELETE_KEY, when: "with --allow-deleting-content" }]
    if (path[0] === "api" && DELETING_OPERATIONS.includes(path[1] ?? "")) return [DELETE_KEY]
    if (path[0] === "api" && path[1] === AGENT_BATCH)
      return [{ key: DELETE_KEY, when: "an operation's action is delete" }]
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
