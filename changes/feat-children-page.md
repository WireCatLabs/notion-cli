### Fixed

- A first sync of a big database, or of a page with many children, moves on in every run, also over MCP's 45 seconds:
  the sync lists a folder a page at a time and goes on where it stopped (cli-core's `childrenPage`). Before, a database
  of more than about 12,000 rows stopped the first sync over MCP at the same step every run. See
  [the sync](../docs/dev/SYNC.md).
