# notion — design

Written by `npx @wirecat/cli-template new`, then filled in during design. Steps 1 and 2 below are built: sign-in with
a token, `doctor`, `documents get`, `databases list|show`, read live, and the sync into the shared store with search,
the local reads and the knowledge commands.

## Answers

- **Category:** files and documents
- **Content languages:** en, ru, es
- **Sign-in:** an API token or key; a browser sign-in (OAuth) comes last, see [Sign-in](#sign-in)
- **The API:** an official API with an official client library
- **How people filter:** by time, by person, by container (chat, folder, calendar), by words in the text, by status or label
- **Never in the store, a log or the output:** tokens and passwords, links that carry a secret
- **Untrusted input:** page and row text written by other members, files and attachments, links, names and titles set
  by others

## Reference CLI

Learn from [drive-cli](https://github.com/WireCatLabs/drive-cli). Where drive-cli keeps code of its own for something
cli-core now shares (profiles, the profile lock, the permission policy, the MCP server, session commands), follow
gcal-cli, mail-cli and bitrix24-cli instead.

## Content languages

Languages: en, ru, es.

## What the tool does

`notion` keeps a copy of the Notion pages and databases a person chooses on their computer, makes them searchable
offline with the rest of WireCat (`memo search`, `search all`), and gives an agent the same through MCP. Later it keeps
a folder of Markdown files and a Notion page tree in step, both ways.

The work goes in this order, each step one pull request:

1. ~~Sign-in with a token, `doctor`, and reading one page live, as Markdown. No store.~~ Done.
2. ~~Sync into the shared store, search and MCP.~~ Done: cli-core's shared documents commands over Notion.
3. Databases: their rows, with their properties.
4. Search by a property (`status:Done`).
5. Writes: create, update and delete a page.
6. A local folder kept in step with a Notion page tree.
7. The raw API, comments and files.
8. Sign-in in the browser (OAuth), through the person's own Notion connection.

Every request runs inside cli-core's command run (WC-LIFE-15, WC-LIFE-17).

## Sign-in

Every secret lives in the system keyring (a private file only when the keyring fails or `--credential-storage file`
is given). Nothing is kept on a WireCat server.

- **A token.** `notion <profile> session start` asks for the token hidden, or reads it from stdin, checks it against
  Notion ([retrieve your token's bot user](https://developers.notion.com/reference/get-self)), and keeps it under the
  keyring account `token:<profile>`. Two kinds of token work:
  - a [personal access token](https://developers.notion.com/guides/connections-and-tokens/personal-access-tokens),
    which acts with the person's own rights and expires after at most one year;
  - an internal connection's token, which sees only the pages shared with that connection.
- **OAuth, last.** Through a public Notion connection in the browser, under `oauth:notion:<profile>`. A profile uses
  one kind of sign-in; starting the other replaces it.
  - Notion's token endpoint takes the client id and secret as HTTP Basic and a JSON body, and each refresh returns a
    new refresh token ([authorization guide](https://developers.notion.com/guides/get-started/authorization)).
    cli-core's token keeper refreshes under one lock for every process, so a rotated token is never sent twice.
  - The secret is needed for every exchange, and Notion does not call its clients public. So no WireCat app can ship
    inside the tool (WC-SECR-25): the person registers their own public connection, its secret is asked hidden and
    kept in the keyring, and `doctor` reports that WireCat has no app, with the reason.
  - cli-core's sign-in listens on a random local port, and a connection matches its redirect address exactly.
    Either cli-core gets a fixed local port, which the person registers with their own connection, or the browser
    returns to a fixed relay page that forwards the code to the local port and stores nothing, as bitrix24-cli does.

`session status`, `session list` and `session end` work as in the template sample. `session end` removes only this
tool's own entries. Notion's own CLI keeps its tokens under the same keyring service name, `notion-cli`, with a
workspace id as the account; this tool never lists, reads or removes an account it did not write.

The environment variables start with `WCNOTION_` (`WCNOTION_TOKEN`, `WCNOTION_PROFILE`), not `NOTION_`: Notion's own
MCP server reads `NOTION_TOKEN`, and a token set for it would silently sign every profile in.

## Commands

The command names are drive-cli's and the shared vocabulary's wherever the thing is the same. A difference has its
reason here.

| Command | What it does | drive-cli |
| --- | --- | --- |
| `session start\|status\|end\|list`, `account remove` | sign-in, as above | same; `status` is required (WC-ACCT-12) |
| `folders add\|list\|browse\|remove` | narrow the sync to chosen pages and databases; with none chosen, everything the token sees is synced | same name; a Notion "folder" is a page or a database |
| `sync`, `status` | copy the chosen pages into the store; report coverage | same |
| `documents list\|show\|export\|context\|add` | read the local copy; `add` one page by its link | same |
| `documents get` | read one page live, as Markdown | same |
| `documents create\|update\|delete\|restore` | write a page; `delete` moves it to Notion's trash | `create\|update`; Notion has a trash to restore from |
| `databases list\|show` | a database, its data sources (their ids) and its properties, live | Notion only, as `sheets` is Drive only |
| `search` | the local copy, Lucene syntax; database rows are searched here, not by a separate query | same |
| `catalog`, `tags`, `relationships`, `notes`, `memories`, `facts`, `identities` | the knowledge layer over documents | same |
| `mirrors add\|list\|remove\|status\|sync\|watch` | a local Markdown folder in step with a page tree | same |
| `comments list\|create\|reply` | page comments | same group name |
| `api list\|show`, one command per operation | the raw API, from Notion's OpenAPI document | same |
| `doctor`, `config`, `mcp`, `skill`, `runs`, `upgrade`, `commands` | from cli-core | same |

drive-cli commands with no Notion counterpart: `documents check` and `documents history`, `revisions` (page history is
out of scope), `files` (Notion stores files inside pages), `permissions` (no command changes who sees a page),
`store` (an import for old drive installs).

Notion's own CLI and MCP server show what users trip on. This tool takes three of their ideas:

- `documents update` refuses to delete child pages and databases unless `--allow-deleting-content` is given;
- `databases show` gives a database's data source ids, which every query after Notion's 2025-09-03 version needs;
- `api` lists the operations and prints each one's spec.

## Further answers

### Storing, indexing, syncing and deleting

1. **What is kept.** Each page and each database row is a `documents` record through cli-core's document ingestion,
   under the provider `notion` (kind `documents`, registered on every run that opens the store).
   - The account is one sign-in's view of a workspace: the workspace id plus the token's bot id. Two profiles in one
     workspace see different pages, so they are different accounts.
   - The record's external id is the page id. In the catalog a page is a `file` and a database a `folder`, with
     Notion's type kept beside it. Every page is a folder to the sync and a document too (cli-core's `isDocument`),
     so pages under pages are copied and a page can be a chosen folder. A row is a plain file.
   - The page text is Notion's own Markdown export
     ([retrieve a page as Markdown](https://developers.notion.com/reference/retrieve-page-markdown), version 2). A
     row's properties go into its front matter, so they are searchable as words from step 3, and as fields from
     step 4. Authors and editors are recorded as identities.
   - File links that Notion signs carry a secret and expire after an hour. They are removed from the text before it
     is stored.
2. **How it syncs.** On demand (`sync`), on a schedule (`jobs`), and kept running by `mirrors watch`. Notion has no
   change feed, so the position is a time mark:
   - The first sync walks everything the token sees, or only the chosen folders: the top of the workspace, and the
     rows of each database. WireCat Desktop offers the same choice.
   - ~~Pages under pages are not synced yet~~: done in step 2. [SYNC.md](SYNC.md) has the details.
   - Later syncs read the pages edited since the mark, with a two-minute overlap, because Notion's timestamps
     appear to be rounded to the minute (to be confirmed against the live API in step 2). They come from search
     sorted by `last_edited_time`, and from each chosen database filtered by `last_edited_time`.
   - Notion says its search is not complete and lags behind edits
     ([search limitations](https://developers.notion.com/reference/search-optimizations-and-limitations)). So a full
     walk runs again on a schedule and with `sync --rescan`, and that walk finds deleted pages.
   - A database query stops at 10,000 rows and says so
     ([query a data source](https://developers.notion.com/reference/query-a-data-source)); the store's catalog takes
     at most 10,000 entries per scope. Every page of results is checked, and a folder that would pass a limit fails
     with an error that names it, never a silent cut. The store has no ceiling any more; one sync walks at most
     10,000 entries under the chosen folders (`maxEntries`), and says so when a scope passes it.
   - Requests are paced below Notion's limit of 180 a minute per connection, with a second, slower pace for database
     queries ([request limits](https://developers.notion.com/reference/request-limits)), through cli-core's pacer.
     cli-base's retry waits for `Retry-After`; search and database queries are POST, so they are marked as reads.
   - `sync --limit` bounds the pages saved in one run, and the source stops at 2,000 requests while it looks for
     changes. `status` answers with `progress` in the shared shape (WC-LIFE-14). Not yet: a budget sized to the
     deadline with a `next` step (WC-LIFE-16), which cli-core's shared `sync` command does not offer.
3. **When Notion deletes a page.** It leaves the next full walk, is confirmed gone by asking Notion for it directly
   (a page missing from search is not proof), and is marked deleted in the store, never wiped.
4. **Local deletion.** One account with `account remove`, as in drive-cli; the store's own commands cover the rest.

### Search

1. Titles, the full text, a row's properties, and the names of authors.
2. Yes: records of kind `documents` appear in `search all` and in memo, with no change to memo.
3. Everything in the local copy: search, show, export, notes and memories.

### Security

1. The system keyring, as above.
2. Every write is a permission key of its own and goes through cli-core's guard and write journal, with `--dry-run`.
   As in gcal-cli and drive-cli, creating and updating a page is allowed, and deleting one asks first. Deleting child
   pages through an update needs its own flag on top. No command shares a page or changes who can see it.

## Keeping a local folder in step

`mirrors` uses cli-core's mirror engine, as drive-cli does: a three-way merge of Markdown blocks, conflicts settled
with `--keep`, nothing deleted on the other side. The Notion side reads a page as Markdown and writes only the
changed parts with [update page Markdown](https://developers.notion.com/reference/update-page-markdown). Notion applies
the parts that match and only warns about the rest, so a warning counts as a failed write. Child pages are never
deleted.

## Live check

The strict fake in `src/testing/fake-notion.ts` is built from Notion's reference only; no answer was captured from a
live workspace. `bin/notion-live <page>` checks the real API through `scripts/live.sh`, with a temporary profile that
stores nothing, and records the pass in `docs/dev/live-checks.txt` for `bin/release`. It fails on the first two points
below; the rest a person reads in its output:

- `GET /v1/users/me` gives `bot.workspace_id` for both kinds of token. The account is that id and the bot's id; the
  reference lists the field but its example leaves it out, and sign-in refuses an answer without it.
- `documents get` on a page with an uploaded file whose name has parentheses, such as `Screenshot (2).png`, cuts at
  least one signed link and prints no `X-Amz-` or `signature=` query. Use such a page for the check: it fails on a
  page with no file. The form of a signed link in Markdown v2 is not documented; `src/notion/links.ts` cuts every query
  that carries a signature, plain or percent-encoded, wherever the link around it ends.
- `bot.owner.type` is `user` for a personal access token and `workspace` for an internal connection's token.
- On a page past about 20,000 blocks, the `<unknown url="…"/>` tag names its block id, so the fetched part lands in
  place; otherwise it is added after the page.
- `databases list` rows carry a data source's title, and `parent.database_id`, in search results.

## Open questions for the owner

- **Mirrors, to settle before step 6:**
  - Where a page created from a local file keeps its origin key, so a create cut short is not repeated. Drive keeps
    it in a hidden file property. A Notion page has properties only inside a database.
  - Notion has no revision lock on a write. A check of `last_edited_time` before the write leaves a short race.
  - A Markdown edit must match its old text exactly once. A line that repeats (the same checklist item twice) needs
    a whole-page replace instead.
  - Notion blocks the shared Markdown blocks cannot hold (toggles, callouts, mentions, child pages, and possibly
    bookmarks and embeds) must pass through unchanged.
