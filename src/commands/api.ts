import { type APIErrorCode, APIResponseError } from "@notionhq/client"
import { CliError } from "@wirecat/cli-base"
import { serviceApiCommand } from "@wirecat/cli-core/cli"
import type { Command } from "commander"
import { API, configuration } from "../config.js"
import { notionFetchFor, tokenOf } from "../context.js"
import { excluded, NOTION_VERSION } from "../generated/metadata.js"
import { IDENTITY } from "../identity.js"
import { failureOf } from "../notion/errors.js"

/**
 * Notion's refusal by its documented code, as the SDK commands map it. A 429 or 529 keeps the shared refusal, which
 * reads the wait from the answer's headers; a blocked connection is already refused by the client.
 */
const notionRefusal = (status: number, answer: unknown): CliError | undefined => {
  if (status === 429 || status === 529) return undefined
  const body = (answer ?? {}) as { code?: unknown; additional_data?: unknown; request_id?: unknown }
  const failed = failureOf(
    new APIResponseError({
      code: (typeof body.code === "string" ? body.code : "unknown") as APIErrorCode,
      status,
      message: "",
      headers: new Headers(),
      rawBodyText: "",
      additional_data:
        body.additional_data && typeof body.additional_data === "object"
          ? (body.additional_data as Record<string, string | string[]>)
          : undefined,
      request_id: typeof body.request_id === "string" ? body.request_id : undefined,
    }),
  )
  return failed instanceof CliError ? failed : undefined
}

/**
 * Notion's raw API from its OpenAPI document through cli-core's shared group: `api list`, `api show` and one command
 * per operation. Each write asks or refuses by `api.<operation>`, and one that deletes, by its method or its body, by
 * `documents.delete` too (src/config.ts). The requests take the SDK commands' transport: the profile's pace and the
 * run's record.
 */
export const apiCommand = (): Command =>
  serviceApiCommand({
    ...API,
    app: IDENTITY,
    configuration,
    fetch: notionFetchFor,
    token: tokenOf,
    headers: () => ({ "notion-version": NOTION_VERSION }),
    failure: (status, answer) => notionRefusal(status, answer),
    excluded,
    shown: { notion_version: NOTION_VERSION },
    schemas: () => import("../generated/schemas.js").then((module) => module.schemas),
    definitions: () => import("../generated/definitions.js").then((module) => module.definitions),
  })
