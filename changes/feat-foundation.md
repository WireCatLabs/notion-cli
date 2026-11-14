### Added

- `session start | status | end | list` with a Notion personal access token or an internal connection's token,
  checked with Notion and kept in the keyring as `token:<profile>`; the account is the workspace and the token's bot.
- `documents get` reads one page live as Markdown, fills a long page's missing parts, and cuts the signature from
  Notion's signed file links. A page that is still not whole answers `meta.complete: false` and exits non-zero.
- `databases list` and `databases show`: the databases the token sees, and each data source's id and properties.
- Requests are paced below Notion's limit, with a slower pace for data source queries, and a refused request is
  waited out for Notion's `Retry-After`; a connection Notion has blocked is not retried.
- The environment variables start with `WCNOTION_` (`WCNOTION_TOKEN`, `WCNOTION_PROFILE`), not `NOTION_`: Notion's own
  MCP server reads `NOTION_TOKEN`, and a token set for it must not sign this tool in.
