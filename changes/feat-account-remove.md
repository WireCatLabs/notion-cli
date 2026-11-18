### Added

- **`notion <profile> account remove` signs a profile out and forgets it on this computer.** It forgets the Notion
  token, the profile's settings, its chosen pages and its sync checkpoint. `--keep-data` leaves the copied pages in the
  store, where search still finds them; `--delete-data` deletes them. It asks first, or takes `--yes`; `--dry-run` lists
  what it would remove. Why: WireCat Desktop removes an account with this command, and notion could only sign out with
  `session end`. The token itself stays valid at Notion: revoke it on Notion's integrations page.
