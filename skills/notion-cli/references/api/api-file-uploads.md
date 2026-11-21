<!-- Generated from the API manifest and the command tree by pnpm generate. Do not edit. -->

# Notion API: File uploads

## `notion api complete-file-upload [options]`

- What: Complete a multi-part file upload
- Call: `POST /v1/file_uploads/{file_upload_id}/complete`, effect: write

| Flag | Required | What |
|---|---|---|
| `--file-upload-id <value>` | yes | file\_upload\_id |

## `notion api create-file [options]`

- What: Create a file upload
- Call: `POST /v1/file_uploads`, effect: write
- Body: `CreateFileRequest`, required

| Flag | Required | What |
|---|---|---|
| `--body <json>` | no | the request body as JSON; - reads it from stdin |
| `--body-file <path>` | no | the request body from a JSON file; - is stdin |

## `notion api list-file-uploads [options]`

- What: List file uploads
- Call: `GET /v1/file_uploads`, effect: read

| Flag | Required | What |
|---|---|---|
| `--status <value>` | no | status |
| `--start-cursor <value>` | no | start\_cursor |
| `--page-size <value>` | no | page\_size |

## `notion api retrieve-file-upload [options]`

- What: Retrieve a file upload
- Call: `GET /v1/file_uploads/{file_upload_id}`, effect: read

| Flag | Required | What |
|---|---|---|
| `--file-upload-id <value>` | yes | file\_upload\_id |
