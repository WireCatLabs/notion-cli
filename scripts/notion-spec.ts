type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value)

/** cli-base's adapter refuses these; each only narrows what a request may hold, so dropping one accepts more. */
const DROPPED = ["exclusiveMinimum", "exclusiveMaximum", "maxProperties"] as const

const METHODS = ["get", "post", "put", "patch", "delete", "head"]

export interface Normalized {
  document: Json
  /** The one `Notion-Version` every operation declares, taken off each so no command asks for it. */
  version: string
  excluded: { id: string; reason: string }[]
  counts: Record<string, number>
}

const isNull = (member: unknown): boolean =>
  isObject(member) &&
  member.type === "null" &&
  Object.keys(member).every((key) => key === "type" || key === "description")

/**
 * OpenAPI 3.1 as cli-base's strict adapter reads it: `oneOf: [T, {type: "null"}]` is `nullable`, `anyOf` is a union,
 * which is what `oneOf` becomes there, and a field that is only ever `null` takes any value.
 */
const schema = (node: unknown, counts: Record<string, number>): unknown => {
  if (Array.isArray(node)) return node.map((one) => schema(one, counts))
  if (!isObject(node)) return node
  const count = (key: string, by = 1) => {
    counts[key] = (counts[key] ?? 0) + by
  }
  if (node.oneOf !== undefined && node.anyOf !== undefined) throw new Error("a schema with both anyOf and oneOf")
  const out: Json = {}
  for (const [key, value] of Object.entries(node)) {
    if ((DROPPED as readonly string[]).includes(key)) count(key)
    else if (key === "properties" && isObject(value))
      out[key] = Object.fromEntries(Object.entries(value).map(([name, field]) => [name, schema(field, counts)]))
    else if ((key === "oneOf" || key === "anyOf") && Array.isArray(value)) {
      if (key === "anyOf") count("anyOf")
      const members = value.filter((member) => !isNull(member))
      if (members.length < value.length) {
        count("nullMember", value.length - members.length)
        out.nullable = true
      }
      out.oneOf = schema(members, counts)
    } else out[key] = schema(value, counts)
  }
  if (out.type === "null") {
    count("nullOnly")
    delete out.type
  }
  return out
}

const REF = "#/components/schemas/"

/**
 * cli-base merges only objects in an allOf, so one union member, inline or behind a reference, is distributed:
 * A and (B or C) is (A and B) or (A and C).
 */
const distribute = (node: unknown, components: Json, counts: Record<string, number>): unknown => {
  if (Array.isArray(node)) return node.map((one) => distribute(one, components, counts))
  if (!isObject(node)) return node
  const out = Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, distribute(value, components, counts)]),
  ) as Json
  if (!Array.isArray(out.allOf)) return out
  const unionOf = (member: unknown, seen = new Set<string>()): Json | undefined => {
    if (!isObject(member)) return undefined
    if (Array.isArray(member.oneOf)) return member
    if (typeof member.$ref !== "string" || !member.$ref.startsWith(REF) || seen.has(member.$ref)) return undefined
    seen.add(member.$ref)
    return unionOf(components[member.$ref.slice(REF.length)], seen)
  }
  const unions = out.allOf.filter((member) => unionOf(member))
  if (unions.length !== 1) return out
  counts.allOfUnion = (counts.allOfUnion ?? 0) + 1
  const [member] = unions
  const union = unionOf(member) as Json
  const rest = out.allOf.filter((one) => one !== member)
  const { allOf: _, ...own } = out
  return distribute(
    {
      ...own,
      ...(union.nullable ? { nullable: true } : {}),
      oneOf: (union.oneOf as unknown[]).map((one) => ({ allOf: [...rest, one] })),
    },
    components,
    counts,
  )
}

/** string, number, boolean, null, arrays and maps of itself: any JSON value, which cli-base's types cannot name. */
const isAnyJson = (id: string, node: unknown): boolean => {
  if (!isObject(node) || !Array.isArray(node.oneOf)) return false
  const self = { $ref: `${REF}${id}` }
  const has = (wanted: unknown) =>
    (node.oneOf as unknown[]).some((one) => JSON.stringify(one) === JSON.stringify(wanted))
  return (
    ["string", "number", "boolean"].every((type) => has({ type })) &&
    has({ type: "array", items: self }) &&
    has({ type: "object", additionalProperties: self })
  )
}

const parameterOf = (document: Json, parameter: unknown): Json => {
  const ref = isObject(parameter) ? parameter.$ref : undefined
  if (typeof ref !== "string") return isObject(parameter) ? parameter : {}
  const parameters = isObject(document.components) ? document.components.parameters : undefined
  const found = isObject(parameters) ? parameters[ref.replace("#/components/parameters/", "")] : undefined
  return isObject(found) ? found : {}
}

const isVersion = (document: Json, parameter: unknown): boolean => {
  const source = parameterOf(document, parameter)
  return source.in === "header" && String(source.name).toLowerCase() === "notion-version"
}

const excludedReason = (operation: Json): string | undefined => {
  const security = Array.isArray(operation.security) ? operation.security : []
  if (security.some((one) => isObject(one) && "basicAuth" in one))
    return "OAuth: signs in with the connection's client secret and carries tokens; never a generated command"
  const content = isObject(operation.requestBody) ? operation.requestBody.content : undefined
  if (isObject(content) && !("application/json" in content))
    return `sends ${Object.keys(content).join(", ")}, which the generated command cannot send`
  return undefined
}

export const normalizeNotionSpec = (source: Json): Normalized => {
  const counts: Record<string, number> = {}
  const excluded: Normalized["excluded"] = []
  const versions = new Set<string>()
  const paths: Json = {}
  for (const [path, item] of Object.entries(isObject(source.paths) ? source.paths : {})) {
    if (!isObject(item)) continue
    const kept: Json = {}
    for (const [method, operation] of Object.entries(item)) {
      if (!METHODS.includes(method) || !isObject(operation)) {
        kept[method] = operation
        continue
      }
      const reason = excludedReason(operation)
      if (reason) {
        excluded.push({ id: String(operation.operationId), reason })
        continue
      }
      const parameters = Array.isArray(operation.parameters) ? operation.parameters : []
      for (const parameter of parameters.filter((one) => isVersion(source, one))) {
        const values = parameterOf(source, parameter).schema
        const allowed = isObject(values) && Array.isArray(values.enum) ? values.enum : []
        for (const one of allowed) versions.add(String(one))
        counts["Notion-Version"] = (counts["Notion-Version"] ?? 0) + 1
      }
      kept[method] = { ...operation, parameters: parameters.filter((one) => !isVersion(source, one)) }
    }
    if (Object.keys(kept).some((key) => METHODS.includes(key))) paths[path] = kept
  }
  if (versions.size !== 1) throw new Error(`expected one Notion-Version, found ${[...versions].join(", ") || "none"}`)
  const [version] = versions as Set<string> & [string]
  const components = isObject(source.components) ? source.components : {}
  const normalized = schema({ ...source, paths, components }, counts) as Json
  const named = isObject(normalized.components) ? normalized.components.schemas : undefined
  if (isObject(named))
    for (const [id, node] of Object.entries(named))
      if (isAnyJson(id, node)) {
        counts.anyJson = (counts.anyJson ?? 0) + 1
        named[id] = { description: (node as Json).description ?? "any JSON value" }
      }
  const schemas = (isObject(normalized.components) ? normalized.components.schemas : undefined) ?? {}
  const document = distribute(normalized, isObject(schemas) ? schemas : {}, counts) as Json
  return { document, version, excluded, counts }
}
