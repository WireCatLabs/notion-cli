### Fixed

- A plain `sync` removes the rows of a data source that was taken out of its database. Before, they stayed in the
  local copy until `sync --rescan`. When Notion will not show the database (403), the rows stay.
