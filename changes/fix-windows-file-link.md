### Fixed

- On Windows, `files upload` and `--file` refuse a link to a file too. Windows has no `O_NOFOLLOW`, so the link was
  followed there.
