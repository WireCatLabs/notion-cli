import type { SleepLike } from "@wirecat/cli-base"
import {
  type BaseEnvironment,
  baseContext,
  type EventSink,
  environmentOf,
  type GlobalFlags,
  ProfileTokenStore,
  refuseOffline,
  serviceApiCall,
} from "@wirecat/cli-core/cli"
import { Pacer, pacePathFor } from "@wirecat/cli-core/sends"
import type { Command } from "commander"
import { API, configuration } from "./config.js"
import { HEADERS } from "./generated/wirecat-config.js"
import { IDENTITY } from "./identity.js"
import { notionClient, notionFetch, PACE, QUERY_PACE } from "./notion/client.js"
import { NOTION, notionRefusal } from "./notion/errors.js"
import { type LiveReads, liveReads } from "./notion/notion.js"
import { notionClock } from "./notion/port.js"
import { type LiveWrites, liveWrites } from "./notion/writes.js"

/** What a test hands `run()` beside cli-core's own: the fake Notion in place of the network (WC-ARCH-10). */
export interface ServiceEnvironment extends BaseEnvironment {
  fetch?: typeof fetch
  /** Notion's retry and pace waits; a test passes one that only counts them (WC-TEST-3). */
  sleep?: SleepLike
  /** The clock those waits run on, in ms; a test's `sleep` moves it, or the pace would wait on real time. */
  now?: () => number
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

/** Notion's transport for one run: hostFetch, paced per profile, a slower pace of its own for data source queries. */
const transportOf = (command: Command, events: EventSink | undefined, onAnswer?: (response: Response) => void) => {
  const { environment, env, profile } = contextOf(command)
  const pace = pacePathFor(IDENTITY, profile, env)
  const now = environment.now ?? Date.now
  return {
    events,
    ...(onAnswer ? { onAnswer } : {}),
    signal: environment.signal,
    fetch: environment.fetch,
    pacer: new Pacer(pace, PACE, now),
    ...(environment.sleep ? { sleep: environment.sleep } : {}),
    ...(environment.now ? { now: () => new Date(now()) } : {}),
    queryPacer: new Pacer(pace.replace(/\.json$/u, ".queries.json"), QUERY_PACE, now),
  }
}

/** Notion for one run: the SDK over the run's transport. */
export const notionFor = (command: Command, token: string, events: EventSink): LiveReads =>
  liveReads(notionClient({ token, ...transportOf(command, events) }))

/**
 * The sync's requests: the calls wirecat.config.ts names, sent by cli-core's `api` request path over the same
 * transport, with the config's headers and Notion's refusals. Notion's clock comes from the Date header of every
 * answer, never from this computer's.
 */
export const notionCallFor = (command: Command, token: string, events: EventSink) => {
  const clock = notionClock()
  const call = serviceApiCall({
    manifest: API.manifest,
    service: NOTION,
    fetch: notionFetch(transportOf(command, events, clock.observe)),
    token: () => token,
    headers: () => ({ ...HEADERS }),
    failure: (status, answer) => notionRefusal(status, answer),
  })
  return { call, serverTime: clock.time }
}

/** The same transport for the generated `api` commands, each attempt recorded in the run, as the SDK's are. */
export const notionFetchFor = (command: Command) => notionFetch(transportOf(command, undefined))

/**
 * Every Notion call goes through here: inside cli-core's run, so `--timeout` bounds it, a failure or `--record` keeps
 * a run named after the command, and the client's requests land in that run (WC-LIFE-5, WC-LIFE-15).
 */
export const withNotion = <T>(command: Command, body: (notion: LiveReads) => Promise<T>): Promise<T> => {
  const token = tokenOf(command)
  return contextOf(command).run((events) => body(notionFor(command, token, events)))
}

/** The writes' client for one run, the same transport as the reads'; the token is read before the write is guarded. */
export const notionWritesFor = (command: Command, token: string, events: EventSink): LiveWrites =>
  liveWrites(notionClient({ token, ...transportOf(command, events) }))
