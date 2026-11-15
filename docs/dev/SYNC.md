# How notion keeps its copy up to date

Notion has no feed of changes. Its search does not promise to return everything, and its index lags behind edits
([search limitations](https://developers.notion.com/reference/search-optimizations-and-limitations)). This page says
how `notion sync` still finds edits, new pages and deleted pages, how late it can be, and what it cannot do yet.

The code is in `src/sync/`. It is a `DocumentSource` for cli-core's sync engine (`syncDocuments`), which saves the
pages, keeps the checkpoint and resumes a cut batch. The reads it needs from Notion are in `src/notion/reads.ts`.

## What is synced

- With no folder chosen: everything the token sees. The sync puts it under one folder that stands for the
  workspace (`notion-workspace`).
- With folders chosen (`folders add`): only those pages and databases, and everything under them.
- A page is a folder and a document at once: the engine lists its children and saves its text (cli-core's
  `isDocument`). A database is a folder, and each of its rows is a document. A row is a plain file, so the
  children of a row are not listed. A row's properties become its front matter, and also lines of its searchable
  text, `Status: Done`.
- A page whose parent the token cannot see is filed at the top of the workspace.

**The cost of pages as folders.** The engine lists the children of every folder it is sent. So a page is sent
again only when Notion changed it, and a full walk asks for each page's children once. Listing a page's children
reads every block that holds others (toggles, columns, lists), since a child page can sit inside one.

## The position between syncs

After each sync the engine keeps an opaque position (the cursor). It holds:

- **The mark**: the newest `last_edited_time` search showed at the start of the last finished pass. It is
  Notion's time.
- **The time of the last full walk**, by this computer's clock. It only decides when the next walk is due.
- **The data sources in scope**, because search may not list a database again.
- **An unfinished pass**, if the last one stopped early: the steps left, so the next sync goes on from there.

## One sync, step by step

1. **Search.** Pages and data sources, newest edit first, until the results are older than the mark minus the
   overlap (ten minutes by default, never under two).
   - Notion rounds `last_edited_time` to the minute
     ([changelog](https://developers.notion.com/changelog/last-edited-time-is-now-rounded-to-the-nearest-minute);
     not yet checked against the live API). The overlap covers that rounding, a small clock difference, and a
     short delay in search's index.
   - A new database is handed to the engine, which reads all its rows. With folders chosen, a database outside
     them is not read.
2. **Each database in scope**, queried for rows edited on or after the mark minus the overlap
   ([timestamp filter](https://developers.notion.com/reference/filter-data-source-entries)). This does not depend on
   search, so a row search misses is still found.
3. **Every 24 hours, a full walk** instead of step 2. It lists the top of the workspace from search, the children
   of every page, and every row of every database by query. `sync --rescan` walks at once.
4. **Before anything is removed**, the sync asks Notion for it directly
   ([retrieve a page](https://developers.notion.com/reference/retrieve-a-page)). It is removed only when Notion
   answers that it is in the trash, or answers 404 (deleted, or no longer shared with the token). A page that is
   still there is kept, or moved to where it now sits. When Notion answers 403, the page is kept as it was.
5. **The mark moves** only when the whole pass is done. It moves to the newest edit search showed when the pass
   began, so an edit made during a long pass is read again by the next one.

## Two traps and how they are handled

- **Two edits in the same minute.** Notion may give both the same `last_edited_time`. A page read less than three
  minutes after its last edit, by Notion's clock, is marked as "not settled", and the next sync reads it again.
  Notion's clock is the `Date` header of its answers. Without one, the sync uses the newest edit time Notion has
  shown, which is never later than Notion's clock. It never uses this computer's clock, which can be minutes off.
  When the text has not changed, the engine counts the page as unchanged and writes nothing.
- **Large databases.** A query stops at 10,000 rows and says so
  ([query a data source](https://developers.notion.com/reference/query-a-data-source)). The sync reads rows in
  `created_time` order. When a query is cut, it starts the next one at the last row's creation minute and drops
  the rows it already has. There is no limit on the total. If more than 10,000 rows were created in one minute,
  the sync stops with an error that names the database instead of looping.

## What is caught, and how late

| Change | Found by | Late by at most |
| --- | --- | --- |
| A database row is edited or added | the database query | the next sync |
| A top-level page is edited or added, and search has indexed it | search | the next sync |
| A page is edited, and search indexes it within the overlap | search | the sync after indexing |
| A page is edited, and search indexes it later than the overlap | the full walk | 24 hours, or `--rescan` |
| A page or row is moved to the trash, deleted, or unshared | the full walk and a direct read | 24 hours, or `--rescan` |
| A page is moved | the full walk; search too, if a move changes `last_edited_time` (not checked) | 24 hours |
| A new database | search, or the full walk | the next sync, or 24 hours |

What the sync does not promise:

- The children of a database row: a row is not listed as a folder.
- In the default scope, the top of the walk comes from search. A top-level page that search has never returned
  and the sync has never held is found only once search returns it.
- Search counts database rows as pages and stops at 10,000 results. In a workspace with more pages and rows than
  that, the walk sees only the 10,000 most recently edited. It says so in a warning, and goes on: rows still come
  by query, and every page the sync holds is still checked directly. A top-level page older than those 10,000
  that the sync never held is found once it is edited.
- A block the token may not see stays out of the text. Notion lists those blocks with the cut ones and does not
  say which is which, so each is asked for once and counted when Notion refuses it.

## Warnings in the answer

Each item or step the source leaves out calls `warn`. `sync` answers every warning in `item.warnings`, with the id
and the words, and once per kind in `meta.issues` (`code`, `reason`, `source: notion`), such as
`notion.child-unreadable` for a linked database view. An answer with issues says `meta.complete: false`: the rest
was synced, and the next sync is likely to leave the same item out.

`sync` should then exit 0, as a command that declares `partial` does (WC-OUT-7). Today it exits with the first
issue's code, 6 for `not_found`. `partial` belongs to cli-core's shared `sync` command, and the shared contract does
not let notion add it.

## Bounds and errors

- One sync makes at most 2,000 requests while it looks for changes. Then it saves where it stopped, and the next
  sync goes on. Saving the pages has its own bound, `sync --limit`.
- **One item Notion refuses** (403, or 404 for a database search still lists, or a linked database view) is left
  out of that sync with a warning. The sync goes on with the rest. This holds for the blocks inside a page too: when
  Notion will not list them, the pages the sync holds under it are read one by one instead.
- **Only a 404 or the trash removes.** A 403 on a page or a database the sync holds keeps it and its rows as they
  were, with a `notion.kept-unconfirmed` warning: a 403 says nothing about whether the item is still there.
- **A failure partway** (a 429 after the client's retries, Notion down) ends the pass early. The work done is
  kept, a warning names the failure and the wait Notion asked for, and the next sync goes on from that step. When
  nothing was done yet, the sync fails with that error (`rate_limited` and the wait), and the position does not
  move.
- **Search cut short while it looks for edits** (more than 10,000 edited since the mark) fails the sync. Search has
  no time filter to split the question by, so going on would quietly miss edits.

## Current limits of the shared engine

These are cli-core's to fix. notion does not work around them.

- **`--rescan` starts over each time.** Every run with `--rescan` throws away the walk an earlier run saved. A
  workspace too big for one run is finished by plain `sync` runs after the first `--rescan`.
- **10,000 entries per walk.** One walk stops with an error past 10,000 pages, databases and rows under the chosen
  folders. Choose smaller folders with `folders add` until the cap moves.
- **A changed page is walked again whole.** The engine lists again the whole subtree of every page or database the
  change feed sends. An edit to a page high in the tree costs a request for every page under it.
- **The search index is caught up by hand.** The engine writes pages but leaves their words unindexed until the next
  writable search, so a read-only search found a page by its title only. notion catches the index up at the end of
  every run that writes. cli-core's `drainNoteIndex` is not exported, so it calls `notes.embedded`, which drains
  first.

## Secrets

Notion's own file links are signed and open the file for an hour. The sync drops the signature from every link in
the text and in the properties, so it is never stored. That includes Notion's image links, which carry the signed
link inside their own address. The part kept still shows which file it was. This also stops a page from looking
changed on every sync, because Notion signs the link again on each read.
