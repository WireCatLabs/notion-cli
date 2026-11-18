import { annotate } from "@wirecat/cli-base/commands"
import {
  type AccountRemoval,
  accountRemoveCommand,
  LOCAL_READ,
  LOCAL_WRITE,
  ProfileTokenStore,
} from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { configuration } from "../config.js"
import { IDENTITY } from "../identity.js"
import { PROVIDER, profileDir } from "../library.js"

const removal: AccountRemoval = {
  // A personal access token is revoked only on Notion's own integrations page, so nothing is revoked here.
  signOut: async (profile, { env, keyring }) => {
    const gone = new ProfileTokenStore({ app: IDENTITY, env, ...(keyring ? { keyring } : {}) }).remove(profile)
    return { revoked: null, removed: gone.length ? [`the Notion token of ${profile}`] : [] }
  },
  // The chosen folders, the sync's checkpoint and its page snapshots; the store's copy is kept or deleted by the flag.
  dataFiles: (profile, { env }) => [profileDir(env, profile)],
}

export const accountCommand = (): Command =>
  annotate(new Command("account"), { effects: LOCAL_READ })
    .description("this profile on this computer")
    .addCommand(
      annotate(
        accountRemoveCommand(IDENTITY, removal, {
          provider: PROVIDER.name,
          resolveSettings: configuration.resolveSettings,
        }),
        { effects: LOCAL_WRITE },
      ),
    )
