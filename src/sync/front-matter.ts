import type { NotionDate, NotionPropertyValue, NotionRichText, NotionUser } from "../notion/reads.js"
import { stripSignedLinks } from "./links.js"

export type FrontMatterValue = string | number | boolean | (string | number | boolean)[]

type Known = Extract<NotionPropertyValue, { type: string }>

const text = (parts: NotionRichText[]) => stripSignedLinks(parts.map((part) => part.plain_text).join(""))
const person = (user: NotionUser) => user.name || user.id
// ISO 8601 writes an interval as start/end.
const date = (value: NotionDate) => (value.end ? `${value.start}/${value.end}` : value.start)
const present = (value: string | null | undefined) => (value ? stripSignedLinks(value) : undefined)

const mapValue = (value: Known): FrontMatterValue | undefined => {
  switch (value.type) {
    case "title":
      return text(value.title) || undefined
    case "rich_text":
      return text(value.rich_text) || undefined
    case "number":
      return value.number ?? undefined
    case "select":
      return value.select?.name
    case "status":
      return value.status?.name
    case "multi_select":
      return value.multi_select.length ? value.multi_select.map((option) => option.name) : undefined
    case "date":
      return value.date ? date(value.date) : undefined
    case "people":
      return value.people.length ? value.people.map(person) : undefined
    case "files":
      return value.files.length ? value.files.map((file) => file.name) : undefined
    case "checkbox":
      return value.checkbox
    case "url":
      return present(value.url)
    case "email":
      return present(value.email)
    case "phone_number":
      return present(value.phone_number)
    case "formula":
      return formula(value.formula)
    case "relation":
      return value.relation.length ? value.relation.map((item) => item.id) : undefined
    case "rollup":
      return rollup(value.rollup)
    case "created_time":
      return value.created_time
    case "last_edited_time":
      return value.last_edited_time
    case "created_by":
      return person(value.created_by)
    case "last_edited_by":
      return person(value.last_edited_by)
    case "unique_id":
      if (value.unique_id.number === null) return undefined
      return value.unique_id.prefix ? `${value.unique_id.prefix}-${value.unique_id.number}` : value.unique_id.number
    case "verification":
      return value.verification?.state
    case "place":
      return present(value.place?.name ?? value.place?.address)
    default:
      return undefined
  }
}

const formula = (value: Extract<Known, { type: "formula" }>["formula"]): FrontMatterValue | undefined => {
  switch (value.type) {
    case "string":
      return present(value.string)
    case "number":
      return value.number ?? undefined
    case "boolean":
      return value.boolean ?? undefined
    case "date":
      return value.date ? date(value.date) : undefined
    default:
      return undefined
  }
}

const rollup = (value: Extract<Known, { type: "rollup" }>["rollup"]): FrontMatterValue | undefined => {
  switch (value.type) {
    case "number":
      return value.number ?? undefined
    case "date":
      return value.date ? date(value.date) : undefined
    case "array": {
      const items = value.array.flatMap((item) => {
        const mapped = mapValue(item)
        return mapped === undefined ? [] : Array.isArray(mapped) ? mapped : [mapped]
      })
      return items.length ? items : undefined
    }
    default:
      return undefined
  }
}

/**
 * A row's properties as front matter: plain values a person would search for, keyed by the property's name. The
 * title is left out (it is the document's name), and so are empty values, buttons and types Notion added later.
 */
export const frontMatter = (properties: Record<string, NotionPropertyValue>) => {
  const fields: Record<string, FrontMatterValue> = {}
  for (const [name, value] of Object.entries(properties)) {
    if (value.type === "title") continue
    const mapped = mapValue(value)
    if (mapped !== undefined) fields[name] = mapped
  }
  return fields
}

export const titleOf = (properties: Record<string, NotionPropertyValue>) => {
  for (const value of Object.values(properties)) if (value.type === "title") return text(value.title)
  return ""
}

export const frontMatterLines = (fields: Record<string, FrontMatterValue>) =>
  Object.entries(fields).map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(", ") : value}`)
