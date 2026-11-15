### Added

- `notion <profile> sync` copies Notion pages, pages under pages, databases and their rows into WireCat's shared
  store, under provider `notion`. Without a chosen folder it copies everything the token sees. `--limit` bounds one
  run and `--rescan` walks everything again. A page or database Notion would not give is named in `meta.issues` and
  in the answer's `warnings`, and the answer says `meta.complete: false` and exits 0. A walk too long for one run
  stops in time and the next sync goes on; there is no cap on the chosen folders' size. A block inside a page whose
  children Notion will not give (a synced block whose original is not shared) is skipped with a warning. A page or
  database Notion answers 403 for is kept as it was; only a 404 or the trash removes it. A block Notion refuses in a
  page's Markdown, or a data source it will not query, is left out with a warning and the rest syncs. See
  [the sync](../docs/dev/SYNC.md).
- A sync stops before its deadline, the hourly pass and the daily walk alike: it saves where it stopped, answers
  `complete: false` and names `sync` as the next step. A `--timeout` too short for one step fails with `timeout`
  and reason `notion.timeout-too-short`. See [the sync](../docs/dev/SYNC.md).
- One Notion connection is one profile: `session start` and `sync` refuse a connection another signed-in profile
  uses, and a profile synced from one connection refuses a token of another. A profile signed in by `WCNOTION_TOKEN`
  counts too. See [sign-in](../docs/dev/DESIGN.md).
- Pages under pages, and a page as a chosen folder, now sync: 0.1.0 said they were not done yet.
- `folders add|list|browse|remove` narrow the sync to chosen pages and databases. `folders browse` lists one level
  live from Notion. Removing the last folder says that the next sync copies the whole workspace again. Over MCP,
  `folders add` goes through the write tool.
- `status`, `documents list|show|export|context|add`, `search` (Lucene syntax, offline), `catalog`, `tags`,
  `relationships`, `notes`, `memories`, `facts` and `identities`: cli-core's shared documents commands over the
  local copy. `documents add` keeps one page, read live, among the sources added by hand.

### Fixed

- Database queries keep to Notion's documented limit of about 3 requests a second, not 60 a minute. See
  [the design](../docs/dev/DESIGN.md).
