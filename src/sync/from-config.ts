import type { ServiceApiCall } from "@wirecat/cli-core/cli"
import { documentSourceFromManifest } from "@wirecat/cli-core/documents/cli"
import { API } from "../config.js"
import { SOURCE } from "../generated/wirecat-config.js"
import { manifestPort } from "../notion/port.js"
import type { NotionSource } from "./browse.js"
import type { NotionFile, NotionSourceOptions, UserAccess } from "./files.js"
import { notionSource } from "./source.js"

const ACCESS_RANK: Record<UserAccess, number> = { none: 0, names: 1, emails: 2 }

export interface NotionConfigSourceOptions extends NotionSourceOptions {
  /** Notion's clock, from the Date header of its latest answer (`notionClock`). */
  serverTime?: () => number | undefined
}

/**
 * The sync's source as wirecat.config.ts describes it: the account and every request from the calls it names, the
 * rest as hooks. The resumable pass, the block tree and a row's container are Notion's own and stay code here.
 */
export const notionSourceFromConfig = (call: ServiceApiCall, options: NotionConfigSourceOptions = {}): NotionSource => {
  const { serverTime, ...rest } = options
  return documentSourceFromManifest<NotionFile>(SOURCE, {
    api: API.manifest,
    call,
    hooks: ({ read, base }) => ({
      ...notionSource(manifestPort(read, serverTime), rest),
      // Only a page or a row has authors and comments. One read with less user information than the connection gives
      // now is read again too, so its people are linked once the owner grants email addresses, and so is one read
      // before the sync kept comments.
      reread: (saved) => {
        const { kind, authors, comments } = saved.metadata.providerMetadata
        if (kind !== "page" && kind !== "row") return false
        if (base.reread?.(saved) || comments === undefined) return true
        const access = options.access?.()
        return authors !== undefined && access !== undefined && ACCESS_RANK[authors] < ACCESS_RANK[access]
      },
    }),
  }) as NotionSource
}
