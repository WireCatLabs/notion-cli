### Added

- **`api`: the whole public Notion API, one command per operation.** The 61 operations of Notion's
  [OpenAPI document](https://developers.notion.com/openapi.json) are commands, `notion personal api retrieve-a-page
  --page-id …`, each with its own permission key, `api.<operation>`. `api list` and `api show <operation>` read the
  saved document without calling Notion. Every request carries `Notion-Version` 2026-03-11, so no command asks for
  it. An operation that deletes asks first at a terminal; over MCP `ask` goes ahead, so set its key to `deny` to stop
  an agent. `--dry-run` sends nothing. The OAuth token operations and the two file uploads are not offered: the first
  sign in with the connection's client secret and carry tokens, the second send multipart bodies. The checks accept
  slightly more than Notion does: any JSON value is untyped, and three bounds (`exclusiveMinimum`, `exclusiveMaximum`,
  `maxProperties`) are dropped in six places, so Notion itself refuses what breaks them.
  [Coverage](../docs/dev/API_COVERAGE.md).
