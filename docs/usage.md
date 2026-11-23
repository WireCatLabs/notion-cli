# Use it

This page explains how a command is built, and how an agent uses the tool. Read it before your first command.

## The profile comes first

A profile is a name you choose for one account. It is the first word of every command that uses an account:

```sh
notion personal config show
```

`WCNOTION_PROFILE=personal` does the same for one shell session. No profile is ever assumed, not even the only one: a
command without one stops with exit code 2 and lists the profiles on this computer.

## Output for scripts

Every command except `mcp serve` on stdin and stdout takes `--json`, and prints one JSON value on stdout. Errors are JSON on stderr, with a code to branch
on. The [command reference](commands.md) lists the codes.

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
