import {
  type BodyPermission,
  type Configuration,
  commandPermissions,
  serviceApiOperations,
  serviceApiPermissions,
  settingsFor,
} from "@wirecat/cli-core/cli"
import * as manifest from "./generated/manifest.js"
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
  "comments create": ["api.create-a-comment"],
  "comments reply": ["comments.create", "api.create-a-comment"],
  "files upload": ["api.create-file", "api.complete-file-upload", "api.patch-block-children"],
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

/**
 * The raw calls whose body deletes in a way no top-level flag says, so `documents.delete: deny` holds over `api` too.
 * The generator gives every destructive operation and every `in_trash` and `erase_content` flag the key
 * (scripts/generate.ts). Found by scanning Notion's OpenAPI document: `is_archived` on a page (what it does is
 * undocumented, so it counts as a delete), `allow_deleting_content` in a Markdown update, an agent batch with a delete
 * in it, and a data source property set to `null`, which removes it with its values
 * ([update a data source](https://developers.notion.com/reference/update-a-data-source)).
 */
const BODY_PERMISSIONS: Readonly<Record<string, readonly BodyPermission[]>> = {
  "patch-page": [
    { key: DELETE_KEY, when: "with is_archived set", applies: (body) => isObject(body) && body.is_archived === true },
  ],
  "update-page-markdown": [
    {
      key: DELETE_KEY,
      when: "with allow_deleting_content set",
      applies: (body) => {
        const update = isObject(body) && typeof body.type === "string" ? body[body.type] : undefined
        return isObject(update) && update.allow_deleting_content === true
      },
    },
  ],
  "agent-batch": [
    {
      key: DELETE_KEY,
      when: "an operation's action is delete",
      applies: (body) =>
        isObject(body) &&
        Array.isArray(body.operations) &&
        body.operations.some((one) => isObject(one) && one.action === "delete"),
    },
  ],
  "update-a-data-source": [
    {
      key: DELETE_KEY,
      when: "a property is set to null",
      applies: (body) =>
        isObject(body) &&
        isObject(body.properties) &&
        Object.values(body.properties).some((property) => property === null),
    },
  ],
}

export const API = {
  manifest: { ...manifest, operations: serviceApiOperations(manifest).offered },
  service: "Notion",
  bodyPermissions: BODY_PERMISSIONS,
}

const api = serviceApiPermissions(API)

/** Each command is checked against its own path (`notes.list`); add the keys a command checks inside itself. */
export const permissions = commandPermissions({
  alsoChecks: (path) => {
    if (path[0] === "api") return api.alsoChecks(path)
    const keys = PAGE_WRITE_KEYS[path.join(" ")] ?? []
    if (path.join(" ") === "documents update")
      return [...keys, { key: DELETE_KEY, when: "with --allow-deleting-content" }]
    return keys
  },
  // As gcal-cli and drive-cli: a page is created and changed freely, a page to the trash asks first, and so does a
  // raw call that deletes. Over MCP `ask` goes ahead (cli-core's rule), so `deny` is what stops an agent.
  defaults: { ...api.defaults, [DELETE_KEY]: "ask" },
  extra: api.extra,
})

export const configuration: Configuration = settingsFor(IDENTITY, { permissions })
