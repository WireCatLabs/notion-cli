import type { Client } from "@notionhq/client"
import { CliError, isCliError } from "@wirecat/cli-base"
import * as v from "valibot"
import { mapped, NOTION } from "./errors.js"
import { peopleNamed, propertiesOf, richText } from "./properties.js"
import { rowReads } from "./rows.js"

// Each wire name is from Notion's reference, linked at its schema; the strict fake in src/testing/fake-notion.ts
// refuses any other. No wire type leaves this file (WC-ARCH-3).

/** [Page](https://developers.notion.com/reference/page): the fields a write's answer reports. */
const wirePage = v.looseObject({
  object: v.literal("page"),
  id: v.string(),
  url: v.optional(v.string()),
  in_trash: v.optional(v.boolean()),
  last_edited_time: v.optional(v.string()),
  properties: v.optional(
    v.record(v.string(), v.looseObject({ type: v.string(), title: v.optional(v.array(v.unknown())) })),
  ),
})

/** [Update a page's content as Markdown](https://developers.notion.com/reference/update-page-markdown). */
const wireUpdated = v.looseObject({
  object: v.literal("page_markdown"),
  id: v.string(),
  markdown: v.optional(v.string()),
  truncated: v.optional(v.boolean()),
  unknown_block_ids: v.optional(v.array(v.string())),
  warnings: v.optional(v.array(v.looseObject({ code: v.string(), message: v.string() }))),
})

/** One part of a targeted edit: `old` as the page has it now, `all` for every place it occurs. */
export interface TextEdit {
  old: string
  new: string
  all?: boolean
}

/**
 * The page after a text write, as Notion answers it. `markdown` is left out when the answer is cut, so nothing reads a
 * part of the page as the whole of it.
 */
const updatedOf = (answer: v.InferOutput<typeof wireUpdated>) => ({
  id: answer.id,
  warnings: (answer.warnings ?? []).map(({ code }) => code),
  ...(answer.markdown !== undefined && answer.truncated === false && (answer.unknown_block_ids ?? []).length === 0
    ? { markdown: answer.markdown }
    : {}),
})

const parsed = <T>(schema: v.GenericSchema<unknown, T>, value: unknown): T => {
  const result = v.safeParse(schema, value)
  if (result.success) return result.output
  throw new CliError("invalid_response", `${NOTION}'s answer does not have the documented shape`, {
    reason: "notion.invalid-response",
  })
}

/** [Comment](https://developers.notion.com/reference/comment-object): the fields a write's answer reports. */
const wireComment = v.looseObject({
  object: v.literal("comment"),
  id: v.string(),
  discussion_id: v.string(),
  created_time: v.optional(v.string()),
})

/** [File upload](https://developers.notion.com/reference/file-upload). */
const wireUpload = v.looseObject({
  object: v.literal("file_upload"),
  id: v.string(),
  status: v.string(),
  filename: v.nullish(v.string()),
  content_type: v.nullish(v.string()),
})

/** [Append block children](https://developers.notion.com/reference/patch-block-children). */
const wireAppended = v.looseObject({
  object: v.literal("list"),
  results: v.array(v.looseObject({ id: v.string(), type: v.string() })),
})

/** Up to 20 MB goes in one part; above, in parts of 5 to 20 MB, Notion's guide suggesting 10 ([larger files](https://developers.notion.com/guides/data-apis/sending-larger-files)). */
export const SINGLE_PART_BYTES = 20 * 1024 * 1024
export const PART_BYTES = 10 * 1024 * 1024

/** The block a file is shown in, by the type Notion read from its name ([file blocks](https://developers.notion.com/reference/block#file)). */
const blockTypeOf = (contentType: string | null | undefined) => {
  const [kind] = (contentType ?? "").split("/")
  if (kind === "image" || kind === "video" || kind === "audio") return kind
  return contentType === "application/pdf" ? "pdf" : "file"
}

export interface Upload {
  /** The page the file is added to, at its end. */
  page: string
  filename: string
  size: number
  /** `length` bytes of the file from `offset`. */
  read: (offset: number, length: number) => Uint8Array<ArrayBuffer>
}

export const pageSchema = v.strictObject({
  id: v.string(),
  title: v.string(),
  url: v.nullable(v.string()),
  in_trash: v.boolean(),
  last_edited_time: v.nullable(v.string()),
})
export type WrittenPage = v.InferOutput<typeof pageSchema>

