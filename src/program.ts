import { join } from "node:path"
import { resolvePaths } from "@wirecat/cli-base"
import {
  appDoctorCommand,
  appMcpCommand,
  commandsCommand,
  configCommand,
  createProgram as createSharedProgram,
  outputFor,
  ProfileTokenStore,
  type ProgramDefinition,
  type ProgramOptions,
  profilesHere,
  type RunOptions,
  run as runShared,
  runsCommand,
  skillCommand,
  upgradeCommand,
} from "@wirecat/cli-core/cli"
import { appUpdate } from "@wirecat/cli-core/update"
import type { Command } from "commander"
import { accountCommand } from "./commands/account.js"
import { apiCommand } from "./commands/api.js"
import { commentsCommand } from "./commands/comments.js"
import { databasesCommand } from "./commands/databases.js"
import { filesCommand } from "./commands/files.js"
import { libraryCommands } from "./commands/library.js"
import { meetingsCommands } from "./commands/meetings.js"
import { rowsCommand } from "./commands/rows.js"
import { sessionCommand } from "./commands/session.js"
import { configuration } from "./config.js"
import { IDENTITY, PACKAGE, SKILL } from "./identity.js"
import { userAccessOf } from "./library.js"

const update = appUpdate({
  packageName: PACKAGE,
  command: IDENTITY.command,
  version: IDENTITY.version,
  entry: import.meta.url,
  statePath: (env) =>
    join(resolvePaths({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env }).state, "update-check.json"),
  // biome-ignore lint/plugin/no-own-settings: the update check runs before any command exists to give baseContext
  enabled: (env) => configuration.resolveSettings({}, { env, needsProfile: false }).updateCheck,
  offVariables: [`${IDENTITY.envPrefix}_NO_UPDATE_CHECK`],
})

/** What each profile's last sync could read of Notion users: without email addresses no author becomes a person. */
const userInformation = (env: NodeJS.ProcessEnv) => {
  const found = Object.fromEntries(
    profilesHere(IDENTITY, [], env).flatMap((profile) => {
      const access = userAccessOf(env, profile)
      return access ? [[profile, access]] : []
    }),
  )
  const short = Object.entries(found).filter(([, access]) => access !== "emails")
  return {
    fields: { user_information: found },
    notes: short.map(
      ([profile, access]) =>
        `profile ${profile}: the Notion connection reads ${access === "none" ? "no user information" : "user names without email addresses"}, ` +
        'so page authors and editors are not matched to people; turn on "Read user information including email ' +
        "addresses\" in the connection's capabilities, then sync",
    ),
  }
}

const mcpCommand = () =>
  appMcpCommand(IDENTITY, configuration, {
    name: "Notion",
    // Pages, databases and meeting notes are shared: other members and Notion AI write their text (WC-MCP-11).
    untrusted: [
      "page text",
      "page and database titles",
      "database descriptions",
      "property names and options",
      "links",
      "comment text",
      "author names",
      "meeting titles, summaries, notes and transcripts",
      "attendee names",
    ],
    permissionExample: "documents.get=deny",
    skill: SKILL,
    signedIn: (profile, env, keyring) =>
      new ProfileTokenStore({ app: IDENTITY, env, ...(keyring ? { keyring } : {}) }).signedIn(profile),
  })

export const definition = (): ProgramDefinition => ({
  app: IDENTITY,
  // The whole object: cli-core refuses a command by its key only when it gets the permission table too.
  configuration,
  commands: () => [
    commandsCommand(IDENTITY),
    sessionCommand(),
    accountCommand(),
    ...libraryCommands(),
    ...meetingsCommands(),
    databasesCommand(),
    rowsCommand(),
    commentsCommand(),
    filesCommand(),
    apiCommand(),
    appDoctorCommand(IDENTITY, configuration, { packageName: PACKAGE, local: userInformation }),
    skillCommand(IDENTITY, SKILL),
    mcpCommand(),
    upgradeCommand(IDENTITY, PACKAGE, (command) => ({
      ...outputFor(command),
      installer: () => update.installer({}),
      latest: () => update.latest({}),
      install: (argv) => update.runUpdate(argv, {}),
    })),
    configCommand(IDENTITY, configuration),
    runsCommand(IDENTITY),
  ],
})

export const createProgram = (options?: ProgramOptions): Command => createSharedProgram(definition(), options)

export const run = (argv: string[], options?: RunOptions): Promise<number> => runShared(argv, definition(), options)
