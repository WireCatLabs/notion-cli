import { APIResponseError, isHTTPResponseError, RequestTimeoutError } from "@notionhq/client"
import { CliError, isCliError } from "@wirecat/cli-base"
import { providerWaitMs, statusToCode } from "@wirecat/cli-base/http"
import { defineReasons } from "@wirecat/cli-base/standards"
import { NOTION } from "./client.js"

/** notion's own reasons; the shared ones (`session.missing`, `offline.refused`, `provider.*`) are cli-core's and cli-base's. */
export const REASONS = defineReasons(
  (
    [
      ["notion.token-refused", "authentication_error", "Notion refused the token"],
      ["notion.restricted", "permission_error", "the token may not read or change this"],
      ["notion.blocked", "permission_error", "Notion has restricted this connection's API access"],
      ["notion.not-shared", "not_found", "no such page or database, or it is not shared with this token"],
      ["notion.refused", "validation_error", "Notion refused the request as it was sent"],
      ["notion.conflict", "conflict", "Notion could not save it because it changed at the same time"],
      ["notion.rate-limited", "rate_limited", "Notion asked to slow down"],
      ["notion.unavailable", "provider_unavailable", "Notion is down or overloaded"],
      ["notion.invalid-response", "invalid_response", "Notion's answer does not have the documented shape"],
      ["notion.id-invalid", "validation_error", "that is not a Notion id or link"],
    ] as const
  ).map(([reason, code, message]) => ({ reason, code, message, details: [] })),
)

/** Notion's error code and rate-limit reason are fixed words from its docs, never text it was sent. */
export const DETAILS = ["notion_code", "rate_limit_reason"]

const SIGN_IN = "sign in again with `notion <profile> session start`"

const additional = (error: APIResponseError, key: string): string | undefined => {
  const value = error.additional_data?.[key]
  return typeof value === "string" ? value : undefined
}

/**
 * Every Notion refusal as a CliError, by Notion's documented codes
 * ([status codes](https://developers.notion.com/reference/status-codes)). Notion's own message is never repeated: it
 * can quote what was sent, and names a connection (WC-SECR-6).
 */
export const failureOf = (error: unknown): unknown => {
  if (isCliError(error)) return error
  if (error instanceof RequestTimeoutError)
    return new CliError("timeout", `${NOTION} did not answer in time`, { retryable: true })
  if (!isHTTPResponseError(error)) return error
  const status = error.status
  const notion = APIResponseError.isAPIResponseError(error) ? error : undefined
  const code = notion?.code ?? "unknown"
  const base = {
    status,
    notion_code: code,
    ...(error.request_id ? { request_id: error.request_id } : {}),
  }
  if (code === "unauthorized" || status === 401)
    return new CliError("authentication_error", `${NOTION} refused the token; ${SIGN_IN}`, {
      ...base,
      reason: "notion.token-refused",
    })
  if (code === "rate_limited" || status === 429 || code === "service_overload" || status === 529) {
    const reason = notion ? additional(notion, "rate_limit_reason") : undefined
    if (reason === "public_api_request_blocked")
      return new CliError(
        "permission_error",
        `${NOTION} has restricted this connection's API access; retrying will not help, contact Notion support`,
        { ...base, rate_limit_reason: reason, reason: "notion.blocked" },
      )
    const wait = error.headers instanceof Headers ? providerWaitMs(error.headers, () => new Date()) : undefined
    return new CliError("rate_limited", `${NOTION} asked to slow down; run the command again later`, {
      ...base,
      ...(reason ? { rate_limit_reason: reason } : {}),
      ...(wait === undefined ? {} : { retry_after_ms: wait }),
      retryable: true,
      reason: "notion.rate-limited",
    })
  }
  if (code === "restricted_resource" || status === 403)
    return new CliError("permission_error", `${NOTION} says this token may not do that`, {
      ...base,
      reason: "notion.restricted",
    })
  if (code === "object_not_found" || status === 404)
    return new CliError(
      "not_found",
      `${NOTION} has no such page or database, or it is not shared with this token: in Notion, open it, ` +
        "choose ••• → Connections, and add the connection",
      { ...base, reason: "notion.not-shared" },
    )
  if (code === "conflict_error" || status === 409)
    return new CliError("conflict", `${NOTION} could not save it because it changed at the same time`, {
      ...base,
      reason: "notion.conflict",
    })
  if (status >= 500)
    return new CliError("provider_unavailable", `${NOTION} is unavailable (HTTP ${status}); try again later`, {
      ...base,
      retryable: true,
      reason: "notion.unavailable",
    })
  const refused = statusToCode(status) === "validation_error"
  return new CliError(
    refused ? "validation_error" : "provider_error",
    `${NOTION} refused the request (HTTP ${status}, ${code})`,
    {
      ...base,
      reason: refused ? "notion.refused" : "provider.refused",
    },
  )
}

/** An SDK call with its failure mapped; a CliError from the fetch chain passes through as it is. */
export const mapped = async <T>(call: () => Promise<T>): Promise<T> => {
  try {
    return await call()
  } catch (error) {
    throw failureOf(error)
  }
}
