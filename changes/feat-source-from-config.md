### Added

- **`wirecat.config.ts` describes the sync's source.** The config names the account, every Notion call the sync
  sends, the API version and both paces. cli-core reads the calls through the same request path as `notion api`.
  Before, these were code over Notion's SDK. A page synced before authors were saved is now read again by cli-core's
  engine, at most 50 a sync, not through a marked version. The same pages are read, with the same limits. One error
  changed: a token whose answer names no workspace now fails with cli-core's `source.no-account`, not
  `notion.no-workspace`. Why: attio and linear already build their sources from a config, and a new documents CLI can
  now do the same ([docs/dev/SYNC.md](../docs/dev/SYNC.md#where-the-requests-come-from)).
