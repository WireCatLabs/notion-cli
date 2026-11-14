import { Readable } from "node:stream"
import { type KeyringStore, memoryKeyring } from "@wirecat/cli-base"
import type { RunOptions } from "@wirecat/cli-core/cli"
import type { ServiceEnvironment } from "../context.js"
import { run } from "../program.js"
import { fakeComments } from "./fake-comments.js"
import { FAKE_TOKEN, type FakeNotion, fakeNotion } from "./fake-notion.js"

/** A keyring where profile `personal` is already signed in to the fake service; never the real one (WC-TEST-2). */
export const signedIn = (): KeyringStore => memoryKeyring({ "notion-cli:token:personal": FAKE_TOKEN })

export interface Ran {
  code: number
  out: string
  err: string
  /** Every retry or pace wait, in ms; nothing really waits. */
  waits: number[]
  /** stdout parsed, or the error object from stderr. */
  json: () => Record<string, unknown>
}

/** Notion's requests to its fake, the sample's to its own. */
export const bothFakes =
  (notion: FakeNotion, service: ReturnType<typeof fakeComments>): typeof fetch =>
  (input, init) =>
    new URL(input instanceof Request ? input.url : String(input)).hostname === "api.notion.com"
      ? notion.fetch(input, init)
      : service.fetch(input, init)

/** The CLI through its own `run()`, as a person or an agent types it, against the fake service (WC-TEST-6). */
export const runCli = async (
  argv: string[],
  {
    service = fakeComments(),
    notion = fakeNotion(),
    keyring = signedIn(),
    stdin,
    env,
    answer,
    tty = false,
  }: {
    service?: ReturnType<typeof fakeComments>
    notion?: FakeNotion
    keyring?: KeyringStore
    stdin?: string
    env?: NodeJS.ProcessEnv
    /** The owner's answer to a question; cli-core never asks under --json, so a test of `ask` leaves it out. */
    answer?: (question: string) => string | null
    /** A person at a terminal, who gets text instead of JSON. */
    tty?: boolean
  } = {},
): Promise<Ran> => {
  const out: string[] = []
  const waits: number[] = []
  const err: string[] = []
  const options: RunOptions & ServiceEnvironment = {
    streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
    tty,
    keyring,
    fetch: bothFakes(notion, service),
    sleep: async (ms) => {
      waits.push(ms)
    },
    ...(env ? { env: { ...process.env, ...env } } : {}),
    ...(answer ? { answer } : {}),
    ...(stdin === undefined ? {} : { stdin: Object.assign(Readable.from([stdin]), { isTTY: false }) }),
  }
  const code = await run(argv, options)
  const text = { out: out.join(""), err: err.join("") }
  return { code, ...text, waits, json: () => JSON.parse(text.out.trim() || text.err.trim()) as Record<string, unknown> }
}
