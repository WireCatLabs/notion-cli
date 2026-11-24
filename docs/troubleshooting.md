# When something goes wrong

Get a command that failed working again, most often in one step. Find the symptom or the code from the error in the
table, do what its row says, then run the command again. Keep the error code and the profile name for a support
request.

| Symptom | What to do |
| --- | --- |
| Not sure what is set up | Run `notion doctor`. It reads no keyring and uses no network. |
| `notion` is not found | Open a new terminal, and check that npm's global folder is on `PATH`. |
| "name a profile" | Put the profile first, as in `notion personal config show`, or set `WCNOTION_PROFILE`. |
| The settings file does not read | `doctor` lists every problem in the file under `config.issues`. Run the `config unset` each one gives, or fix the file by hand. |
| `doctor` lists `files.problems` | Other users of the computer can read `config.json` or enter its folder. Run each `chmod` that `doctor` prints after "to make it private:". `doctor` never changes a file mode itself. |
| `doctor` says a profile reads no user information or no email addresses, or sync names `notion.no-user-information` or `notion.no-user-email` | Turn on "Read user information including email addresses" in the Notion connection's capabilities, then sync. Until then a page's author and editor are kept by Notion id, and only `identities link` joins them to a person. |
| `notion.not-shared`, or Notion has no such page or database | The page or database is not shared with your connection, or the id is wrong. In Notion, open the page, choose ••• → Connections, and add your connection. Then run the command again. |
| A page reads, but the answer lists `notion.not-shared` | A part of the page, such as a linked database, is not shared with your connection, so it was left out. Share that part as above. |
| `notion.restricted` | Notion says the token may not do this. Check the connection's [capabilities](https://developers.notion.com/reference/capabilities) in Notion: reading needs Read content, a change needs Update content or Insert content. When the error asks for email addresses, turn on "Read user information including email addresses", or give a user id instead of an email. |
| A write is refused | The profile's permissions or `WCNOTION_READ_ONLY` stop it; see [settings](configuration.md#permissions). |

Never paste a token, a password or private content into a support request.
