<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Sessions

## `notion api cancel-session [options]`

- What: Cancel a session
- Call: `POST /v1/sessions/{session_id}/cancel`, effect: write
- Body: `CancelSessionRequest`, required

| Flag | Required | What |
|---|---|---|
| `--session-id <value>` | yes | session\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api query-session-events [options]`

- What: Query session events
- Call: `POST /v1/sessions/{session_id}/events/query`, effect: read
- Body: `QuerySessionEventsRequest`, required

| Flag | Required | What |
|---|---|---|
| `--session-id <value>` | yes | session\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api query-sessions [options]`

- What: Query sessions
- Call: `POST /v1/sessions/query`, effect: read
- Body: `QuerySessionsRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api retrieve-session [options]`

- What: Retrieve a session
- Call: `GET /v1/sessions/{session_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--session-id <value>` | yes | session\_id |

## `notion api update-session [options]`

- What: Update a session
- Call: `POST /v1/sessions`, effect: write
- Body: `UpdateSessionRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
