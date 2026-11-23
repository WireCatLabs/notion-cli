import {
  type BodyPermission,
  type Configuration,
  commandPermissions,
  serviceApiOperations,
  serviceApiPermissions,
  settingsFor,
} from "@wirecat/cli-core/cli"
import { DOCUMENT_HISTORY_SETTINGS } from "@wirecat/cli-core/documents/cli"
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
  "documents move": ["api.move-page"],
  "documents rename": ["api.patch-page"],
  "comments create": ["api.create-a-comment"],
  "comments reply": ["comments.create", "api.create-a-comment"],
  "comments edit": ["api.update-a-comment"],
  // Notion keeps no deleted comment, so it asks as a page to the trash does, and as the raw call does.
  "comments delete": ["api.delete-a-comment", DELETE_KEY],
  "files upload": ["api.create-file", "api.complete-file-upload", "api.patch-block-children"],
}

/** The calls a mirror's sync sends, the same keys as the `documents` command that sends each. */
export const MIRROR_KEYS = { create: "api.post-page", replace: "api.update-page-markdown", trash: "api.patch-page" }

/** What `--dry-run` and `commands` show for a mirror's writes, the keys `mirrorKeys` checks. */
const MIRROR_CHECKS = [
  { key: MIRROR_KEYS.create, when: "for each page it creates in Notion" },
  { key: MIRROR_KEYS.replace, when: "for each page whose text it replaces" },
  { key: MIRROR_KEYS.trash, when: "for each page it moves to Notion's trash" },
  { key: DELETE_KEY, when: "for each page or local file it moves to a trash" },
]
const MIRROR_WRITES = new Set(["mirrors sync", "mirrors watch", "mirrors conflicts resolve"])

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

/** Fields that trash, erase or archive when true; `is_archived` is undocumented, so it counts as a delete. */
const DELETING_FIELDS = ["in_trash", "erase_content", "is_archived", "archived"]

/** Top-level, as the old check read them, whether or not Notion's document still lists the field on the operation. */
const deletingField: BodyPermission = {
  key: DELETE_KEY,
  when: `with ${DELETING_FIELDS.join(", ")} set`,
  applies: (body) => isObject(body) && DELETING_FIELDS.some((field) => body[field] === true),
}

/**
 * The raw calls whose body deletes in a way the generator cannot see, so `documents.delete: deny` holds over `api`
 * too; the generator already gives every destructive operation and every `in_trash` and `erase_content` flag in the
 * spec the key (scripts/generate.ts). Found by scanning Notion's OpenAPI document: the deleting fields on the five
 * operations that update content, `allow_deleting_content` in a Markdown update, an agent batch with a delete in it,
 * and a data source property set to `null`, which removes it with its values
 * ([update a data source](https://developers.notion.com/reference/update-a-data-source)).
 */
const BODY_PERMISSIONS: Readonly<Record<string, readonly BodyPermission[]>> = {
  "patch-page": [deletingField],
  "update-a-block": [deletingField],
  "update-database": [deletingField],
  "update-page-markdown": [
    deletingField,
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
    deletingField,
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
    if (MIRROR_WRITES.has(path.join(" "))) return MIRROR_CHECKS
    const keys = PAGE_WRITE_KEYS[path.join(" ")] ?? []
    if (path.join(" ") === "documents update")
      return [
        ...keys,
        { key: DELETE_KEY, when: "with --allow-deleting-content" },
        { key: "api.patch-page", when: "with --field, --emoji or --cover" },
      ]
    return keys
  },
  // As gcal-cli and drive-cli: a page is created and changed freely, a page to the trash asks first, and so does a
  // raw call that deletes. Over MCP `ask` goes ahead (cli-core's rule), so `deny` is what stops an agent.
  defaults: { ...api.defaults, [DELETE_KEY]: "ask" },
  extra: api.extra,
})

export const configuration: Configuration = settingsFor(IDENTITY, { permissions, ...DOCUMENT_HISTORY_SETTINGS })
