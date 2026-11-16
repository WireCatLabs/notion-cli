### Added

- `documents create`, `documents update`, `documents delete` and `documents restore` write Notion pages. `create`
  makes a page under another page from Markdown, `update` replaces a page's text, `delete` moves a page to Notion's
  trash and asks first, and `restore` brings it back. An update that would delete a child page or database is refused
  unless `--allow-deleting-content` is given, and then it asks as a delete does. Every write goes through the
  profile's permissions and the write journal, answers with an `operation_id`, and is previewed with `--dry-run`. See
  [Writes](../docs/dev/DESIGN.md#writes).
