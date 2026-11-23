/** What fake-notion.ts hands in, so this file imports nothing from it and no import cycle forms. */
export interface MeetingNotesFake {
  notes: readonly FakeMeetingNote[]
  unavailable: boolean
  author: string
  error: (status: number, code: string) => { status: number; body: unknown }
  text: (content: string) => unknown
}

export interface FakeMeetingNote {
  id: string
  title: string
  last_edited_time: string
  start: string
  end: string
  attendees: string[]
  summary?: string
  notes?: string
  transcript?: string
}

const MEETING_FILTER = new Set([
  "title",
  "attendees",
  "created_time",
  "created_by",
  "last_edited_time",
  "last_edited_by",
])

/** The one filter the CLI sends, read as [query meeting notes](https://developers.notion.com/reference/query-meeting-notes) describes it. */
const editedSince = (filter: unknown): number | undefined | null => {
  if (filter === undefined) return undefined
  const top = filter as { operator?: unknown; filters?: unknown }
  if (!["and", "or"].includes(String(top.operator)) || !Array.isArray(top.filters) || top.filters.length !== 1)
    return null
  const one = top.filters[0] as { property?: unknown; filter?: { operator?: unknown; value?: unknown } }
  if (!MEETING_FILTER.has(String(one.property)) || one.property !== "last_edited_time") return null
  if (one.filter?.operator !== "date_is_on_or_after") return null
  const exact = one.filter.value as { type?: unknown; value?: Record<string, unknown> }
  const at = exact?.value
  if (exact?.type !== "exact" || at?.type !== "datetime" || at.time_zone !== "UTC") return null
  const keys = Object.keys(at).sort().join()
  if (keys !== "start_date,start_time,time_zone,type") return null
  return Date.parse(`${String(at.start_date)}T${String(at.start_time)}:00Z`)
}

/** Each note's summary, notes and transcript blocks, read as Markdown by their block ids. */
export const meetingNotePages = (notes: readonly FakeMeetingNote[]): Record<string, { markdown: string }> => {
  const pages: Record<string, { markdown: string }> = {}
  for (const note of notes) {
    const base = note.id.slice(0, -2)
    if (note.summary) pages[`${base}01`] = { markdown: note.summary }
    if (note.notes) pages[`${base}02`] = { markdown: note.notes }
    if (note.transcript) pages[`${base}03`] = { markdown: note.transcript }
  }
  return pages
}

export const meetingNotesRoute = ({ notes, unavailable, author, error, text }: MeetingNotesFake) => ({
  // https://developers.notion.com/reference/query-meeting-notes: no cursor, at most 50 a request.
  method: "POST",
  path: /^\/v1\/blocks\/meeting_notes\/query$/u,
  query: [],
  body: ["filter", "sort", "limit"],
  answer: (_: string, { body = {} }: { body?: Record<string, unknown> | undefined }) => {
    if (unavailable) return error(400, "validation_error")
    const since = editedSince(body.filter)
    const limit = Number(body.limit ?? 50)
    const sort = body.sort as { property?: unknown; direction?: unknown }[] | undefined
    if (since === null || !Number.isInteger(limit) || limit < 1 || limit > 50) return error(400, "validation_error")
    if (sort && (sort.length !== 1 || sort[0]?.property !== "last_edited_time" || sort[0]?.direction !== "ascending"))
      return error(400, "validation_error")
    const all = notes
      .filter((note) => since === undefined || Date.parse(note.last_edited_time) >= since)
      .sort((a, b) => a.last_edited_time.localeCompare(b.last_edited_time))
    const block = (note: FakeMeetingNote) => {
      const base = note.id.slice(0, -2)
      return {
        object: "block",
        id: note.id,
        type: "meeting_notes",
        created_time: note.start,
        last_edited_time: note.last_edited_time,
        created_by: { object: "user", id: author },
        last_edited_by: { object: "user", id: author },
        has_children: true,
        in_trash: false,
        meeting_notes: {
          is_full_page: false,
          title: text(note.title),
          status: "notes_ready",
          children: {
            ...(note.summary ? { summary_block_id: `${base}01` } : {}),
            ...(note.notes ? { notes_block_id: `${base}02` } : {}),
            ...(note.transcript ? { transcript_block_id: `${base}03` } : {}),
          },
          calendar_event: { start_time: note.start, end_time: note.end, attendees: note.attendees },
          recording: { start_time: note.start, end_time: note.end },
        },
      }
    }
    return {
      status: 200,
      body: { object: "list", results: all.slice(0, limit).map(block), has_more: all.length > limit },
    }
  },
})
