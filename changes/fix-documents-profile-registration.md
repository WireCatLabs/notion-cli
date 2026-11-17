### Fixed

- **A search hit from Notion names `notion` and the profile.** `memo search` and `search all` showed a Notion page as
  `provider: notes` with the store's account number, and the tree label showed raw ids, because notion never said
  which account its profile is. A sync now records it through cli-core's documents engine.
- **The workspace root and databases stay out of search.** They are catalog entries, not pages: word search, meaning
  search and memo's digest showed them with an empty excerpt, and `documents show` could not open them.
- **An agent's `relationships add` is saved.** It is written unconfirmed for the owner, who confirms it by adding the
  same relationship or rejects it by removing it. It used to write nothing.
- **A sync cut inside Notion's own pass says to sync again.** When a slow listing reached the deadline, its cursor
  waited on the sync's pending plan, where notion did not look: the answer said `complete: false` with no step to run
  next, and `status` gave a total as if the pass were planned. notion now reads that cursor too.
- cli-core 0.687.0 (was 0.680.0), cli-base 0.109.0 (was 0.106.0).
