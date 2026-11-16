# Changelog

Notable changes to `@wirecat/notion-cli`. One section per version, newest first.

## 0.2.0 — 16.11.2026

### Added

- `notion <profile> sync` copies Notion pages, pages under pages, databases and their rows into WireCat's shared
  store, under provider `notion`. Without a chosen folder it copies everything the token sees. `--limit` bounds one
  run and `--rescan` walks everything again. A page or database Notion would not give is named in `meta.issues` and
  in the answer's `warnings`, and the answer says `meta.complete: false` and exits 0. A walk too long for one run
  stops in time and the next sync goes on; there is no cap on the chosen folders' size. A block inside a page whose
  children Notion will not give (a synced block whose original is not shared) is skipped with a warning. A page or
  database Notion answers 403 for is kept as it was; only a 404 or the trash removes it. A block Notion refuses in a
  page's Markdown, or a data source it will not query, is left out with a warning and the rest syncs. See
  [the sync](docs/dev/SYNC.md).
- A sync runs up to 15 minutes in a terminal and 45 seconds over MCP, unless `--timeout` sets another time
  (cli-core 0.671.0). It stops before its deadline, in the hourly pass and the daily walk alike, one request at a
  time: it saves where it stopped, answers `complete: false` and names `sync` as the next step. A page's child
  pages come from its listing, 100 a request. A `--timeout` too short to keep anything fails with `timeout` and
  reason `notion.timeout-too-short`. See [the sync](docs/dev/SYNC.md).
- One Notion connection is one profile: `session start` and `sync` refuse a connection another signed-in profile
  uses, and a profile synced from one connection refuses a token of another. A profile signed in by `WCNOTION_TOKEN`
  counts too. See [sign-in](docs/dev/DESIGN.md).
- Pages under pages, and a page as a chosen folder, now sync: 0.1.0 said they were not done yet.
- `folders add|list|browse|remove` narrow the sync to chosen pages and databases. `folders browse` lists one level
  live from Notion. Removing the last folder says that the next sync copies the whole workspace again. Over MCP,
  `folders add` goes through the write tool.
- `status`, `documents list|show|export|context|add`, `search` (Lucene syntax, offline), `catalog`, `tags`,
  `relationships`, `notes`, `memories`, `facts` and `identities`: cli-core's shared documents commands over the
  local copy. `documents add` keeps one page, read live, among the sources added by hand.

### Fixed

- A first sync of a big database, or of a page with many children, moves on in every run, also over MCP's 45 seconds:
  the sync lists a folder a page at a time and goes on where it stopped (cli-core's `childrenPage`). Before, a database
  of more than about 12,000 rows stopped the first sync over MCP at the same step every run. See
  [the sync](docs/dev/SYNC.md).
- Database queries keep to Notion's documented limit of about 3 requests a second, not 60 a minute. See
  [the design](docs/dev/DESIGN.md).
- `folders browse --parent` and the synced copy give a page under a page its link, in Notion's own form
  `https://app.notion.com/p/{page-id}`, instead of an empty `url`. See [the sync](docs/dev/SYNC.md).

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
