import type { Client } from "@notionhq/client"
import { CliError, isCliError } from "@wirecat/cli-base"
import type {
  MeetingSource,
  SourceMeeting,
  SourceParticipant,
  SummaryContent,
  TranscriptLine,
} from "@wirecat/cli-core/meetings"
import * as v from "valibot"
import { mapped, NOTION } from "./errors.js"
import { withoutSignedLinks } from "./links.js"
import type { NotionReads } from "./reads.js"

// Each wire name is from Notion's reference, linked at its schema; the strict fake in src/testing/fake-notion.ts
// refuses any other. No wire type leaves this file (WC-ARCH-3).

const richText = v.array(v.looseObject({ plain_text: v.string() }))

/** [Query meeting notes](https://developers.notion.com/reference/query-meeting-notes): one meeting note block. */
const wireNote = v.looseObject({
  object: v.literal("block"),
  id: v.string(),
  type: v.literal("meeting_notes"),
  created_time: v.string(),
  last_edited_time: v.string(),
  in_trash: v.optional(v.boolean()),
  meeting_notes: v.looseObject({
    title: v.optional(richText),
    status: v.optional(v.string()),
    children: v.optional(
      v.looseObject({
        summary_block_id: v.optional(v.string()),
        notes_block_id: v.optional(v.string()),
        transcript_block_id: v.optional(v.string()),
      }),
    ),
    calendar_event: v.optional(
      v.looseObject({
        start_time: v.string(),
        end_time: v.string(),
        event_id: v.optional(v.string()),
        attendees: v.optional(v.array(v.string())),
      }),
    ),
    recording: v.optional(v.looseObject({ start_time: v.optional(v.string()), end_time: v.optional(v.string()) })),
  }),
})
type WireNote = v.InferOutput<typeof wireNote>

const wireNotes = v.looseObject({ results: v.array(v.unknown()), has_more: v.boolean() })

const wireMarkdown = v.looseObject({ markdown: v.string(), truncated: v.optional(v.boolean()) })

const parsed = <T>(schema: v.GenericSchema<unknown, T>, value: unknown): T => {
  const result = v.safeParse(schema, value)
  if (result.success) return result.output
  throw new CliError("invalid_response", `${NOTION}'s answer does not have the documented shape`, {
    reason: "notion.invalid-response",
  })
}

/** Notion lists at most 50 a request, with no cursor; the next request starts at the last one's edit time. */
const PAGE = 50
/** The most requests one listing makes: 10,000 meeting notes. */
const MAX_PAGES = 200
/** A note's summary and transcript come after the meeting, and Notion filters by the minute. */
const OVERLAP_MS = 10 * 60_000

const minuteOf = (iso: string) => {
  const at = new Date(iso)
  return {
    type: "datetime" as const,
    start_date: at.toISOString().slice(0, 10),
    start_time: at.toISOString().slice(11, 16),
    time_zone: "UTC",
  }
}

const unavailable = (error: unknown) => {
  if (isCliError(error) && error.code === "validation_error")
    return new CliError(
      "validation_error",
      `${NOTION} refused the meeting notes query: AI meeting notes are not available for this connection's user. ` +
        "They need a workspace with Notion AI meeting notes, and a personal access token of a member who attends",
      { reason: "notion.meeting-notes-unavailable" },
    )
  return error
}

const textOf = (parts: v.InferOutput<typeof richText> | undefined) =>
  (parts ?? []).map((part) => part.plain_text).join("")

const meetingOf = (note: WireNote): SourceMeeting => {
  const { meeting_notes: body } = note
  const start = body.recording?.start_time ?? body.calendar_event?.start_time ?? note.created_time
  const end = body.recording?.end_time ?? body.calendar_event?.end_time ?? null
  return {
    series: null,
    occurrence: { id: note.id, seriesId: note.id, title: textOf(body.title) || null, startedAt: start, endedAt: end },
    metadata: {
      status: body.status ?? null,
      calendar_event_id: body.calendar_event?.event_id ?? null,
      last_edited_time: note.last_edited_time,
    },
  }
}

