# Use it

Read and change your Notion pages from a terminal, or let your agent do it, always in the workspace you name. Every
command starts with a profile, so nothing goes to the wrong account.

You or your agent can then find a page offline, answer comments, fill database rows, change one part of a page
without sending all of it again, bring back an earlier version, keep a folder of Markdown files in step with Notion
and read your meeting notes. A script gets JSON, with an error code to branch on.

**On this page:**

1. [The profile comes first](#the-profile-comes-first)
2. [Find and read a page](#find-and-read-a-page)
3. [Comments](#comments)
4. [Output for scripts](#output-for-scripts)
5. [Database rows](#database-rows)
6. [Changing part of a page](#changing-part-of-a-page)
7. [Earlier versions and the change log](#earlier-versions-and-the-change-log)
8. [Keep a folder of Markdown files and Notion pages the same](#keep-a-folder-of-markdown-files-and-notion-pages-the-same)
9. [Meeting notes](#meeting-notes)
10. [Agents](#agents)

## The profile comes first

A profile is a name you choose for one account. It is the first word of every command that uses an account:

```sh
notion personal config show
```

`WCNOTION_PROFILE=personal` does the same for one shell session. No profile is ever assumed, not even the only one: a
command without one stops with exit code 2 and lists the profiles on this computer.

## Find and read a page

Search runs on the copy on your computer, so it works without the internet. Read a page live from Notion when you
need its current text:

```sh
notion personal sync
notion personal search "quarterly plan"
notion personal documents get https://www.notion.so/Roadmap-0123456789abcdef0123456789abcdef
```

`search` finds the words in any of their forms, and `--exact` matches them as typed. When a text model is already
downloaded on your computer, `notion personal sync --embed` also indexes the new text, so search finds a page by its
meaning too. `documents show` reads a
page from the copy, and `documents get` reads it live.

## Comments

```sh
notion personal comments list PAGE_ID
notion personal comments create PAGE_ID --text "Looks good"
notion personal comments reply DISCUSSION_ID --text "Done, see the new plan"
```

`comments list` shows only open comments, because Notion's API gives no resolved ones. Reply to a discussion by the
`discussion_id` that `comments list` gives. `comments edit` and `comments delete` change only the comments this
connection posted.

## Output for scripts

Every command except `mcp serve` on stdin and stdout takes `--json`, and prints one JSON value on stdout. Errors
are JSON on stderr, with a code to branch on. The [command reference](commands.md) lists the codes.

## Database rows

A database's rows are pages with typed values. Read the property names, options and templates first, then write:

```sh
notion personal databases show DATABASE_ID
notion personal documents create --into DATABASE_ID --title "Write the plan" --field Status=Open --field Owner=me
notion personal documents update ROW_ID --field Status=Done
notion personal rows list DATABASE_ID --filter Status=Open --filter "Due<2026-12-01"
```

Each `--field` is checked against the property's type before anything is sent. A list (multi-select, people,
relations) takes values split by commas, a date takes `2026-12-01` or a range `2026-12-01/2026-12-05`, and an empty
value clears it. `--from-template default`, or a template's name from `databases show`, fills the row from a template.

## Changing part of a page

Read the page, then send only the parts to change, with the fingerprint the read gave:

```sh
notion personal documents get PAGE_ID --json
notion personal documents update PAGE_ID --payload '[{"old": "Due Friday", "new": "Due Monday"}]' \
  --expected-fingerprint SHA256
```

The page is read again just before the write. When it changed since your read, nothing is written and the error
says to read it again. Notion has no conditional write, so an edit someone makes in the second between that check and
the write is not caught. The text the write replaced is kept in your local versions, and the answer says where.

## Earlier versions and the change log

```sh
notion personal documents history PAGE_ID
notion personal documents history PAGE_ID --revision 2
notion personal changes --since 7d --event deleted,unavailable
```

Each sync keeps a page's text before it changes or leaves the copy, for `keep_versions_for_days` (365 by default).
A page in Notion's trash is `deleted`. A page Notion answers 404 for is `unavailable`: deleted for good, or no longer
shared with the token. It keeps its text and comes back when Notion shows it again.

## Keep a folder of Markdown files and Notion pages the same

A mirror pairs a local folder with one Notion page. Each page under that page is a Markdown file named after its
title, and the pages under it are in a folder of the same name. Edit the files in any editor, or the pages in Notion,
and a sync copies each change to the other side.

```sh
notion personal mirrors add https://www.notion.so/Notes-0123456789abcdef0123456789abcdef ~/Notes
notion personal mirrors preview
notion personal mirrors sync
```

`mirrors add` checks the page and saves the pair. Nothing is copied until `mirrors sync`. `mirrors preview` shows
what a sync would do and changes nothing.

What a sync does:

- **A new or changed file** becomes a new or changed page, and a page changed in Notion is written into its file.
  Notion keeps a page in its own Markdown, so after a page is sent, its file gets Notion's form of the text. Your
  earlier text is kept as a version.
- **A file deleted on one side** goes to the other side's trash: Notion's trash for a page, and `.wirecat-trash/<date>/` inside the
  mirrored folder for a file.
  Only a page in Notion's trash counts as deleted. A page you moved elsewhere, or one the connection can no longer
  see, leaves its file alone.
- **A file changed on both sides** is merged line by line when the changes are in different places. When they touch
  the same lines, the sync leaves both as they are and lists a conflict. `mirrors conflicts list` shows them,
  `mirrors conflicts show <id> <path>` shows the three versions, and `mirrors conflicts resolve <id> <path> --keep
  local`, `--keep notion`, `--keep both` or `--file <final>` settles one.
- **Every overwrite and deletion** first keeps the earlier text on this computer, for `keep_versions_for_days` (365 by
  default). `mirrors versions list <id> <path>` shows them and `mirrors versions restore <id> <path> <sha256>` puts
  one back.

A sync that would delete more than 10 files or overwrite more than 50 stops before it changes anything, and says
which flag lets it go on. Run `mirrors preview`, then `mirrors sync <id> --allow-deletions <count>` or
`--allow-replacements <count>`. `mirrors watch` keeps syncing until
Ctrl-C. Notion has no change feed, so it reads every mirrored page each time it checks, every 5 minutes by default.

Limits:

- Only `.md` files become pages. Leave other files out with `mirrors update <id> --ignore <path>`.
- A sync reads every mirrored page, about two requests a page. Notion answers about three requests a second, so 300
  pages take about 3 minutes.
- Renaming a file trashes the page and makes a new one, so the page loses its comments, links to it and sharing.
  Rename the page in Notion instead.
- A page with pages under it is trashed only once their files are gone too, so deleting a folder of pages takes two
  syncs.
- Two pages with the same title in one place are left out until one is renamed.

The permissions `api.post-page`, `api.update-page-markdown` and `api.patch-page` apply to a sync as to `documents`,
and a deletion on either side asks for `documents.delete`.

## Meeting notes

```sh
notion personal meetings sync --since-time 2026-11-01
notion personal meetings list
notion personal meetings transcript 12
```

`meetings sync` copies the Notion AI meeting notes of the meetings you attended, with their attendees, AI summary,
your notes and the transcript. Use a personal access token: an internal connection attends no meetings. A workspace
without AI meeting notes gets an error with the reason `notion.meeting-notes-unavailable`.

## Agents

`notion skill install` puts the tool's skill where Claude Code, Codex, Gemini CLI and OpenClaw look for it.
`notion skill install --for hermes` also adds that folder to Hermes Agent's own settings, so a bare `skill install`
leaves Hermes out. `notion personal mcp serve` serves the profile's commands over MCP, on stdin and stdout:

```sh
claude mcp add notion -- notion personal mcp serve
```

The server offers every command, the ones that write included. The profile's permissions decide what runs; see
[settings](configuration.md#permissions).

For ChatGPT and Claude in the browser,
`notion personal mcp serve --http --public-url https://laptop.example.ts.net` serves on `127.0.0.1` (port 8765, or
`--port`) behind your own tunnel. A browser app logs in with a one-time code that the command prints;
`notion personal mcp revoke` ends every login. `notion personal mcp server start` runs the same
server in the background, `mcp server status` shows its port, the login code and the apps logged in, and
`mcp server stop` ends it.
