<!-- Generated from the command tree by pnpm generate. Do not edit. -->

# Commands

Every command, option and exit code, generated from the program itself. For the same list as JSON, run
`notion commands --json`.

**The first word is the profile**, a name you choose: `notion personal config show`. `WCNOTION_PROFILE`
does the same for a whole shell session. No profile is assumed: a command that uses an account stops without one and
lists the profiles on this computer.

## Options for every command

| Option | What it does |
|---|---|
| `-V, --version` | output the version number. |
| `-v, --verbose` | more detail in what is shown: -v ids, -vv everything we know. Default: `0`. |
| `--json` | machine-readable output: one JSON value on stdout; --json=id,text keeps only those fields. |
| `--jsonl` | machine-readable output: one JSON object per line, for streaming and jq. |
| `--quiet` | diagnostics off; a failure is still said. |
| `--trace` | the connection's own log lines on stderr — never content. |
| `--debug` | on a failure, its whole record — cause and stack — in place of the short line. |
| `--timeout <duration>` | give up on the whole command after this — 30s, 2m, 500ms. |
| `--offline` | answer from what was recorded and never connect; fails if nothing was. |
| `--no-input` | never prompt or open interactive login; piped input remains available. |
| `--max-input-bytes <bytes>` | maximum buffered input bytes (default: 16777216). |
| `--max-output-bytes <bytes>` | maximum machine output bytes (default: 4194304; 0 disables). |
| `--brief` | found items as reference, title, time, author and excerpt only. |
| `--full` | found items with their whole text and every provider field. |
| `--compact` | one line per item for an agent: reference first, text last, paging and next steps as # lines. |
| `--dry-run` | preview parsed arguments and permissions before running the action. |
| `--yes` | go ahead without the question an ask level puts before a write. |
| `--record` | keep this run even where the config says record false; record_input false leaves the typed words out. |
| `--no-record` | do not keep this run, even if it fails. |

## `notion commands`

every command by section; --json prints its contract, one path per call

### `notion commands info`

one command contract, or all schemas, error reasons and explicit overrides

```sh
notion commands info [path]
```

| Argument | | What it is |
|---|---|---|
| `path` | optional | one command path; without one, export schemas, error reasons and explicit overrides. |

**Example:** `notion commands info commands`

## `notion session`

keep this profile's Notion token in the OS keyring

### `notion session start`

sign this profile in: a Notion personal access token, which acts with your own rights, or an internal connection's token, which sees only the pages shared with that connection. It is asked hidden or read from stdin, never taken as an argument, checked with Notion, and only then kept in the keyring, or in a private file

**Changes something on this computer only.**

```sh
notion session start [options]
```

| Option | What it does |
|---|---|
| `--credential-storage <storage>` | where the token is kept: keyring, which falls back to a private file by itself, or file. Default: `keyring`. |

**Example:** `notion personal session start`, `notion personal session start --credential-storage file`

### `notion session status`

show where this profile's token comes from: WCNOTION_TOKEN, the keyring or a file, never the token; --check asks Notion whose token it is

```sh
notion session status [options]
```

| Option | What it does |
|---|---|
| `--check` | ask Notion whether the token still works, and whose it is. |

**Example:** `notion personal session status`, `notion personal session status --check --json`

### `notion session end`

forget this profile's token on this computer; the token itself stays valid in Notion. Only this tool's own entry goes: Notion's own CLI keeps its tokens under the same keyring name, and they stay

**Changes something on this computer only.**

```sh
notion session end
```

**Example:** `notion personal session end`

### `notion session list`

list the profiles on this computer and whether each has a token; picks none

```sh
notion session list
```

**Example:** `notion session list`, `notion session list --json`

## `notion documents`

read Notion pages

### `notion documents get`

read one page live from Notion as Notion-flavoured Markdown. A page too long for one answer is read in parts; a part the token may not see is listed in missing_block_ids, and a page that is not whole answers meta.complete false and exits non-zero. Signed file links lose their signature, so the output never carries a link that opens the file

```sh
notion documents get <page>
```

| Argument | | What it is |
|---|---|---|
| `page` | required | the page's id or its Notion link. |

**Returns:** document markdown — id, markdown, truncated, missing_block_ids, signed_links_removed; every field: notion commands info documents get

**Example:** `notion personal documents get https://www.notion.so/Roadmap-0123456789abcdef0123456789abcdef`, `notion personal documents get 0123456789abcdef0123456789abcdef --json`

