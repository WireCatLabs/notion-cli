import { describe, expect, it } from "vitest"
import type { NotionPropertyValue } from "../notion/reads.js"
import { frontMatter, frontMatterLines, titleOf } from "./front-matter.js"

// Value shapes from https://developers.notion.com/reference/page-property-values
const SIGNED = "https://prod-files-secure.s3.us-west-2.amazonaws.com/w/f/a.pdf?X-Amz-Signature=abc&X-Amz-Credential=k"
const user = (id: string, name?: string) => ({ object: "user" as const, id, ...(name ? { name } : {}) })
const rich = (value: string) => [{ plain_text: value }]

const every: Record<string, NotionPropertyValue> = {
  Name: { type: "title", title: rich("Launch") },
  Summary: { type: "rich_text", rich_text: [{ plain_text: "Launch " }, { plain_text: "checklist" }] },
  Estimate: { type: "number", number: 8 },
  Priority: { type: "select", select: { name: "High" } },
  Status: { type: "status", status: { name: "Done" } },
  Tags: { type: "multi_select", multi_select: [{ name: "a" }, { name: "b" }] },
  Due: { type: "date", date: { start: "2026-11-01" } },
  Sprint: { type: "date", date: { start: "2026-11-01", end: "2026-11-14", time_zone: null } },
  Owner: { type: "people", people: [user("u1", "Ada"), user("u2")] },
  Attachments: { type: "files", files: [{ name: "a.pdf", type: "file", file: { url: SIGNED } }] },
  Shipped: { type: "checkbox", checkbox: false },
  Link: { type: "url", url: SIGNED },
  Email: { type: "email", email: "ada@example.com" },
  Phone: { type: "phone_number", phone_number: "+34 600" },
  Score: { type: "formula", formula: { type: "number", number: 3 } },
  Label: { type: "formula", formula: { type: "string", string: "ok" } },
  Late: { type: "formula", formula: { type: "boolean", boolean: true } },
  Next: { type: "formula", formula: { type: "date", date: { start: "2026-12-01" } } },
  Projects: { type: "relation", relation: [{ id: "p1" }], has_more: false },
  Total: { type: "rollup", rollup: { type: "number", number: 13 } },
  Latest: { type: "rollup", rollup: { type: "date", date: { start: "2026-10-01" } } },
  Names: {
    type: "rollup",
    rollup: {
      type: "array",
      array: [
        { type: "rich_text", rich_text: rich("x") },
        { type: "number", number: 2 },
      ],
    },
  },
  Created: { type: "created_time", created_time: "2026-01-01T00:00:00.000Z" },
  Edited: { type: "last_edited_time", last_edited_time: "2026-02-01T00:00:00.000Z" },
  Author: { type: "created_by", created_by: user("u1", "Ada") },
  Editor: { type: "last_edited_by", last_edited_by: user("u3") },
  Task: { type: "unique_id", unique_id: { number: 42, prefix: "TASK" } },
  Plain: { type: "unique_id", unique_id: { number: 7, prefix: null } },
  Verified: { type: "verification", verification: { state: "verified" } },
  Office: { type: "place", place: { name: "Valencia HQ", address: "Calle 1" } },
}

const empty: Record<string, NotionPropertyValue> = {
  Summary: { type: "rich_text", rich_text: [] },
  Estimate: { type: "number", number: null },
  Priority: { type: "select", select: null },
  Status: { type: "status", status: null },
  Tags: { type: "multi_select", multi_select: [] },
  Due: { type: "date", date: null },
  Owner: { type: "people", people: [] },
  Attachments: { type: "files", files: [] },
  Link: { type: "url", url: null },
  Email: { type: "email", email: null },
  Phone: { type: "phone_number", phone_number: null },
  Score: { type: "formula", formula: { type: "number", number: null } },
  Label: { type: "formula", formula: { type: "string", string: null } },
  Late: { type: "formula", formula: { type: "boolean", boolean: null } },
  Next: { type: "formula", formula: { type: "date", date: null } },
  Projects: { type: "relation", relation: [] },
  Total: { type: "rollup", rollup: { type: "number", number: null } },
  Latest: { type: "rollup", rollup: { type: "date", date: null } },
  Names: { type: "rollup", rollup: { type: "array", array: [] } },
  Partial: { type: "rollup", rollup: { type: "incomplete" } },
  TooBig: { type: "rollup", rollup: { type: "unsupported" } },
  Task: { type: "unique_id", unique_id: { number: null, prefix: "TASK" } },
  Verified: { type: "verification", verification: null },
  Office: { type: "place", place: null },
  Act: { type: "button", button: {} },
}

describe("frontMatter", () => {
  it("maps every property type Notion documents to a plain value", () => {
    expect(frontMatter(every)).toEqual({
      Summary: "Launch checklist",
      Estimate: 8,
      Priority: "High",
      Status: "Done",
      Tags: ["a", "b"],
      Due: "2026-11-01",
      Sprint: "2026-11-01/2026-11-14",
      Owner: ["Ada", "u2"],
      Attachments: ["a.pdf"],
      Shipped: false,
      Link: "https://prod-files-secure.s3.us-west-2.amazonaws.com/w/f/a.pdf",
      Email: "ada@example.com",
      Phone: "+34 600",
      Score: 3,
      Label: "ok",
      Late: true,
      Next: "2026-12-01",
      Projects: ["p1"],
      Total: 13,
      Latest: "2026-10-01",
      Names: ["x", 2],
      Created: "2026-01-01T00:00:00.000Z",
      Edited: "2026-02-01T00:00:00.000Z",
      Author: "Ada",
      Editor: "u3",
      Task: "TASK-42",
      Plain: 7,
      Verified: "verified",
      Office: "Valencia HQ",
    })
  })

  it("leaves out empty values, buttons, unfinished rollups and the title", () => {
    expect(frontMatter(empty)).toEqual({})
  })

  it("skips a property type Notion added after this was written", () => {
    const later = { Future: { type: "hologram", hologram: {} } } as unknown as Record<string, NotionPropertyValue>
    expect(frontMatter(later)).toEqual({})
  })

  it("keeps no signed link anywhere in the result", () => {
    expect(JSON.stringify(frontMatter(every))).not.toMatch(/X-Amz-/)
  })

  it("names the page by its title property, whatever it is called", () => {
    expect(titleOf({ Task: { type: "title", title: rich("Write docs") } })).toBe("Write docs")
    expect(titleOf({})).toBe("")
  })

  it("writes fields as searchable lines", () => {
    expect(frontMatterLines({ Status: "Done", Tags: ["a", "b"], Shipped: true })).toEqual([
      "Status: Done",
      "Tags: a, b",
      "Shipped: true",
    ])
  })
})
