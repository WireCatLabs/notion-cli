# notion

`notion` reads your Notion pages and databases for you and your AI agent: in the terminal, in scripts and through
MCP. It signs in with your own Notion token, kept in your system keyring.

[Docs](https://wirecat.dev/en/docs/notion) ·
[Install](https://github.com/WireCatLabs/notion-cli/blob/main/docs/installation.md) ·
[Usage](https://github.com/WireCatLabs/notion-cli/blob/main/docs/usage.md) ·
[Discord](https://discord.gg/DebENqbRrJ)

**Status: in development.** It signs in, reads live from Notion, and keeps a copy of your pages on your computer,
searchable offline with the rest of WireCat, and creates, changes and deletes pages. Next it searches database rows by
their properties, and later keeps a folder of Markdown files in step with a Notion page tree. The order of work is in [docs/dev/DESIGN.md](docs/dev/DESIGN.md).

## What it does now

- `notion personal session start` signs a profile in with a token, asked hidden or read from stdin:
  - a [personal access token](https://developers.notion.com/guides/connections-and-tokens/personal-access-tokens),
    which acts with your own rights;
  - or an internal connection's token, which sees only the pages shared with that connection.
- `notion personal documents get <page id or link>` prints one page as Markdown, live.
- `notion personal sync` copies the pages, the pages under them, the databases and their rows into WireCat's shared
  store. With no folder chosen it copies everything the token sees. `folders add <page or database>` narrows it, and
  `folders browse` shows what there is to choose, one level at a time.
- `notion personal search <words>` searches the copy offline, in Lucene syntax. `documents list|show|export|context`
  read it, `status` says how far the sync is, and `tags`, `notes`, `memories` and `facts` keep your own notes on a
  page. `memo search` and `search all` find the pages too.
- `notion personal documents create --parent <page> --file notes.md` makes a page from Markdown, `documents update
  <page> --file page.md` replaces a page's text, `documents delete <page>` moves it to Notion's trash after asking, and
  `documents restore <page>` brings it back. An update that would delete a child page or database needs
  `--allow-deleting-content`; `--dry-run` shows what a write would do and sends nothing.
- `notion personal comments list <page>` shows a page's open comments (Notion's API gives no resolved ones), `comments
  create <page> --text …` starts a discussion and `comments reply <discussion> --text …` answers in one.
  `comments edit` and `comments delete` change or delete a comment this connection posted. The sync keeps a page's
  open comments in the copy, so search finds them. `files upload <file> --parent <page>` adds a file to the end of a
  page.
- `notion personal documents move <page> --parent <page>` files a page under another page or, with `--into`, into a
  database. `documents rename <page> <title>` gives it a new title, and `documents update --emoji` and `--cover` set
  its icon and cover.
- `notion personal databases list` lists the databases the token sees; `databases show <id or link>` gives each data
  source's id, its properties and its templates.
- `notion personal documents create --into <database> --title "Write the plan" --field Status=Open --field Owner=me`
  adds a row, each value checked against the database's properties. `documents update <row> --field Status=Done`
  changes values, and `rows list <database> --filter Status=Open` lists rows live.
- `notion doctor`, `notion personal mcp serve` and the other commands every WireCat CLI shares.

The token's variable is `WCNOTION_TOKEN`, not `NOTION_TOKEN`: Notion's own MCP server reads that one, and a token
set for it must not sign this tool in. `session end` removes only this tool's own keyring entry; the entries of
Notion's own CLI stay.

## Quick start

```sh
pnpm install
pnpm build
node dist/bin/notion.js doctor
node dist/bin/notion.js personal session start
```

`doctor` needs no profile. Every command that uses an account starts with one, a name you choose: `notion personal
config show`.

It was started from [cli-template](https://github.com/WireCatLabs/cli-template).
