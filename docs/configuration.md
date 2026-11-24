# Settings

Decide once what your agent may change in Notion, and how much one command lists. Settings live in one file,
`config.json`, in the folder `notion doctor` shows. Each profile has its own part, and `defaults` apply to every
profile.

```sh
notion personal config show
notion personal config set limit 50
notion personal config unset limit
```

`config show` lists each setting and where it came from: the file, a variable or the default.

## Permissions

`permissions` decides what a command may do for this profile: `allow`, `ask`, `readonly` or `deny`, per permission
key. Over MCP there is no one to ask, so `ask` lets the command run. `WCNOTION_READ_ONLY=1` refuses every write, whatever
the permissions say.

Creating, changing and restoring a page is `allow` by default. `documents.delete` is `ask`, and an update with
`--allow-deleting-content` asks under the same key, since it deletes child pages. To keep an agent from deleting
pages over MCP, set `documents.delete` to `deny`. That holds for the raw `api` commands too: an operation that deletes,
such as `delete-a-block`, and a call whose body trashes, erases, archives or removes content also check
`documents.delete`. Each page write also checks the key of
the API operation it sends, such as `api.patch-page` for `documents delete`, so denying that operation stops both.

## Run records

A command that fails is kept as a run, for `notion runs list` and `runs show`. A command you add that does its work
in `context.run` is kept when it succeeds too, unless `record` is `false` (then only failures) or it ran with
`--no-record`. `documents`, `databases` and `session status --check` do their work in a run, so `--record` keeps them. `record_input` decides whether a run
keeps the words you typed; it is `true` unless you set it to `false`. Secrets are masked either way; see
[Security](security.md).
