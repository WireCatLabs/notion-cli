### Added

- **A database row is created and changed with typed values.** `documents create --into <database>` adds a row
  with `--title` and `--field Name=Value`. Each value is checked against the database's properties and sent as its
  type takes it: text, number, select, status, multi-select, date or range, checkbox, link, email, phone, people and
  relations. A person is an email address, a user id or `me`. `--from-template default`, a template's id or its name fills
  the row from a template, and the answer says `template_pending: true`, since Notion adds the template's text after
  it answers. `documents update <row> --field Status=Done` changes the values named and keeps the rest. `rows list
  <database> --filter Status=Open --filter "Due<2026-12-01"` lists rows live with their values. `databases show` now
  lists each data source's templates. Why: an agent could add a task to a Notion database only through raw `api`
  calls, with no check of its values ([docs/dev/DESIGN.md](../docs/dev/DESIGN.md#rows)).
- **`notion <profile> documents move` and `documents rename` file and name pages.** `move` puts a page under another
  page (`--parent`) or into a database (`--into`). `rename` sets the title of a page or a row. `documents update
  --emoji` and `--cover` set the icon and the cover, or take them away with `none`. Why: moving a page needed a raw
  `api` call ([docs/dev/DESIGN.md](../docs/dev/DESIGN.md#moving-and-renaming)).
- **Comments are in the local copy and in search, and the connection's own comments can be fixed.** The sync reads a
  page's open comments with its text and adds them to the page's searchable text, never to its Markdown. A page
  synced before this version is read once more to add them. A connection without the "Read comments" capability
  gets one warning and the rest of the sync goes on. `comments edit` and `comments delete` change or delete a comment
  this connection posted. Notion keeps no deleted comment, so `comments delete` asks first, as `documents delete`
  does, and both answer the comment's earlier text in `previous_text`
  ([docs/dev/SYNC.md](../docs/dev/SYNC.md#comments)).

### Fixed

- cli-core 0.720.0 (was 0.718.0), cli-base 0.126.1 (was 0.125.0).
