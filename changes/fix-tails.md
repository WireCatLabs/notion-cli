### Changed

- **`api` is cli-core's shared group, as in attio, linear and hubspot.** The commands, their names and their keys stay
  the same: each write asks or refuses by `api.<operation>`, and a call that deletes, by its method or its body, also
  by `documents.delete`. Which calls delete now comes from the generated manifest, plus four body rules notion keeps
  itself. A fix to the group in cli-core now reaches notion with a version bump.
- cli-core 0.707.0 (was 0.687.0), cli-base 0.124.0 (was 0.109.0).

### Fixed

- **A first sync reads each Notion page once instead of three times.** The walk asked Notion for each page's kind,
  and every page read asked again for its parent page. notion now keeps what one run has already seen, also from the
  walk and the plan an earlier run saved. A page with 60 pages under it took 182 page requests and now takes 61, so a
  big workspace syncs about twice as fast under Notion's limit of about three requests a second.
