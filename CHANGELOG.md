# Changelog

Notable changes to `@wirecat/notion-cli`. One section per version, newest first.

## 0.1.0 — 15.11.2026

### Added

- Started from `@wirecat/cli-template` 0.24.0.
- **`api`: the whole public Notion API, one command per operation.** The 61 operations of Notion's
  [OpenAPI document](https://developers.notion.com/openapi.json) are commands, `notion personal api retrieve-a-page
  --page-id …`, each with its own permission key, `api.<operation>`. `api list` and `api show <operation>` read the
  saved document without calling Notion. Every request carries `Notion-Version` 2026-03-11, so no command asks for
  it. An operation that deletes asks first at a terminal; over MCP `ask` goes ahead, so set its key to `deny` to stop
  an agent. `--dry-run` sends nothing. The OAuth token operations and the two file uploads are not offered: the first
  sign in with the connection's client secret and carry tokens, the second send multipart bodies. The checks accept
  slightly more than Notion does: any JSON value is untyped, and three bounds (`exclusiveMinimum`, `exclusiveMaximum`,
  `maxProperties`) are dropped in six places, so Notion itself refuses what breaks them.
  [Coverage](docs/dev/API_COVERAGE.md).
- `session start | status | end | list` with a Notion personal access token or an internal connection's token,
  checked with Notion and kept in the keyring as `token:<profile>`; the account is the workspace and the token's bot.
- `documents get` reads one page live as Markdown, fills a long page's missing parts, and cuts the signature from
  Notion's signed file links. A page that is still not whole answers `meta.complete: false` and exits non-zero.
- `databases list` and `databases show`: the databases the token sees, and each data source's id and properties.
- Requests are paced below Notion's limit, with a slower pace for data source queries, and a refused request is
  waited out for Notion's `Retry-After`; a connection Notion has blocked is not retried.
- The environment variables start with `WCNOTION_` (`WCNOTION_TOKEN`, `WCNOTION_PROFILE`), not `NOTION_`: Notion's own
  MCP server reads `NOTION_TOKEN`, and a token set for it must not sign this tool in.
- An incremental sync source for Notion, ready for cli-core's sync engine: it reads changes since a time mark with
  an overlap, queries every database in scope, walks everything once a day, and removes a page only after Notion
  confirms it is gone. Large databases are read whole, past Notion's 10,000-row query cap. One item Notion refuses
  is left out with a warning, and a sync cut short goes on next time. Not yet: pages under pages, and a page as a
  chosen folder, which wait for cli-core. See [the sync](docs/dev/SYNC.md).
