import { createHash } from "node:crypto"
import { existsSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { CliError, resolvePaths, writeSecurely } from "@wirecat/cli-base"
import type { ProviderEntry } from "@wirecat/cli-core"
import {
  accountFileFor,
  openAppStore,
  type ProfileTokenStore,
  profilesHere,
  readOnlyLockOf,
  rememberAccount,
} from "@wirecat/cli-core/cli"
import type { SourceContent, SourceState, SourceStatePort, SourceWalk } from "@wirecat/cli-core/documents"
import { acquireLock } from "@wirecat/cli-core/files"
import type { MessageStore } from "@wirecat/cli-core/store"
import { IDENTITY } from "./identity.js"
import { type NotionFile, WORKSPACE_ROOT } from "./sync/source.js"

// What the shared documents commands keep for one profile, beside the shared store: the chosen folders, the sync's
// checkpoint, its walk and one snapshot per page, each a private file under the profile's state folder.

export const PROVIDER = {
  name: "notion",
  kind: "documents",
  aliases: [],
  command: IDENTITY.command,
  opens: { document: "documents show" },
} as const satisfies ProviderEntry

/** The most entries one sync walks under the chosen folders. */
export const MAX_ENTRIES = 10_000
/** The longest page text the store keeps; a longer page is kept by name only. */
export const TEXT_LIMIT = 1_000_000

/** The shared store with notion's provider entry; a read, or any run under the read-only lock, opens it read-only. */
export const openStore = (env: NodeJS.ProcessEnv, write: boolean): Promise<MessageStore> =>
  openAppStore(env, {
    app: IDENTITY,
    provider: PROVIDER,
    readOnly: !write || readOnlyLockOf(IDENTITY, env) !== undefined,
  })

/**
 * A write leaves the search index caught up: a page is indexed only when a writable search drains what was written,
 * so a read-only search right after a sync found it by title but not by its words. cli-core's `drainNoteIndex` is not
 * exported; `embedded` drains before it looks.
 */
export const withStore = async <T>(
  env: NodeJS.ProcessEnv,
  write: boolean,
  fn: (store: MessageStore) => Promise<T>,
): Promise<T> => {
  const store = await openStore(env, write)
  try {
    const value = await fn(store)
    if (write && readOnlyLockOf(IDENTITY, env) === undefined) await store.notes.embedded("", {})
    return value
  } finally {
    await store.close()
  }
}

const profileDir = (env: NodeJS.ProcessEnv, profile: string) =>
  join(resolvePaths({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env }).state, "profiles", profile)

const readJson = <T>(path: string): T | undefined => {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined
    throw new CliError("configuration_error", `${path} cannot be read; move it away and sync again`, {
      reason: "state.unreadable",
    })
  }
}

const writeJson = (path: string, value: unknown) => writeSecurely(path, JSON.stringify(value), 0o600)

interface Folders {
  roots: string[]
  /** When the choice last changed: a sync before it copied another scope. */
  changed_at?: string
}

const foldersOf = (env: NodeJS.ProcessEnv, profile: string) =>
  readJson<Folders>(join(profileDir(env, profile), "folders.json"))

export const chosenFolders = (env: NodeJS.ProcessEnv, profile: string): string[] => foldersOf(env, profile)?.roots ?? []

export const foldersChangedAt = (env: NodeJS.ProcessEnv, profile: string) => foldersOf(env, profile)?.changed_at

export const saveFolders = (env: NodeJS.ProcessEnv, profile: string, roots: string[]) =>
  writeJson(join(profileDir(env, profile), "folders.json"), { roots, changed_at: new Date().toISOString() })

export const rootsOf = (env: NodeJS.ProcessEnv, profile: string) => {
  const chosen = chosenFolders(env, profile)
  return chosen.length ? chosen : [WORKSPACE_ROOT]
}

/** A Notion id is a file name as it is; anything else is hashed, so no id can reach outside the folder. */
const fileName = (id: string) =>
  /^[0-9a-f-]{1,64}$/u.test(id) ? id : createHash("sha256").update(id).digest("hex").slice(0, 40)

export const syncState = (env: NodeJS.ProcessEnv, profile: string, principal: string): SourceStatePort<NotionFile> => {
  const dir = join(profileDir(env, profile), "sync")
  const snapshot = (id: string) => join(dir, "snapshots", `${fileName(id)}.json`)
  return {
    read: () =>
      readJson<SourceState<NotionFile>>(join(dir, "state.json")) ?? {
        version: 1,
        principal,
        scope: "",
        folders: {},
        documents: {},
        skipped: [],
      },
    save: (state) => writeJson(join(dir, "state.json"), state),
    readWalk: (scope) => {
      const walk = readJson<SourceWalk<NotionFile>>(join(dir, "walk.json"))
      return walk?.scope === scope ? walk : undefined
    },
    saveWalk: (walk) => writeJson(join(dir, "walk.json"), walk),
    removeWalk: () => rmSync(join(dir, "walk.json"), { force: true }),
    saveSnapshot: (content) => writeJson(snapshot(content.metadata.id), content),
    removeSnapshot: (id) => rmSync(snapshot(id), { force: true }),
  }
}

/** The engine's planning walk, when one is under way: it is saved between runs until the plan is made. */
export const walkUnderWay = (env: NodeJS.ProcessEnv, profile: string) =>
  existsSync(join(profileDir(env, profile), "sync", "walk.json"))

export const readSnapshot = (env: NodeJS.ProcessEnv, profile: string, id: string) =>
  readJson<SourceContent<NotionFile>>(join(profileDir(env, profile), "sync", "snapshots", `${fileName(id)}.json`))

/** What the sync holds, for the source to tell a page it missed from one Notion deleted. */
export const knownOf = (state: SourceState<NotionFile>): NotionFile[] => [
  ...Object.values(state.documents).map((doc) => doc.metadata),
  ...Object.values(state.folders).filter((folder) => !state.documents[folder.id]),
]

/**
 * The lock a sync and every write to the profile's local copy take, so a tag added during a sync is not lost. A
 * second holder is refused at once: waiting would hold an agent's tool call for the length of a sync.
 */
export const withProfileLock = async <T>(
  env: NodeJS.ProcessEnv,
  profile: string,
  fn: (assertHeld: () => void) => Promise<T>,
): Promise<T> => {
  const lock = await acquireLock(join(profileDir(env, profile), "sync.lock")).catch((error: unknown) => {
    throw new CliError("provider_unavailable", "another sync or write holds this profile's local copy; retry later", {
      reason: "profile.busy",
      ...(error instanceof CliError ? { holders: error.details.holders } : {}),
    })
  })
  let held = true
  try {
    return await fn(() => {
      if (!held)
        throw new CliError("provider_unavailable", "the profile's lock was released", { reason: "profile.busy" })
    })
  } finally {
    held = false
    await lock.release()
  }
}

const recalled = (env: NodeJS.ProcessEnv, profile: string) =>
  readJson<{ account?: unknown }>(accountFileFor(IDENTITY, profile, env))?.account

/** The account a profile has synced as: local reads never ask Notion, and a profile only signed in has no copy. */
export const principalOf = (env: NodeJS.ProcessEnv, profile: string): string => {
  const account = recalled(env, profile)
  if (typeof account !== "string" || !existsSync(join(profileDir(env, profile), "sync", "state.json")))
    throw new CliError("not_found", `profile ${profile} has no local copy yet — ${IDENTITY.command} ${profile} sync`, {
      reason: "profile.not-synced",
    })
  return account
}

/**
 * Takes a Notion connection for a profile, before its token is kept or its copy written. One connection is one
 * account in the shared store, so two profiles on it would each remove the other's pages; and a profile's local copy
 * stays with the connection it was synced from.
 */
export const claimAccount = (
  env: NodeJS.ProcessEnv,
  profile: string,
  account: string,
  tokens: Pick<ProfileTokenStore, "read">,
) => {
  // A token from the environment variable is every profile's, so it holds none.
  const signedIn = (name: string) => {
    const source = tokens.read(name)?.source
    return source !== undefined && source !== "environment"
  }
  const other = profilesHere(IDENTITY, [], env).find(
    (name) => name !== profile && recalled(env, name) === account && signedIn(name),
  )
  const cli = IDENTITY.command
  if (other)
    throw new CliError(
      "conflict",
      `profile ${other} already uses this Notion connection; use \`${cli} ${other} …\`, or run ` +
        `\`${cli} ${other} session end\` first`,
      { reason: "profile.account-taken", profile: other },
    )
  const synced = syncState(env, profile, "").read().principal
  if (synced && synced !== account)
    throw new CliError(
      "conflict",
      `profile ${profile} holds a copy synced from another Notion connection; sign this token in under a new ` +
        `profile (\`${cli} <new profile> session start\`), or keep this profile's own token`,
      { reason: "profile.other-account" },
    )
  if (recalled(env, profile) !== account) rememberAccount(IDENTITY, profile, account, env)
}