const titleOf = (properties: v.InferOutput<typeof wirePage>["properties"]) => {
  const title = Object.values(properties ?? {}).find((property) => property.type === "title")?.title ?? []
  return title.map((part) => (part as { plain_text?: unknown }).plain_text ?? "").join("")
}

const pageOf = (answer: unknown): WrittenPage => {
  const page = parsed(wirePage, answer)
  return {
    id: page.id,
    title: titleOf(page.properties),
    url: page.url ?? null,
    in_trash: page.in_trash ?? false,
    last_edited_time: page.last_edited_time ?? null,
  }
}

/** A title as the rich text a page's `title` property takes ([page properties](https://developers.notion.com/reference/page-property-values#title)). */
const titleProperty = (title: string) => ({ title: { title: [{ type: "text" as const, text: { content: title } }] } })

/**
 * Notion refuses a Markdown update that would drop a child page or database with a `validation_error`, unless the
 * update allows it ([protecting child pages](https://developers.notion.com/reference/update-page-markdown)). Its
 * message names the pages but may quote other people's titles, so the refusal says what to do instead (WC-SECR-6).
 */
const withContentHint = (error: unknown) =>
  isCliError(error) && error.code === "validation_error" && error.details.reason === "notion.refused"
    ? new CliError(
        "validation_error",
        `${NOTION} refused the new text. Most often it leaves out a child page or database, which Notion would ` +
          "delete: keep its <page> or <database> tag, or add --allow-deleting-content. Text over 5,000 blocks is " +
          "refused too",
        { ...error.details, reason: "notion.text-refused" },
      )
    : error

const UNANSWERED = new Set(["network_error", "timeout", "invalid_response", "provider_unavailable"])

/**
 * A write Notion may have carried out is `outcome_unknown`, never retried (WC-LIFE-9): no answer, an answer that cannot
 * be read, or a 5xx, which Notion also gives a request it ended after 60 s
 * ([status codes](https://developers.notion.com/reference/status-codes)). A refusal, a 429 and anything not sent
 * keep their own code.
 */
const outcomeOf = (error: unknown) => {
  const known = isCliError(error)
  if (known && (error.details.sent === false || !UNANSWERED.has(error.code))) return error
  return new CliError("outcome_unknown", `${NOTION} did not confirm the write; check the page before repeating it`, {
    ...(known ? { status: error.details.status, notion_code: error.details.notion_code, cause_code: error.code } : {}),
    retryable: false,
  })
}

const writing = async <T>(call: () => Promise<T>): Promise<T> => {
  try {
    return await call()
  } catch (error) {
    throw outcomeOf(error)
  }
}

/** A move's or a comment write's answer, which Notion may give as only `object` and `id`. */
const wirePartialPage = v.looseObject({ object: v.literal("page"), id: v.string() })
const wireFullComment = v.looseObject({
  object: v.literal("comment"),
  id: v.string(),
  discussion_id: v.optional(v.string()),
  last_edited_time: v.optional(v.string()),
  created_by: v.looseObject({ id: v.string() }),
  rich_text: v.array(v.looseObject({ plain_text: v.string() })),
})
const wirePartialComment = v.looseObject({
  object: v.literal("comment"),
  id: v.string(),
  discussion_id: v.optional(v.string()),
  last_edited_time: v.optional(v.string()),
})

/**
 * [Get self](https://developers.notion.com/reference/get-self): the bot a comment written through this token names,
 * and for a personal access token the person who owns it, whose name such a comment may carry instead (not checked
 * live).
 */
const wireBot = v.looseObject({
  object: v.literal("user"),
  id: v.string(),
  bot: v.optional(
    v.looseObject({
      owner: v.optional(v.looseObject({ type: v.string(), user: v.optional(v.looseObject({ id: v.string() })) })),
    }),
  ),
})

/** A page's title property, whatever the database calls it ([page properties](https://developers.notion.com/reference/page-property-values#title)). */
const wireTitled = v.looseObject({
  object: v.literal("page"),
  parent: v.optional(v.looseObject({ data_source_id: v.optional(v.string()) })),
  properties: v.record(v.string(), v.looseObject({ type: v.string() })),
})

