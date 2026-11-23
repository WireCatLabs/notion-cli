import type { Client } from "@notionhq/client"
import { CliError, isCliError } from "@wirecat/cli-base"
import * as v from "valibot"
import { mapped, NOTION } from "./errors.js"
import type { People, Schema } from "./properties.js"

// Each wire name is from Notion's reference, linked at its schema; the strict fake in src/testing/fake-notion.ts
// refuses any other. No wire type leaves this file (WC-ARCH-3).

const parsed = <T>(schema: v.GenericSchema<unknown, T>, value: unknown): T => {
  const result = v.safeParse(schema, value)
  if (result.success) return result.output
  throw new CliError("invalid_response", `${NOTION}'s answer does not have the documented shape`, {
    reason: "notion.invalid-response",
  })
}

/** [Retrieve a database](https://developers.notion.com/reference/retrieve-database): its data sources. */
const wireSources = v.looseObject({
  object: v.literal("database"),
  data_sources: v.array(v.looseObject({ id: v.string() })),
})

/** [Data source](https://developers.notion.com/reference/data-source): its properties, each with its type's config. */
const wireSchema = v.looseObject({
  object: v.literal("data_source"),
  properties: v.record(v.string(), v.looseObject({ name: v.string(), type: v.string() })),
})

/** [Get self](https://developers.notion.com/reference/get-self): the bot and, for a token a person owns, that person. */
const wireSelf = v.looseObject({
  object: v.literal("user"),
  id: v.string(),
  bot: v.optional(
    v.looseObject({
      owner: v.optional(v.looseObject({ type: v.string(), user: v.optional(v.looseObject({ id: v.string() })) })),
    }),
  ),
})

/** [List all users](https://developers.notion.com/reference/get-users); `person.email` needs the email capability. */
const wireUsers = v.looseObject({
  object: v.literal("list"),
  results: v.array(
    v.looseObject({ id: v.string(), person: v.optional(v.looseObject({ email: v.optional(v.string()) })) }),
  ),
  has_more: v.boolean(),
  next_cursor: v.nullish(v.string()),
})

/** Option names of a select, multi-select or status property: what a filter like `status:Done` takes. */
export const optionsOf = (property: Record<string, unknown>): string[] | undefined => {
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

/** The users listed to find people by email; a workspace past this many pages is refused, never half-searched. */
const USER_PAGES = 20

/** What a row write and a query read before they send: the data source, its schema and the people named. */
export const rowReads = (client: Client) => {
  /**
   * The data source a database id names, or the id itself when it is not a database: a data source id is given in
   * place of its database when the database has several. One with several is refused with their ids, never picked.
   */
  const dataSourceOf = async (id: string): Promise<string> => {
    let found: v.InferOutput<typeof wireSources>
    try {
      found = parsed(wireSources, await mapped(() => client.databases.retrieve({ database_id: id })))
    } catch (error) {
      if (isCliError(error) && (error.code === "not_found" || error.details.status === 400)) return id
      throw error
    }
    const [only, ...more] = found.data_sources
    if (only && more.length === 0) return only.id
    throw new CliError(
      "validation_error",
      found.data_sources.length === 0
        ? "the database has no data source this token can see"
        : `the database has ${found.data_sources.length} data sources: give one of their ids in place of the ` +
            "database, as databases show lists them",
      {
        reason: "notion.data-source-ambiguous",
        sent: false,
        data_source_ids: found.data_sources.map((source) => source.id),
      },
    )
  }

  const schemaOf = async (dataSource: string): Promise<Schema> => {
    const source = parsed(wireSchema, await mapped(() => client.dataSources.retrieve({ data_source_id: dataSource })))
    return Object.fromEntries(
      Object.values(source.properties).map((property) => {
        const options = optionsOf(property)
        return [property.name, { name: property.name, type: property.type, ...(options ? { options } : {}) }]
      }),
    )
  }

  const peopleOf = async ({ me, emails }: { me: boolean; emails: string[] }): Promise<People> => {
    const byEmail = new Map<string, string>()
    let owner: string | undefined
    if (me) {
      const self = parsed(wireSelf, await mapped(() => client.users.me({})))
      owner = self.bot?.owner?.type === "user" ? self.bot.owner.user?.id : undefined
    }
    if (emails.length > 0) {
      let cursor: string | undefined
      let pages = 0
      let any = false
      do {
        const page = parsed(
          wireUsers,
          await mapped(() => client.users.list({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) })),
        )
        for (const user of page.results) {
          const email = user.person?.email?.toLowerCase()
          if (email) {
            any = true
            byEmail.set(email, user.id)
          }
        }
        cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined
        pages++
      } while (cursor && pages < USER_PAGES && emails.some((email) => !byEmail.has(email)))
      if (!any)
        throw new CliError(
          "permission_error",
          `${NOTION} gave no email addresses: turn on "Read user information including email addresses" in the ` +
            "connection's capabilities, or give a user id",
          { reason: "notion.restricted", sent: false },
        )
    }
    return { ...(owner ? { me: owner } : {}), byEmail }
  }

  return { dataSourceOf, schemaOf, peopleOf }
}
