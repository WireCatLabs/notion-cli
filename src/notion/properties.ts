import { CliError } from "@wirecat/cli-base"
import { InvalidArgumentError } from "commander"
import { notionId } from "./ids.js"

/** A data source's property as its schema gives it: the type picks how a value is written or filtered. */
export interface SchemaProperty {
  name: string
  type: string
  options?: string[]
}

export type Schema = Record<string, SchemaProperty>

/** Who a people value names: the token's owner for `me`, and a person found by email. */
export interface People {
  me?: string
  byEmail: ReadonlyMap<string, string>
}

const refused = (message: string, extra: Record<string, unknown> = {}) =>
  new CliError("validation_error", message, { reason: "notion.value-invalid", sent: false, ...extra })

/** A repeatable `--field Name=Value`: the name is everything before the first `=`. */
export const assignment = (text: string, previous: [string, string][] = []): [string, string][] => {
  const at = text.indexOf("=")
  if (at < 1) throw new InvalidArgumentError("expected Name=Value, such as Status=Done")
  return [...previous, [text.slice(0, at), text.slice(at + 1)]]
}

const OPERATORS = ["!=", ">=", "<=", "!~", "=", ">", "<", "~"] as const
type Operator = (typeof OPERATORS)[number]
export type Condition = [string, Operator, string]

/** A repeatable `--where Name<op>Value`; the first operator found splits it, so a value may hold one too. */
export const condition = (text: string, previous: Condition[] = []): Condition[] => {
  const found = /^(.+?)(!=|>=|<=|!~|=|>|<|~)(.*)$/su.exec(text)
  if (!found?.[1] || !found[2])
    throw new InvalidArgumentError("expected Name=Value, or one of != > >= < <= ~ !~ in place of =")
  return [...previous, [found[1], found[2] as Operator, found[3] ?? ""]]
}

const propertyOf = (schema: Schema, name: string) => {
  const property = schema[name]
  if (!property)
    throw refused(`the database has no property "${name}"; databases show lists its properties`, {
      properties: Object.keys(schema),
    })
  return property
}

/** Notion takes at most 2,000 characters in one text object ([request limits](https://developers.notion.com/reference/request-limits)). */
const TEXT_PART = 2000
/** Notion takes at most 100 people or relations in one request ([request limits](https://developers.notion.com/reference/request-limits)). */
const MOST_REFERENCES = 100

export const richText = (value: string) => {
  const parts = []
  for (let at = 0; at < value.length; at += TEXT_PART)
    parts.push({ type: "text" as const, text: { content: value.slice(at, at + TEXT_PART) } })
  return parts
}

const listOf = (value: string) =>
  value
    .split(",")
    .map((one) => one.trim())
    .filter(Boolean)

const DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/u

const dateOf = (name: string, value: string) => {
  const [start = "", end, more] = value.split("/")
  if (more !== undefined || !DATE.test(start) || (end !== undefined && !DATE.test(end)))
    throw refused(`${name} takes a date such as 2026-12-01, a time 2026-12-01T09:00+01:00, or a range start/end`)
  return { start, ...(end === undefined ? {} : { end }) }
}

const numberOf = (name: string, value: string) => {
  const number = Number(value)
  if (value.trim() === "" || !Number.isFinite(number)) throw refused(`${name} takes a number`)
  return number
}

const BOOLEAN: Record<string, boolean> = { true: true, yes: true, "1": true, false: false, no: false, "0": false }

const booleanOf = (name: string, value: string) => {
  const found = BOOLEAN[value.trim().toLowerCase()]
  if (found === undefined) throw refused(`${name} takes true or false`)
  return found
}

const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/iu

