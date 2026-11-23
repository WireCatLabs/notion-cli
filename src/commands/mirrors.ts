import { CliError } from "@wirecat/cli-base"
import { outputFor, renderAnswer } from "@wirecat/cli-core/cli"
import { type FileMirrorWrite, fileMirrorsCommand, keepVersionsForDays } from "@wirecat/cli-core/documents/cli"
import { guardFor, keyedGuard, levelFor } from "@wirecat/cli-core/sends"
import type { Command } from "commander"
import { DELETE_KEY, MIRROR_KEYS, permissions } from "../config.js"
import { contextOf, notionFor, notionWritesFor, tokenOf } from "../context.js"
import { IDENTITY } from "../identity.js"
import { profileDir } from "../library.js"
import { NOTION } from "../notion/errors.js"
import { notionId } from "../notion/ids.js"
import { mirrorPages, notionMirrorTarget } from "../notion/mirror-target.js"

/**
 * The Notion calls each mirror write sends, as `documents create|update|delete` check them, so denying `api.<call>`
 * cannot be got round through a mirror. A deletion on either side asks as `documents delete` does. A local file
 * replaced asks nothing: its version is kept first, and the mirror writes Notion's own Markdown back into the local
 * file after every upload, so a key there would ask at every push.
 */
export const mirrorKeys = ({ action, side }: FileMirrorWrite): readonly string[] => {
  if (action === "delete") return side === "remote" ? [MIRROR_KEYS.trash, DELETE_KEY] : [DELETE_KEY]
  if (side === "local") return []
  if (action === "create" || action === "folder") return [MIRROR_KEYS.create]
  if (action === "update") return [MIRROR_KEYS.replace]
  return []
}

const profileOf = (command: Command) => {
  const { profile } = contextOf(command)
  if (!profile) throw new CliError("validation_error", "a profile is required")
  return profile
}

/**
 * cli-core's `mirrors` group over the pages under one Notion page: each page is `<title>.md`, the pages under it are
 * in `<title>/`. Only a page in Notion's trash counts as deleted.
 */
export const mirrorsCommand = (): Command =>
  fileMirrorsCommand({
    identity: IDENTITY,
    service: NOTION,
    remote: "notion",
    root: {
      place: "Notion page",
      description: "the Notion page whose pages become the folder's files, by its id or its Notion link",
      examples: [
        "0123456789abcdef0123456789abcdef ./notes",
        "0123456789abcdef0123456789abcdef ~/Roadmap --ignore drafts",
      ],
      note: "Each page under it is a Markdown file named after its title, and the pages under that one are in a folder of the same name",
    },
    // Notion has no change feed a mirror can ask, so each poll reads every mirrored page, about two requests each.
    every: "5m",
    output: (command, body) => renderAnswer(command, outputFor(command), body),
    profile: profileOf,
    stateDir: (command) => profileDir(contextOf(command).env, profileOf(command)),
    keepForDays: (command) => keepVersionsForDays(contextOf(command).settings),
    connect: (command, body, options) => {
      const token = tokenOf(command)
      return contextOf(command).run((events) => {
        const pages = mirrorPages(notionFor(command, token, events), notionWritesFor(command, token, events))
        return body({
          target: notionMirrorTarget(pages),
          root: async (input) => {
            const id = notionId(input)
            if (await pages.inTrash(id))
              throw new CliError("validation_error", `page ${id} is in Notion's trash; restore it first`, {
                reason: "mirror.not-folder",
              })
            return { folder: id, rootId: id }
          },
        })
      }, options)
    },
    writeGuard: (command, extra, ask) => {
      const { settings, env, renderer } = contextOf(command)
      return keyedGuard(
        (asker) =>
          guardFor(
            IDENTITY,
            // Notion limits its own rate, so this guard keeps the levels and the journal, not a send cap.
            { ...settings, sendsPerHour: Number.MAX_SAFE_INTEGER, permissionDefaults: permissions.defaults },
            renderer.warn,
            env,
            asker,
          ),
        ask,
        (key) => levelFor(settings.permissions, key, permissions.defaults).level,
        extra,
      )
    },
    keysOf: mirrorKeys,
  })
