import { Client } from "@notionhq/client"
import { CliError, type SleepLike } from "@wirecat/cli-base"
import { type FetchLike, hostFetch, type PacerLike, retrying, statusToCode } from "@wirecat/cli-base/http"
import { type EventSink, providerRequest } from "@wirecat/cli-core/cli"
import { BLOCKED, blocked, NOTION } from "./errors.js"

export const API_HOST = "api.notion.com"
/** The API version every request names ([versioning](https://developers.notion.com/reference/versioning)). */
export const NOTION_VERSION = "2026-03-11"

/** Notion ends a request after 60 s ([status codes](https://developers.notion.com/reference/status-codes), 503). */
const EXCHANGE_MS = 70_000
const LARGEST_ANSWER = 16 * 1024 * 1024
/** A pace or retry wait longer than this ends the run with `rate_limited` instead of sitting in it. */
const LONGEST_WAIT_MS = 60_000
/** Notion's guide retries 429 and 529 with `Retry-After`, then backs off ([request limits](https://developers.notion.com/reference/request-limits)). */
const RETRY = { retries: 3, baseDelayMs: 500, maxDelayMs: 10_000, maxRetryAfterMs: LONGEST_WAIT_MS }

/** 180 a minute per connection, the lower plan's limit; data source queries have a slower limit of their own. */
export const PACE = { perMinute: 170, burst: 10 }
export const QUERY_PACE = { perMinute: 60, burst: 3 }

const ID = /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/giu
const QUERY = /^\/v1\/data_sources\/[^/]+\/query$/u
const READ_POSTS = [/^\/v1\/search$/u, QUERY]

/** The run record keeps the path's shape, never a page id (WC-LIFE-15). */
export const operationOf = (method: string, url: URL) => `${method} ${url.pathname.replace(ID, ":id")}`

/** Search and data source queries are POST, yet read nothing but answers: they may be sent again. */
export const isRead = (method: string, url: URL) =>
  method === "GET" || (method === "POST" && READ_POSTS.some((path) => path.test(url.pathname)))

export interface NotionClientOptions {
  token: string
  fetch?: FetchLike | undefined
  signal?: AbortSignal | undefined
  events?: EventSink | undefined
  pacer?: PacerLike | undefined
  /** The data source queries' own pace, taken on top of `pacer`. */
  queryPacer?: PacerLike | undefined
  sleep?: SleepLike
  now?: () => Date
  /** Sees every answer Notion gives, as `notionClock` does for its Date header. */
  onAnswer?: (response: Response) => void
}

const both = (first: PacerLike, second: PacerLike): PacerLike => ({
  reserve: async () => Math.max(await first.reserve(), await second.reserve()),
  holdFor: async (ms) => {
    await Promise.all([first.holdFor(ms), second.holdFor(ms)])
  },
})

/** The SDK reads the whole body as text; past the cap the stream fails, and the SDK passes that error on as it is. */
const bounded = (response: Response): Response => {
  if (!response.body) return response
  let bytes = 0
  const capped = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytes += chunk.byteLength
        if (bytes > LARGEST_ANSWER)
          controller.error(new CliError("invalid_response", `${NOTION}'s answer is over ${LARGEST_ANSWER} bytes`))
        else controller.enqueue(chunk)
      },
    }),
  )
  return new Response(capped, { status: response.status, statusText: response.statusText, headers: response.headers })
}

/** Notion's 429 body names why; a blocked connection must reach cli-base's retry as a failure, not a 429. */
const blockedAnswer = async (response: Response): Promise<boolean> => {
  try {
    const body = (await response.clone().json()) as { additional_data?: { rate_limit_reason?: unknown } }
    return body.additional_data?.rate_limit_reason === BLOCKED
  } catch {
    return false
  }
}

/**
 * One attempt: only api.notion.com, no redirect (it would carry the token elsewhere), the run's signal, and a record
 * of the call under its path template. A failure to reach Notion is already a retryable CliError from `hostFetch`.
 */
const attempt =
  (send: FetchLike, options: NotionClientOptions): FetchLike =>
  async (input, init = {}) => {
    const url = new URL(String(input))
    const method = (init.method ?? "GET").toUpperCase()
    const end = providerRequest(operationOf(method, url), options.events, { method, transport: "http" })
    try {
      const response = await send(url, {
        ...init,
        redirect: "error",
        ...(options.signal ? { signal: options.signal } : {}),
      })
      options.onAnswer?.(response)
      if (response.status === 429 && (await blockedAnswer(response))) {
        await response.body?.cancel().catch(() => {})
        throw blocked({ status: 429, notion_code: "rate_limited" })
      }
      end({ status: response.status, ...(response.ok ? {} : { errorCode: statusToCode(response.status) }) })
      return bounded(response)
    } catch (error) {
      end({ error, errorCode: error instanceof CliError ? error.code : "network_error" })
      throw error
    }
  }

/**
 * The only code that holds the token: the SDK puts it in the Authorization header. The SDK's own retries and console
 * logger are off: retries are cli-base's, paced by cli-core's Pacer, and the logger would print Notion's messages and
 * answer bodies (WC-SECR-6, WC-OUT-20).
 */
export const notionClient = (options: NotionClientOptions): Client => {
  const once = attempt(
    hostFetch({ hosts: [API_HOST], timeoutMs: EXCHANGE_MS, ...(options.fetch ? { fetch: options.fetch } : {}) }),
    options,
  )
  const common = {
    retry: RETRY,
    budget: LONGEST_WAIT_MS,
    reads: (method: string, url: URL) => isRead(method, url),
    ...(options.sleep ? { sleep: options.sleep } : {}),
    ...(options.now ? { now: options.now } : {}),
  }
  const general = retrying(once, { ...common, ...(options.pacer ? { pacer: options.pacer } : {}) })
  const queryPacer =
    options.pacer && options.queryPacer
      ? both(options.pacer, options.queryPacer)
      : (options.queryPacer ?? options.pacer)
  const queries = retrying(once, { ...common, ...(queryPacer ? { pacer: queryPacer } : {}) })
  const fetch: FetchLike = (input, init) =>
    (QUERY.test(new URL(String(input)).pathname) ? queries : general)(input, init)
  return new Client({
    auth: options.token,
    notionVersion: NOTION_VERSION,
    fetch: fetch as typeof globalThis.fetch,
    retry: false,
    timeoutMs: EXCHANGE_MS + LONGEST_WAIT_MS + 10_000,
    logger: () => {},
  })
}
