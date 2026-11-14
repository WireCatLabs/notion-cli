import { type APIErrorCode, APIResponseError } from "@notionhq/client"
import { CliError } from "@wirecat/cli-base"
import type { ManifestOperation } from "@wirecat/cli-base/codegen"
import { annotate } from "@wirecat/cli-base/commands"
import {
  checkApiBody,
  checkApiParameter,
  generatedApiCommand,
  httpApiExecutor,
  itemOf,
  listOf,
  NO_EFFECTS,
  outputFor,
  queryTerms,
  renderAnswer,
  termField,
  terminalAsker,
  withQuery,
} from "@wirecat/cli-core/cli"
import { guardedWrite, guardFor, keyedGuard, levelFor, newOperationId } from "@wirecat/cli-core/sends"
import { Command } from "commander"
import { permissions } from "../config.js"
import { contextOf, notionFetchFor, tokenOf } from "../context.js"
import { operations } from "../generated/manifest.js"
import { excluded, NOTION_VERSION } from "../generated/metadata.js"
import { IDENTITY } from "../identity.js"
import { API_HOST } from "../notion/client.js"
import { failureOf } from "../notion/errors.js"

const CLI = IDENTITY.command
export const NOTION_API = `https://${API_HOST}`

const keyOf = (operation: ManifestOperation) => `api.${operation.command}`

/** Every write's one path, as the comments sample's: the level for `api.<operation>` refuses or asks once. */
const guardedApiWrite = async (command: Command, operation: ManifestOperation, send: () => Promise<unknown>) => {
  const { settings, env, renderer, run } = contextOf(command)
  const key = keyOf(operation)
  const operationId = newOperationId()
  const levelOfKey = (one: string) => levelFor(settings.permissions, one, permissions.defaults).level
  const guard = keyedGuard(
    (ask) =>
      guardFor(
        IDENTITY,
        { ...settings, sendsPerHour: Number.MAX_SAFE_INTEGER, permissionDefaults: permissions.defaults },
        renderer.warn,
        env,
        ask,
      ),
    terminalAsker(command),
    levelOfKey,
    [],
  )
  const request = { chatId: null, kind: "edit" as const, key, operationId }
  guard.refuse(request)
  try {
    const result = await guardedWrite(guard, request, () => run(() => send()))
    return { operation_id: operationId, result }
  } catch (error) {
    if (error instanceof CliError && error.code === "outcome_unknown")
      throw new CliError("outcome_unknown", error.message, { ...error.details, operation_id: operationId })
    throw error
  }
}

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

const execute = httpApiExecutor({
  service: "Notion",
  baseUrl: NOTION_API,
  fetch: notionFetchFor,
  headers: (command) => ({ authorization: `Bearer ${tokenOf(command)}`, "notion-version": NOTION_VERSION }),
  write: guardedApiWrite,
  read: (command, _operation, send) => contextOf(command).run(() => send()),
  failure: (status, answer) => notionRefusal(status, answer),
})

/** The schemas are 0.5 MB of code, loaded only once an `api` command is about to check its input. */
let schemas: typeof import("../generated/schemas.js")["schemas"] | undefined
const loadSchemas = async () => {
  schemas ??= (await import("../generated/schemas.js")).schemas
}
const loaded = () => {
  if (!schemas) throw new CliError("configuration_error", "the api schemas were not loaded before the command ran")
  return schemas
}

const checkParameter = (name: string, schema: ManifestOperation["parameters"][number]["schema"], raw: string) =>
  checkApiParameter(name, schema, raw, loaded())
const checkBody = (operation: ManifestOperation, text: string | undefined) => checkApiBody(operation, text, loaded())

const operationOf = (name: string): ManifestOperation => {
  const found = operations.find((operation) => operation.command === name || operation.id === name)
  if (found) return found
  const left = excluded.find((one) => one.id === name)
  throw new CliError(
    "not_found",
    left ? `${name} is not offered: ${left.reason}` : `no Notion API operation ${name}; see ${CLI} api list`,
  )
}

const rowOf = (operation: ManifestOperation) => ({
  command: operation.command,
  method: operation.binding.kind === "http" ? operation.binding.method : "",
  path: operation.binding.kind === "http" ? operation.binding.path : "",
  effect: operation.effect,
  summary: operation.summary ?? "",
})

const API_QUERY = {
  entity: "api_operation",
  backend: "native",
  fields: [
    termField("effect", "enum", "effect:destructive", { values: ["read", "write", "destructive"] }),
    termField("tag", "kw", "tag:Pages"),
  ],
} as const

const listCommand = () =>
  withQuery(
    annotate(new Command("list"), {
      effects: NO_EFFECTS,
      examples: [`${CLI} api list`, `${CLI} api list effect:destructive --json=command,path`],
    }),
    API_QUERY,
  )
    .description("list every Notion API operation this CLI offers, without calling Notion")
    .action(function (this: Command, words: string[]) {
      const terms = queryTerms(words, API_QUERY, "api list")
      const effect = terms.get("effect")
      const tag = terms.get("tag")
      const items = operations
        .filter((one) => (!effect || one.effect === effect) && (!tag || one.tags.includes(tag)))
        .map(rowOf)
      renderAnswer(this, outputFor(this), listOf("api list", { items, limit: items.length, has_more: false }))
    })

const showCommand = () =>
  annotate(new Command("show"), {
    effects: NO_EFFECTS,
    examples: [`${CLI} api show retrieve-a-page --json`],
  })
    .description("show one operation's parameters and request schema, without calling Notion")
    .argument("<operation>", "the operation, as api list prints it")
    .action(async function (this: Command, name: string) {
      const operation = operationOf(name)
      const { definitions } = await import("../generated/definitions.js")
      const schema = operation.request?.schema ? definitions[operation.request.schema] : undefined
      renderAnswer(
        this,
        outputFor(this),
        itemOf({ operation, notion_version: NOTION_VERSION, ...(schema ? { request_schema: schema } : {}) }),
      )
    })

export const apiCommand = (): Command => {
  const generated = generatedApiCommand({
    operations,
    description: "every operation of Notion's public API, generated from its OpenAPI document",
    checkParameter,
    checkBody,
    execute,
  })
  const api = annotate(new Command("api"), { effects: NO_EFFECTS }).description(
    "the raw Notion API, one command per operation of its OpenAPI document",
  )
  api.addCommand(listCommand()).addCommand(showCommand())
  for (const child of generated.commands) api.addCommand(child.hook("preAction", loadSchemas))
  return api
}
