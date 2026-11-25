import { serviceApiCommand } from "@wirecat/cli-core/cli"
import type { Command } from "commander"
import { API, configuration } from "../config.js"
import { notionFetchFor, tokenOf } from "../context.js"
import { excluded, NOTION_VERSION } from "../generated/metadata.js"
import { HEADERS } from "../generated/wirecat-config.js"
import { IDENTITY } from "../identity.js"
import { notionRefusal } from "../notion/errors.js"

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
    headers: () => ({ ...HEADERS }),
    failure: (status, answer) => notionRefusal(status, answer),
    excluded,
    shown: { notion_version: NOTION_VERSION },
    schemas: () => import("../generated/schemas.js").then((module) => module.schemas),
    definitions: () => import("../generated/definitions.js").then((module) => module.definitions),
  })
