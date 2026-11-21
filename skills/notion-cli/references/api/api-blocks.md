<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Blocks

## `notion api delete-a-block [options]`

- What: Delete a block
- Call: `DELETE /v1/blocks/{block_id}`, effect: destructive

| Flag | Required | What |
|---|---|---|
| `--block-id <value>` | yes | block\_id |

## `notion api get-block-children [options]`

- What: Retrieve block children
- Call: `GET /v1/blocks/{block_id}/children`, effect: read

| Flag | Required | What |
|---|---|---|
| `--block-id <value>` | yes | block\_id |
| `--start-cursor <value>` | no | start\_cursor |
| `--page-size <value>` | no | page\_size |

## `notion api patch-block-children [options]`

- What: Append block children
- Call: `PATCH /v1/blocks/{block_id}/children`, effect: write
- Body: `PatchBlockChildrenRequest`, required

| Flag | Required | What |
|---|---|---|
| `--block-id <value>` | yes | block\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api retrieve-a-block [options]`

- What: Retrieve a block
- Call: `GET /v1/blocks/{block_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--block-id <value>` | yes | block\_id |

## `notion api update-a-block [options]`

- What: Update a block
- Call: `PATCH /v1/blocks/{block_id}`, effect: write
- Body: `UpdateABlockRequest`, required

| Flag | Required | What |
|---|---|---|
| `--block-id <value>` | yes | block\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
