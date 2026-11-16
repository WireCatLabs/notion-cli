### Fixed

- `bin/notion-live` reads the token from the keyring service that `NOTION_LIVE_KEYRING_SERVICE` names. When it is
  unset, the service stays `notion-live`.
