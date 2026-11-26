### Changed — may break callers

- **`session start | status | end | list` are cli-core's shared session commands now** (cli-core 1.3.0). A profile
  signed in before keeps its token, with no new sign-in: the keyring entry is the same. `session list` gives each row a
  `state` (`saved`, `missing` or `unknown`). A profile whose sign-in cannot be read, such as a keyring this run cannot
  reach, is listed with `signed_in: null` and `state: "unknown"` and a warning, where the whole list failed before.
  `session status --check` refuses an offline run first, as `session start` does.
- **Built on cli-core 1.3.0.**