## `notion databases`

read Notion databases and their data sources

### `notion databases list`

list the databases this token can see, live from Notion's search: one row for each data source, with the database it belongs to. Notion's search can lag behind a new database by a few minutes

```sh
notion databases list [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | field:value terms that narrow the list — the fields are below. |

| Option | What it does |
|---|---|
| `--limit <n>` | at most this many, up to 100; 50 if not given. |
| `--cursor <cursor>` | go on from where the last page stopped; page.next gives it. |

**Returns:** database — id, data_source_id, title, last_edited_time; every field: notion commands info databases list

**Example:** `notion personal databases list`, `notion personal databases list title:Roadmap --json=id,data_source_id,title`

### `notion databases show`

show one database live from Notion: its title, where it sits, and each of its data sources with its id and its properties, with the options of each select and status; a query of the database names a data source id

```sh
notion databases show <database>
```

| Argument | | What it is |
|---|---|---|
| `database` | required | the database's id or its Notion link. |

**Returns:** database — id, title, description, url, parent, is_inline, in_trash, created_time, and 2 more; every field: notion commands info databases show

**Example:** `notion personal databases show 0123456789abcdef0123456789abcdef`, `notion personal databases show https://www.notion.so/0123456789abcdef0123456789abcdef --json`

## `notion doctor`

the state this installation is in, without connecting unless --online

```sh
notion doctor [options]
```

| Option | What it does |
|---|---|
| `--online` | also connect once and read the account; sends nothing. |

**Example:** `notion doctor`, `notion doctor --json`

### `notion doctor reports`

problem reports

#### `notion doctor reports show`

what a problem report holds; writes nothing

```sh
notion doctor reports show
```

**Example:** `notion doctor reports show`

#### `notion doctor reports create`

write a problem report to a file, and say where to send it

**Changes something on this computer only.**

```sh
notion doctor reports create [options]
```

| Option | What it does |
|---|---|
| `--run <id>` | the run the report is about; the newest failed one if not given. |
| `--output <file>` | where to write it; a new file in this directory if not given. |

**Example:** `notion doctor reports create --output ./problem-report.json`

## `notion skill`

the instructions an agent is given for this tool

### `notion skill show`

print SKILL.md — `notion skill install` puts it where Claude Code, Codex, Gemini CLI and OpenClaw look for it, and where Hermes does on request; --for prints the copy already there

```sh
notion skill show [options]
```

| Option | What it does |
|---|---|
| `--for <agents>` | print the copy installed for these agents instead of this version's. One of: `claude`, `agents`. |

**Example:** `notion skill show`

### `notion skill install`

write SKILL.md to \~/.claude/skills/notion-cli/ (Claude Code) and \~/.agents/skills/notion-cli/ (Codex, Gemini CLI, OpenClaw); --for hermes also has Hermes read \~/.agents/skills, which changes Hermes's own settings, so all leaves it out

**Changes something on this computer only.**

```sh
notion skill install [options]
```

| Option | What it does |
|---|---|
| `--for <agents>` | which agents to install for. One of: `claude`, `agents`, `hermes`, `all`. Default: `all`. |

**Example:** `notion skill install --for agents`

### `notion skill status`

for each place `notion skill install` writes to, and for the copy Hermes reads: the path, the version installed there, and whether it is current, stale, missing or unversioned

```sh
notion skill status
```

**Example:** `notion skill status`, `notion skill status --json`

## `notion mcp`

serve this profile to an agent over MCP and set it up — `claude mcp add notion -- notion <profile> mcp serve`

### `notion mcp serve`

serve this profile to an agent over MCP, on stdin and stdout — `claude mcp add notion -- notion <profile> mcp serve`; `notion mcp serve --profiles a,b` or `--profiles all` serves those profiles from one server and each tool asks which

**Changes something in the service.**

```sh
notion mcp serve [options]
```

| Option | What it does |
|---|---|
| `--permission <key=level>` | make a permission stricter for this server only, like documents.get=deny; it never loosens the profile; repeat for more keys. |
| `--profiles <names\|all>` | serve several profiles from one server instead of one: names, comma-separated, or all for every profile. |
| `--http` | serve over HTTP on 127.0.0.1 for ChatGPT and Claude in the browser, behind your tunnel; the profile's permissions decide. |
| `--port <port>` | the local port for --http (default 8765). |
| `--public-url <url>` | the tunnel's https address the browser apps use, e.g. https://<name>.ts.net or https://<name>.ts.net/tg. |

