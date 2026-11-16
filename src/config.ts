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

/** Each command is checked against its own path (`notes.list`); add the keys a command checks inside itself. */
export const permissions = commandPermissions({
  alsoChecks: (path) => {
    const keys = PAGE_WRITE_KEYS[path.join(" ")] ?? []
    return path.join(" ") === "documents update"
      ? [...keys, { key: DELETE_KEY, when: "with --allow-deleting-content" }]
      : keys
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
