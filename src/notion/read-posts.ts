/**
 * The POST operations that change nothing, by operation id: the generator marks them as reads, and the client may send
 * them again after a failure. One list, so a read the commands offer is never left out of the retries.
 */
export const READ_POSTS = {
  "post-search": { path: "/v1/search", reason: "a POST that only searches" },
  "post-database-query": {
    path: "/v1/data_sources/{data_source_id}/query",
    reason: "a POST that only queries a data source",
  },
  "create-view-query": {
    path: "/v1/views/{view_id}/queries",
    reason: "a POST that runs a view's query; it changes no page",
  },
  "query-meeting-notes": { path: "/v1/blocks/meeting_notes/query", reason: "a POST that only lists meeting notes" },
  "query-agents": { path: "/v1/agents/query", reason: "a POST that only lists agents" },
  "query-sessions": { path: "/v1/sessions/query", reason: "a POST that only lists sessions" },
  "query-session-events": {
    path: "/v1/sessions/{session_id}/events/query",
    reason: "a POST that only lists a session's events",
  },
} as const

export const READ_POST_PATHS = Object.values(READ_POSTS).map(
  ({ path }) => new RegExp(`^${path.replace(/\{[^}]+\}/gu, "[^/]+")}$`, "u"),
)
