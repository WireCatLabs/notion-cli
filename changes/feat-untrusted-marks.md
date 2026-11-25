### Fixed

- **A scheduled agent reads other people's Notion text marked.** In a run locked read-only with a mark
  (`WCNOTION_READ_ONLY=1` and `WCNOTION_UNTRUSTED_MARK`), `documents get` marks the page's Markdown, `folders browse`
  the names, `databases list|show` the titles, descriptions, property names, select options and template names, `rows
  list` the row titles, `comments list` the comment text and its author, and the `api` group's operations every string
  in the raw answer, its keys left as they are. cli-core's shared commands already marked theirs, `mirrors preview` and
  `mirrors conflicts list|show` among them. Outside such a run no answer changes. A marked property name is passed back
  to `rows list --filter` without the markers. Not marked yet: the values in `rows list`'s `properties`, whose keys
  differ in each database.
- **A `--rescan` removes a page or row found in Notion's trash as deleted.** A full walk that read a held page or row
  directly and found it in the trash left it out, so it stayed as no longer visible with its text kept. It now leaves
  as deleted, as the change feed already did. A page Notion no longer finds stays as no longer visible. What was
  under a page or database in the trash is not read, and leaves as no longer visible, as before.