/** A person by user id, `me` or email address; an email is looked up before the write. */
const personOf = (name: string, value: string, people: People) => {
  if (UUID.test(value)) return notionId(value, "user")
  if (value.toLowerCase() === "me") {
    if (!people.me)
      throw refused(
        `${name}: "me" names the person who owns this connection, and this one belongs to the workspace; give an ` +
          "email address or a user id",
      )
    return people.me
  }
  const id = people.byEmail.get(value.toLowerCase())
  if (!id) throw refused(`${name}: no person with that email address in this workspace`)
  return id
}

const referencesOf = (name: string, value: string) => {
  const all = listOf(value)
  if (all.length > MOST_REFERENCES) throw refused(`${name} takes at most ${MOST_REFERENCES} values in one write`)
  return all
}

const statusOf = (property: SchemaProperty, value: string) => {
  if (property.options && !property.options.includes(value))
    throw refused(`${property.name} has no status "${value}"; Notion adds no status in a write`, {
      choices: property.options,
    })
  return { name: value }
}

const READ_ONLY = new Set([
  "formula",
  "rollup",
  "created_time",
  "created_by",
  "last_edited_time",
  "last_edited_by",
  "unique_id",
  "button",
])

/** One value as the page write takes it ([page property values](https://developers.notion.com/reference/page-property-values)). */
const writeValue = (property: SchemaProperty, value: string, people: People): Record<string, unknown> => {
  const { name, type } = property
  const empty = value.trim() === ""
  switch (type) {
    case "title":
    case "rich_text":
      return { [type]: richText(value) }
    case "number":
      return { number: empty ? null : numberOf(name, value) }
    case "select":
      return { select: empty ? null : { name: value } }
    case "status":
      if (empty) throw refused(`${name} cannot be left without a status`)
      return { status: statusOf(property, value) }
    case "multi_select":
      return { multi_select: listOf(value).map((one) => ({ name: one })) }
    case "date":
      return { date: empty ? null : dateOf(name, value) }
    case "checkbox":
      return { checkbox: empty ? false : booleanOf(name, value) }
    case "url":
    case "email":
    case "phone_number":
      return { [type]: empty ? null : value }
    case "people":
      return { people: referencesOf(name, value).map((one) => ({ id: personOf(name, one, people) })) }
    case "relation":
      return { relation: referencesOf(name, value).map((one) => ({ id: notionId(one) })) }
    case "files":
      throw refused(`${name} is a files property; files upload adds a file to a page`)
    default:
      if (READ_ONLY.has(type)) throw refused(`${name} is a ${type} property, which Notion sets itself`)
      throw refused(`${name} is a ${type} property, which notion cannot write yet; use api patch-page`)
  }
}

const once = (pairs: readonly (readonly [string, ...unknown[]])[]) => {
  const seen = new Set<string>()
  for (const [name] of pairs) {
    if (seen.has(name)) throw refused(`${name} is given twice`)
    seen.add(name)
  }
}

/** The emails and `me` the values name, to look up before the write. */
export const peopleNamed = (schema: Schema, pairs: readonly (readonly [string, string])[]) => {
  const emails = new Set<string>()
  let me = false
  for (const [name, value] of pairs) {
    if (schema[name]?.type !== "people") continue
    for (const one of listOf(value)) {
      if (one.toLowerCase() === "me") me = true
      else if (!UUID.test(one)) emails.add(one.toLowerCase())
    }
  }
  return { me, emails: [...emails] }
}

/** The page write's `properties`, by property name as the data source's schema names them. */
export const propertiesOf = (
  schema: Schema,
  pairs: readonly (readonly [string, string])[],
  people: People,
  title?: string,
) => {
  once(pairs)
  const properties: Record<string, Record<string, unknown>> = {}
  for (const [name, value] of pairs) properties[name] = writeValue(propertyOf(schema, name), value, people)
  if (title !== undefined) {
    const named = Object.values(schema).find((property) => property.type === "title")
    if (!named) throw refused("the database has no title property")
    if (named.name in properties) throw refused(`${named.name} is given twice, with --title and --field`)
    properties[named.name] = { title: richText(title) }
  }
  return properties
}

