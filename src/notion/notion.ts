import type { Client } from "@notionhq/client"
import { CliError, isCliError } from "@wirecat/cli-base"
import * as v from "valibot"
import { frontMatter, titleOf } from "../sync/front-matter.js"
import { isItemError, mapped, NOTION } from "./errors.js"
import { withoutSignedLinks } from "./links.js"
import { fingerprintOf } from "./page-target.js"
import { notionPort } from "./port.js"
import { type Condition, filterFrom, peopleFiltered } from "./properties.js"
import type { NotionPropertyValue } from "./reads.js"
import { optionsOf, rowReads } from "./rows.js"

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
  sha256: v.nullable(v.string()),
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

export const templateSchema = v.strictObject({ id: v.string(), name: v.string(), is_default: v.boolean() })
export type Template = v.InferOutput<typeof templateSchema>

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
  data_sources: v.array(
    v.strictObject({
      id: v.string(),
      title: v.string(),
      templates: v.optional(v.array(templateSchema)),
      properties: v.array(propertySchema),
    }),
  ),
})
export type Database = v.InferOutput<typeof databaseSchema>

/** [Comment](https://developers.notion.com/reference/comment-object). */
const wireComment = v.looseObject({
  object: v.literal("comment"),
  id: v.string(),
  discussion_id: v.string(),
  parent: wireParent,
  created_time: v.string(),
  last_edited_time: v.optional(v.string()),
  created_by: v.looseObject({ id: v.string() }),
  rich_text: richText,
  display_name: v.optional(v.looseObject({ resolved_name: v.nullish(v.string()) })),
  attachments: v.optional(v.array(v.unknown())),
})

export const commentSchema = v.strictObject({
  id: v.string(),
  discussion_id: v.string(),
  parent: v.nullable(v.strictObject({ type: v.string(), id: v.nullable(v.string()) })),
  author_id: v.string(),
  author_name: v.nullable(v.string()),
  text: v.string(),
  attachments: v.number(),
  created_time: v.string(),
  last_edited_time: v.nullable(v.string()),
})
export type Comment = v.InferOutput<typeof commentSchema>

/** [Query a data source](https://developers.notion.com/reference/query-a-data-source): one page of rows. */
const wireRow = v.looseObject({
  object: v.literal("page"),
  id: v.string(),
  url: v.optional(v.string()),
  created_time: v.optional(v.string()),
  last_edited_time: v.optional(v.string()),
  in_trash: v.optional(v.boolean()),
  properties: v.record(v.string(), v.looseObject({ type: v.string() })),
})

/** [List data source templates](https://developers.notion.com/reference/list-data-source-templates). */
const wireTemplates = v.looseObject({
  templates: v.array(v.looseObject({ id: v.string(), name: v.string(), is_default: v.boolean() })),
  has_more: v.boolean(),
  next_cursor: v.nullish(v.string()),
})

const scalar = v.union([v.string(), v.number(), v.boolean()])

export const rowSchema = v.strictObject({
  id: v.string(),
  title: v.string(),
  url: v.nullable(v.string()),
  created_time: v.nullable(v.string()),
  last_edited_time: v.nullable(v.string()),
  properties: v.record(v.string(), v.union([scalar, v.array(scalar)])),
})
export type Row = v.InferOutput<typeof rowSchema>

/** At most this many unknown blocks are fetched again; Notion lists at most 100. */
const MORE_BLOCKS = 100
/** A data source's templates read for `databases show`, in pages of 100. */
const MORE_TEMPLATES = 500
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
  const rows = rowReads(client)

  /**
   * A data source's templates, what `documents create --template` takes by name or id. They are read for a database's
   * schema only, so one the token may not list is left out, not a failure of the whole answer.
   */
  const templatesOf = async (dataSource: string): Promise<Template[] | null> => {
    const all: Template[] = []
    let cursor: string | undefined
    try {
      do {
        const page = parsed(
          wireTemplates,
          await mapped(() =>
            client.dataSources.listTemplates({
              data_source_id: dataSource,
              page_size: 100,
              ...(cursor ? { start_cursor: cursor } : {}),
            }),
          ),
        )
        for (const { id, name, is_default } of page.templates) all.push({ id, name, is_default })
        cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined
      } while (cursor && all.length < MORE_TEMPLATES)
    } catch (error) {
      if (isItemError(error)) return null
      throw error
    }
    return all
  }
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
          // Only a whole page has a fingerprint: a write at it must not stand for a part of the page.
          sha256: issues.length > 0 ? null : fingerprintOf(clean.text),
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

    /** One page of a page's or block's comments; Notion's API lists only the unresolved ones. */
    comments: async ({ block, limit, cursor }: { block: string; limit: number; cursor?: string | undefined }) => {
      const page = parsed(
        wireSearch,
        await mapped(() =>
          client.comments.list({ block_id: block, page_size: limit, ...(cursor ? { start_cursor: cursor } : {}) }),
        ),
      )
      const items = page.results.map((result): Comment => {
        const comment = parsed(wireComment, result)
        return {
          id: comment.id,
          discussion_id: comment.discussion_id,
          parent: parentOf(comment.parent),
          author_id: comment.created_by.id,
          author_name: comment.display_name?.resolved_name ?? null,
          text: textOf(comment.rich_text),
          attachments: comment.attachments?.length ?? 0,
          created_time: comment.created_time,
          last_edited_time: comment.last_edited_time ?? null,
        }
      })
      return { items, hasMore: page.has_more, cursor: page.has_more ? (page.next_cursor ?? undefined) : undefined }
    },

    /**
     * One page of a data source's rows, live, filtered by `--filter` against its schema. A row's values are read as the
     * sync writes them into front matter, so a query and the local copy show the same words.
     */
    rows: async ({
      database,
      conditions,
      limit,
      cursor,
    }: {
      database: string
      conditions: readonly Condition[]
      limit: number
      cursor?: string | undefined
    }) => {
      const dataSource = await rows.dataSourceOf(database)
      const schema = conditions.length > 0 ? await rows.schemaOf(dataSource) : {}
      const people = await rows.peopleOf(peopleFiltered(schema, conditions))
      const filter = filterFrom(schema, conditions, people)
      const page = parsed(
        wireSearch,
        await mapped(() =>
          client.dataSources.query({
            data_source_id: dataSource,
            page_size: limit,
            ...(filter ? { filter: filter as never } : {}),
            ...(cursor ? { start_cursor: cursor } : {}),
          }),
        ),
      )
      const items = page.results.map((result): Row => {
        const row = parsed(wireRow, result)
        const properties = row.properties as unknown as Record<string, NotionPropertyValue>
        return {
          id: row.id,
          title: titleOf(properties),
          url: row.url ?? null,
          created_time: row.created_time ?? null,
          last_edited_time: row.last_edited_time ?? null,
          properties: frontMatter(properties),
        }
      })
      return {
        dataSource,
        items,
        hasMore: page.has_more,
        cursor: page.has_more ? (page.next_cursor ?? undefined) : undefined,
      }
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
        const templates = await templatesOf(source.id)
        sources.push({
          id: source.id,
          title: textOf(source.title) || reference.name || "",
          ...(templates ? { templates } : {}),
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