/** Where a page goes: under a page, or into a database or one of its data sources ([move page](https://developers.notion.com/reference/move-page)). */
export type Destination = { page: string } | { into: string }

/** `none` takes the icon or cover away, a https link is an external image, and an emoji is an icon. */
export type Picture = "none" | { url: string } | { emoji: string }

const iconOf = (picture: Picture) => {
  if (picture === "none") return null
  if ("url" in picture) return { type: "external" as const, external: { url: picture.url } }
  return { type: "emoji" as const, emoji: picture.emoji }
}

const coverOf = (picture: Picture) => {
  if (picture === "none") return null
  if ("url" in picture) return { type: "external" as const, external: { url: picture.url } }
  throw new CliError("validation_error", "a cover is an https link to an image, or none", { sent: false })
}

const textOfComment = (comment: { rich_text: { plain_text: string }[] }) =>
  comment.rich_text.map((part) => part.plain_text).join("")

/** A template by `default`, `none`, its id or its name, as `databases show` lists them. */
export type TemplateChoice = string | undefined

const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/iu

/** A row's `--field Name=Value` pairs, in the order given. */
export type Fields = readonly (readonly [string, string])[]

export interface Patch {
  fields?: Fields
  title?: string | undefined
  icon?: Picture
  cover?: Picture
}

