<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Meeting notes

## `notion api create-meeting-note [options]`

- What: Create a meeting note
- Call: `POST /v1/blocks/meeting_notes`, effect: write
- Body: `CreateMeetingNoteRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api query-meeting-notes [options]`

- What: Query meeting notes
- Call: `POST /v1/blocks/meeting_notes/query`, effect: read
- Body: `QueryMeetingNotesRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
