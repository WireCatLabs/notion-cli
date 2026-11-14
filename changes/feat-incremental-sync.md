### Added

- An incremental sync source for Notion, ready for cli-core's sync engine: it reads changes since a time mark with
  an overlap, queries every database in scope, walks everything once a day, and removes a page only after Notion
  confirms it is gone. Large databases are read whole, past Notion's 10,000-row query cap. One item Notion refuses
  is left out with a warning, and a sync cut short goes on next time. Not yet: pages under pages, and a page as a
  chosen folder, which wait for cli-core. See [the sync](../docs/dev/SYNC.md).
