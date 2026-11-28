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

Each failed command is kept as a run, so `notion runs list` and `runs show` tell you what happened. Commands that
call Notion, such as `documents`, `databases`, `comments` and `session status --check`, are kept when they succeed
too. Set `record` to `false` to keep failures
only. Add `--no-record` to keep nothing of one command, or `--record` to keep a success that would not be kept
otherwise. A run keeps the command line as you typed it. With `record_input` set to `false`, it hides every value that
may be your text. Secrets are hidden either way; see [Security](security.md).
