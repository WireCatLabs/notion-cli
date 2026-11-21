<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Pages

## `notion api move-page [options]`

- What: Move a page
- Call: `POST /v1/pages/{page_id}/move`, effect: write
- Body: `MovePageRequest`, required

| Flag | Required | What |
|---|---|---|
| `--page-id <value>` | yes | page\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api patch-page [options]`

- What: Update page
- Call: `PATCH /v1/pages/{page_id}`, effect: write
- Body: `PatchPageRequest`, required

| Flag | Required | What |
|---|---|---|
| `--page-id <value>` | yes | page\_id |
| `--filter-properties <value>` | no | filter\_properties |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api post-page [options]`

- What: Create a page
- Call: `POST /v1/pages`, effect: write
- Body: `PostPageRequest`, required

| Flag | Required | What |
|---|---|---|
| `--filter-properties <value>` | no | filter\_properties |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api retrieve-a-page [options]`

- What: Retrieve a page
- Call: `GET /v1/pages/{page_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--page-id <value>` | yes | page\_id |
| `--filter-properties <value>` | no | filter\_properties |

## `notion api retrieve-a-page-property [options]`

- What: Retrieve a page property item
- Call: `GET /v1/pages/{page_id}/properties/{property_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--page-id <value>` | yes | page\_id |
| `--property-id <value>` | yes | property\_id |
| `--start-cursor <value>` | no | start\_cursor |
| `--page-size <value>` | no | page\_size |

## `notion api retrieve-page-markdown [options]`

- What: Retrieve a page as markdown
- Call: `GET /v1/pages/{page_id}/markdown`, effect: read

| Flag | Required | What |
|---|---|---|
| `--page-id <value>` | yes | page\_id |
| `--include-transcript <value>` | no | include\_transcript |
| `--markdown-version <value>` | no | markdown\_version |

## `notion api update-page-markdown [options]`

- What: Update a page's content as markdown
- Call: `PATCH /v1/pages/{page_id}/markdown`, effect: write
- Body: `UpdatePageMarkdownRequest`, required

| Flag | Required | What |
|---|---|---|
| `--page-id <value>` | yes | page\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
