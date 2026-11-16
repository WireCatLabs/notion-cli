# When something goes wrong

Start with the symptom, run the check, then retry the command. Keep the error code and the profile name for a
support request.

| Symptom | What to do |
| --- | --- |
| Not sure what is set up | Run `notion doctor`. It reads no keyring and uses no network. |
| `notion` is not found | Open a new terminal, and check that npm's global folder is on `PATH`. |
| "name a profile" | Put the profile first, as in `notion personal config show`, or set `WCNOTION_PROFILE`. |
| The settings file does not read | `doctor` lists every problem in the file under `config.issues`. Run the `config unset` each one gives, or fix the file by hand. |
| `doctor` lists `files.problems` | Other users of the computer can read `config.json` or enter its folder. Run each `chmod` that `doctor` prints after "to make it private:". `doctor` never changes a file mode itself. |
| `doctor` says a profile reads no user information or no email addresses, or sync names `notion.no-user-information` or `notion.no-user-email` | Turn on "Read user information including email addresses" in the Notion connection's capabilities, then sync. Until then a page's author and editor are kept by Notion id, and only `identities link` joins them to a person. |
| A write is refused | The profile's permissions or `WCNOTION_READ_ONLY` stop it; see [settings](configuration.md#permissions). |

Never paste a token, a password or private content into a support request.