/** Every Notion write the commands make, each answer checked against its documented shape. */
export const liveWrites = (client: Client) => {
  const rows = rowReads(client)

  const templateOf = async (dataSource: string, template: TemplateChoice) => {
    if (template === undefined || template === "none") return undefined
    if (template === "default") return { type: "default" as const }
    if (UUID.test(template)) return { type: "template_id" as const, template_id: template }
    const found = parsed(
      v.looseObject({ templates: v.array(v.looseObject({ id: v.string(), name: v.string() })) }),
      await mapped(() =>
        client.dataSources.listTemplates({ data_source_id: dataSource, name: template, page_size: 100 }),
      ),
    ).templates.filter((one) => one.name.toLowerCase() === template.toLowerCase())
    const [only, ...more] = found
    if (only && more.length === 0) return { type: "template_id" as const, template_id: only.id }
    throw new CliError(
      "validation_error",
      found.length === 0
        ? "the database has no template of that name; databases show lists them"
        : `${found.length} templates have that name; give one by its id from databases show`,
      {
        reason: "notion.value-invalid",
        sent: false,
        ...(found.length ? { template_ids: found.map((one) => one.id) } : {}),
      },
    )
  }

  const ownComment = async (id: string) => {
    const comment = parsed(wireFullComment, await mapped(() => client.comments.retrieve({ comment_id: id })))
    const bot = parsed(wireBot, await mapped(() => client.users.me({})))
    const own = [bot.id, ...(bot.bot?.owner?.type === "user" && bot.bot.owner.user ? [bot.bot.owner.user.id] : [])]
    if (!own.includes(comment.created_by.id))
      throw new CliError(
        "permission_error",
        `${NOTION} lets a connection change or delete only the comments it posted, and another person or connection ` +
          "posted this one",
        { reason: "notion.not-own-comment", sent: false },
      )
    return comment
  }

  return {
    /** A new page under `parent`; with no title, Notion takes the Markdown's first `# heading`. */
    create: ({ parent, title, markdown }: { parent: string; title?: string | undefined; markdown?: string }) =>
      writing(async () =>
        pageOf(
          await mapped(() =>
            client.pages.create({
              parent: { page_id: parent },
              ...(title === undefined ? {} : { properties: titleProperty(title) }),
              ...(markdown === undefined ? {} : { markdown, markdown_version: "v2" as const }),
            }),
          ),
        ),
      ),

    /** The whole text replaced; a child page or database left out is deleted only when `allowDeleting` is set. */
    replace: (id: string, markdown: string, allowDeleting: boolean) =>
      writing(async () => {
        try {
          const answer = parsed(
            wireUpdated,
            await mapped(() =>
              client.pages.updateMarkdown({
                page_id: id,
                markdown_version: "v2",
                type: "replace_content",
                replace_content: { new_str: markdown, ...(allowDeleting ? { allow_deleting_content: true } : {}) },
              }),
            ),
          )
          return updatedOf(answer)
        } catch (error) {
          throw allowDeleting ? error : withContentHint(error)
        }
      }),

    /**
     * Parts of the text replaced where they are, by `update_content`. Notion applies the parts that match and only
     * warns about the rest (`no_match`), so the caller checks every part against the text first.
     */
    edit: (id: string, edits: readonly TextEdit[], allowDeleting: boolean) =>
      writing(async () => {
        try {
          const answer = parsed(
            wireUpdated,
            await mapped(() =>
              client.pages.updateMarkdown({
                page_id: id,
                markdown_version: "v2",
                type: "update_content",
                update_content: {
                  content_updates: edits.map((edit) => ({
                    old_str: edit.old,
                    new_str: edit.new,
                    ...(edit.all ? { replace_all_matches: true } : {}),
                  })),
                  ...(allowDeleting ? { allow_deleting_content: true } : {}),
                },
              }),
            ),
          )
          return updatedOf(answer)
        } catch (error) {
          throw allowDeleting ? error : withContentHint(error)
        }
      }),

    /** A comment on a page, or a reply in a discussion; Notion takes inline Markdown only ([create a comment](https://developers.notion.com/reference/create-a-comment)). */
    comment: (target: { page: string } | { discussion: string }, markdown: string) =>
      writing(async () => {
        const body =
          "page" in target
            ? { parent: { page_id: target.page }, markdown, markdown_version: "v2" as const }
            : { discussion_id: target.discussion, markdown, markdown_version: "v2" as const }
        const comment = parsed(wireComment, await mapped(() => client.comments.create(body)))
        return { id: comment.id, discussion_id: comment.discussion_id, created_time: comment.created_time ?? null }
      }),

    /**
     * The file sent to Notion, in parts when it is larger than one may be, then added to the end of the page as a block
     * of its kind. An upload not added to a page within an hour expires ([file uploads](https://developers.notion.com/reference/file-upload)).
     */
    upload: ({ page, filename, size, read }: Upload) =>
      writing(async () => {
        const parts = size > SINGLE_PART_BYTES ? Math.ceil(size / PART_BYTES) : 1
        const created = parsed(
          wireUpload,
          await mapped(() =>
            client.fileUploads.create(
              parts > 1 ? { mode: "multi_part", number_of_parts: parts, filename } : { filename },
            ),
          ),
        )
        let answer: unknown
        for (let part = 1; part <= parts; part++) {
          const offset = parts > 1 ? (part - 1) * PART_BYTES : 0
          const data = new Blob([read(offset, parts > 1 ? Math.min(PART_BYTES, size - offset) : size)])
          answer = await mapped(() =>
            client.fileUploads.send({
              file_upload_id: created.id,
              file: { filename, data },
              ...(parts > 1 ? { part_number: String(part) } : {}),
            }),
          )
        }
        if (parts > 1) answer = await mapped(() => client.fileUploads.complete({ file_upload_id: created.id }))
        const uploaded = parsed(wireUpload, answer)
        if (uploaded.status !== "uploaded")
          throw new CliError("invalid_response", `${NOTION} did not finish the upload: it is ${uploaded.status}`, {
            reason: "notion.upload-unfinished",
          })
        const type = blockTypeOf(uploaded.content_type)
        const block = { type, [type]: { type: "file_upload", file_upload: { id: uploaded.id } } }
        const appended = parsed(
          wireAppended,
          await mapped(() =>
            client.blocks.children.append({
              block_id: page,
              children: [block as unknown as Parameters<typeof client.blocks.children.append>[0]["children"][number]],
            }),
          ),
        )
        return {
          upload: { id: uploaded.id, filename, content_type: uploaded.content_type ?? null, size, parts },
          block: { id: appended.results.at(-1)?.id ?? null, type },
        }
      }),

    /**
     * A row in a data source, its values typed by the data source's schema. A template is applied by Notion after the
     * answer, so the row's text is not there yet when this returns ([create a page](https://developers.notion.com/reference/post-page)).
     */
    createRow: async ({
      into,
      fields,
      title,
      template,
      markdown,
    }: {
      into: string
      fields: Fields
      title?: string | undefined
      template?: TemplateChoice
      markdown?: string | undefined
    }) => {
      const dataSource = await rows.dataSourceOf(into)
      const schema = await rows.schemaOf(dataSource)
      const properties = propertiesOf(schema, fields, await rows.peopleOf(peopleNamed(schema, fields)), title)
      const chosen = await templateOf(dataSource, template)
      if (chosen && markdown !== undefined)
        throw new CliError(
          "validation_error",
          "give a template or the row's text, not both: Notion fills a row from one",
          {
            sent: false,
          },
        )
      const page = await writing(async () =>
        pageOf(
          await mapped(() =>
            client.pages.create({
              parent: { type: "data_source_id", data_source_id: dataSource },
              properties: properties as never,
              ...(chosen ? { template: chosen as never } : {}),
              ...(markdown === undefined ? {} : { markdown, markdown_version: "v2" as const }),
            }),
          ),
        ),
      )
      return { page, data_source_id: dataSource, template_pending: chosen !== undefined }
    },

    /** A page under another page or into a database; Notion moves no database and nothing to the workspace's top. */
    move: async (id: string, destination: Destination) => {
      const parent =
        "page" in destination
          ? { type: "page_id" as const, page_id: destination.page }
          : { type: "data_source_id" as const, data_source_id: await rows.dataSourceOf(destination.into) }
      const moved = await writing(async () =>
        parsed(wirePartialPage, await mapped(() => client.pages.move({ page_id: id, parent }))),
      )
      return {
        id: moved.id,
        parent:
          "page_id" in parent
            ? { type: "page", id: parent.page_id }
            : { type: "data_source", id: parent.data_source_id },
      }
    },

    /**
     * A page's title, a row's values, its icon or its cover, in one update. The title property is found by its type,
     * so a row's is renamed too. A row's values not named keep theirs, and a list given replaces the whole list.
     */
    patch: async (id: string, { fields = [], title, icon, cover }: Patch) => {
      let properties: Record<string, unknown> | undefined
      if (title !== undefined || fields.length > 0) {
        const page = parsed(wireTitled, await mapped(() => client.pages.retrieve({ page_id: id })))
        const source = page.parent?.data_source_id
        if (fields.length > 0) {
          if (!source)
            throw new CliError("validation_error", "the page is not a database row, and only a row has fields", {
              sent: false,
            })
          const schema = await rows.schemaOf(source)
          properties = propertiesOf(schema, fields, await rows.peopleOf(peopleNamed(schema, fields)), title)
        } else {
          const name = Object.entries(page.properties).find(([, property]) => property.type === "title")?.[0] ?? "title"
          properties = { [name]: { title: richText(title ?? "") } }
        }
      }
      return writing(async () =>
        pageOf(
          await mapped(() =>
            client.pages.update({
              page_id: id,
              ...(properties ? { properties: properties as never } : {}),
              ...(icon === undefined ? {} : { icon: iconOf(icon) }),
              ...(cover === undefined ? {} : { cover: coverOf(cover) }),
            }),
          ),
        ),
      )
    },

    /**
     * A comment this connection posted, changed or deleted. Notion answers 404 for anyone else's
     * ([update a comment](https://developers.notion.com/reference/update-a-comment)), so the comment is read first: the
     * refusal then says why, and the answer keeps the text it had.
     */
    editComment: async (id: string, markdown: string) => {
      const before = await ownComment(id)
      const after = await writing(async () =>
        parsed(
          wirePartialComment,
          await mapped(() => client.comments.update({ comment_id: id, markdown, markdown_version: "v2" })),
        ),
      )
      return {
        comment: {
          id: after.id,
          discussion_id: after.discussion_id ?? before.discussion_id ?? null,
          last_edited_time: after.last_edited_time ?? null,
        },
        previous_text: textOfComment(before),
      }
    },

    /** Notion keeps no deleted comment: the answer carries its text, the only copy left. */
    deleteComment: async (id: string) => {
      const before = await ownComment(id)
      const gone = await writing(async () =>
        parsed(wirePartialComment, await mapped(() => client.comments.delete({ comment_id: id }))),
      )
      return {
        comment: { id: gone.id, discussion_id: before.discussion_id ?? null },
        previous_text: textOfComment(before),
      }
    },

    /** Notion has no permanent delete in its API: a page goes to the trash and comes back from it ([trash a page](https://developers.notion.com/reference/trash-page)). */
    trash: (id: string, inTrash: boolean) =>
      writing(async () => pageOf(await mapped(() => client.pages.update({ page_id: id, in_trash: inTrash })))),
  }
}

export type LiveWrites = ReturnType<typeof liveWrites>
