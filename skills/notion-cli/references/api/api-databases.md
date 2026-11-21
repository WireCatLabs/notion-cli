<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Databases

## `notion api create-database [options]`

- What: Create a database
- Call: `POST /v1/databases`, effect: write
- Body: `CreateDatabaseRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api retrieve-database [options]`

- What: Retrieve a database
- Call: `GET /v1/databases/{database_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--database-id <value>` | yes | database\_id |

## `notion api update-database [options]`

- What: Update a database
- Call: `PATCH /v1/databases/{database_id}`, effect: write
- Body: `UpdateDatabaseRequest`, required

| Flag | Required | What |
|---|---|---|
| `--database-id <value>` | yes | database\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
