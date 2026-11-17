# Changelog

Notable changes to `@wirecat/notion-cli`. One section per version, newest first.

## 0.5.0 — 17.11.2026

### Fixed

- **A search hit from Notion names `notion` and the profile.** `memo search` and `search all` showed a Notion page as
  `provider: notes` with the store's account number, and the tree label showed raw ids, because notion never said
  which account its profile is. A sync now records it through cli-core's documents engine.
- **The workspace root and databases stay out of search.** They are catalog entries, not pages: word search, meaning
  search and memo's digest showed them with an empty excerpt, and `documents show` could not open them.
- **An agent's `relationships add` is saved.** It is written unconfirmed for the owner, who confirms it by adding the
  same relationship or rejects it by removing it. It used to write nothing.
- **A sync cut inside Notion's own pass says to sync again.** When a slow listing reached the deadline, its cursor
  waited on the sync's pending plan, where notion did not look: the answer said `complete: false` with no step to run
  next, and `status` gave a total as if the pass were planned. notion now reads that cursor too.
- cli-core 0.687.0 (was 0.680.0), cli-base 0.109.0 (was 0.106.0).
- Sync now saves a page's creator and last editor as people in the shared store, with their names and email addresses
  from Notion, and links the page to them as `owner` and `last-editor`. An email address joins them to the person who
  already has it, so a person's context shows the Notion pages they wrote or edited. This needs the connection's
  capability to read user information including email addresses; without it the authors are kept by Notion id, and
  `sync` and `doctor` say so. A page synced before this gets its authors when it next changes.
- `identities link <page> <notion-id> person:<uid>` works: it no longer fails because the Notion user was not in the
  store, and it moves every synced page's link from that user to the person.

## 0.4.0 — 16.11.2026

### Added

- `comments list`, `comments create` and `comments reply` read and write the comments on a Notion page, live.
  `comments list` shows only unresolved comments, as Notion's API gives no others. A comment's text never reaches a
  run record. See [Comments and files](docs/dev/DESIGN.md#comments-and-files).
- `files upload <file> --parent <page>` uploads a file and adds it to the end of a page as an image, video, audio, PDF
  or file block. A file over 20 MB goes in parts of 10 MB. Only a regular file is sent, as with `--file`.
- Each write checks its own permission (`comments.create`, `files.upload`) and the `api` operations it sends, and
  takes `--dry-run`.

### Changed — may break callers

- `folders browse` pages: `--limit` (100 by default) and `--cursor` from `page.next_cursor`. At the top of the
  workspace it reads Notion's search one page at a time instead of all of it, so a large workspace answers within a
  minute. Each item now says where it sits (`parent`, null at the top) and whether sync already copies it as `added`,
  the field drive's `folders browse` uses, in place of `chosen`. A database lists nothing inside, as its rows are not
  folders. When Notion's search was cut at 10,000 results, the answer says so in `missing`.

### Fixed

- On Windows, `files upload` and `--file` refuse a link to a file too. Windows has no `O_NOFOLLOW`, so the link was
  followed there.

## 0.3.0 — 16.11.2026

### Added

- `documents create`, `documents update`, `documents delete` and `documents restore` write Notion pages. `create`
  makes a page under another page from Markdown, `update` replaces a page's text, `delete` moves a page to Notion's
  trash and asks first, and `restore` brings it back. An update that would delete a child page or database is refused
  unless `--allow-deleting-content` is given, and then it asks as a delete does. Every write goes through the
  profile's permissions and the write journal, answers with an `operation_id`, and is previewed with `--dry-run`.
  A raw `api` call that deletes, trashes, erases or archives content, or removes a database property, now asks as
  `documents delete` does, so `documents.delete` set to `deny` stops it too, also for an `agent-batch` call with a
  delete in it. `--file` reads only a regular file, never a link, one under `/proc`, `/sys` or `/dev`, nor a
  credential file. See
  [Writes](docs/dev/DESIGN.md#writes).

### Fixed

- The [install page](docs/installation.md#sign-in) shows how to sign in with `session start`.
- `bin/notion-live` reads the token from the keyring service that `NOTION_LIVE_KEYRING_SERVICE` names. When it is
  unset, the service stays `notion-live`.
- A plain `sync` removes the rows of a data source that was taken out of its database. Before, they stayed in the
  local copy until `sync --rescan`. When Notion will not show the database (403), the rows stay.

### Security

- cli-core 0.680.0 and cli-base 0.106.0. cli-core now refuses files under `/proc`, `/sys` and `/dev` itself, so
  `--file` uses its check instead of notion's own. `--file` still opens the file once, never through a link, and
  checks the file it opened.

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
