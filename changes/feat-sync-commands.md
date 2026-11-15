### Added

- `notion <profile> sync` copies Notion pages, pages under pages, databases and their rows into WireCat's shared
  store, under provider `notion`. Without a chosen folder it copies everything the token sees. `--limit` bounds one
  run and `--rescan` walks everything again. A page or database Notion would not give is named in `meta.issues` and
  in the answer's `warnings`. See [the sync](../docs/dev/SYNC.md).
- `folders add|list|browse|remove` narrow the sync to chosen pages and databases. `folders browse` lists one level
  live from Notion.
- `status`, `documents list|show|export|context|add`, `search` (Lucene syntax, offline), `catalog`, `tags`,
  `relationships`, `notes`, `memories`, `facts` and `identities`: cli-core's shared documents commands over the
  local copy. `documents add` keeps one page, read live, among the sources added by hand.
