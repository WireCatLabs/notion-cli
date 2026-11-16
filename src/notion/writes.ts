import type { Client } from "@notionhq/client"
import { CliError, isCliError } from "@wirecat/cli-base"
import * as v from "valibot"
import { mapped, NOTION } from "./errors.js"

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
  warnings: v.optional(v.array(v.looseObject({ code: v.string(), message: v.string() }))),
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

/** Every Notion write the commands make, each answer checked against its documented shape. */
export const liveWrites = (client: Client) => ({
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
        return { id: answer.id, warnings: (answer.warnings ?? []).map(({ code }) => code) }
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

  /** Notion has no permanent delete in its API: a page goes to the trash and comes back from it ([trash a page](https://developers.notion.com/reference/trash-page)). */
  trash: (id: string, inTrash: boolean) =>
    writing(async () => pageOf(await mapped(() => client.pages.update({ page_id: id, in_trash: inTrash })))),
})

export type LiveWrites = ReturnType<typeof liveWrites>
