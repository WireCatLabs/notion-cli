### Fixed

- Sync now saves a page's creator and last editor as people in the shared store, with their names and email addresses
  from Notion, and links the page to them as `owner` and `last-editor`. An email address joins them to the person who
  already has it, so a person's context shows the Notion pages they wrote or edited. This needs the connection's
  capability to read user information including email addresses; without it the authors are kept by Notion id, and
  `sync` and `doctor` say so. A page synced before this gets its authors when it next changes.
- `identities link <page> <notion-id> person:<uid>` works: it no longer fails because the Notion user was not in the
  store, and it moves every synced page's link from that user to the person.
