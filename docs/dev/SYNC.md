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
reads every block that holds others (toggles, columns, lists), since a child page can sit inside one. A child page
comes from its `child_page` block, which names its id, title, times and authors
([block](https://developers.notion.com/reference/block)), so a page of 100 children costs one request, not 101. A
page under a page has only its title for properties, so nothing is lost. The block has no link, so the page gets
Notion's own form, `https://app.notion.com/p/{page-id}`, until its text is read and the page's link replaces it
([versioning](https://developers.notion.com/reference/versioning) names that form and says links are "for people to
open, not stable identifiers"). A child database is still read on its own, for its data sources.

The live check (`scripts/live.sh`) compares a `child_page` block with its page, so the test page needs at least one
page under it. It warns, and does not fail, when the block's `last_edited_time` differs from the page's: then a walk
sends such pages again each day, which costs work and loses nothing. It also warns when `has_children` does not match
what the page holds: the walk skips the listing of a child page whose block says it has no children and under which
the sync holds nothing.

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
3. **Every 24 hours, a full walk** instead of step 2. It lists the top of the workspace from search, one page of
   results at a time, the children of every page, and every row of every database by query. The known top-level
   pages search did not show are read directly at the end. `sync --rescan` walks at once.
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
`notion.child-unreadable` for a linked database view. An answer with issues says `meta.complete: false` and exits 0:
the rest was synced, and the next sync is likely to leave the same item out. cli-core's shared `sync` declares
`partial` (WC-OUT-7).

## Bounds and errors

- One sync makes at most 2,000 requests while it looks for changes. Then it saves where it stopped, and the next
  sync goes on. Saving the pages has its own bound, `sync --limit`.
- **A walk goes on over several syncs.** cli-core's engine asks the run's budget before each listing and each page
  it reads. The budget comes from the run's deadline, at about 2 s a step. Since cli-core 0.671.0 the shared `sync`
  is cooperative: its deadline is 15 minutes in a terminal and 45 seconds over MCP, unless `--timeout` sets one. A
  sync that stops answers `complete: false`,
  `stopped` and `walk`, exits 0, and names `sync` as its next step. `--rescan` starts the walk over, so it is run once
  and continued with plain `sync` runs.
- **A folder is listed a page at a time** (cli-core's `childrenPage`). A database gives a page of rows a step, read
  from the last row's minute on; a page gives a page of its blocks a step. The engine keeps the position in its walk
  file (`listing` in a stack entry), so a first sync of a database of any size moves on in every run, also over MCP's
  45 seconds. Known children a page did not show are read directly before any counts as gone: for rows, those
  created within the span the page covered; for a page, those missing once its last block is listed. Notion answers
  400 `validation_error` to a `start_cursor` it no longer takes. When the request sent with the saved
  `start_cursor` gets it, the answer becomes `not_found` (`notion.listing-stale`), and the engine lists the folder
  again from its first page and drops nothing. Any other 400 is an ordinary error, such as a block inside the page
  whose children Notion cannot list. A folder that goes stale a second time in one run fails with the 400 too, so it
  cannot be listed again forever. The workspace itself is still one listing: search has no order to resume by.
- **A pass stops before the run's deadline.** Each step of the pass costs one request: one page of a search, one
  database, one page of rows, one page of a page's blocks, or one direct read. A step that needs a page's container
  may read it too, and keeps what it read. Before each request the source checks that the slowest request so far,
  plus cli-core's margin (`deadlineMargin`), still fits before the deadline. If not, it saves the step it reached in
  the position. The answer then says `complete: false` and names `sync` (with the same `--timeout`) as its next
  step, and the next sync goes on from that step. This holds for the hourly pass and for the daily walk. A run that
  could keep nothing fails with `timeout` (`notion.timeout-too-short`) instead of asking for the same run again; run
  it with a longer `--timeout`.
  - Rows go a page at a time. The next page is read from the last row's minute on, as Notion rounds `created_time`
    to the minute. Only when a whole page of rows shares one minute does the step go on by the query's own position.
  - A saved position Notion no longer takes (a 400) starts that search or listing again from its top, with a
    `notion.listing-restarted` warning.
- **The change feed names each changed page.** A round of changes lists only the direct children of a page the feed
  names, so the feed names every page and row that changed, not only an ancestor (checked by cli-core's
  `documentSourceContract`, `addNested`). A page new to the scope is walked in full.
- **One item Notion refuses** (403, or 404 for a database search still lists, or a linked database view) is left
  out of that sync with a warning. The sync goes on with the rest. This holds for the blocks inside a page too, at
  any depth: a synced block whose original is not shared with the token answers 404 for its children. That block is
  skipped with a `notion.left-out` warning, and the rest of the page is read. The pages the sync holds under a
  skipped block are read one by one instead. A block Notion answers 403 for while the page's Markdown is read is
  skipped the same way, with a warning, and the page keeps the rest of its text. A data source of a database that
  Notion will not query (404 or 403) is left out with a warning; the database's other data sources still sync. In
  the daily walk the rows already held are read one by one before any counts as gone; in the engine's walk (a first
  sync or `--rescan`) they are kept as they are. A data source its database no longer lists takes its rows out of the
  local copy on the next sync that reads the database, and search, which still finds them, does not bring them
  back; when Notion will not show the database (403), they stay.
- **Only a 404 or the trash removes.** A 403 on a page or a database the sync holds keeps it and its rows as they
  were, with a `notion.kept-unconfirmed` warning: a 403 says nothing about whether the item is still there.
- **A failure partway** (a 429 after the client's retries, Notion down) ends the pass early. The work done is
  kept, a warning names the failure and the wait Notion asked for, and the next sync goes on from that step. When
  nothing was done yet, the sync fails with that error (`rate_limited` and the wait), and the position does not
  move.
- **Search cut short while it looks for edits** (more than 10,000 edited since the mark) fails the sync. Search has
  no time filter to split the question by, so going on would quietly miss edits.

## The search index

At the end of a sync cli-core's engine indexes the words of what it wrote, so a read-only search finds a page by the
words of its text right after the sync. Reads open the store read-only.

## Secrets

Notion's own file links are signed and open the file for an hour. The sync drops the signature from every link in
the text and in the properties, so it is never stored. That includes Notion's image links, which carry the signed
link inside their own address. The part kept still shows which file it was. This also stops a page from looking
changed on every sync, because Notion signs the link again on each read.
