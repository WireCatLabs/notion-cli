# notion — design

Written by `npx @wirecat/cli-template new`, then filled in during design. Nothing below is built yet. The owner reads
this page before the first command is built.

## First task

Delete this section once every step is done (WC-DOC-3).

1. If an answer below is missing, ask the owner the [design interview](skills/design-interview/SKILL.md).
2. Learn how a command reaches a service from the sample (`AGENTS.md`, "The sample"), and the domain, the
   store and its commands from the reference CLI below. Build the first command on the sample.
3. Ask the further questions in the interview that the reference CLI does not answer, and write the answers here.
   Build only after the owner has read this page.
4. When the first command reaches the service, rewrite `README.md`, `docs/index.md` and the description in
   `package.json` and `skills/notion-cli/SKILL.md` to say what the tool does and who it is for. Rewrite
   `appMcpCommand`'s `name` and `untrusted` in `src/program.ts` too: name the kinds of outside text the CLI
   carries (WC-MCP-11). Rewrite the tagline and the sign-in texts of `DESKTOP` in `src/identity.ts`, then run
   `pnpm generate`: WireCat Desktop shows them before it installs the tool.

## Answers

- **Category:** files and documents
- **Content languages:** en, ru, es
- **Sign-in:** an API token or key; a browser sign-in (OAuth) comes in a later slice, see [Sign-in](#sign-in)
- **The API:** an official API with an official client library
- **How people filter:** by time, by person, by container (chat, folder, calendar), by words in the text, by status or label
- **Never in the store, a log or the output:** tokens and passwords, links that carry a secret
- **Untrusted input:** files and attachments, links, names and titles set by others

## Reference CLI

Learn from [drive-cli](https://github.com/WireCatLabs/drive-cli). Where drive-cli keeps code of its own for something
cli-core now shares (profiles, the profile lock, the permission policy, the MCP server, session commands), follow
gcal-cli, mail-cli and bitrix24-cli instead. bitrix24-cli is also the model for two sign-in kinds on one profile.

## Content languages

Languages: en, ru, es.

## What the tool does

`notion` keeps a copy of the Notion pages and databases a person chooses on their computer, makes them searchable
offline with the rest of WireCat (`memo search`, `search all`), and gives an agent the same through MCP. Later it keeps
a folder of Markdown files and a Notion page tree in step, both ways.

The work goes in this order, each step one pull request:

1. Sign-in, `doctor`, and reading one page live, as Markdown. No store.
2. Sync into the shared store, search and MCP.
3. Databases: their rows, with their properties.
4. Search by a property (`status:Done`).
5. Sign-in in the browser (OAuth).
6. Writes: create, update and trash a page.
7. A local folder kept in step with a Notion page tree.
8. The raw API, comments and files.

## Sign-in

Two kinds of sign-in, both per profile, as in bitrix24-cli. Every secret lives in the system keyring (a private file
only when the keyring fails or `--credential-storage file` is given); nothing is kept on a WireCat server.

- **A token, first.** `notion <profile> session start` asks for the token hidden, or reads it from stdin, checks it
  against Notion (`GET /v1/users/me`), and keeps it under the keyring account `token:<profile>`. Two kinds of token
  work:
  - a [personal access token](https://developers.notion.com/guides/connections-and-tokens/personal-access-tokens),
    which acts with the person's own rights and expires after at most one year;
  - an internal connection's token, which sees only the pages shared with that connection.
- **OAuth, later.** `session start --client-id <id>` signs in through a public Notion connection in the browser:
  - The connection's secret is asked hidden and kept in the keyring with the tokens under `oauth:notion:<profile>`.
  - Notion's token endpoint takes the client id and secret as HTTP Basic and a JSON body
    ([authorization guide](https://developers.notion.com/guides/get-started/authorization)), so the provider
    supplies its own `exchange`.
  - Each refresh returns a new refresh token, and replaying an old one can revoke the whole grant
    ([MCP client guide](https://developers.notion.com/guides/mcp/build-mcp-client)). cli-core's token keeper
    refreshes under one lock for every process, which this needs.
  - Notion's documentation does not say whether a `localhost` redirect with any port is accepted. The browser
    therefore returns to a fixed relay page on wirecat.dev, which forwards the code to the local port and stores
    nothing, as bitrix24-cli does.

`session status`, `session list` and `session end` work as in the template sample. `session end` removes only this
tool's own entries. The official Notion CLI keeps its tokens under the same keyring service name, `notion-cli`, with a
workspace id as the account; this tool never lists, reads or removes an account it did not write.

## Commands

The command names are drive-cli's wherever the thing is the same. A difference has its reason here.

| Command | What it does | drive-cli |
| --- | --- | --- |
| `session start\|status\|end\|list`, `account remove` | sign-in, as above | same, plus `status` |
| `roots add\|list\|browse\|remove` | choose the pages and databases to sync | `folders …`: Notion has no folders; a root is a page or a database |
| `sync`, `status` | copy the chosen pages into the store; report coverage | same |
| `documents list\|show\|export\|context` | read the local copy | same |
| `documents get` | read one page live, as Markdown | same |
| `documents create\|update\|trash` | write a page | `create\|update`; Notion trashes instead of deleting |
| `databases list\|show\|query\|resolve` | a database, its data sources and rows, live | Notion only, as `sheets` is Drive only |
| `search` | the local copy, Lucene syntax | same |
| `catalog`, `tags`, `relationships`, `notes`, `memories`, `facts`, `identities` | the knowledge layer over documents | same |
| `mirrors add\|list\|remove\|status\|sync\|watch` | a local Markdown folder in step with a page tree | same |
| `comments list\|add` | page comments | same group name |
| `api list\|show\|call`, one command per operation | the raw API, from Notion's OpenAPI document | same |
| `doctor`, `config`, `mcp`, `skill`, `runs`, `upgrade`, `commands` | from cli-core | same |

Notion's own CLI and MCP server show what users trip on. This tool takes three of their ideas:

- `documents update` refuses to delete child pages and databases unless `--allow-deleting-content` is given;
- `databases resolve` turns a database id into its data source ids;
- `api` lists the operations and prints each one's spec.

## Further answers

### Storing, indexing, syncing and deleting

1. **What is kept.** Each page and each database row is a `documents` record through cli-core's document ingestion,
   under the provider `notion` (kind `documents`, registered on every run that opens the store). The account is the
   Notion workspace the token belongs to; the record's external id is the page id; the catalog kind is `page` or
   `database`. The page text is Notion's own Markdown export
   ([retrieve a page as Markdown](https://developers.notion.com/reference/retrieve-page-markdown), version 2). A
   row's properties go into its front matter, so they are searchable as words from step 3, and as fields from step 4.
   Authors and editors are recorded as identities. File links that Notion signs are never stored: they carry a
   secret and expire after an hour.
2. **How it syncs.** On demand (`sync`), on a schedule (`jobs`), and kept running by `mirrors watch`. Notion has no
   change feed, so the position is a time mark:
   - The first sync walks the chosen roots: child pages, and the rows of each database.
   - Later syncs read the pages edited since the mark, with a two-minute overlap, because Notion's timestamps
     appear to be rounded to the minute (to be confirmed against the live API in step 2). They come from search sorted by `last_edited_time`, and from each chosen database
     filtered by `last_edited_time`.
   - Notion says its search is not complete and lags behind edits
     ([search limitations](https://developers.notion.com/reference/search-optimizations-and-limitations)). So a full
     walk runs again on a schedule and with `sync --rescan`, and that walk finds deleted pages.
   - Requests are paced below Notion's limit of 180 a minute per connection
     ([request limits](https://developers.notion.com/reference/request-limits)) and wait for `Retry-After`.
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
   Proposed levels: creating and updating a page `ask`; trashing a page `ask`; deleting child pages through an
   update needs its own flag on top. No command shares a page or changes who can see it.

## Keeping a local folder in step

`mirrors` uses cli-core's mirror engine, as drive-cli does: a three-way merge of Markdown blocks, conflicts settled
with `--keep local|notion|both`, nothing deleted on the other side. The Notion side reads a page as Markdown and
writes only the changed parts with
[update page Markdown](https://developers.notion.com/reference/update-page-markdown). Child pages are never deleted.

## Open questions for the owner

- **A WireCat public connection for OAuth.** It would let people sign in without making their own connection. Its
  secret would have to ship with the tool; Notion treats it as confidential. Until decided, OAuth uses the person's
  own connection.
- **The sync scope of a personal access token.** It sees the whole workspace. Proposed: sync only the chosen roots,
  with an explicit way to choose everything.
- **Mirrors, to settle before step 7:**
  - Where a page created from a local file keeps its origin key, so a create cut short is not repeated. Drive keeps
    it in a hidden file property. A Notion page has properties only inside a database.
  - Notion has no revision lock on a write. A check of `last_edited_time` before the write leaves a short race.
  - A Markdown edit must match its old text exactly once. A line that repeats (the same checklist item twice) needs
    a whole-page replace instead.
  - Notion blocks the shared Markdown blocks cannot hold (toggles, callouts, mentions, child pages) must pass through
    unchanged.
