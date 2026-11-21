<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Comments

## `notion api create-a-comment [options]`

- What: Create a comment
- Call: `POST /v1/comments`, effect: write
- Body: `CreateACommentRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api delete-a-comment [options]`

- What: Delete a comment
- Call: `DELETE /v1/comments/{comment_id}`, effect: destructive

| Flag | Required | What |
|---|---|---|
| `--comment-id <value>` | yes | comment\_id |

## `notion api list-comments [options]`

- What: List comments
- Call: `GET /v1/comments`, effect: read

| Flag | Required | What |
|---|---|---|
| `--block-id <value>` | yes | block\_id |
| `--start-cursor <value>` | no | start\_cursor |
| `--page-size <value>` | no | page\_size |

## `notion api retrieve-comment [options]`

- What: Retrieve a comment
- Call: `GET /v1/comments/{comment_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--comment-id <value>` | yes | comment\_id |

## `notion api update-a-comment [options]`

- What: Update a comment
- Call: `PATCH /v1/comments/{comment_id}`, effect: write
- Body: `UpdateACommentRequest`, required

| Flag | Required | What |
|---|---|---|
| `--comment-id <value>` | yes | comment\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
