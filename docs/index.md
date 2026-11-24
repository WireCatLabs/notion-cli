# notion

`notion` is a WireCat command-line tool for Notion, for the terminal, for scripts and for AI agents. It signs in
with your own Notion token: a personal access token, or the token of an internal connection you made in Notion.

`session` signs a profile in. `documents get` prints a page live as Markdown, and `databases list` and
`databases show` give the databases the token sees, with their data source ids and properties.

`sync` keeps a copy of the pages, the pages under them and the database rows in WireCat's shared store. With no
folder chosen it copies everything the token sees; `folders add` narrows it to chosen pages and databases. `search`,
`documents list|show|export|context`, `status`, `catalog` and the knowledge commands (`tags`, `relationships`,
`notes`, `memories`, `facts`, `identities`) read and annotate that copy offline.
`mirrors` keeps a local folder of Markdown files and the pages under one Notion page the same, both ways: a deletion
goes to the other side's trash, each overwrite keeps the earlier text, and a change on both sides is merged or listed as
a conflict.
It has the commands every WireCat CLI shares: `doctor`, `commands`, `config`, `skill`, `mcp`, `runs` and `upgrade`.

Start with [installation](installation.md), then [usage](usage.md).
