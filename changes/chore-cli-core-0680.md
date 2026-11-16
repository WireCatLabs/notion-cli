### Security

- cli-core 0.680.0 and cli-base 0.106.0. cli-core now refuses files under `/proc`, `/sys` and `/dev` itself, so
  `--file` uses its check instead of notion's own. `--file` still opens the file once, never through a link, and
  checks the file it opened.

### Fixed

- The [install page](../docs/installation.md#sign-in) shows how to sign in with `session start`.
