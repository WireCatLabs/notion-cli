import { APIResponseError, isHTTPResponseError, RequestTimeoutError } from "@notionhq/client"
import { CliError, isCliError } from "@wirecat/cli-base"
import { providerWaitMs, statusToCode } from "@wirecat/cli-base/http"
import { defineReasons } from "@wirecat/cli-base/standards"

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
      ["notion.truncated", "provider_error", "Notion gave only part of the page"],
      ["notion.no-workspace", "invalid_response", "Notion did not name the token's workspace"],
      ["notion.failed", "provider_error", "a Notion read failed"],
      ["notion.search-incomplete", "provider_error", "Notion cut the search for edits short"],
      ["notion.window-too-dense", "validation_error", "more than 10,000 rows of one database share one minute"],
      ["notion.search-capped", "provider_error", "Notion's search gave only its 10,000 most recent results"],
      ["notion.database-unreadable", "not_found", "a database search listed could not be read"],
      ["notion.child-unreadable", "not_found", "a child page or database Notion would not give was left out"],
      ["notion.kept-unconfirmed", "permission_error", "a page Notion would not show was kept as it was"],
      ["notion.left-out", "not_found", "an item Notion refused was left out of this sync"],
      ["notion.stopped-early", "provider_error", "the sync stopped early and goes on next time"],
      ["notion.listing-restarted", "validation_error", "Notion no longer took a saved list position; it started over"],
      ["notion.timeout-too-short", "timeout", "the time left was too short for one step of the sync"],
      ["source.text-limit", "validation_error", "the page is longer than the text the store keeps"],
      ["profile.not-synced", "not_found", "the profile has no local copy yet; sync first"],
      ["profile.busy", "provider_unavailable", "another sync or write holds the profile's local copy"],
      ["state.unreadable", "configuration_error", "the profile's sync state cannot be read"],
      ["folder.not-a-folder", "validation_error", "only a page or a database can be chosen as a folder"],
      ["folder.not-chosen", "not_found", "that page or database is not a chosen folder"],
      ["folder.workspace", "validation_error", "the whole workspace is the scope when no folder is chosen"],
      ["identity.not-seen", "not_found", "this Notion user was not seen on the document"],
      ["identity.target", "validation_error", "the target must be a person: reference"],
      ["identity.no-person", "not_found", "the target person has no known identity"],
      ["profile.account-taken", "conflict", "another profile already uses this Notion connection", ["profile"]],
      ["profile.other-account", "conflict", "the profile's local copy was synced from another Notion connection"],
    ] as const
  ).map(([reason, code, message, details = []]) => ({ reason, code, message, details: [...details] })),
)

/** Notion's error code and rate-limit reason are fixed words from its docs, never text it was sent. */
export const DETAILS = ["notion_code", "rate_limit_reason"]

export const NOTION = "Notion"

/** A 429 with this reason is not a pace to wait out: "Retrying won't help" (Notion's request limits page). */
export const BLOCKED = "public_api_request_blocked"

export const blocked = (base: Record<string, unknown> = {}): CliError =>
  new CliError(
    "permission_error",
    `${NOTION} has restricted this connection's API access; retrying will not help, contact Notion support`,
    { ...base, rate_limit_reason: BLOCKED, reason: "notion.blocked" },
  )

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
    if (reason === BLOCKED) return blocked(base)
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