**Example:** `notion personal mcp serve`, `notion mcp serve --profiles work,personal`, `notion personal mcp serve --http --public-url https://laptop.example.ts.net`

### `notion mcp revoke`

forget every login `mcp serve --http` gave a browser app, of this profile or of the server `--profiles` names; each app must log in again

**Changes something on this computer only.**

```sh
notion mcp revoke [options]
```

| Option | What it does |
|---|---|
| `--profiles <names\|all>` | serve several profiles from one server instead of one: names, comma-separated, or all for every profile. |

**Example:** `notion personal mcp revoke`, `notion mcp revoke --profiles all`

### `notion mcp server`

start, stop and check `mcp serve --http` in the background; status shows the login code for a browser app

#### `notion mcp server start`

start `mcp serve --http` apart from this shell and answer once it listens, with its login code

**Changes something on this computer only.**

```sh
notion mcp server start [options]
```

| Option | What it does |
|---|---|
| `--port <port>` | the local port (default 8765). |
| `--public-url <url>` | the tunnel's https address the browser apps use, e.g. https://<name>.ts.net or https://<name>.ts.net/tg. |
| `--permission <key=level>` | make a permission stricter for this server only; repeat for more keys. |
| `--profiles <names\|all>` | the server of several profiles that `mcp serve --profiles` serves: names, comma-separated, or all. |

**Example:** `notion personal mcp server start --public-url https://laptop.example.ts.net`

#### `notion mcp server stop`

stop `mcp serve --http` — only one that `mcp server start` started

**Changes something on this computer only.**

```sh
notion mcp server stop [options]
```

| Option | What it does |
|---|---|
| `--profiles <names\|all>` | the server of several profiles that `mcp serve --profiles` serves: names, comma-separated, or all. |

**Example:** `notion personal mcp server stop`

#### `notion mcp server status`

whether `mcp serve --http` runs, on which port and address, the login code for a new browser app, and the apps logged in

```sh
notion mcp server status [options]
```

| Option | What it does |
|---|---|
| `--profiles <names\|all>` | the server of several profiles that `mcp serve --profiles` serves: names, comma-separated, or all. |

**Example:** `notion personal mcp server status --json`

### `notion mcp config`

print the mcpServers entry for Claude Desktop, Cursor and others, with full paths; writes nothing

```sh
notion mcp config [options]
```

| Option | What it does |
|---|---|
| `--permission <key=level>` | make a permission stricter for this server only, like documents.get=deny; it never loosens the profile; repeat for more keys. |
| `--profiles <names\|all>` | serve several profiles from one server instead of one: names, comma-separated, or all for every profile. |

**Example:** `notion personal mcp config`, `notion mcp config --profiles all`

### `notion mcp add`

add this profile's local MCP server to Codex or Claude Code

**Changes something on this computer only.**

```sh
notion mcp add <client> [options]
```

| Argument | | What it is |
|---|---|---|
| `client` | required | codex or claude-code. |

| Option | What it does |
|---|---|
| `--allow-writes` | acknowledge that this profile offers writing tools. |
| `--permission <key=level>` | make a permission stricter for this server only, like documents.get=deny; it never loosens the profile; repeat for more keys. |

**Example:** `notion personal mcp add codex --allow-writes`

### `notion mcp check`

check this profile's local MCP handshake and tool list

```sh
notion mcp check [options]
```

| Option | What it does |
|---|---|
| `--permission <key=level>` | make a permission stricter for this server only, like documents.get=deny; it never loosens the profile; repeat for more keys. |

**Example:** `notion personal mcp check`

## `notion upgrade`

upgrade notion with the package manager that installed it; --check only looks

**Changes something on this computer only.**

```sh
notion upgrade [options]
```

| Option | What it does |
|---|---|
| `--check` | say whether a newer version exists, and install nothing. |

**Example:** `notion upgrade --check`

## `notion config`

the settings in force, and where each one came from

### `notion config show`

the profile, the profiles that exist, and each setting with where it came from

```sh
notion config show
```

**Example:** `notion personal config show`

### `notion config set`

save a setting to the configuration file

**Changes something on this computer only.**

```sh
notion config set <setting> <value> [options]
```

