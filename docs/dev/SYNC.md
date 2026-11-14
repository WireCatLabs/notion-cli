# How notion keeps its copy up to date

Notion has no feed of changes. Its search does not promise to return everything, and its index lags behind edits
([search limitations](https://developers.notion.com/reference/search-optimizations-and-limitations)). This page says
how `notion sync` still finds every edit, every new page and every deleted page, and how late it can be.

The code is in `src/sync/`. It is a `DocumentSource` for cli-core's sync engine (`syncDocuments`), which saves the
pages, keeps the checkpoint and resumes a cut batch. The reads it needs from Notion are in `src/notion/reads.ts`.

## What is synced

- With no folder chosen: everything the token sees. The sync puts it under one folder that stands for the
  workspace (`notion-workspace`).
- With folders chosen (`folders add`): only those pages and databases and what is under them.
- A page is a document. A database is a folder, and each of its rows is a document. A row's properties become its
  front matter, and also lines of its searchable text, `Status: Done`.
- A page that sits inside a column or a toggle is filed under the page that holds that block.
- A page whose parent the token cannot see is filed at the top of the workspace.

## The position between syncs

After each sync the engine keeps an opaque position (the cursor). It holds:

- **The mark**: the newest `last_edited_time` seen at the start of the last finished pass. The time comes from
  Notion, never from this computer's clock.
- **The time of the last full walk**, by this computer's clock.
- **The data sources in scope**, because search may not list a database again.
- **An unfinished pass**, if the last one stopped at its request bound: the steps left, so the next sync goes on
  from there.

## One sync, step by step

1. **Search.** Pages and data sources, newest edit first, until the results are older than the mark minus the
   overlap (ten minutes by default, never under two).
   - Notion rounds `last_edited_time` to the minute
     ([changelog](https://developers.notion.com/changelog/last-edited-time-is-now-rounded-to-the-nearest-minute);
     not yet checked against the live API). The overlap covers that rounding, a small clock difference, and a
     short delay in search's index.
   - A page that comes back in the trash is removed.
   - A new database is handed to the engine, which reads all its rows.
2. **Each database in scope**, queried for rows edited on or after the mark minus the overlap
   ([timestamp filter](https://developers.notion.com/reference/filter-data-source-entries)). This does not depend on
   search, so a row search misses is still found.
3. **Every 24 hours, a full walk** instead of step 2. It lists the children of every page and every row of every
   database ([block children](https://developers.notion.com/reference/get-block-children)). `sync --rescan` walks
   at once.
4. **Before anything is removed**, the sync asks Notion for it directly
   ([retrieve a page](https://developers.notion.com/reference/retrieve-a-page)). It is removed only when Notion
   answers that it is in the trash, or answers 404 (deleted, or no longer shared with the token). A page that is
   still there is kept, or moved to where it now sits.
5. **The mark moves** only when the whole pass is done. It moves to the newest edit search showed when the pass
   began, so an edit made during a long pass is read again by the next one.

## Two traps and how they are handled

- **Two edits in the same minute.** Notion may give both the same `last_edited_time`. A page read less than three
  minutes after its last edit is marked as "not settled", and the next sync reads it again. When the text has not
  changed, the engine counts it as unchanged and writes nothing.
- **Large databases.** A query stops at 10,000 rows and says so
  ([query a data source](https://developers.notion.com/reference/query-a-data-source)). The sync reads rows in
  `created_time` order. When a query is cut, it starts the next one at the last row's creation minute and drops
  the rows it already has. There is no limit on the total. If more than 10,000 rows were created in one minute,
  the sync stops with an error that names the database instead of looping.

## What is caught, and how late

| Change | Found by | Late by at most |
| --- | --- | --- |
| A database row is edited or added | the database query | the next sync |
| A page is edited or added, and search has indexed it | search | the next sync |
| A page is edited, and search indexes it within the overlap | search | the sync after indexing |
| A page is edited, and search indexes it later than the overlap | the full walk | 24 hours, or `--rescan` |
| A page or row is moved to the trash, deleted, or unshared | the full walk and a direct read | 24 hours, or `--rescan` |
| A page is moved | the full walk; search too, if a move changes `last_edited_time` (not checked) | 24 hours |
| A new database | search, or the full walk | the next sync, or 24 hours |

What the sync does not promise:

- In the default scope, the top of the walk comes from search. A top-level page that search has never returned
  and the sync has never held is found only once search returns it. Everything under a page the sync holds is
  read in full.
- Child pages of database rows are not walked.
- A block the token may not see stays out of the text. Notion lists those blocks with the cut ones and does not
  say which is which, so each is asked for once and counted when Notion refuses it.

## Bounds and errors

- One sync makes at most 2,000 requests while it looks for changes. Then it saves where it stopped, and the next
  sync goes on. Saving the pages has its own bound, `sync --limit`.
- When Notion answers 429 and the client's retries run out, the sync stops with `rate_limited` and the wait Notion
  asked for. Nothing is lost. The position does not move, and the next sync repeats the step.

## Secrets

Notion's own file links are signed and open the file for an hour. The sync drops the signature from every link in
the text and in the properties, so it is never stored. The part kept still shows which file it was. This also
stops a page from looking changed on every sync, because Notion signs the link again on each read.
