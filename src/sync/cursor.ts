import { CliError } from "@wirecat/cli-base"
import * as v from "valibot"

const PREFIX = "notion1."

const Task = v.variant("t", [
  v.object({
    t: v.literal("search"),
    kind: v.picklist(["page", "data_source"]),
    start: v.optional(v.string()),
    /** Everything search gives, for the top of a workspace walk, not only what was edited since the mark. */
    full: v.optional(v.boolean()),
  }),
  v.object({ t: v.literal("database"), id: v.string(), walk: v.optional(v.boolean()) }),
  /** Known children of a container that its listing has not shown yet, each read directly at the end of the pass. */
  v.object({ t: v.literal("confirm"), container: v.string(), ids: v.array(v.string()) }),
  v.object({
    t: v.literal("rows"),
    database: v.string(),
    source: v.string(),
    after: v.optional(v.string()),
    /** Every row, not only those edited since the mark: part of a full walk. */
    full: v.optional(v.boolean()),
  }),
  v.object({ t: v.literal("walk"), id: v.string() }),
])

const Cursor = v.object({
  v: v.literal(1),
  /** The newest `last_edited_time` a finished pass started from; the next pass reads from it minus the overlap. */
  mark: v.nullable(v.string()),
  /** When the last full walk started, by this computer's clock. */
  walkedAt: v.number(),
  /** Data sources seen in scope, kept because search may not list a database again. */
  sources: v.array(v.object({ database: v.string(), source: v.string() })),
  /** A pass cut short by its request bound: what is left, so the next sync goes on from there. */
  pass: v.optional(
    v.object({
      next: v.nullable(v.string()),
      startedAt: v.number(),
      walk: v.boolean(),
      tasks: v.array(Task),
    }),
  ),
})

export type SyncCursor = v.InferOutput<typeof Cursor>
export type SyncTask = v.InferOutput<typeof Task>
export type SyncPass = NonNullable<SyncCursor["pass"]>

export const encodeCursor = (cursor: SyncCursor) =>
  `${PREFIX}${Buffer.from(JSON.stringify(cursor)).toString("base64url")}`

export const decodeCursor = (token: string): SyncCursor => {
  if (!token.startsWith(PREFIX))
    throw new CliError("invalid_response", "the sync position is not a Notion one; run sync --rescan", {
      reason: "sync.cursor-invalid",
    })
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(token.slice(PREFIX.length), "base64url").toString("utf8"))
  } catch {
    parsed = undefined
  }
  const result = v.safeParse(Cursor, parsed)
  if (!result.success)
    throw new CliError("invalid_response", "the sync position is damaged; run sync --rescan", {
      reason: "sync.cursor-invalid",
    })
  return result.output
}
