import type { Client } from "@notionhq/client"
import { CliError, isCliError } from "@wirecat/cli-base"
import * as v from "valibot"
import { mapped, NOTION } from "./errors.js"
import { withoutSignedLinks } from "./links.js"
import { notionPort } from "./port.js"

// Each wire name is from Notion's reference, linked at its schema; the strict fake in src/testing/fake-notion.ts
// refuses any other. No wire type leaves this file (WC-ARCH-3).

const richText = v.array(v.looseObject({ plain_text: v.string() }))
const textOf = (parts: v.InferOutput<typeof richText> | undefined) =>
  (parts ?? []).map((part) => part.plain_text).join("")

/** [Retrieve your token's bot user](https://developers.notion.com/reference/get-self), [user](https://developers.notion.com/reference/user). */
const wireMe = v.looseObject({
  object: v.literal("user"),
  id: v.string(),
  type: v.optional(v.string()),
  name: v.nullish(v.string()),
  bot: v.optional(
    v.looseObject({
      owner: v.optional(v.looseObject({ type: v.string() })),
      workspace_name: v.nullish(v.string()),
      workspace_id: v.nullish(v.string()),
    }),
  ),
})

/** [Retrieve a page as Markdown](https://developers.notion.com/reference/retrieve-page-markdown). */
const wireMarkdown = v.looseObject({
  object: v.literal("page_markdown"),
  id: v.string(),
  markdown: v.string(),
  truncated: v.boolean(),
  unknown_block_ids: v.array(v.string()),
})

/** [Parent object](https://developers.notion.com/reference/parent-object). */
const wireParent = v.looseObject({
  type: v.string(),
  database_id: v.optional(v.string()),
  page_id: v.optional(v.string()),
  data_source_id: v.optional(v.string()),
  block_id: v.optional(v.string()),
})

/** [Data source](https://developers.notion.com/reference/data-source); search may answer the partial shape. */
const wireDataSource = v.looseObject({
  object: v.literal("data_source"),
  id: v.string(),
  title: v.optional(richText),
  parent: v.optional(wireParent),
  last_edited_time: v.optional(v.string()),
  in_trash: v.optional(v.boolean()),
  properties: v.optional(
    v.record(
      v.string(),
      v.looseObject({
        id: v.string(),
        name: v.string(),
        type: v.string(),
      }),
    ),
  ),
})

/** [Search](https://developers.notion.com/reference/post-search), [pagination](https://developers.notion.com/reference/pagination). */
const wireSearch = v.looseObject({
  object: v.literal("list"),
  results: v.array(v.unknown()),
  has_more: v.boolean(),
  next_cursor: v.nullish(v.string()),
})

/** [Retrieve a database](https://developers.notion.com/reference/retrieve-database). */
const wireDatabase = v.looseObject({
  object: v.literal("database"),
  id: v.string(),
  title: richText,
  description: v.optional(richText),
  parent: wireParent,
  is_inline: v.optional(v.boolean()),
  in_trash: v.optional(v.boolean()),
  created_time: v.optional(v.string()),
  last_edited_time: v.optional(v.string()),
  url: v.optional(v.string()),
  data_sources: v.array(v.looseObject({ id: v.string(), name: v.optional(v.string()) })),
})

const parsed = <T>(schema: v.GenericSchema<unknown, T>, value: unknown): T => {
  const result = v.safeParse(schema, value)
  if (result.success) return result.output
  throw new CliError("invalid_response", `${NOTION}'s answer does not have the documented shape`, {
    reason: "notion.invalid-response",
  })
}

const parentOf = (parent: v.InferOutput<typeof wireParent> | undefined) => {
  if (!parent) return null
  const id = parent.page_id ?? parent.database_id ?? parent.data_source_id ?? parent.block_id ?? null
  return { type: parent.type, id }
}

