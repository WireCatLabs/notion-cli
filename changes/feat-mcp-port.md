### Added

- **WireCat Desktop reads the MCP port and the sign-in from notion itself.** The manifest (`notion --wcat-describe`)
  now names the fixed MCP port 8762 and the token sign-in, with the token passed in `WCNOTION_TOKEN` or on stdin.
  Desktop reads them from the tool and keeps its own list only as a fallback. Built on cli-base 1.2.0.
