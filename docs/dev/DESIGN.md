# notion — design

Written by `npx @wirecat/cli-template new`, then filled in during design. Steps 1, 2 and 5 below are built: sign-in
with a token, `doctor`, `documents get`, `databases list|show`, read live, the sync into the shared store with search,
the local reads and the knowledge commands, and the page writes.

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
5. ~~Writes: create, update and delete a page.~~ Done: see [Writes](#writes).
6. A local folder kept in step with a Notion page tree.
7. ~~The raw API, comments and files.~~ Done: `api`, and see [Comments and files](#comments-and-files).
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

**One connection, one profile.** The account is the workspace id and the token's bot id. Two profiles on one token
would be one account in the shared store, and each sync would remove the pages of the other. So `session start` and
`sync` refuse a connection another profile signed in to uses (`profile.account-taken`), and name that profile: use
it, or run `session end` there first. A profile whose copy was synced from one connection refuses a token of another
(`profile.other-account`), at sign-in and at sync; the token it had stays. The other connection goes to a new profile.
Removing a profile's copy (`account remove`) is not built yet.

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
| `documents create\|update\|delete\|restore` | write a page or a database row; `delete` moves it to Notion's trash | `create\|update`; Notion has a trash to restore from |
| `documents move\|rename` | file a page under another page or into a database, and give it a new title | `files move`, `documents rename` |
| `databases list\|show` | a database, its data sources (their ids), its properties and its templates, live | Notion only, as `sheets` is Drive only |
| `rows list` | a database's rows with their values, live, filtered by `--filter` | Notion only, as `sheets` is Drive only |
| `search` | the local copy, Lucene syntax; database rows are searched here, not by a separate query | same |
| `catalog`, `tags`, `relationships`, `notes`, `memories`, `facts`, `identities` | the knowledge layer over documents | same |
| `mirrors add\|list\|remove\|status\|sync\|watch` | a local Markdown folder in step with a page tree | same |
| `comments list\|create\|reply\|edit\|delete` | page comments, live. `list` shows unresolved ones only, and `edit` and `delete` act on the connection's own only | same group name |
| `files upload` | a local file added to the end of a page | Notion only |
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
   under the provider `notion` (kind `documents`, registered on every run that writes the store; a read opens it
   read-only).
   - The account is one sign-in's view of a workspace: the workspace id plus the token's bot id. Two profiles in one
     workspace with tokens of their own see different pages, so they are different accounts.
   - The record's external id is the page id. In the catalog a page is a `file` and a database a `folder`, with
     Notion's type kept beside it. Every page is a folder to the sync and a document too (cli-core's `isDocument`),
     so pages under pages are copied and a page can be a chosen folder. A row is a plain file.
   - The page text is Notion's own Markdown export
     ([retrieve a page as Markdown](https://developers.notion.com/reference/retrieve-page-markdown), version 2). A
     row's properties go into its front matter, so they are searchable as words from step 3, and as fields from
     step 4. A page's creator and last editor become Notion identities in the shared store, with the roles `owner`
     and `last-editor`, and the page is linked to their people. Their names and email addresses come from
     [retrieve a user](https://developers.notion.com/reference/get-user), asked once per user and run. An email
     address joins the identity to the person who has it, as drive-cli does. That needs the connection's capability
     to read user information including email addresses; without it the sync keeps the id, and says so in its issues
     and in `doctor`. Each page keeps what its read could learn of users (`authors`). A plain sync reads again, 50
     a run, the pages read before notion saved authors (0.5.0 and older) and those read with less than the connection
     gives now, as the last sync found it; no other page is read again for this.
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
     with an error that names it, never a silent cut. The store has no ceiling any more, and neither has the sync: one
     sync walks at most 10,000 entries (`maxEntries`) and its run's budget, saves where it stopped, and the next sync
     goes on.
   - Requests are paced below Notion's limit of 180 a minute per connection, through cli-core's pacer. Data source
     queries have a limit of their own, "about 3 requests per second per connection"
     ([request limits](https://developers.notion.com/reference/request-limits)), so they take a second pace at the
     same rate with a smaller burst.
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

## Writes

`documents create|update|delete|restore` change pages live, as gcal-cli changes events. Each runs through cli-core's
guard and send journal, with the command's own permission key, and answers with an `operation_id`.

- **create** sends [create a page](https://developers.notion.com/reference/post-page) with `markdown` (version 2)
  under a parent page. With no `--title`, Notion takes the text's first `# heading`. A row of a database is not
  created here: its title property has a name of its own, and its other properties are step 3's.
- **update** replaces the whole text with `replace_content` of
  [update page Markdown](https://developers.notion.com/reference/update-page-markdown). Notion refuses a text that
  leaves out a child page's or database's tag unless `allow_deleting_content` is set, which `--allow-deleting-content`
  sends. Notion's refusal is a plain `validation_error`, also given to a text over 5,000 blocks, so it is mapped
  to `notion.text-refused` with both causes named; Notion's own message is not repeated, as it quotes titles. Notion's `warnings` for a part it changed or left out are reported by their code only.
- **A targeted edit and a guarded write** (IDEA-2864 of the Notion roadmap in cli-private). `documents get` answers
  `sha256`, the sha256 of the text it shows, signed links already cut; a page Notion does not give whole answers
  `null`, since a write at it would stand for a part of the page. `documents check <page> --expected-fingerprint`
  says whether the page still has it. `documents update --payload '[{"old": …, "new": …}]'` sends `update_content`,
  and needs `--expected-fingerprint`; a whole `--text` or `--file` takes it too. The write goes through cli-core's
  `guardedFileWrite` over a one-page target (`src/notion/page-target.ts`): the page's text is read into the profile's
  version store (`versions/` in its state folder), hashed and compared, read again just before the write and
  compared again. Notion has no conditional write, so an edit landing after that last read is not caught; the help
  says "checked just before the write", never more. Each part's `old` must be on the page once (or `"all": true`),
  checked on that last read with nothing sent otherwise, because Notion applies the parts that match and only warns
  about the rest. A `no_match` warning still counts as a part not made: the answer is incomplete and exits non-zero.
  Every text write keeps the text it replaces, a whole replace without a fingerprint too (read just before), and
  answers `replaced.sha256` and `kept_at`. A page too long to read whole is replaced as before, with the warning
  `earlier_text_not_kept`. `--payload` and `--expected-fingerprint` are cli-base's words: `edit` means a sent
  message there, and `--if-sha256` is the old name of `--expected-fingerprint`. `files update`, the shared builder,
  is not used: Notion's `files` are uploads, and a page is not one.
- **delete** and **restore** set `in_trash` with [update a page](https://developers.notion.com/reference/trash-page).
  The API has no permanent delete, so `delete` is always undone by `restore`.
- **Permissions**, as gcal-cli and drive-cli: create, update and restore are `allow`; `documents.delete` is `ask`. An
  update with `--allow-deleting-content` also checks `documents.delete`, so it asks too, in one question. Over MCP
  `ask` goes ahead (cli-core's rule), so `deny` is what keeps an agent from deleting. Each write also checks the key of
  the `api` operation it sends (`api.post-page`, `api.update-page-markdown`, `api.patch-page`), so denying the
  operation cannot be got round through `documents`. The other way round, a raw `api` call that deletes also checks
  `documents.delete`, as gcal-cli's `api` checks `events.delete` for a body that cancels an event: every operation
  whose method deletes (`delete-a-block`, which may be a page, `delete-a-comment`, `delete-view` and the rest), and a
  body that sets `in_trash`, `erase_content` or `is_archived` to `true`, allows deleting content, or sets a data
  source's property to `null`, which removes it with its values. The list comes from a scan of Notion's OpenAPI
  document for such fields. `--dry-run` and `WCNOTION_READ_ONLY` are cli-core's.
- **Files.** `--file` takes only a regular file, after following links, and refuses `/proc`, `/sys` and `/dev`
  (`/proc/self/environ` holds `WCNOTION_TOKEN`), credential files, browser profiles and the WireCat folders, with
  cli-core's `refusedPlace`, as a messenger's file send does: an agent steered by a page's text must not publish a
  key. The `/proc` and regular-file check here goes once cli-core's `refusedPlace` has it (cli-core #3014).
- **Never sent twice.** A 5xx, which Notion also gives a request it ended after 60 s, no answer, or an answer that
  cannot be read is `outcome_unknown`: the page may have changed, so it is read before the write is repeated.
- The local copy is not changed by a write; the next `sync` brings it in step.

## Rows

Rows were added in 0.8.0 (plan IDEA-2863 in cli-private). The plan named `rows create|update|query`. The shared
vocabulary has no `query` verb, and a row is a page, so a row is written as a document:
`documents create --into <database>` and `documents update <row> --field`. Only the live list is its own group,
`rows list`, as no shared command lists a table's rows live. `--field <key=value>` is the vocabulary's flag for a
named value on a write. `rows`, `databases`, `--from-template` and `--cover` are in the vocabulary since cli-base
0.128.0 ([cli-base #693](https://github.com/WireCatLabs/cli-base/issues/693)). The lint override left is the list
without a query.

- **Typed values come from the schema.** Each `--field Name=Value` is checked against the data source's properties
  ([retrieve a data source](https://developers.notion.com/reference/retrieve-a-data-source)) and sent in the shape
  [page property values](https://developers.notion.com/reference/page-property-values) gives for its type. The body is
  keyed by property name, as the docs' examples are. A status must be one of its options, since a page write adds
  none. Formula, rollup, the created and edited fields, unique ids and buttons are refused, as Notion sets them. A
  files property is refused too: `files upload` adds a file. cli-core's CRM typed values were checked first. They
  read Attio's typed entries and write nothing, so they do not fit a write. cli-core's meetings `--setting` parser
  is not exported and takes snake_case names only, so `--field` has a small parser of its own.
- **Lists** (multi-select, people, relations) take values split by commas, which Notion's option names cannot hold. A
  list replaces the whole list, as Notion does. More than 100 people or relations in one write is refused, not split
  into several requests ([request limits](https://developers.notion.com/reference/request-limits)).
- **People** are an email address, a user id or `me`. An email is looked up in
  [list all users](https://developers.notion.com/reference/get-users), which needs the email capability. `me` is the
  person who owns the token (`bot.owner.user` in [get self](https://developers.notion.com/reference/get-self)). A
  connection the workspace owns has none, so `me` is refused there. In a `--filter`, `me` is sent as Notion's own
  `me`.
- **A database with several data sources** is refused with their ids, and one of those ids is given in place of the
  database. None is picked. A database id that Notion does not know as a database is taken as a data source id.
- **Templates**: `--from-template default`, `none`, an id, or a name looked up with
  [list data source templates](https://developers.notion.com/reference/list-data-source-templates). `databases show`
  lists them for each data source. Notion applies a template after it answers
  ([create a page](https://developers.notion.com/reference/post-page)), so the answer says `template_pending: true`.
  A template and `--text` together are refused, as Notion fills a row from one.
- **Filters**: `--filter Name<op>Value` with `=`, `!=`, `>`, `>=`, `<`, `<=`, `~` and `!~`, mapped per type to
  [filter data source entries](https://developers.notion.com/reference/filter-data-source-entries). An empty value
  with `=` or `!=` asks whether it is empty. Several are joined with `and`. The docs list no conditions for url,
  email and phone properties. They get the text conditions, not checked live.
- **Permissions**: a row is created by `documents create`, which checks `api.post-page`. `documents update --field`
  also checks `api.patch-page`. The reads before a write (schema, users, templates) fail with their own code. Only
  the write itself can be `outcome_unknown`.

## Moving and renaming

`documents move`, `documents rename` and `documents update --emoji|--cover` were added in 0.8.0 (IDEA-2865).

- **move** sends [move page](https://developers.notion.com/reference/move-page). The plan named one `--parent` for a
  page or a database. A Notion link does not say which it is, so a page is `--parent <id>` and a database, or one
  of its data sources, is `--into <id>`. Notion moves no database and nothing to the top of the workspace. Its answer
  may be only `object` and `id`, so that is all the answer relies on. It checks `api.move-page`.
- **rename** reads the page, finds its title property by type, and sets it. A row's title property has a name of its
  own, so it is not guessed. It checks `api.patch-page`.
- **icon and cover**: `--emoji` takes one emoji for the icon, `--cover` an https link for the cover, and `none` takes
  either away. An icon from a link or a file, and a cover from a file, wait for IDEA-2869 (files into a page). With
  text too, the values, icon and cover are set first in one request, then the text in a second.

## Comments and files

`comments list|create|reply` and `files upload` are friendly commands over the same calls `api` makes, with the
writes' guard, send journal, `operation_id`, `--dry-run` and `WCNOTION_READ_ONLY`.

- **comments list** sends [list comments](https://developers.notion.com/reference/list-comments), which gives only
  unresolved comments; its help says so. `--limit` and `--cursor` page it.
- **comments edit** and **comments delete** send [update a comment](https://developers.notion.com/reference/update-a-comment)
  and [delete a comment](https://developers.notion.com/reference/delete-a-comment). Notion lets a connection change
  only the comments it created and answers 404 for any other. So the comment is read first and its author compared
  with the token's bot from [get self](https://developers.notion.com/reference/get-self). Someone else's comment is
  refused before any write with `notion.not-own-comment`. The text read first is the answer's `previous_text`: Notion
  keeps no deleted comment, and this is its last copy. `comments delete` checks `documents.delete` and
  `api.delete-a-comment`, so it asks first, as the raw call does. Notion's answer to both may be only `object` and
  `id`. There is no resolve: the docs describe no way to resolve a comment.
- **comments create** comments on a page and **comments reply** answers in a discussion by its `discussion_id`, both
  with `markdown` in [create a comment](https://developers.notion.com/reference/create-a-comment), which keeps inline
  Markdown only. The text is a `secretInput`: no run record keeps it, whatever `record_input` says. Both check
  `comments.create` and `api.create-a-comment`, so a deny on either stops a reply too.
- **files upload** sends up to 20 MB in one part and a larger file in parts of 10 MB, then completes it, as
  [sending larger files](https://developers.notion.com/guides/data-apis/sending-larger-files) says (parts of 5 to
  20 MB). It then appends the file to the end of the page as an image, video, audio, PDF or file block, by the type
  Notion read from the name. It checks `files.upload`, `api.create-file`, `api.complete-file-upload` and
  `api.patch-block-children`. The file is opened once and checked as `--file` is: no link, no system or credential
  file.

## Meeting notes

Notion AI meeting notes go into cli-core's meetings category (IDEA-2868 of the Notion roadmap), so they sit beside
Zoom calls and the other meetings in the shared store, under the profile's Notion account. `meetings sync` reads them
with [query meeting notes](https://developers.notion.com/reference/query-meeting-notes) and the shared commands read
the store: `meetings list|show|transcript|summary|export|people|repair` and `events list`. `meetings import` is not
mounted: Notion keeps no meeting files.

- **What the API gives.** One `meeting_notes` block per meeting the token's user attended, with its title, status,
  calendar event (times, attendee ids), recording times and the block ids of its AI summary, notes and transcript.
  Each of those blocks is read as Markdown with
  [retrieve a page as Markdown](https://developers.notion.com/reference/retrieve-page-markdown), which takes a block
  id; the transcript with `include_transcript=true`. The summary is the meeting's summary, the notes a section of it.
- **Listing.** The query has no cursor, only `limit` (50 at most) and `has_more`. The sync filters
  `last_edited_time` on or after the cursor, to the minute in UTC, sorted oldest first, and asks again from the last
  note's edit time while `has_more` is true, at most 200 times. A summary written after the meeting edits the note,
  so the next sync reads it again. A whole page of 50 notes edited in one minute stops the listing there.
- **Attendees** are user ids, read with `GET /v1/users/{id}` for a name and an email address, as page authors are.
- **Not documented, not guessed.** The docs give no line format for a transcript (speaker, time). Each line is kept as
  written, with no speaker and no time of its own. An internal connection is likely to see no meetings, since it
  attends none: only a personal access token was assumed to.
- **A workspace without AI meeting notes** answers 400. The sync says so with `notion.meeting-notes-unavailable`.

## Keeping a local folder in step

`mirrors` uses cli-core's file mirror engine (`syncFileMirror`), as yandex-disk-cli does, not drive-cli's
`pushDocuments`: it already keeps conflicts for `mirrors conflicts list|show|resolve`, keeps every replaced version,
crosses a deletion into the other side's trash, and tells a deletion from mere absence
([cli-core #3232](https://github.com/WireCatLabs/cli-core/issues/3232)). `src/notion/mirror-target.ts` is its
`FileTarget`. The `mirrors` commands are cli-core's shared group, `fileMirrorsCommand` (cli-core 0.729.0), mounted in
`src/commands/mirrors.ts` with remote word `notion`, a 5 minute `watch` default and `mirrorKeys`: each write checks the
same `api.*` key as the `documents` command that sends it, a deletion on either side asks for `documents.delete`, and a
local file replaced asks nothing, since the mirror writes Notion's form back into the file after every upload.

- **Paths.** Each page under the mirrored page is `<title>.md`, and the pages under it are in the folder `<title>/`.
  A slash in a title becomes `-`, an empty title is `Untitled`. Two pages with one title in one place are mirrored as
  neither, and the listing says it is incomplete, so neither looks deleted. Only `.md` files are sent.
- **Notion's own Markdown.** Notion keeps a page as blocks and gives back its own Markdown, so the target says it
  `rewrites`: after a write the mirror takes Notion's form into the local file, the earlier version kept. Both sides
  then hold the same bytes, and the next sync merges against one base. A page's Markdown holds a `<page>` tag for each
  page under it, so creating a page changes its parent's file. A whole-page replace keeps child pages: one left out
  is refused, never deleted (`allow_deleting_content` stays off).
- **Checked just before the write.** Notion has no conditional write. Each update and trash reads the page again,
  compares the fingerprint with what the listing saw, and refuses another one. An edit landing after that read is not
  caught.
- **Deletion and absence.** A page is deleted only when Notion says it is in the trash. A page missing from the
  listing is looked up by its id from the last sync: moved elsewhere, it is still there, and a 404 may mean it is no
  longer shared. Both leave the local file alone, as `unknown`. A local deletion trashes the page in Notion, where it
  can be restored. A page with pages under it is not trashed, since Notion would trash them with it.
- **Cost.** Each sync reads every mirrored page's Markdown and lists the pages under each: about two requests a page.
  `last_edited_time` is rounded to the minute, so it cannot prove a page unchanged.

## Live check

The strict fake in `src/testing/fake-notion.ts` is built from Notion's reference only; no answer was captured from a
live workspace. `bin/notion-live <page>` checks the real API through `scripts/live.sh`, with a temporary profile that
stores nothing, and records the pass in `docs/dev/live-checks.txt` for `bin/release`. It fails on the first two points
below and on the write round trip after them; the rest a person reads in its output:

- `GET /v1/users/me` gives `bot.workspace_id` for both kinds of token. The account is that id and the bot's id; the
  reference lists the field but its example leaves it out, and sign-in refuses an answer without it.
- `documents get` on a page with an uploaded file whose name has parentheses, such as `Screenshot (2).png`, cuts at
  least one signed link and prints no `X-Amz-` or `signature=` query. Use such a page for the check: it fails on a
  page with no file. The form of a signed link in Markdown v2 is not documented; `src/notion/links.ts` cuts every query
  that carries a signature, plain or percent-encoded, wherever the link around it ends.
- A `child_page` block's `last_edited_time` is its page's, and its `has_children` matches what the page holds. The
  sync files a child page from its block ([the sync](SYNC.md)); the check warns on a difference and needs a test page
  with at least one page under it.
- A renewed personal access token, or a new token of the same connection, keeps the bot id. If it does not, a
  profile refuses its own renewed token as another connection (`profile.other-account`), and the account must become
  the workspace id alone, or the bot's owner.
- `GET /v1/users/{id}` with the bot's own id answers with its name (not yet checked live). The reference says a
  connection without user information capabilities is refused with 403; the sync then keeps authors by id only.
- `bot.owner.type` is `user` for a personal access token and `workspace` for an internal connection's token.
- On a page past about 20,000 blocks, the `<unknown url="…"/>` tag names its block id, so the fetched part lands in
  place; otherwise it is added after the page.
- `databases list` rows carry a data source's title, and `parent.database_id`, in search results.

The check writes, but only under the page it is given, the owner's test page "WireCat Test". It creates one page
`wirecat-live-<time>` there and a page under it, reads the text back twice and later sends
Notion's own Markdown back (a mirror needs the same bytes each time, so a difference is a warning), replaces it,
checks that an update dropping the
child page is refused with `notion.text-refused`, edits part of the text with `--payload` at the fingerprint
`documents get` gave and checks that the same fingerprint, now stale, is refused with `mirror.remote-changed`, trashes and restores the page, checking `in_trash` each time, and
leaves it in Notion's trash. Its temporary profile allows `documents.delete`, so no question stops the run; a check
that fails half way trashes its page on the way out.

## Open questions for the owner

- **Mirrors.** The four questions of step 6 are settled by the file mirror engine (above): a page is found by its
  path and id, not an origin key, a write is checked just before it is sent, the whole page is replaced, and Notion's
  own Markdown is taken back, so blocks Markdown shows as tags pass through. Not checked live yet: that two reads of an
  unchanged page give the same Markdown.