/** Option names of a select, multi-select or status property: what a filter like `status:Done` takes. */
const optionsOf = (property: Record<string, unknown>): string[] | undefined => {
  const config = property[String(property.type)]
  if (!config || typeof config !== "object") return undefined
  const options = (config as { options?: unknown }).options
  if (!Array.isArray(options)) return undefined
  return options.flatMap((option) =>
    option && typeof option === "object" && typeof (option as { name?: unknown }).name === "string"
      ? [(option as { name: string }).name]
      : [],
  )
}

export const accountSchema = v.strictObject({
  workspace: v.strictObject({ id: v.string(), name: v.nullable(v.string()) }),
  user: v.strictObject({
    id: v.string(),
    name: v.nullable(v.string()),
    type: v.string(),
    owner: v.nullable(v.string()),
  }),
})
export type Account = v.InferOutput<typeof accountSchema>

export const documentSchema = v.strictObject({
  id: v.string(),
  markdown: v.string(),
  truncated: v.boolean(),
  missing_block_ids: v.array(v.string()),
  signed_links_removed: v.number(),
})
export type Document = v.InferOutput<typeof documentSchema>

/** A part of the answer that is not there (WC-OUT-7). */
export type Issue = { code: "not_found" | "provider_error"; reason: string; source: "notion" }

export const databaseRowSchema = v.strictObject({
  id: v.nullable(v.string()),
  data_source_id: v.string(),
  title: v.string(),
  last_edited_time: v.nullable(v.string()),
})
export type DatabaseRow = v.InferOutput<typeof databaseRowSchema>

const propertySchema = v.strictObject({
  id: v.string(),
  name: v.string(),
  type: v.string(),
  options: v.optional(v.array(v.string())),
})

export const databaseSchema = v.strictObject({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  url: v.nullable(v.string()),
  parent: v.nullable(v.strictObject({ type: v.string(), id: v.nullable(v.string()) })),
  is_inline: v.boolean(),
  in_trash: v.boolean(),
  created_time: v.nullable(v.string()),
  last_edited_time: v.nullable(v.string()),
  data_sources: v.array(v.strictObject({ id: v.string(), title: v.string(), properties: v.array(propertySchema) })),
})
export type Database = v.InferOutput<typeof databaseSchema>

/** At most this many unknown blocks are fetched again; Notion lists at most 100. */
const MORE_BLOCKS = 100
/** A database's data sources read for `databases show`; Notion lists at most 100. */
const MORE_SOURCES = 100

const placeholderFor = (markdown: string, id: string) => {
  const compact = id.replaceAll("-", "")
  const tags = markdown.match(/<unknown\b[^>]*\/>/giu) ?? []
  return tags.find((tag) => tag.includes(id) || tag.includes(compact))
}

