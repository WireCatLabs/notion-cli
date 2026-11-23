import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { describe, expect, it } from "vitest"
import { FAKE_TOKEN, type FakeMeetingNote, fakeNotion, OTHER_PERSON_ID, PERSON_ID } from "./testing/fake-notion.js"
import { runCli } from "./testing/harness.js"

const note = (n: number, more: Partial<FakeMeetingNote> = {}): FakeMeetingNote => ({
  id: `cccccccc-0000-4000-8000-0000000${String(n).padStart(3, "0")}00`,
  title: `Test weekly sync ${n}`,
  last_edited_time: `2026-11-${String(n).padStart(2, "0")}T10:00:00.000Z`,
  start: `2026-11-${String(n).padStart(2, "0")}T09:00:00.000Z`,
  end: `2026-11-${String(n).padStart(2, "0")}T09:30:00.000Z`,
  attendees: [PERSON_ID, OTHER_PERSON_ID],
  summary: `Fake summary ${n}: the roadmap is agreed.`,
  notes: `Fake notes ${n}`,
  transcript: `Fake first line ${n}\nFake second line ${n}`,
  ...more,
})

/** One profile signed in to the fake, with a store of its own. */
const profile = (notion: ReturnType<typeof fakeNotion>) => {
  const dir = mkdtempSync(join(tmpdir(), "notion-meetings-"))
  const env = {
    MESSAGING_STORE: join(dir, "wirecat.db"),
    WCNOTION_STATE_DIR: join(dir, "state"),
    WCNOTION_CONFIG_DIR: join(dir, "config"),
  }
  const keyring = memoryKeyring()
  const run = (argv: string[], stdin?: string) =>
    runCli(["personal", ...argv, "--json"], { notion, keyring, env, ...(stdin ? { stdin } : {}) })
  return { run }
}

