### Changed — may break callers

- `folders browse` pages: `--limit` (100 by default) and `--cursor` from `page.next_cursor`. At the top of the
  workspace it reads Notion's search one page at a time instead of all of it, so a large workspace answers within a
  minute. Each item now says where it sits (`parent`, null at the top) and whether sync already copies it as `added`,
  the field drive's `folders browse` uses, in place of `chosen`. A database lists nothing inside, as its rows are not
  folders. When Notion's search was cut at 10,000 results, the answer says so in `missing`.
