# notion

`notion` is a WireCat command-line tool for Notion, for the terminal, for scripts and for AI agents. It signs in
with your own Notion token: a personal access token, or the token of an internal connection you made in Notion.

Today it reads live from Notion: `session` signs a profile in, `documents get` prints a page as Markdown, and
`databases list` and `databases show` give the databases the token sees, with their data source ids and properties.
It has the commands every WireCat CLI shares: `doctor`, `commands`, `config`, `skill`, `mcp`, `runs` and `upgrade`.
The template's sample `comments` group is still there until this tool writes to Notion.

Start with [installation](installation.md), then [usage](usage.md).