/**
 * Notion AI meeting notes as meetings for cli-core's `pull`: the notes of meetings the token's user attended, with
 * their attendees, AI summary, own notes and transcript. Notion documents no line format for a transcript, so each
 * line is kept as written, with no speaker or time of its own.
 */
export const meetingNotesSource = (client: Client, reads: NotionReads): MeetingSource => {
  const seen = new Map<string, WireNote>()
  const markdownOf = async (block: string | undefined, transcript = false) => {
    if (!block) return null
    try {
      const answer = parsed(
        wireMarkdown,
        await mapped(() =>
          client.pages.retrieveMarkdown({
            page_id: block,
            markdown_version: "v2",
            ...(transcript ? { include_transcript: true } : {}),
          }),
        ),
      )
      return withoutSignedLinks(answer.markdown).text
    } catch (error) {
      if (isCliError(error) && error.code === "not_found") return null
      throw error
    }
  }
  const children = (id: string) => seen.get(id)?.meeting_notes.children
  return {
    provider: "notion",
    name: "Notion AI meeting notes",
    overlapMs: OVERLAP_MS,
    meetings: async (since) => {
      let from = since
      const found = new Map<string, WireNote>()
      for (let page = 0; page < MAX_PAGES; page++) {
        const answer = parsed(
          wireNotes,
          await mapped(() =>
            client.blocks.meetingNotes.query({
              filter: {
                operator: "and",
                filters: [
                  {
                    property: "last_edited_time",
                    filter: { operator: "date_is_on_or_after", value: { type: "exact", value: minuteOf(from) } },
                  },
                ],
              },
              sort: [{ property: "last_edited_time", direction: "ascending" }],
              limit: PAGE,
            }),
          ).catch((error: unknown) => Promise.reject(unavailable(error))),
        )
        const notes = answer.results.map((result) => parsed(wireNote, result))
        for (const note of notes) if (!note.in_trash) found.set(note.id, note)
        const last = notes.at(-1)?.last_edited_time
        if (!answer.has_more || !last) break
        // A whole page edited in one minute cannot be passed by the minute filter; the rest waits for a later edit.
        if (minuteOf(last).start_time === minuteOf(from).start_time && last.slice(0, 10) === from.slice(0, 10)) break
        from = last
      }
      for (const [id, note] of found) seen.set(id, note)
      return [...found.values()].map(meetingOf)
    },
    participants: async (id) => {
      const note = seen.get(id)
      if (!note) return null
      const people: SourceParticipant[] = []
      for (const user of note.meeting_notes.calendar_event?.attendees ?? []) {
        const detail = await reads.retrieveUser(user).catch((error: unknown) => {
          if (isCliError(error) && ["not_found", "permission_error"].includes(error.code)) return undefined
          throw error
        })
        people.push({
          identityExternalId: user,
          email: detail?.person?.email ?? null,
          displayName: detail?.name ?? null,
          externalId: user,
          role: "attendee",
          joinedAt: null,
          leftAt: null,
          durationMs: null,
          sessions: null,
          metadata: {},
        })
      }
      return people
    },
    transcript: async (id): Promise<TranscriptLine[] | null> => {
      const text = await markdownOf(children(id)?.transcript_block_id, true)
      if (text === null) return null
      return text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ startMs: 0, endMs: 0, speaker: null, text: line }))
    },
    summary: async (id): Promise<SummaryContent | null> => {
      const parts = children(id)
      const summary = await markdownOf(parts?.summary_block_id)
      const notes = await markdownOf(parts?.notes_block_id)
      if (summary === null && notes === null) return null
      return {
        source: "notion",
        content: summary,
        title: textOf(seen.get(id)?.meeting_notes.title) || null,
        overview: summary,
        sections: notes ? [{ label: "Notes", text: notes }] : [],
        nextSteps: [],
      }
    },
    chat: async () => null,
    files: async () => null,
  }
}
