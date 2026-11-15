import type { ManifestIdentity } from "@wirecat/cli-base/wcat/manifest"
import type { AppIdentity } from "@wirecat/cli-core/cli"
import { DETAILS, REASONS } from "./notion/errors.js"
import { VERSION } from "./version.js"

export const PACKAGE = "@wirecat/notion-cli"

export const IDENTITY: AppIdentity = {
  command: "notion",
  appName: "notion-cli",
  envPrefix: "WCNOTION",
  description: "Notion pages and databases for you and your agent, read live with your own token",
  version: VERSION,
  issues: "https://github.com/WireCatLabs/notion-cli/issues/new",
  messenger: false,
  contentLanguages: ["en", "ru", "es"],
  errors: { reasons: REASONS, details: DETAILS },
}

// What `wcat` and WireCat Desktop show before the tool is installed. The bin passes it to wcatStart before anything
// else loads; src/wcat.ts adds the permission keys.
export const DESKTOP: ManifestIdentity = {
  ...IDENTITY,
  docs: "https://github.com/WireCatLabs/notion-cli#readme",
  // Every host the CLI contacts (WC-CMD-32).
  hosts: ["api.notion.com"],
  tagline: "Notion pages and databases, searchable on your computer",
  syncs: "Notion pages and database rows",
  signIn: {
    gives: "Lets your agent read the Notion pages and databases your token can see.",
    asks: "A Notion personal access token, or the token of an internal connection you made in Notion.",
  },
}

export const SKILL = new URL("../skills/notion-cli/SKILL.md", import.meta.url)
