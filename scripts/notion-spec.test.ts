import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { adaptOpenApi } from "@wirecat/cli-base/codegen"
import { describe, expect, it } from "vitest"
import { normalizeNotionSpec } from "./notion-spec.ts"

const version = { name: "Notion-Version", in: "header", required: true, schema: { enum: ["2026-03-11"] } }
const tiny = {
  openapi: "3.1.0",
  info: { title: "t", version: "1.0.0" },
  paths: {
    "/v1/pages/{page_id}": {
      get: {
        operationId: "retrieve-a-page",
        parameters: [{ name: "page_id", in: "path", required: true, schema: { type: "string" } }, version],
        responses: { "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/page" } } } } },
      },
    },
    "/v1/oauth/token": {
      post: { operationId: "create-a-token", security: [{ basicAuth: [] }], parameters: [version] },
    },
    "/v1/file_uploads/{id}/send": {
      post: {
        operationId: "upload-file",
        parameters: [version],
        requestBody: { content: { "multipart/form-data": { schema: { type: "object" } } } },
      },
    },
  },
  components: {
    schemas: {
      page: {
        type: "object",
        properties: {
          icon: { anyOf: [{ $ref: "#/components/schemas/emoji" }, { type: "null" }] },
          anyOf: { type: "string" },
          ratio: { type: "number", exclusiveMinimum: 0, exclusiveMaximum: 1 },
          always: { type: "null", description: "never set" },
        },
      },
      json: {
        oneOf: [
          { type: "string" },
          { type: "number" },
          { type: "boolean" },
          { type: "null" },
          { type: "array", items: { $ref: "#/components/schemas/json" } },
          { type: "object", additionalProperties: { $ref: "#/components/schemas/json" } },
        ],
      },
      emoji: { type: "object", properties: { emoji: { type: "string" } }, maxProperties: 2 },
    },
  },
}

describe("Notion's spec as cli-base's strict adapter reads it", () => {
  it("pins the version, leaves out OAuth and multipart, and keeps nullability", () => {
    const { document, version: pinned, excluded, counts } = normalizeNotionSpec(structuredClone(tiny))
    expect(pinned).toBe("2026-03-11")
    expect(excluded.map(({ id }) => id)).toEqual(["create-a-token", "upload-file"])
    expect(counts).toEqual({
      "Notion-Version": 1,
      anyOf: 1,
      nullMember: 2,
      anyJson: 1,
      nullOnly: 1,
      exclusiveMinimum: 1,
      exclusiveMaximum: 1,
      maxProperties: 1,
    })
    const model = adaptOpenApi(document)
    expect(model.operations.map((op) => op.parameters.map((p) => p.name))).toEqual([["page_id"]])
    const page = model.schemas.find((one) => one.id === "page")?.schema
    expect(page).toMatchObject({
      type: "object",
      properties: {
        icon: { type: "union", nullable: true, of: [{ type: "ref", ref: "emoji" }] },
        anyOf: { type: "string" },
        always: { type: "unknown" },
      },
    })
    expect(model.schemas.find((one) => one.id === "json")?.schema).toMatchObject({ type: "unknown" })
  })

  it("refuses a spec that pins no single version", () => {
    const loose = structuredClone(tiny)
    loose.paths["/v1/pages/{page_id}"].get.parameters[1] = { ...version, schema: { enum: ["a", "b"] } }
    expect(() => normalizeNotionSpec(loose)).toThrow(/one Notion-Version/)
  })

  it("passes the strict check for the saved snapshot", () => {
    const text = readFileSync(resolve(import.meta.dirname, "../spec/notion/openapi.json"), "utf8")
    const { document, excluded } = normalizeNotionSpec(JSON.parse(text))
    expect(adaptOpenApi(document).operations.length + excluded.length).toBe(66)
  })
})
