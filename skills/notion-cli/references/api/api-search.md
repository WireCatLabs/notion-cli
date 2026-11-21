<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Search

## `notion api post-search [options]`

- What: Search by title
- Call: `POST /v1/search`, effect: read
- Body: `PostSearchRequest`, required

| Flag | Required | What |
|---|---|---|
| `--filter-properties <value>` | no | filter\_properties |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
