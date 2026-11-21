<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Views

## `notion api create-view [options]`

- What: Create a view
- Call: `POST /v1/views`, effect: write
- Body: `CreateViewRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api create-view-query [options]`

- What: Create a view query
- Call: `POST /v1/views/{view_id}/queries`, effect: read
- Body: `CreateViewQueryRequest`, required

| Flag | Required | What |
|---|---|---|
| `--view-id <value>` | yes | view\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api delete-view [options]`

- What: Delete a view
- Call: `DELETE /v1/views/{view_id}`, effect: destructive

| Flag | Required | What |
|---|---|---|
| `--view-id <value>` | yes | view\_id |

## `notion api delete-view-query [options]`

- What: Delete a view query
- Call: `DELETE /v1/views/{view_id}/queries/{query_id}`, effect: destructive

| Flag | Required | What |
|---|---|---|
| `--view-id <value>` | yes | view\_id |
| `--query-id <value>` | yes | query\_id |

## `notion api get-view-query-results [options]`

- What: Get view query results
- Call: `GET /v1/views/{view_id}/queries/{query_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--view-id <value>` | yes | view\_id |
| `--query-id <value>` | yes | query\_id |
| `--start-cursor <value>` | no | start\_cursor |
| `--page-size <value>` | no | page\_size |

## `notion api list-views [options]`

- What: List views
- Call: `GET /v1/views`, effect: read

| Flag | Required | What |
|---|---|---|
| `--database-id <value>` | no | database\_id |
| `--data-source-id <value>` | no | data\_source\_id |
| `--start-cursor <value>` | no | start\_cursor |
| `--page-size <value>` | no | page\_size |

## `notion api retrieve-a-view [options]`

- What: Retrieve a view
- Call: `GET /v1/views/{view_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--view-id <value>` | yes | view\_id |

## `notion api update-a-view [options]`

- What: Update a view
- Call: `PATCH /v1/views/{view_id}`, effect: write
- Body: `UpdateViewRequest`, required

| Flag | Required | What |
|---|---|---|
| `--view-id <value>` | yes | view\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