| Argument | | What it is |
|---|---|---|
| `setting` | required | one of: limit, timeout_ms, color, record, record_input, keep_runs_for_days, keep_successful_runs_for_days, keep_store_runs_for_days, runs_size_limit_mb, permissions, requests_per_minute, search_reranker, embedding_provider, embedding_model, embedding_base_url, embedding_dims, models, update_check, skill_hint, search_stemmers.cyrillic, search_stemmers.latin, owner_languages, crm.<provider>:<account>.links, crm.<provider>:<account>.company-types, crm.<provider>:<account>.scope, crm.<provider>:<account>.unassigned, crm.<provider>:<account>.self, crm.<provider>:<account>.stage-tasks, crm.<provider>:<account>.activities. |
| `value` | required | a number, true or false; for a group tg:work,max:Alice,email:me@x. |

| Option | What it does |
|---|---|
| `--defaults` | change what every profile gets, rather than this profile. |

**Example:** `notion personal config set limit 20`

### `notion config unset`

remove a setting from the configuration file

**Changes something on this computer only.**

```sh
notion config unset <setting> [options]
```

| Argument | | What it is |
|---|---|---|
| `setting` | required | one of: limit, timeout_ms, color, record, record_input, keep_runs_for_days, keep_successful_runs_for_days, keep_store_runs_for_days, runs_size_limit_mb, permissions, requests_per_minute, search_reranker, embedding_provider, embedding_model, embedding_base_url, embedding_dims, models, update_check, skill_hint, search_stemmers.cyrillic, search_stemmers.latin, owner_languages, crm.<provider>:<account>.links, crm.<provider>:<account>.company-types, crm.<provider>:<account>.scope, crm.<provider>:<account>.unassigned, crm.<provider>:<account>.self, crm.<provider>:<account>.stage-tasks, crm.<provider>:<account>.activities. |

| Option | What it does |
|---|---|
| `--defaults` | change what every profile gets, rather than this profile. |

**Example:** `notion personal config unset limit`

### `notion config migrate`

write each setting the file lacks at its default, keeping yours

**Changes something on this computer only.**

```sh
notion config migrate
```

**Example:** `notion config migrate`

### `notion config repair`

fix broken JSON syntax in the settings file — comments, a missing or extra comma, unquoted keys, single quotes, missing closing brackets at the end — keeping every value, with a backup beside it; refuses anything with more than one reading and changes nothing then

**Changes something on this computer only.**

```sh
notion config repair [options]
```

| Option | What it does |
|---|---|
| `--dry-run` | say what it would fix, and change nothing. |

**Example:** `notion config repair`, `notion config repair --dry-run`

## `notion runs`

recorded runs — what this tool did, and when

### `notion runs list`

recorded runs, newest first

```sh
notion runs list [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | field:value terms that narrow the list — the fields are below. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many to show. Default: `20`. |
| `--page <n>` | which page, starting at 1. Default: `1`. |

**Returns:** run — run_id, command, started_at, status, cli_version, profile, completed_at, requests, and 23 more; every field: notion commands info runs list

**Example:** `notion personal runs list --limit 10`

### `notion runs show`

one run: what it was, how it ended, and every event it logged

```sh
notion runs show <run-id> [options]
```

| Argument | | What it is |
|---|---|---|
| `run-id` | required | an id from `notion runs list`. |

| Option | What it does |
|---|---|
| `--problems` | only failed responses, warnings and crashes. |

**Returns:** run details — run_id, command, started_at, status, cli_version, directory, event_count, events, and 22 more; every field: notion commands info runs show

**Example:** `notion personal runs show run-101`

### `notion runs path`

the directory holding one run

```sh
notion runs path <run-id>
```

| Argument | | What it is |
|---|---|---|
| `run-id` | required | an id from `notion runs list`. |

**Returns:** run location — path; every field: notion commands info runs path

**Example:** `notion personal runs path run-101`

## Exit codes

Branch on the code, not on the text: the text can change, the code does not.

| Code | When |
|---|---|
| `0` | it worked |
| `2` | `validation_error` |
| `3` | `configuration_error` |
| `4` | `authentication_error` |
| `5` | `permission_error` |
| `6` | `not_found` |
| `7` | `confirmation_required` |
| `8` | `rate_limited` |
| `9` | `timeout` |
| `10` | `network_error` |
| `11` | `provider_error` |
| `12` | `provider_unavailable` |
| `13` | `invalid_response` |
| `14` | `outcome_unknown` |
| `15` | `conflict` |
| `130` | `cancelled` |
| `1` | anything else |
