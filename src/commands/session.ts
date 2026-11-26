import { tokenSessionCommand } from "@wirecat/cli-core/cli"
import type { Command } from "commander"
import { configuration } from "../config.js"
import { notionFor } from "../context.js"
import { IDENTITY } from "../identity.js"
import { claimAccount } from "../library.js"
import { NOTION } from "../notion/errors.js"

// `session start | status | end | list` is every provider CLI's sign-in (WC-ACCT-12). The token is a personal access
// token or an internal connection's; both are checked with GET /v1/users/me
// (https://developers.notion.com/reference/get-self). OAuth comes last (DESIGN.md, Sign-in).

export const sessionCommand = (): Command =>
  tokenSessionCommand({
    app: IDENTITY,
    service: NOTION,
    resolveSettings: configuration.resolveSettings,
    token: "token",
    about:
      "The token is a Notion personal access token, which acts with your own rights, or an internal connection's " +
      "token, which sees only the pages shared with that connection",
    endNote:
      "Only this tool's own entry goes: Notion's own CLI keeps its tokens under the same keyring name, and they stay",
    verify: async (command, token, events) => {
      const account = await notionFor(command, token, events).me()
      // Two profiles in one workspace see different pages, so the account is the workspace and the token's bot.
      return { id: `${account.workspace.id}:${account.user.id}`, account }
    },
    claim: (env, profile, id, tokens) => claimAccount(env, profile, id, tokens),
  })