const TEXT_CONDITIONS: Partial<Record<Operator, string>> = {
  "=": "equals",
  "!=": "does_not_equal",
  "~": "contains",
  "!~": "does_not_contain",
}
const NUMBER_CONDITIONS: Partial<Record<Operator, string>> = {
  "=": "equals",
  "!=": "does_not_equal",
  ">": "greater_than",
  ">=": "greater_than_or_equal_to",
  "<": "less_than",
  "<=": "less_than_or_equal_to",
}
const DATE_CONDITIONS: Partial<Record<Operator, string>> = {
  "=": "equals",
  ">": "after",
  ">=": "on_or_after",
  "<": "before",
  "<=": "on_or_before",
}
const EQUAL_CONDITIONS: Partial<Record<Operator, string>> = { "=": "equals", "!=": "does_not_equal" }
const CONTAIN_CONDITIONS: Partial<Record<Operator, string>> = {
  "=": "contains",
  "~": "contains",
  "!=": "does_not_contain",
  "!~": "does_not_contain",
}

const conditionsOf = (type: string) => {
  switch (type) {
    case "title":
    case "rich_text":
    case "url":
    case "email":
    case "phone_number":
      return TEXT_CONDITIONS
    case "number":
    case "unique_id":
      return NUMBER_CONDITIONS
    case "date":
    case "created_time":
    case "last_edited_time":
      return DATE_CONDITIONS
    case "checkbox":
    case "select":
    case "status":
      return EQUAL_CONDITIONS
    case "multi_select":
    case "people":
    case "relation":
      return CONTAIN_CONDITIONS
    default:
      return undefined
  }
}

const filterValue = (property: SchemaProperty, value: string, people: People): unknown => {
  switch (property.type) {
    case "number":
    case "unique_id":
      return numberOf(property.name, value)
    case "checkbox":
      return booleanOf(property.name, value)
    case "date":
    case "created_time":
    case "last_edited_time":
      return dateOf(property.name, value).start
    case "people":
      // Notion's own filter takes `me` for the person the token acts for.
      return value.toLowerCase() === "me" ? "me" : personOf(property.name, value, people)
    case "relation":
      return notionId(value)
    default:
      return value
  }
}

/** One `--filter` as a filter ([filter data source entries](https://developers.notion.com/reference/filter-data-source-entries)). */
const filterOf = (schema: Schema, [name, operator, value]: Condition, people: People) => {
  const property = propertyOf(schema, name)
  const conditions = conditionsOf(property.type)
  if (!conditions) throw refused(`${name} is a ${property.type} property, which --filter cannot filter yet`)
  const timestamp = property.type === "created_time" || property.type === "last_edited_time"
  const target = timestamp ? { timestamp: property.type } : { property: name }
  if (value.trim() === "" && (operator === "=" || operator === "!="))
    return { ...target, [property.type]: { [operator === "=" ? "is_empty" : "is_not_empty"]: true } }
  const word = conditions[operator]
  if (!word)
    throw refused(`${name} takes ${Object.keys(conditions).join(" ")} in --filter, not ${operator}`, {
      operators: Object.keys(conditions),
    })
  return { ...target, [property.type]: { [word]: filterValue(property, value, people) } }
}

/** Every `--filter` at once: one is the filter itself, more are all required. */
export const filterFrom = (schema: Schema, conditions: readonly Condition[], people: People) => {
  const filters = conditions.map((one) => filterOf(schema, one, people))
  if (filters.length === 0) return undefined
  return filters.length === 1 ? filters[0] : { and: filters }
}

/** The emails a `--filter` on a people property names, to look up before the query. */
export const peopleFiltered = (schema: Schema, conditions: readonly Condition[]) =>
  peopleNamed(
    schema,
    conditions.filter(([, , value]) => value.toLowerCase() !== "me").map(([name, , value]) => [name, value] as const),
  )
