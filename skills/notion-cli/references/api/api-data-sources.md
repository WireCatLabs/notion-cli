<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Data sources

## `notion api create-a-database [options]`

- What: Create a data source
- Call: `POST /v1/data_sources`, effect: write
- Body: `CreateADatabaseRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api list-data-source-templates [options]`

- What: List templates in a data source
- Call: `GET /v1/data_sources/{data_source_id}/templates`, effect: read

| Flag | Required | What |
|---|---|---|
| `--data-source-id <value>` | yes | data\_source\_id |
| `--name <value>` | no | name |
| `--start-cursor <value>` | no | start\_cursor |
| `--page-size <value>` | no | page\_size |

## `notion api post-database-query [options]`

- What: Query a data source
- Call: `POST /v1/data_sources/{data_source_id}/query`, effect: read
- Body: `PostDatabaseQueryRequest`, required

| Flag | Required | What |
|---|---|---|
| `--data-source-id <value>` | yes | data\_source\_id |
| `--filter-properties <value>` | no | filter\_properties |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api retrieve-a-data-source [options]`

- What: Retrieve a data source
- Call: `GET /v1/data_sources/{data_source_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--data-source-id <value>` | yes | data\_source\_id |

## `notion api update-a-data-source [options]`

- What: Update a data source
- Call: `PATCH /v1/data_sources/{data_source_id}`, effect: write
- Body: `UpdateADataSourceRequest`, required

| Flag | Required | What |
|---|---|---|
| `--data-source-id <value>` | yes | data\_source\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