/** Every Notion read the commands make, each answer checked against its documented shape. */
export const liveReads = (client: Client) => {
  const port = notionPort(client)
  return {
    port,
    /** The token's bot user; its workspace id and bot id are the account (DESIGN.md, Sign-in). */
    me: async (): Promise<Account> => {
      const me = parsed(wireMe, await port.self())
      const workspace = me.bot?.workspace_id
      if (!workspace)
        throw new CliError("invalid_response", `${NOTION} did not say which workspace this token belongs to`, {
          reason: "notion.invalid-response",
        })
      return {
        workspace: { id: workspace, name: me.bot?.workspace_name ?? null },
        user: { id: me.id, name: me.name ?? null, type: me.type ?? "bot", owner: me.bot?.owner?.type ?? null },
      }
    },

    /**
     * A page as Notion-flavoured Markdown (v2). A truncated page's unknown blocks are fetched again and put in place of
     * their `<unknown>` tag, or after the page when no tag names them. What is still not there is an issue: a block
     * the token cannot see, or a part past Notion's limit or past the blocks fetched again.
     */
    document: async (id: string): Promise<{ document: Document; issues: Issue[] }> => {
      const read = async (pageId: string) =>
        parsed(wireMarkdown, { object: "page_markdown", id: pageId, ...(await port.pageMarkdown(pageId)) })
      const page = await read(id)
      let markdown = page.markdown
      const hidden: string[] = []
      const unread: string[] = []
      // Notion lists at most 100 unknown blocks, so a cut page with none, or with a full list, may have more.
      let cut = page.truncated && (page.unknown_block_ids.length === 0 || page.unknown_block_ids.length >= MORE_BLOCKS)
      for (const block of page.unknown_block_ids.slice(0, MORE_BLOCKS)) {
        try {
          const part = await read(block)
          const tag = placeholderFor(markdown, block)
          markdown = tag ? markdown.replace(tag, () => part.markdown) : `${markdown}\n\n${part.markdown}`
          for (const more of part.unknown_block_ids) unread.push(more)
          if (part.truncated && part.unknown_block_ids.length === 0) cut = true
        } catch (error) {
          if (!isCliError(error) || error.code !== "not_found") throw error
          hidden.push(block)
        }
      }
      for (const more of page.unknown_block_ids.slice(MORE_BLOCKS)) unread.push(more)
      const clean = withoutSignedLinks(markdown)
      const issues: Issue[] = [
        ...(hidden.length > 0 ? [{ code: "not_found", reason: "notion.not-shared", source: "notion" } as const] : []),
        ...(cut || unread.length > 0
          ? [{ code: "provider_error", reason: "notion.truncated", source: "notion" } as const]
          : []),
      ]
      return {
        document: {
          id: page.id,
          markdown: clean.text,
          truncated: issues.length > 0,
          missing_block_ids: [...hidden, ...unread],
          signed_links_removed: clean.removed,
        },
        issues,
      }
    },

    /** The data sources the token sees, one row each with its database, by Notion's own search. */
    databases: async ({
      limit,
      cursor,
      title,
    }: {
      limit: number
      cursor?: string | undefined
      title?: string | undefined
    }) => {
      const page = parsed(
        wireSearch,
        await mapped(() =>
          client.search({
            filter: { property: "object", value: "data_source" },
            page_size: limit,
            ...(title ? { query: title } : {}),
            ...(cursor ? { start_cursor: cursor } : {}),
          }),
        ),
      )
      const items = page.results.map((result): DatabaseRow => {
        const source = parsed(wireDataSource, result)
        return {
          id: source.parent?.database_id ?? null,
          data_source_id: source.id,
          title: textOf(source.title),
          last_edited_time: source.last_edited_time ?? null,
        }
      })
      return { items, hasMore: page.has_more, cursor: page.has_more ? (page.next_cursor ?? undefined) : undefined }
    },

    /** A database with each data source's id and property schema: what a query or a filter needs. */
    database: async (id: string): Promise<Database> => {
      const database = parsed(wireDatabase, await mapped(() => client.databases.retrieve({ database_id: id })))
      const sources = []
      for (const reference of database.data_sources.slice(0, MORE_SOURCES)) {
        const source = parsed(
          wireDataSource,
          await mapped(() => client.dataSources.retrieve({ data_source_id: reference.id })),
        )
        sources.push({
          id: source.id,
          title: textOf(source.title) || reference.name || "",
          properties: Object.values(source.properties ?? {}).map((property) => {
            const options = optionsOf(property)
            return {
              id: property.id,
              name: property.name,
              type: property.type,
              ...(options ? { options } : {}),
            }
          }),
        })
      }
      return {
        id: database.id,
        title: textOf(database.title),
        description: textOf(database.description),
        url: database.url ?? null,
        parent: parentOf(database.parent),
        is_inline: database.is_inline ?? false,
        in_trash: database.in_trash ?? false,
        created_time: database.created_time ?? null,
        last_edited_time: database.last_edited_time ?? null,
        data_sources: sources,
      }
    },
  }
}

export type LiveReads = ReturnType<typeof liveReads>
