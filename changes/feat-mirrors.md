### Added

- **Keep a local folder of Markdown files and Notion pages the same, both ways.** `mirrors add <page> <folder>` pairs
  a folder with the pages under one Notion page: each page is a file named after its title, and the pages under it are
  in a folder of the same name. `mirrors sync` copies each change to the other side. A deletion goes to the other
  side's trash, and only a page in Notion's trash counts as deleted. Every overwrite keeps the earlier text for
  `keep_versions_for_days` (365 by default). A file changed on both sides is merged line by line, or listed for
  `mirrors conflicts resolve`. `mirrors preview`, `status`, `watch`, `update`, `remove` and `versions list|restore`
  are there too. These are cli-core's shared commands, the same as in ydisk. See [usage](../docs/usage.md).

### Fixed

- **The text `documents update` replaces is kept as long as synced versions.** It stayed 30 days. It now follows the
  profile's `keep_versions_for_days`, 365 days by default, the same period as `documents history`.
