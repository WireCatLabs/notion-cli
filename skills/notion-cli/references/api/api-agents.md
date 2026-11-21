<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: Agents

## `notion api agent-batch [options]`

- What: Apply many agent operations
- Call: `POST /v1/agents/batch`, effect: write
- Body: `AgentBatchRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api delete-agent [options]`

- What: Delete agent
- Call: `DELETE /v1/agents/{agent_id}`, effect: destructive

| Flag | Required | What |
|---|---|---|
| `--agent-id <value>` | yes | agent\_id |

## `notion api get-agent [options]`

- What: Get agent
- Call: `GET /v1/agents/{agent_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--agent-id <value>` | yes | agent\_id |
| `--verbose <value>` | no | verbose |

## `notion api get-agent-insights [options]`

- What: Get agent insights
- Call: `GET /v1/agents/{agent_id}/insights`, effect: read

| Flag | Required | What |
|---|---|---|
| `--agent-id <value>` | yes | agent\_id |
| `--start-time <value>` | no | start\_time |
| `--end-time <value>` | no | end\_time |

## `notion api query-agents [options]`

- What: Query agents
- Call: `POST /v1/agents/query`, effect: read
- Body: `QueryAgentsRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api update-agent [options]`

- What: Update agent
- Call: `PATCH /v1/agents/{agent_id}`, effect: write
- Body: `UpdateAgentRequest`, required

| Flag | Required | What |
|---|---|---|
| `--agent-id <value>` | yes | agent\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api update-agent-credit-limit [options]`

- What: Update agent credit limit
- Call: `PATCH /v1/agents/{agent_id}/credit_limit`, effect: write
- Body: `UpdateAgentCreditLimitRequest`, required

| Flag | Required | What |
|---|---|---|
| `--agent-id <value>` | yes | agent\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api update-agent-status [options]`

- What: Update agent status
- Call: `PATCH /v1/agents/{agent_id}/status`, effect: write, deprecated
- Body: `UpdateAgentStatusRequest`, required

| Flag | Required | What |
|---|---|---|
| `--agent-id <value>` | yes | agent\_id |
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |
