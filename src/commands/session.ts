import { CliError } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import { readSecret } from "@wirecat/cli-core"
import {
  commandWords,
  environmentOf,
  FETCH,
  itemOf,
  LOCAL_READ,
  LOCAL_WRITE,
  listOf,
  logsInOrOut,
  outputFor,
  ProfileTokenStore,
  profileFree,
  profilesHere,
  REMOTE_READ,
  refuseCommandName,
  refuseOffline,
  refuseUnderReadOnly,
  rememberAccount,
  renderAnswer,
  rootOf,
  secretInputOf,
  type TokenStorage,
} from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { configuration } from "../config.js"
import { contextOf, notionFor, withNotion } from "../context.js"
import { IDENTITY } from "../identity.js"
import { NOTION } from "../notion/errors.js"

// `session start | status | end | list` is every provider CLI's sign-in (WC-ACCT-12). The token is a personal access
// token or an internal connection's; both are checked with GET /v1/users/me
// (https://developers.notion.com/reference/get-self). OAuth comes last (DESIGN.md, Sign-in).

const SERVICE = NOTION

const CLI = IDENTITY.command

const answer = (command: Command, item: unknown) => renderAnswer(command, outputFor(command), itemOf(item))

const storageOf = (raw: string): TokenStorage => {
  if (raw === "keyring" || raw === "file") return raw
  throw new CliError("validation_error", `--credential-storage takes keyring or file; got ${raw}`)
}

const startCommand = () =>
  logsInOrOut(
    annotate(new Command("start"), {
      effects: FETCH,
      lifetime: "interactive",
      mcp: false,
      examples: [`${CLI} personal session start`, `${CLI} personal session start --credential-storage file`],
    }),
  )
    .summary("sign in to Notion with a personal access token or an internal connection's token")
    .description(
      "sign this profile in: a Notion personal access token, which acts with your own rights, or an internal " +
        "connection's token, which sees only the pages shared with that connection. It is asked hidden or read from " +
        "stdin, never taken as an argument, checked with Notion, and only then kept in the keyring, or in a private file",
    )
    .option(
      "--credential-storage <storage>",
      "where the token is kept: keyring, which falls back to a private file by itself, or file",
      storageOf,
      "keyring" as TokenStorage,
    )
    .action(async function (this: Command, args: { credentialStorage: TokenStorage }) {
      const { env, profile, tokens, run } = contextOf(this)
      refuseCommandName(profile, commandWords(rootOf(this)), CLI)
      refuseOffline(this, SERVICE)
      // A secret is never an argument: it would land in shell history and in the run record (WC-SECR-5).
      const token = (await readSecret("Notion token: ", secretInputOf(this))).trim()
      if (!token) throw new CliError("validation_error", "no token was given")
      const account = await run((events) => notionFor(this, token, events).me())
      const storedIn = tokens.write(profile, token, args.credentialStorage)
      // Two profiles in one workspace see different pages, so the account is the workspace and the token's bot.
      rememberAccount(IDENTITY, profile, `${account.workspace.id}:${account.user.id}`, env)
      answer(this, { profile, state: "saved", stored_in: storedIn, verified: true, ...account })
    })

const statusCommand = () =>
  annotate(new Command("status"), {
    effects: REMOTE_READ,
    examples: [`${CLI} personal session status`, `${CLI} personal session status --check --json`],
  })
    .summary("show where this profile's token comes from; never the token")
    .description(
      `show where this profile's token comes from: ${IDENTITY.envPrefix}_TOKEN, the keyring or a file, never the token; ` +
        `--check asks ${SERVICE} whose token it is`,
    )
    .option("--check", `ask ${SERVICE} whether the token still works, and whose it is`)
    .action(async function (this: Command, args: { check?: boolean }) {
      const { profile, tokens } = contextOf(this)
      const saved = tokens.read(profile)
      const status = { profile, state: saved ? "saved" : "missing", token_from: saved?.source ?? null }
      if (!args.check || !saved) return answer(this, { ...status, verified: false })
      answer(this, { ...status, verified: true, ...(await withNotion(this, (notion) => notion.me())) })
    })

const endCommand = () =>
  logsInOrOut(
    annotate(new Command("end"), {
      effects: LOCAL_WRITE,
      mcp: false,
      examples: [`${CLI} personal session end`],
    }),
  )
    .summary("forget this profile's token on this computer")
    .description(
      `forget this profile's token on this computer; the token itself stays valid in ${SERVICE}. Only this tool's ` +
        "own entry goes: Notion's own CLI keeps its tokens under the same keyring name, and they stay",
    )
    .action(function (this: Command) {
      refuseUnderReadOnly(this, "session end")
      const { profile, tokens } = contextOf(this)
      answer(this, { profile, ended: tokens.remove(profile) })
    })

const listCommand = () =>
  profileFree(
    annotate(new Command("list"), {
      effects: LOCAL_READ,
      examples: [`${CLI} session list`, `${CLI} session list --json`],
    }),
  )
    .summary("list the profiles here and whether each is signed in")
    .description("list the profiles on this computer and whether each has a token; picks none")
    .action(function (this: Command) {
      const environment = environmentOf(this)
      const env = environment.env ?? process.env
      // biome-ignore lint/plugin/no-own-settings: baseContext needs a profile, and this local read names none
      const { configuredProfiles } = configuration.resolveSettings({}, { env, needsProfile: false })
      const tokens = new ProfileTokenStore({
        app: IDENTITY,
        env,
        ...(environment.keyring ? { keyring: environment.keyring } : {}),
        warn: outputFor(this).renderer.warn,
      })
      const items = profilesHere(IDENTITY, configuredProfiles, env).map((profile) => {
        const saved = tokens.read(profile)
        return { profile, signed_in: saved !== undefined, token_from: saved?.source ?? null }
      })
      renderAnswer(
        this,
        outputFor(this),
        listOf("session list", { items, limit: Math.max(1, items.length), has_more: false }),
      )
    })

export const sessionCommand = (): Command =>
  annotate(new Command("session"), { effects: LOCAL_READ })
    .description(`keep this profile's ${SERVICE} token in the OS keyring`)
    .addCommand(startCommand())
    .addCommand(statusCommand())
    .addCommand(endCommand())
    .addCommand(listCommand())
