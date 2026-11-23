### Added

- **Notion AI meeting notes in WireCat's meetings.** `notion <profile> meetings sync` copies the meeting notes of the
  meetings the token's user attended, with attendees, the AI summary, the notes and the transcript, into the shared
  store beside Zoom calls. `meetings list`, `show`, `transcript`, `summary`, `export` and `people` read them offline,
  and `search all` finds them. A summary Notion writes after the meeting is read at the next sync. Notion documents
  no line format for a transcript, so its lines are kept as written, with no speaker or time. Why: the owner's
  meetings in Notion were not with the others ([docs/dev/DESIGN.md](../docs/dev/DESIGN.md#meeting-notes)).

### Changed — may break callers

- **Uses `@wirecat/cli-base` 0.130.0**, whose vocabulary has the `summary` and `people` views of the shared meetings
  commands.
