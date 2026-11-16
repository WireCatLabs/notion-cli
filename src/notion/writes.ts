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

  /** Notion has no permanent delete in its API: a page goes to the trash and comes back from it ([trash a page](https://developers.notion.com/reference/trash-page)). */
  trash: (id: string, inTrash: boolean) =>
    writing(async () => pageOf(await mapped(() => client.pages.update({ page_id: id, in_trash: inTrash })))),
})

export type LiveWrites = ReturnType<typeof liveWrites>
