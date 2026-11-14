import { describe, expect, it } from "vitest"
import { decodeCursor, encodeCursor, type SyncCursor } from "./cursor.js"

describe("the sync cursor", () => {
  it("round-trips a pass cut short", () => {
    const cursor: SyncCursor = {
      v: 1,
      mark: "2026-11-14T10:00:00.000Z",
      walkedAt: 1,
      sources: [{ database: "d", source: "s" }],
      pass: {
        next: "2026-11-14T10:05:00.000Z",
        startedAt: 2,
        walk: false,
        tasks: [{ t: "rows", database: "d", source: "s", after: "2026-01-01T00:00:00.000Z" }],
      },
    }
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
  })

  it("refuses a position that is not Notion's or is damaged, and points to a rescan", () => {
    expect(() => decodeCursor("12345")).toThrow(/sync --rescan/)
    expect(() => decodeCursor("notion1.not-json")).toThrow(/damaged/)
    expect(() => decodeCursor(`notion1.${Buffer.from('{"v":2}').toString("base64url")}`)).toThrow(/damaged/)
  })
})
