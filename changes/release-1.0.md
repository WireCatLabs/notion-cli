### Changed — may break callers

- **Built on cli-core 1.0.0 and cli-base 1.0.0.** The generated API files read their types from
  `@wirecat/cli-base/codegen/runtime`, and the store types from `@wirecat/cli-core/store/areas`. Store version 73 comes
  with cli-core 1.0: once a 1.0 tool opens the store, a 0.x tool refuses it, so upgrade every WireCat CLI together.
- **Over MCP, a call that names a credential file or a WireCat folder now answers `permission_error`**
  (`access.denied`), checked by cli-core before the command runs. It answered `validation_error` before.
