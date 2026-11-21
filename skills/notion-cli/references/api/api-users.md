<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Users

## `notion api get-self`

- What: Retrieve your token's bot user
- Call: `GET /v1/users/me`, effect: read

## `notion api get-user [options]`

- What: Retrieve a user
- Call: `GET /v1/users/{user_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--user-id <value>` | yes | user\_id |

## `notion api get-users [options]`

- What: List all users
- Call: `GET /v1/users`, effect: read

| Flag | Required | What |
|---|---|---|
| `--start-cursor <value>` | no | start\_cursor |
| `--page-size <value>` | no | page\_size |
