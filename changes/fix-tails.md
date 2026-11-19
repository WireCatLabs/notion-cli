### Changed

- **`api` is cli-core's shared group, as in attio, linear and hubspot.** The commands, their names and their keys stay
  the same: each write asks or refuses by `api.<operation>`, and a call that deletes, by its method or its body, also
  by `documents.delete`. Which calls delete now comes from the generated manifest, plus four body rules notion keeps
  itself. A fix to the group in cli-core now reaches notion with a version bump.
- cli-core 0.707.0 (was 0.687.0), cli-base 0.124.0 (was 0.109.0).
