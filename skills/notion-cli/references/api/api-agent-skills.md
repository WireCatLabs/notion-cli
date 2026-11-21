<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Agent Skills

## `notion api get-plugin-directory [options]`

- What: Get a plugin directory
- Call: `GET /v1/ai/plugins/{id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--id <value>` | yes | id |

## `notion api get-skill-directory [options]`

- What: Get a skill directory
- Call: `GET /v1/ai/skills/{id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--id <value>` | yes | id |

## `notion api list-skills-plugins [options]`

- What: List skills plugins
- Call: `GET /v1/ai/plugins`, effect: read

| Flag | Required | What |
|---|---|---|
| `--page-size <value>` | no | page\_size |
| `--start-cursor <value>` | no | start\_cursor |
