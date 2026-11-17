// GENERATED. DO NOT EDIT.
// Source: spec/notion/openapi.json, verified by provenance.json
// Run: pnpm generate

import type { ApiServer, ManifestOperation, SecurityRequirement, SecurityScheme } from "@wirecat/cli-base/codegen"

export const operations: readonly ManifestOperation[] = [
  {
    id: "get-self",
    command: "get-self",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/users/me",
    },
    effect: "read",
    summary: "Retrieve your token's bot user",
    tags: ["Users"],
    parameters: [],
    response: {
      confidence: "contract",
      schema: "UserObjectResponse",
    },
  },
  {
    id: "get-user",
    command: "get-user",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/users/{user_id}",
    },
    effect: "read",
    summary: "Retrieve a user",
    tags: ["Users"],
    parameters: [
      {
        name: "user_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the user or bot to retrieve.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "UserObjectResponse",
    },
  },
  {
    id: "get-users",
    command: "get-users",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/users",
    },
    effect: "read",
    summary: "List all users",
    tags: ["Users"],
    parameters: [
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          type: "number",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "GetUsersResponse",
    },
  },
  {
    id: "post-page",
    command: "post-page",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/pages",
    },
    effect: "write",
    summary: "Create a page",
    tags: ["Pages"],
    parameters: [
      {
        name: "filter_properties",
        in: "query",
        required: false,
        schema: {
          description:
            "Property names or IDs to include in each page's `properties` object. Other properties are left out. Repeat the parameter to pass more than one value, for example `filter_properties=title&filter_properties=Status`. Pages that aren't in a data source always return only `title`.",
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "PostPageRequest",
    },
    response: {
      confidence: "contract",
      schema: "PostPageResponse",
    },
  },
  {
    id: "retrieve-a-page",
    command: "retrieve-a-page",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/pages/{page_id}",
    },
    effect: "read",
    summary: "Retrieve a page",
    tags: ["Pages"],
    parameters: [
      {
        name: "page_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the page to retrieve.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "filter_properties",
        in: "query",
        required: false,
        schema: {
          description:
            "Property names or IDs to include in each page's `properties` object. Other properties are left out. Repeat the parameter to pass more than one value, for example `filter_properties=title&filter_properties=Status`. Pages that aren't in a data source always return only `title`.",
          type: "array",
          items: {
            type: "string",
          },
          maxItems: 100,
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "RetrieveAPageResponse",
    },
  },
  {
    id: "patch-page",
    command: "patch-page",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/pages/{page_id}",
    },
    effect: "write",
    summary: "Update page",
    tags: ["Pages"],
    parameters: [
      {
        name: "page_id",
        in: "path",
        required: true,
        schema: {
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "filter_properties",
        in: "query",
        required: false,
        schema: {
          description:
            "Property names or IDs to include in each page's `properties` object. Other properties are left out. Repeat the parameter to pass more than one value, for example `filter_properties=title&filter_properties=Status`. Pages that aren't in a data source always return only `title`.",
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "PatchPageRequest",
    },
    response: {
      confidence: "contract",
      schema: "PatchPageResponse",
    },
  },
  {
    id: "move-page",
    command: "move-page",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/pages/{page_id}/move",
    },
    effect: "write",
    summary: "Move a page",
    tags: ["Pages"],
    parameters: [
      {
        name: "page_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the page to move.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "MovePageRequest",
    },
    response: {
      confidence: "contract",
      schema: "MovePageResponse",
    },
  },
  {
    id: "retrieve-a-page-property",
    command: "retrieve-a-page-property",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/pages/{page_id}/properties/{property_id}",
    },
    effect: "read",
    summary: "Retrieve a page property item",
    tags: ["Pages"],
    parameters: [
      {
        name: "page_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the page containing the property.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "property_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID or name of the property to retrieve.",
          type: "string",
        },
      },
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          type: "integer",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "RetrieveAPagePropertyResponse",
    },
  },
  {
    id: "retrieve-page-markdown",
    command: "retrieve-page-markdown",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/pages/{page_id}/markdown",
    },
    effect: "read",
    summary: "Retrieve a page as markdown",
    tags: ["Pages"],
    parameters: [
      {
        name: "page_id",
        in: "path",
        required: true,
        schema: {
          description:
            "The ID of the page (or block) to retrieve as markdown. Non-navigable block IDs from truncated responses can be passed here to fetch their subtrees.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "include_transcript",
        in: "query",
        required: false,
        schema: {
          description:
            "Whether to include meeting note transcripts. Defaults to false. When true, full transcripts are included; when false, a placeholder with the meeting note URL is shown instead.",
          type: "boolean",
        },
      },
      {
        name: "markdown_version",
        in: "query",
        required: false,
        schema: {
          description:
            "The Markdown syntax to use. `v2` is [Notion-flavored Markdown](/guides/data-apis/notion-flavored-markdown) and is recommended. `v1` is enhanced markdown. It's deprecated. It's the default on current Notion-Versions. The next Notion-Version rejects `v1` with a `400` `validation_error`.",
          type: "string",
          enum: ["v1", "v2"],
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "PageMarkdownResponse",
    },
  },
  {
    id: "update-page-markdown",
    command: "update-page-markdown",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/pages/{page_id}/markdown",
    },
    effect: "write",
    summary: "Update a page's content as markdown",
    tags: ["Pages"],
    parameters: [
      {
        name: "page_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the page to update.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdatePageMarkdownRequest",
    },
    response: {
      confidence: "contract",
      schema: "PageMarkdownResponse",
    },
  },
  {
    id: "retrieve-async-task",
    command: "retrieve-async-task",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/async_tasks/{task_id}",
    },
    effect: "read",
    summary: "Retrieve an async task",
    tags: ["Async tasks"],
    parameters: [
      {
        name: "task_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the async task to retrieve.",
          type: "string",
          minLength: 1,
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "RetrieveAsyncTaskResponse",
    },
  },
  {
    id: "retrieve-a-block",
    command: "retrieve-a-block",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/blocks/{block_id}",
    },
    effect: "read",
    summary: "Retrieve a block",
    tags: ["Blocks"],
    parameters: [
      {
        name: "block_id",
        in: "path",
        required: true,
        schema: {
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "RetrieveABlockResponse",
    },
  },
  {
    id: "update-a-block",
    command: "update-a-block",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/blocks/{block_id}",
    },
    effect: "write",
    summary: "Update a block",
    tags: ["Blocks"],
    parameters: [
      {
        name: "block_id",
        in: "path",
        required: true,
        schema: {
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdateABlockRequest",
    },
    response: {
      confidence: "contract",
      schema: "UpdateABlockResponse",
    },
  },
  {
    id: "delete-a-block",
    command: "delete-a-block",
    binding: {
      kind: "http",
      method: "DELETE",
      path: "/v1/blocks/{block_id}",
    },
    effect: "destructive",
    summary: "Delete a block",
    tags: ["Blocks"],
    parameters: [
      {
        name: "block_id",
        in: "path",
        required: true,
        schema: {
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "DeleteABlockResponse",
    },
  },
  {
    id: "get-block-children",
    command: "get-block-children",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/blocks/{block_id}/children",
    },
    effect: "read",
    summary: "Retrieve block children",
    tags: ["Blocks"],
    parameters: [
      {
        name: "block_id",
        in: "path",
        required: true,
        schema: {
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          type: "number",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "GetBlockChildrenResponse",
    },
  },
  {
    id: "patch-block-children",
    command: "patch-block-children",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/blocks/{block_id}/children",
    },
    effect: "write",
    summary: "Append block children",
    tags: ["Blocks"],
    parameters: [
      {
        name: "block_id",
        in: "path",
        required: true,
        schema: {
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "PatchBlockChildrenRequest",
    },
    response: {
      confidence: "contract",
      schema: "PatchBlockChildrenResponse",
    },
  },
  {
    id: "retrieve-a-data-source",
    command: "retrieve-a-data-source",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/data_sources/{data_source_id}",
    },
    effect: "read",
    summary: "Retrieve a data source",
    tags: ["Data sources"],
    parameters: [
      {
        name: "data_source_id",
        in: "path",
        required: true,
        schema: {
          description: "ID of a Notion data source.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "RetrieveADataSourceResponse",
    },
  },
  {
    id: "update-a-data-source",
    command: "update-a-data-source",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/data_sources/{data_source_id}",
    },
    effect: "write",
    summary: "Update a data source",
    tags: ["Data sources"],
    parameters: [
      {
        name: "data_source_id",
        in: "path",
        required: true,
        schema: {
          description: "ID of a Notion data source.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdateADataSourceRequest",
    },
    response: {
      confidence: "contract",
      schema: "UpdateADataSourceResponse",
    },
  },
  {
    id: "post-database-query",
    command: "post-database-query",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/data_sources/{data_source_id}/query",
    },
    effect: "read",
    summary: "Query a data source",
    tags: ["Data sources"],
    parameters: [
      {
        name: "data_source_id",
        in: "path",
        required: true,
        schema: {
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "filter_properties",
        in: "query",
        required: false,
        schema: {
          description:
            "Property names or IDs to include in each page's `properties` object. Other properties are left out. Repeat the parameter to pass more than one value, for example `filter_properties=title&filter_properties=Status`. Pages that aren't in a data source always return only `title`.",
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "PostDatabaseQueryRequest",
    },
    response: {
      confidence: "contract",
      schema: "PageOrDataSourceListResponse",
    },
  },
  {
    id: "create-a-database",
    command: "create-a-database",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/data_sources",
    },
    effect: "write",
    summary: "Create a data source",
    tags: ["Data sources"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "CreateADatabaseRequest",
    },
    response: {
      confidence: "contract",
      schema: "CreateADatabaseResponse",
    },
  },
  {
    id: "list-data-source-templates",
    command: "list-data-source-templates",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/data_sources/{data_source_id}/templates",
    },
    effect: "read",
    summary: "List templates in a data source",
    tags: ["Data sources"],
    parameters: [
      {
        name: "data_source_id",
        in: "path",
        required: true,
        schema: {
          description: "ID of a Notion data source.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "name",
        in: "query",
        required: false,
        schema: {
          description: "Filter templates by name (case-insensitive substring match).",
          type: "string",
        },
      },
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          description:
            "If supplied, this endpoint will return a page of results starting after the cursor provided. If not supplied, this endpoint will return the first page of results.",
          type: "string",
        },
      },
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          description: "The number of items from the full list desired in the response. Maximum: 100",
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "ListDataSourceTemplatesResponse",
    },
  },
  {
    id: "retrieve-database",
    command: "retrieve-database",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/databases/{database_id}",
    },
    effect: "read",
    summary: "Retrieve a database",
    tags: ["Databases"],
    parameters: [
      {
        name: "database_id",
        in: "path",
        required: true,
        schema: {
          description: "ID of a Notion database, a container for one or more data sources.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "RetrieveDatabaseResponse",
    },
  },
  {
    id: "update-database",
    command: "update-database",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/databases/{database_id}",
    },
    effect: "write",
    summary: "Update a database",
    tags: ["Databases"],
    parameters: [
      {
        name: "database_id",
        in: "path",
        required: true,
        schema: {
          description: "ID of a Notion database, a container for one or more data sources.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdateDatabaseRequest",
    },
    response: {
      confidence: "contract",
      schema: "UpdateDatabaseResponse",
    },
  },
  {
    id: "create-database",
    command: "create-database",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/databases",
    },
    effect: "write",
    summary: "Create a database",
    tags: ["Databases"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "CreateDatabaseRequest",
    },
    response: {
      confidence: "contract",
      schema: "CreateDatabaseResponse",
    },
  },
  {
    id: "post-search",
    command: "post-search",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/search",
    },
    effect: "read",
    summary: "Search by title",
    tags: ["Search"],
    parameters: [
      {
        name: "filter_properties",
        in: "query",
        required: false,
        schema: {
          description:
            "Property names or IDs to include in each page's `properties` object. Other properties are left out. Repeat the parameter to pass more than one value, for example `filter_properties=title&filter_properties=Status`. Pages that aren't in a data source always return only `title`. Search skips names or IDs that don't exist on a page.",
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "PostSearchRequest",
    },
    response: {
      confidence: "contract",
      schema: "PageOrDataSourceListResponse",
    },
  },
  {
    id: "list-comments",
    command: "list-comments",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/comments",
    },
    effect: "read",
    summary: "List comments",
    tags: ["Comments"],
    parameters: [
      {
        name: "block_id",
        in: "query",
        required: true,
        schema: {
          description: "Identifier for a Notion block or page.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          description:
            "If supplied, this endpoint will return a page of results starting after the cursor provided. If not supplied, this endpoint will return the first page of results.",
          type: "string",
        },
      },
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          description: "The number of items from the full list desired in the response. Maximum: 100",
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "ListCommentsResponse",
    },
  },
  {
    id: "create-a-comment",
    command: "create-a-comment",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/comments",
    },
    effect: "write",
    summary: "Create a comment",
    tags: ["Comments"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "CreateACommentRequest",
    },
    response: {
      confidence: "contract",
      schema: "CreateACommentResponse",
    },
  },
  {
    id: "retrieve-comment",
    command: "retrieve-comment",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/comments/{comment_id}",
    },
    effect: "read",
    summary: "Retrieve a comment",
    tags: ["Comments"],
    parameters: [
      {
        name: "comment_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the comment to retrieve.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "RetrieveCommentResponse",
    },
  },
  {
    id: "update-a-comment",
    command: "update-a-comment",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/comments/{comment_id}",
    },
    effect: "write",
    summary: "Update a comment",
    tags: ["Comments"],
    parameters: [
      {
        name: "comment_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the comment to update.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdateACommentRequest",
    },
    response: {
      confidence: "contract",
      schema: "UpdateACommentResponse",
    },
  },
  {
    id: "delete-a-comment",
    command: "delete-a-comment",
    binding: {
      kind: "http",
      method: "DELETE",
      path: "/v1/comments/{comment_id}",
    },
    effect: "destructive",
    summary: "Delete a comment",
    tags: ["Comments"],
    parameters: [
      {
        name: "comment_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the comment to delete.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "DeleteACommentResponse",
    },
  },
  {
    id: "list-file-uploads",
    command: "list-file-uploads",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/file_uploads",
    },
    effect: "read",
    summary: "List file uploads",
    tags: ["File uploads"],
    parameters: [
      {
        name: "status",
        in: "query",
        required: false,
        schema: {
          description: "If supplied, the endpoint will return file uploads with the specified status.",
          type: "string",
          enum: ["pending", "uploaded", "expired", "failed"],
        },
      },
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          description:
            "If supplied, this endpoint will return a page of results starting after the cursor provided. If not supplied, this endpoint will return the first page of results.",
          type: "string",
        },
      },
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          description: "The number of items from the full list desired in the response. Maximum: 100",
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "ListFileUploadsResponse",
    },
  },
  {
    id: "create-file",
    command: "create-file",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/file_uploads",
    },
    effect: "write",
    summary: "Create a file upload",
    tags: ["File uploads"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "CreateFileRequest",
    },
    response: {
      confidence: "contract",
      schema: "FileUploadObjectResponse",
    },
  },
  {
    id: "complete-file-upload",
    command: "complete-file-upload",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/file_uploads/{file_upload_id}/complete",
    },
    effect: "write",
    summary: "Complete a multi-part file upload",
    tags: ["File uploads"],
    parameters: [
      {
        name: "file_upload_id",
        in: "path",
        required: true,
        schema: {
          description: "Identifier for a Notion file upload object.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "FileUploadObjectResponse",
    },
  },
  {
    id: "retrieve-file-upload",
    command: "retrieve-file-upload",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/file_uploads/{file_upload_id}",
    },
    effect: "read",
    summary: "Retrieve a file upload",
    tags: ["File uploads"],
    parameters: [
      {
        name: "file_upload_id",
        in: "path",
        required: true,
        schema: {
          description: "Identifier for a Notion file upload object.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "FileUploadObjectResponse",
    },
  },
  {
    id: "list-custom-emojis",
    command: "list-custom-emojis",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/custom_emojis",
    },
    effect: "read",
    summary: "List custom emojis",
    tags: ["Custom emojis"],
    parameters: [
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          description:
            "If supplied, this endpoint will return a page of results starting after the cursor provided. If not supplied, this endpoint will return the first page of results.",
          type: "string",
        },
      },
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          description: "The number of items from the full list desired in the response. Maximum: 100",
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
      {
        name: "name",
        in: "query",
        required: false,
        schema: {
          description:
            "If supplied, filters custom emojis by exact name match. Useful for resolving a custom emoji name to its ID.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "ListCustomEmojisResponse",
    },
  },
  {
    id: "list-views",
    command: "list-views",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/views",
    },
    effect: "read",
    summary: "List views",
    tags: ["Views"],
    parameters: [
      {
        name: "database_id",
        in: "query",
        required: false,
        schema: {
          description:
            "ID of a Notion database (collection view block) to list views for. At least one of database_id or data_source_id is required.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "data_source_id",
        in: "query",
        required: false,
        schema: {
          description:
            "ID of a data source (collection) to list all views for, including linked views across the workspace. At least one of database_id or data_source_id is required.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          description:
            "If supplied, this endpoint will return a page of results starting after the cursor provided. If not supplied, this endpoint will return the first page of results.",
          type: "string",
        },
      },
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          description: "The number of items from the full list desired in the response. Maximum: 100",
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "ListViewsResponse",
    },
  },
  {
    id: "create-view",
    command: "create-view",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/views",
    },
    effect: "write",
    summary: "Create a view",
    tags: ["Views"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "CreateViewRequest",
    },
    response: {
      confidence: "contract",
      schema: "CreateViewResponse",
    },
  },
  {
    id: "retrieve-a-view",
    command: "retrieve-a-view",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/views/{view_id}",
    },
    effect: "read",
    summary: "Retrieve a view",
    tags: ["Views"],
    parameters: [
      {
        name: "view_id",
        in: "path",
        required: true,
        schema: {
          description: "ID of a Notion view.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "RetrieveAViewResponse",
    },
  },
  {
    id: "update-a-view",
    command: "update-a-view",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/views/{view_id}",
    },
    effect: "write",
    summary: "Update a view",
    tags: ["Views"],
    parameters: [
      {
        name: "view_id",
        in: "path",
        required: true,
        schema: {
          description: "ID of a Notion view.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdateViewRequest",
    },
    response: {
      confidence: "contract",
      schema: "UpdateAViewResponse",
    },
  },
  {
    id: "delete-view",
    command: "delete-view",
    binding: {
      kind: "http",
      method: "DELETE",
      path: "/v1/views/{view_id}",
    },
    effect: "destructive",
    summary: "Delete a view",
    tags: ["Views"],
    parameters: [
      {
        name: "view_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the view to delete.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "PartialDataSourceViewObjectResponse",
    },
  },
  {
    id: "create-view-query",
    command: "create-view-query",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/views/{view_id}/queries",
    },
    effect: "read",
    summary: "Create a view query",
    tags: ["Views"],
    parameters: [
      {
        name: "view_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the view.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "CreateViewQueryRequest",
    },
    response: {
      confidence: "contract",
      schema: "ViewQueryResponse",
    },
  },
  {
    id: "get-view-query-results",
    command: "get-view-query-results",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/views/{view_id}/queries/{query_id}",
    },
    effect: "read",
    summary: "Get view query results",
    tags: ["Views"],
    parameters: [
      {
        name: "view_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the view.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "query_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the query.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          description: "If supplied, this endpoint will return a page of results starting after the cursor provided.",
          type: "string",
        },
      },
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          description: "The number of results to return per page. Maximum: 100",
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "GetViewQueryResultsResponse",
    },
  },
  {
    id: "delete-view-query",
    command: "delete-view-query",
    binding: {
      kind: "http",
      method: "DELETE",
      path: "/v1/views/{view_id}/queries/{query_id}",
    },
    effect: "destructive",
    summary: "Delete a view query",
    tags: ["Views"],
    parameters: [
      {
        name: "view_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the view.",
          type: "ref",
          ref: "idRequest",
        },
      },
      {
        name: "query_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the query.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "DeletedViewQueryResponse",
    },
  },
  {
    id: "create-meeting-note",
    command: "create-meeting-note",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/blocks/meeting_notes",
    },
    effect: "write",
    summary: "Create a meeting note",
    tags: ["Meeting notes"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "CreateMeetingNoteRequest",
    },
    response: {
      confidence: "contract",
      schema: "CreateMeetingNoteResponse",
    },
  },
  {
    id: "query-meeting-notes",
    command: "query-meeting-notes",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/blocks/meeting_notes/query",
    },
    effect: "read",
    summary: "Query meeting notes",
    tags: ["Meeting notes"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "QueryMeetingNotesRequest",
    },
    response: {
      confidence: "contract",
      schema: "QueryMeetingNotesResponse",
    },
  },
  {
    id: "query-agents",
    command: "query-agents",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/agents/query",
    },
    effect: "read",
    summary: "Query agents",
    tags: ["Agents"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "QueryAgentsRequest",
    },
    response: {
      confidence: "contract",
      schema: "QueryAgentsResponse",
    },
  },
  {
    id: "get-agent",
    command: "get-agent",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/agents/{agent_id}",
    },
    effect: "read",
    summary: "Get agent",
    tags: ["Agents"],
    parameters: [
      {
        name: "agent_id",
        in: "path",
        required: true,
        schema: {
          description:
            "The agent ID (a UUID), or `notion_ai` for the personal agent. Endpoint-specific restrictions still apply.",
          type: "union",
          of: [
            {
              type: "ref",
              ref: "idRequest",
            },
            {
              description: "Always `notion_ai`",
              type: "string",
              enum: ["notion_ai"],
            },
          ],
        },
      },
      {
        name: "verbose",
        in: "query",
        required: false,
        schema: {
          description: "Whether to include the agent's inline instructions. Defaults to false.",
          type: "boolean",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "GetAgentResponse",
    },
  },
  {
    id: "update-agent",
    command: "update-agent",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/agents/{agent_id}",
    },
    effect: "write",
    summary: "Update agent",
    tags: ["Agents"],
    parameters: [
      {
        name: "agent_id",
        in: "path",
        required: true,
        schema: {
          description:
            "The agent ID (a UUID), or `notion_ai` for the personal agent. Endpoint-specific restrictions still apply.",
          type: "union",
          of: [
            {
              type: "ref",
              ref: "idRequest",
            },
            {
              description: "Always `notion_ai`",
              type: "string",
              enum: ["notion_ai"],
            },
          ],
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdateAgentRequest",
    },
    response: {
      confidence: "contract",
      schema: "UpdateAgentResponse",
    },
  },
  {
    id: "delete-agent",
    command: "delete-agent",
    binding: {
      kind: "http",
      method: "DELETE",
      path: "/v1/agents/{agent_id}",
    },
    effect: "destructive",
    summary: "Delete agent",
    tags: ["Agents"],
    parameters: [
      {
        name: "agent_id",
        in: "path",
        required: true,
        schema: {
          description:
            "The agent ID (a UUID), or `notion_ai` for the personal agent. The personal agent cannot be deleted.",
          type: "union",
          of: [
            {
              type: "ref",
              ref: "idRequest",
            },
            {
              description: "Always `notion_ai`",
              type: "string",
              enum: ["notion_ai"],
            },
          ],
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "DeleteAgentResponse",
    },
  },
  {
    id: "get-agent-insights",
    command: "get-agent-insights",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/agents/{agent_id}/insights",
    },
    effect: "read",
    summary: "Get agent insights",
    tags: ["Agents"],
    parameters: [
      {
        name: "agent_id",
        in: "path",
        required: true,
        schema: {
          description:
            "The agent ID (a UUID), or `notion_ai` for the personal agent. Endpoint-specific restrictions still apply.",
          type: "union",
          of: [
            {
              type: "ref",
              ref: "idRequest",
            },
            {
              description: "Always `notion_ai`",
              type: "string",
              enum: ["notion_ai"],
            },
          ],
        },
      },
      {
        name: "start_time",
        in: "query",
        required: false,
        schema: {
          description:
            "Start of the insights window, as an epoch timestamp in seconds. Must be supplied together with `end_time`; if either is omitted the window defaults to the current billing period.",
          type: "integer",
          minimum: 0,
        },
      },
      {
        name: "end_time",
        in: "query",
        required: false,
        schema: {
          description:
            "End of the insights window, as an epoch timestamp in seconds. Must be supplied together with `start_time`; if either is omitted the window defaults to the current billing period.",
          type: "integer",
          minimum: 0,
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "GetAgentInsightsResponse",
    },
  },
  {
    id: "update-agent-status",
    command: "update-agent-status",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/agents/{agent_id}/status",
    },
    effect: "write",
    summary: "Update agent status",
    tags: ["Agents"],
    deprecated: true,
    parameters: [
      {
        name: "agent_id",
        in: "path",
        required: true,
        schema: {
          description:
            "The agent ID (a UUID), or `notion_ai` for the personal agent. Endpoint-specific restrictions still apply.",
          type: "union",
          of: [
            {
              type: "ref",
              ref: "idRequest",
            },
            {
              description: "Always `notion_ai`",
              type: "string",
              enum: ["notion_ai"],
            },
          ],
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdateAgentStatusRequest",
    },
    response: {
      confidence: "contract",
      schema: "UpdateAgentStatusResponse",
    },
  },
  {
    id: "update-agent-credit-limit",
    command: "update-agent-credit-limit",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "/v1/agents/{agent_id}/credit_limit",
    },
    effect: "write",
    summary: "Update agent credit limit",
    tags: ["Agents"],
    parameters: [
      {
        name: "agent_id",
        in: "path",
        required: true,
        schema: {
          description:
            "The ID of the custom agent (a UUID). The personal agent (Notion AI) is not supported by this endpoint.",
          type: "union",
          of: [
            {
              type: "ref",
              ref: "idRequest",
            },
            {
              description: "Always `notion_ai`",
              type: "string",
              enum: ["notion_ai"],
            },
          ],
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdateAgentCreditLimitRequest",
    },
    response: {
      confidence: "contract",
      schema: "UpdateAgentCreditLimitResponse",
    },
  },
  {
    id: "agent-batch",
    command: "agent-batch",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/agents/batch",
    },
    effect: "write",
    summary: "Apply many agent operations",
    tags: ["Agents"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "AgentBatchRequest",
    },
    response: {
      confidence: "contract",
      schema: "AgentBatchResponse",
    },
  },
  {
    id: "list-skills-plugins",
    command: "list-skills-plugins",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/ai/plugins",
    },
    effect: "read",
    summary: "List skills plugins",
    tags: ["Agent Skills"],
    parameters: [
      {
        name: "page_size",
        in: "query",
        required: false,
        schema: {
          description: "The number of items to return. Maximum: 100.",
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
      {
        name: "start_cursor",
        in: "query",
        required: false,
        schema: {
          description: "An opaque cursor returned by the previous page of results.",
          type: "string",
          minLength: 1,
          maxLength: 200,
          pattern: "^[A-Za-z0-9]+$",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "ListSkillsPluginsResponse",
    },
  },
  {
    id: "get-plugin-directory",
    command: "get-plugin-directory",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/ai/plugins/{id}",
    },
    effect: "read",
    summary: "Get a plugin directory",
    tags: ["Agent Skills"],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 200,
          pattern: "^[^\\u0000-\\u001f\\u007f]+$",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "GetPluginDirectoryResponse",
    },
  },
  {
    id: "get-skill-directory",
    command: "get-skill-directory",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/ai/skills/{id}",
    },
    effect: "read",
    summary: "Get a skill directory",
    tags: ["Agent Skills"],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          description: "Identifier for a Notion skill page.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "GetSkillDirectoryResponse",
    },
  },
  {
    id: "update-session",
    command: "update-session",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/sessions",
    },
    effect: "write",
    summary: "Update a session",
    tags: ["Sessions"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "UpdateSessionRequest",
    },
    response: {
      confidence: "contract",
      schema: "UpdateSessionResponse",
    },
  },
  {
    id: "retrieve-session",
    command: "retrieve-session",
    binding: {
      kind: "http",
      method: "GET",
      path: "/v1/sessions/{session_id}",
    },
    effect: "read",
    summary: "Retrieve a session",
    tags: ["Sessions"],
    parameters: [
      {
        name: "session_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the session to retrieve.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "RetrieveSessionResponse",
    },
  },
  {
    id: "query-sessions",
    command: "query-sessions",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/sessions/query",
    },
    effect: "read",
    summary: "Query sessions",
    tags: ["Sessions"],
    parameters: [],
    request: {
      required: true,
      confidence: "contract",
      schema: "QuerySessionsRequest",
    },
    response: {
      confidence: "contract",
      schema: "QuerySessionsResponse",
    },
  },
  {
    id: "query-session-events",
    command: "query-session-events",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/sessions/{session_id}/events/query",
    },
    effect: "read",
    summary: "Query session events",
    tags: ["Sessions"],
    parameters: [
      {
        name: "session_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the session whose events should be queried.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "QuerySessionEventsRequest",
    },
    response: {
      confidence: "contract",
      schema: "QuerySessionEventsResponse",
    },
  },
  {
    id: "cancel-session",
    command: "cancel-session",
    binding: {
      kind: "http",
      method: "POST",
      path: "/v1/sessions/{session_id}/cancel",
    },
    effect: "write",
    summary: "Cancel a session",
    tags: ["Sessions"],
    parameters: [
      {
        name: "session_id",
        in: "path",
        required: true,
        schema: {
          description: "The ID of the session to cancel.",
          type: "ref",
          ref: "idRequest",
        },
      },
    ],
    request: {
      required: true,
      confidence: "contract",
      schema: "CancelSessionRequest",
    },
    response: {
      confidence: "contract",
      schema: "CancelSessionResponse",
    },
  },
]

export const servers: readonly ApiServer[] = [
  {
    url: "https://api.notion.com",
  },
]

export const securitySchemes: Readonly<Record<string, SecurityScheme>> = {
  bearerAuth: {
    scheme: "bearer",
    type: "http",
  },
  basicAuth: {
    scheme: "basic",
    type: "http",
  },
}

export const security: readonly SecurityRequirement[] = [
  {
    bearerAuth: [],
  },
]
