# notion

`notion` reads your Notion pages and databases for you and your AI agent: in the terminal, in scripts and through
MCP. It signs in with your own Notion token, kept in your system keyring.

**Status: in development.** It signs in and reads live from Notion today. Next it keeps a copy of the pages you
choose on your computer, searchable offline with the rest of WireCat, then writes pages, and later keeps a folder of
Markdown files in step with a Notion page tree. The order of work is in [docs/dev/DESIGN.md](docs/dev/DESIGN.md).

## What it does now

- `notion personal session start` signs a profile in with a token, asked hidden or read from stdin:
  - a [personal access token](https://developers.notion.com/guides/connections-and-tokens/personal-access-tokens),
    which acts with your own rights;
  - or an internal connection's token, which sees only the pages shared with that connection.
- `notion personal documents get <page id or link>` prints one page as Markdown.
- `notion personal databases list` lists the databases the token sees; `databases show <id or link>` gives each data
  source's id and its properties.
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
