// Generated from wirecat.config.ts by scripts/from-config.ts; run pnpm generate

export const SOURCE: Readonly<Record<string, unknown>> = {
  provider: "notion",
  identity: {
    operation: "get-self",
    id: ["bot.workspace_id", "id"],
  },
  reads: {
    self: {
      operation: "get-self",
    },
    user: {
      operation: "get-user",
      path: {
        user_id: "{id}",
      },
    },
    search: {
      operation: "post-search",
    },
    query: {
      operation: "post-database-query",
      path: {
        data_source_id: "{id}",
      },
    },
    page: {
      operation: "retrieve-a-page",
      path: {
        page_id: "{id}",
      },
    },
    database: {
      operation: "retrieve-database",
      path: {
        database_id: "{id}",
      },
    },
    block: {
      operation: "retrieve-a-block",
      path: {
        block_id: "{id}",
      },
    },
    blocks: {
      operation: "get-block-children",
      path: {
        block_id: "{id}",
      },
      query: {
        page_size: 100,
        start_cursor: "{cursor}",
      },
    },
    markdown: {
      operation: "retrieve-page-markdown",
      path: {
        page_id: "{id}",
      },
      query: {
        markdown_version: "v2",
      },
    },
    comments: {
      operation: "list-comments",
      query: {
        block_id: "{id}",
        page_size: 100,
        start_cursor: "{cursor}",
      },
    },
  },
  reread: {
    missing: "authors",
  },
}

export const HEADERS: Readonly<Record<string, string>> = {
  "notion-version": "2026-03-11",
}

export const PACES = {
  perMinute: 170,
  burst: 10,
  operations: {
    "post-database-query": {
      perMinute: 170,
      burst: 3,
    },
  },
}