describe("Notion AI meeting notes in the meetings category", () => {
  it("syncs the notes with attendees, summary, notes and transcript, and reads them offline", async () => {
    const notion = fakeNotion({ meetingNotes: [note(1), note(2)] })
    const { run } = profile(notion)
    expect((await run(["session", "start"], FAKE_TOKEN)).code).toBe(0)
    const synced = await run(["meetings", "sync", "--since-time", "2026-10-01T00:00:00Z"])
    expect(synced.code, synced.err).toBe(0)
    const listed = await run(["meetings", "list"])
    expect(listed.code, listed.err).toBe(0)
    const items = (listed.json() as { items: { id: number; title: string }[] }).items
    expect(items.map((item) => item.title).sort()).toEqual(["Test weekly sync 1", "Test weekly sync 2"])
    const first = items.find((item) => item.title === "Test weekly sync 1")?.id
    const transcript = await run(["meetings", "transcript", String(first)])
    expect(transcript.code, transcript.err).toBe(0)
    expect(transcript.out).toContain("Fake second line 1")
    const summary = await run(["meetings", "summary", String(first)])
    expect(summary.out).toContain("the roadmap is agreed")
    expect(summary.out).toContain("Fake notes 1")
    const shown = await run(["meetings", "show", String(first)])
    expect(shown.out).toContain("Test Person")
    const markdown = notion.calls.filter((call) => call.path.endsWith("/markdown"))
    expect(markdown.some((call) => call.query?.include_transcript === "true")).toBe(true)
    expect(notion.refusals).toEqual([])
  })

  it("reads what was edited since the sync's start, ten minutes earlier, by the minute", async () => {
    const notion = fakeNotion({ meetingNotes: [note(1)] })
    const { run } = profile(notion)
    await run(["session", "start"], FAKE_TOKEN)
    expect((await run(["meetings", "sync", "--since-time", "2026-10-01T00:00:00Z"])).code).toBe(0)
    const query = notion.calls.find((call) => call.path === "/v1/blocks/meeting_notes/query")
    expect(query?.body).toMatchObject({
      filter: {
        operator: "and",
        filters: [
          {
            property: "last_edited_time",
            filter: {
              operator: "date_is_on_or_after",
              value: {
                type: "exact",
                value: { type: "datetime", start_date: "2026-09-30", start_time: "23:50", time_zone: "UTC" },
              },
            },
          },
        ],
      },
      sort: [{ property: "last_edited_time", direction: "ascending" }],
      limit: 50,
    })
  })

  // 55 meetings, each saved in turn: slower than the default timeout under coverage.
  it("goes past 50 notes by the last one's edit time, since Notion gives no cursor", async () => {
    const many = Array.from({ length: 55 }, (_, index) =>
      note(index + 100, {
        id: `cccccccc-0000-4000-8000-${String(index).padStart(10, "0")}00`,
        last_edited_time: new Date(Date.UTC(2026, 10, 1, 0, index)).toISOString(),
        start: new Date(Date.UTC(2026, 10, 1, 0, index)).toISOString(),
        end: new Date(Date.UTC(2026, 10, 1, 0, index + 1)).toISOString(),
        transcript: "",
        notes: "",
        summary: "",
        attendees: [],
      }),
    )
    const notion = fakeNotion({ meetingNotes: many })
    const { run } = profile(notion)
    await run(["session", "start"], FAKE_TOKEN)
    const synced = await run(["meetings", "sync", "--since-time", "2026-10-01T00:00:00Z"])
    expect(synced.code, synced.err).toBe(0)
    expect(notion.calls.filter((call) => call.path === "/v1/blocks/meeting_notes/query")).toHaveLength(2)
    const listed = await run(["meetings", "list", "--limit", "100"])
    expect((listed.json() as { items: unknown[] }).items).toHaveLength(55)
  }, 20_000)

  it("reads a summary Notion wrote after the meeting at the next sync", async () => {
    const late = note(3, { summary: "Fake summary 3: first draft." })
    const pages: Record<string, { markdown: string }> = {}
    const notion = fakeNotion({ meetingNotes: [late], pages })
    const { run } = profile(notion)
    await run(["session", "start"], FAKE_TOKEN)
    expect((await run(["meetings", "sync", "--since-time", "2026-10-01T00:00:00Z"])).code).toBe(0)
    pages[`${late.id.slice(0, -2)}01`] = { markdown: "Fake summary 3: final, with next steps." }
    // The sync's cursor is the time it ran, so the summary's edit comes after it.
    late.last_edited_time = new Date(Date.now() + 60_000).toISOString()
    const again = await run(["meetings", "sync"])
    expect(again.code, again.err).toBe(0)
    const listed = await run(["meetings", "list"])
    const id = (listed.json() as { items: { id: number }[] }).items[0]?.id
    const summary = await run(["meetings", "summary", String(id)])
    expect(summary.out).toContain("final, with next steps")
    expect(summary.out).not.toContain("first draft")
  })

  it("records each request of meetings sync in the command's run", async () => {
    const notion = fakeNotion({ meetingNotes: [note(1)] })
    const { run } = profile(notion)
    await run(["session", "start"], FAKE_TOKEN)
    const synced = await run(["--record", "meetings", "sync", "--since-time", "2026-10-01T00:00:00Z"])
    const runId = String((synced.json().meta as Record<string, unknown>).run_id)
    const shown = await run(["runs", "show", runId])
    const item = shown.json().item as { operations: string[] }
    expect(item.operations).toEqual(
      expect.arrayContaining(["POST /v1/blocks/meeting_notes/query", "GET /v1/pages/:id/markdown"]),
    )
  })

  it("says plainly when the workspace has no AI meeting notes for the token's user", async () => {
    const notion = fakeNotion({ noMeetingNotes: true })
    const { run } = profile(notion)
    await run(["session", "start"], FAKE_TOKEN)
    const refused = await run(["meetings", "sync", "--since-time", "2026-10-01T00:00:00Z"])
    expect(refused.code).not.toBe(0)
    expect(refused.json()).toMatchObject({ error: { reason: "notion.meeting-notes-unavailable" } })
  })

  it("refuses a profile that is not signed in, before any request", async () => {
    const notion = fakeNotion({ meetingNotes: [note(1)] })
    const { run } = profile(notion)
    const refused = await run(["meetings", "list"])
    expect(refused.code).not.toBe(0)
    expect(notion.calls).toEqual([])
  })
})
