<!--
GENERATED. DO NOT EDIT.
Source: spec/notion/openapi.json, verified by provenance.json
Run: pnpm generate
-->

# Notion API coverage

61 operations from openapi 1.0.0.

| Operation | Call | Command | Effect | Request source | Status | Summary |
|---|---|---|---|---|---|---|
| `get-self` | `GET /v1/users/me` | `notion <profile> api get-self` | read | — | generated | Retrieve your token's bot user |
| `get-user` | `GET /v1/users/{user_id}` | `notion <profile> api get-user` | read | — | generated | Retrieve a user |
| `get-users` | `GET /v1/users` | `notion <profile> api get-users` | read | — | generated | List all users |
| `post-page` | `POST /v1/pages` | `notion <profile> api post-page` | write | contract | generated | Create a page |
| `retrieve-a-page` | `GET /v1/pages/{page_id}` | `notion <profile> api retrieve-a-page` | read | — | generated | Retrieve a page |
| `patch-page` | `PATCH /v1/pages/{page_id}` | `notion <profile> api patch-page` | write | contract | generated | Update page |
| `move-page` | `POST /v1/pages/{page_id}/move` | `notion <profile> api move-page` | write | contract | generated | Move a page |
| `retrieve-a-page-property` | `GET /v1/pages/{page_id}/properties/{property_id}` | `notion <profile> api retrieve-a-page-property` | read | — | generated | Retrieve a page property item |
| `retrieve-page-markdown` | `GET /v1/pages/{page_id}/markdown` | `notion <profile> api retrieve-page-markdown` | read | — | generated | Retrieve a page as markdown |
| `update-page-markdown` | `PATCH /v1/pages/{page_id}/markdown` | `notion <profile> api update-page-markdown` | write | contract | generated | Update a page's content as markdown |
| `retrieve-async-task` | `GET /v1/async_tasks/{task_id}` | `notion <profile> api retrieve-async-task` | read | — | generated | Retrieve an async task |
| `retrieve-a-block` | `GET /v1/blocks/{block_id}` | `notion <profile> api retrieve-a-block` | read | — | generated | Retrieve a block |
| `update-a-block` | `PATCH /v1/blocks/{block_id}` | `notion <profile> api update-a-block` | write | contract | generated | Update a block |
| `delete-a-block` | `DELETE /v1/blocks/{block_id}` | `notion <profile> api delete-a-block` | destructive | — | generated | Delete a block |
| `get-block-children` | `GET /v1/blocks/{block_id}/children` | `notion <profile> api get-block-children` | read | — | generated | Retrieve block children |
| `patch-block-children` | `PATCH /v1/blocks/{block_id}/children` | `notion <profile> api patch-block-children` | write | contract | generated | Append block children |
| `retrieve-a-data-source` | `GET /v1/data_sources/{data_source_id}` | `notion <profile> api retrieve-a-data-source` | read | — | generated | Retrieve a data source |
| `update-a-data-source` | `PATCH /v1/data_sources/{data_source_id}` | `notion <profile> api update-a-data-source` | write | contract | generated | Update a data source |
| `post-database-query` | `POST /v1/data_sources/{data_source_id}/query` | `notion <profile> api post-database-query` | read | contract | generated | Query a data source |
| `create-a-database` | `POST /v1/data_sources` | `notion <profile> api create-a-database` | write | contract | generated | Create a data source |
| `list-data-source-templates` | `GET /v1/data_sources/{data_source_id}/templates` | `notion <profile> api list-data-source-templates` | read | — | generated | List templates in a data source |
| `retrieve-database` | `GET /v1/databases/{database_id}` | `notion <profile> api retrieve-database` | read | — | generated | Retrieve a database |
| `update-database` | `PATCH /v1/databases/{database_id}` | `notion <profile> api update-database` | write | contract | generated | Update a database |
| `create-database` | `POST /v1/databases` | `notion <profile> api create-database` | write | contract | generated | Create a database |
| `post-search` | `POST /v1/search` | `notion <profile> api post-search` | read | contract | generated | Search by title |
| `list-comments` | `GET /v1/comments` | `notion <profile> api list-comments` | read | — | generated | List comments |
| `create-a-comment` | `POST /v1/comments` | `notion <profile> api create-a-comment` | write | contract | generated | Create a comment |
| `retrieve-comment` | `GET /v1/comments/{comment_id}` | `notion <profile> api retrieve-comment` | read | — | generated | Retrieve a comment |
| `update-a-comment` | `PATCH /v1/comments/{comment_id}` | `notion <profile> api update-a-comment` | write | contract | generated | Update a comment |
| `delete-a-comment` | `DELETE /v1/comments/{comment_id}` | `notion <profile> api delete-a-comment` | destructive | — | generated | Delete a comment |
| `list-file-uploads` | `GET /v1/file_uploads` | `notion <profile> api list-file-uploads` | read | — | generated | List file uploads |
| `create-file` | `POST /v1/file_uploads` | `notion <profile> api create-file` | write | contract | generated | Create a file upload |
| `complete-file-upload` | `POST /v1/file_uploads/{file_upload_id}/complete` | `notion <profile> api complete-file-upload` | write | — | generated | Complete a multi-part file upload |
| `retrieve-file-upload` | `GET /v1/file_uploads/{file_upload_id}` | `notion <profile> api retrieve-file-upload` | read | — | generated | Retrieve a file upload |
| `list-custom-emojis` | `GET /v1/custom_emojis` | `notion <profile> api list-custom-emojis` | read | — | generated | List custom emojis |
| `list-views` | `GET /v1/views` | `notion <profile> api list-views` | read | — | generated | List views |
| `create-view` | `POST /v1/views` | `notion <profile> api create-view` | write | contract | generated | Create a view |
| `retrieve-a-view` | `GET /v1/views/{view_id}` | `notion <profile> api retrieve-a-view` | read | — | generated | Retrieve a view |
| `update-a-view` | `PATCH /v1/views/{view_id}` | `notion <profile> api update-a-view` | write | contract | generated | Update a view |
| `delete-view` | `DELETE /v1/views/{view_id}` | `notion <profile> api delete-view` | destructive | — | generated | Delete a view |
| `create-view-query` | `POST /v1/views/{view_id}/queries` | `notion <profile> api create-view-query` | read | contract | generated | Create a view query |
| `get-view-query-results` | `GET /v1/views/{view_id}/queries/{query_id}` | `notion <profile> api get-view-query-results` | read | — | generated | Get view query results |
| `delete-view-query` | `DELETE /v1/views/{view_id}/queries/{query_id}` | `notion <profile> api delete-view-query` | destructive | — | generated | Delete a view query |
| `create-meeting-note` | `POST /v1/blocks/meeting_notes` | `notion <profile> api create-meeting-note` | write | contract | generated | Create a meeting note |
| `query-meeting-notes` | `POST /v1/blocks/meeting_notes/query` | `notion <profile> api query-meeting-notes` | read | contract | generated | Query meeting notes |
| `query-agents` | `POST /v1/agents/query` | `notion <profile> api query-agents` | read | contract | generated | Query agents |
| `get-agent` | `GET /v1/agents/{agent_id}` | `notion <profile> api get-agent` | read | — | generated | Get agent |
| `update-agent` | `PATCH /v1/agents/{agent_id}` | `notion <profile> api update-agent` | write | contract | generated | Update agent |
| `delete-agent` | `DELETE /v1/agents/{agent_id}` | `notion <profile> api delete-agent` | destructive | — | generated | Delete agent |
| `get-agent-insights` | `GET /v1/agents/{agent_id}/insights` | `notion <profile> api get-agent-insights` | read | — | generated | Get agent insights |
| `update-agent-status` | `PATCH /v1/agents/{agent_id}/status` | `notion <profile> api update-agent-status` | write | contract | deprecated | Update agent status |
| `update-agent-credit-limit` | `PATCH /v1/agents/{agent_id}/credit_limit` | `notion <profile> api update-agent-credit-limit` | write | contract | generated | Update agent credit limit |
| `agent-batch` | `POST /v1/agents/batch` | `notion <profile> api agent-batch` | write | contract | generated | Apply many agent operations |
| `list-skills-plugins` | `GET /v1/ai/plugins` | `notion <profile> api list-skills-plugins` | read | — | generated | List skills plugins |
| `get-plugin-directory` | `GET /v1/ai/plugins/{id}` | `notion <profile> api get-plugin-directory` | read | — | generated | Get a plugin directory |
| `get-skill-directory` | `GET /v1/ai/skills/{id}` | `notion <profile> api get-skill-directory` | read | — | generated | Get a skill directory |
| `update-session` | `POST /v1/sessions` | `notion <profile> api update-session` | write | contract | generated | Update a session |
| `retrieve-session` | `GET /v1/sessions/{session_id}` | `notion <profile> api retrieve-session` | read | — | generated | Retrieve a session |
| `query-sessions` | `POST /v1/sessions/query` | `notion <profile> api query-sessions` | read | contract | generated | Query sessions |
| `query-session-events` | `POST /v1/sessions/{session_id}/events/query` | `notion <profile> api query-session-events` | read | contract | generated | Query session events |
| `cancel-session` | `POST /v1/sessions/{session_id}/cancel` | `notion <profile> api cancel-session` | write | contract | generated | Cancel a session |

## Not generated

| Operation | Why |
|---|---|
| `upload-file` | sends multipart/form-data, which the generated command cannot send |
| `create-a-token` | OAuth: signs in with the connection's client secret and carries tokens; never a generated command |
| `revoke-token` | OAuth: signs in with the connection's client secret and carries tokens; never a generated command |
| `introspect-token` | OAuth: signs in with the connection's client secret and carries tokens; never a generated command |
| `upload-skill` | sends multipart/form-data, which the generated command cannot send |
