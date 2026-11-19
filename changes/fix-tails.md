### Fixed

- **Pages synced before 0.5.0 get their authors and last editors as people without a rescan.** A plain `sync` now
  reads such pages again, 50 a run, and links them to the people who wrote and last edited them. It also does this
  for pages read before the connection could read email addresses, once a sync has seen that it can. It reads no
  other page again. Before, a page got its people only once someone edited it.
- **A first sync reads each Notion page once instead of three times.** The walk asked Notion for each page's kind,
  and every page read asked again for its parent page. notion now keeps what one run has already seen, also from the
  walk and the plan an earlier run saved. A page with 60 pages under it took 182 page requests and now takes 61, which
  counts under Notion's limit of about three requests a second.
- **`api` is cli-core's shared group, as in attio, linear and hubspot.** The commands, their names and their keys stay
  the same: each write asks or refuses by `api.<operation>`, and a call that deletes, by its method or its body, also
  by `documents.delete`. Which calls delete now comes from the generated manifest, plus four body rules notion keeps
  itself. A fix to the group in cli-core now reaches notion with a version bump.
- cli-core 0.707.0 (was 0.687.0), cli-base 0.124.0 (was 0.109.0).
