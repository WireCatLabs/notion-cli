### Added

- `comments list`, `comments create` and `comments reply` read and write the comments on a Notion page, live.
  `comments list` shows only unresolved comments, as Notion's API gives no others. A comment's text never reaches a
  run record. See [Comments and files](../docs/dev/DESIGN.md#comments-and-files).
- `files upload <file> --parent <page>` uploads a file and adds it to the end of a page as an image, video, audio, PDF
  or file block. A file over 20 MB goes in parts of 10 MB. Only a regular file is sent, as with `--file`.
- Each write checks its own permission (`comments.create`, `files.upload`) and the `api` operations it sends, and
  takes `--dry-run`.

