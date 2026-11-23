### Added

- **A page's text edited in place, at the version an agent read.** `documents get` answers `sha256`, and
  `documents check <page> --expected-fingerprint <sha256>` says whether the page changed since. `documents update
  <page> --payload '[{"old": "Due Friday", "new": "Due Monday"}]' --expected-fingerprint <sha256>` changes only those
  parts, with Notion's `update_content`. A whole `--text` or `--file` takes `--expected-fingerprint` too. The page is
  read again just before the write, and the write is refused when it changed (`mirror.remote-changed`). Notion has no
  conditional write, so an edit landing after that read is not caught. A part whose old text is not on the page once
  is refused with nothing sent, and a part Notion still reports as not matched makes the answer incomplete. Why: an
  agent could only rewrite a whole page, over anyone's newer edit
  ([docs/dev/DESIGN.md](../docs/dev/DESIGN.md#writes)).
- **Every text write keeps the text it replaced.** The profile's local versions hold it, and the answer names it
  (`replaced.sha256`, `replaced.kept_at`).
- **Earlier versions of every synced page, and a change log.** `documents history <page>` lists the versions the
  syncs kept, and `--revision <n>` shows one. `changes --since 1d` lists the pages added, changed, deleted or no
  longer visible. `keep_versions_for_days` (365 by default) sets how long they are kept. Both are local reads, so an
  agent gets them over MCP too ([docs/dev/SYNC.md](../docs/dev/SYNC.md)).

### Fixed

- **A page answered with 404 is no longer visible, not deleted.** Notion gives a 404 for a deleted page and for one
  no longer shared with the connection. Such a page leaves lists and search, keeps its text in the local copy, and
  comes back as it was when Notion shows it again. Only a page in Notion's trash counts as deleted.

### Changed — may break callers

- **Uses `@wirecat/cli-core` 0.724.0 and `@wirecat/cli-base` 0.129.0.**
