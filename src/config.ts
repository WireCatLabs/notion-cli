import { type Configuration, commandPermissions, settingsFor } from "@wirecat/cli-core/cli"
import { operations } from "./generated/manifest.js"
import { IDENTITY } from "./identity.js"

/** Each command is checked against its own path (`notes.list`); add the keys a command checks inside itself. */
export const permissions = commandPermissions({
  // A generated API operation that deletes asks first at a terminal. Over MCP `ask` goes ahead (cli-core's rule),
  // so `deny` is what stops an agent.
  defaults: Object.fromEntries(
    operations
      .filter((operation) => operation.effect === "destructive")
      .map((operation) => [`api.${operation.command}`, "ask"]),
  ),
})

export const configuration: Configuration = settingsFor(IDENTITY, { permissions })
