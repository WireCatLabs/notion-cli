import type { SleepLike } from "@wirecat/cli-base"
import {
  type BaseEnvironment,
  baseContext,
  type EventSink,
  environmentOf,
  type GlobalFlags,
  ProfileTokenStore,
  refuseOffline,
} from "@wirecat/cli-core/cli"
import { Pacer, pacePathFor } from "@wirecat/cli-core/sends"
import type { Command } from "commander"
import { configuration } from "./config.js"
import { IDENTITY } from "./identity.js"
import { notionClient, PACE, QUERY_PACE } from "./notion/client.js"
import { NOTION } from "./notion/errors.js"
import { type LiveReads, liveReads } from "./notion/notion.js"

/** What a test hands `run()` beside cli-core's own: the fake Notion in place of the network (WC-ARCH-10). */
export interface ServiceEnvironment extends BaseEnvironment {
  fetch?: typeof fetch
  /** Notion's retry and pace waits; a test passes one that only counts them (WC-TEST-3). */
  sleep?: SleepLike
}

/**
 * Settings, keyring and the run come from cli-core's `baseContext` and nowhere else: a command that resolves settings
 * on its own skips `--timeout`, the run record and the profile's permissions (WC-LIFE-5, WC-LIFE-15).
 */
export const contextOf = (command: Command) => {
  const base = baseContext(command, configuration.resolveSettings)
  return {
    ...base,
    environment: environmentOf<ServiceEnvironment>(command),
    flags: command.optsWithGlobals<GlobalFlags>(),
    profile: base.settings.profile,
    tokens: new ProfileTokenStore({
      app: IDENTITY,
      env: base.env,
      ...(base.keyring ? { keyring: base.keyring } : {}),
      warn: base.renderer.warn,
    }),
  }
}

/** The profile's saved token, or an authentication error that says how to sign in. Read before any request. */
export const tokenOf = (command: Command): string => {
  const { profile, tokens } = contextOf(command)
  refuseOffline(command, NOTION)
  return tokens.need(profile)
}

/** Notion for one run: the SDK over hostFetch, paced per profile, a slower pace of its own for data source queries. */
export const notionFor = (command: Command, token: string, events: EventSink): LiveReads => {
  const { environment, env, profile } = contextOf(command)
  const pace = pacePathFor(IDENTITY, profile, env)
  return liveReads(
    notionClient({
      token,
      events,
      signal: environment.signal,
      fetch: environment.fetch,
      pacer: new Pacer(pace, PACE),
      ...(environment.sleep ? { sleep: environment.sleep } : {}),
      queryPacer: new Pacer(pace.replace(/\.json$/u, ".queries.json"), QUERY_PACE),
    }),
  )
}

/**
 * Every Notion call goes through here: inside cli-core's run, so `--timeout` bounds it, a failure or `--record` keeps
 * a run named after the command, and the client's requests land in that run (WC-LIFE-5, WC-LIFE-15).
 */
export const withNotion = <T>(command: Command, body: (notion: LiveReads) => Promise<T>): Promise<T> => {
  const token = tokenOf(command)
  return contextOf(command).run((events) => body(notionFor(command, token, events)))
}
