import { CliError, isCliError } from "@wirecat/cli-base"
import { type SourceState, type SourceWalk, syncDocuments } from "@wirecat/cli-core/documents"
import { FAKE_FOLDER, fakeDocumentSource } from "@wirecat/cli-core/documents/testing"
import { expect, it } from "vitest"

const PRINCIPAL = "alpha"

const harness = (source: ReturnType<typeof fakeDocumentSource>) => {
  let state: SourceState = { version: 1, principal: PRINCIPAL, scope: "", folders: {}, documents: {}, skipped: [] }
  let walk: SourceWalk | undefined
  const saved = new Set<string>()
  const run = (rescan = false) =>
    syncDocuments({
      source,
      rescan,
      index: {
        save: async (_p, content) => {
          saved.add(content.metadata.id)
          return `document:${content.metadata.id}`
        },
        remove: async (_p, id) => {
          saved.delete(id)
        },
        openPictures: async () => {
          throw new CliError("not_found", "no picture model")
        },
      },
      state: {
        read: () => structuredClone(state),
        save: (next) => {
          state = structuredClone(next)
        },
        readWalk: (scope) => (walk?.scope === scope ? structuredClone(walk) : undefined),
        saveWalk: (next) => {
          walk = structuredClone(next)
        },
        removeWalk: () => {
          walk = undefined
        },
        saveSnapshot: () => {},
        removeSnapshot: () => {},
      },
      principal: PRINCIPAL,
      roots: ["root"],
      textLimit: 10_000,
      max: 1_000,
      maxEntries: 1_000,
      isFolder: (file) => file.mime === FAKE_FOLDER,
      skipReason: () => undefined,
      retryable: () => false,
      errorOf: (error) => (isCliError(error) ? error : new CliError("provider_error", String(error))),
      assertHeld: () => undefined,
      storeVersion: "contract",
    } as Parameters<typeof syncDocuments>[0])
  return { run, saved, state: () => state }
}

it("feed source: --rescan after one 404 on the root's metadata", async () => {
  const source = fakeDocumentSource(PRINCIPAL)
  const h = harness(source)
  await h.run()
  const before = [...h.saved].sort()
  source.deny("root", 404)
  let error: unknown
  try {
    await h.run(true)
  } catch (e) {
    error = e
  }
  console.log(
    JSON.stringify({
      feed: Boolean(source.changes),
      before,
      after: [...h.saved].sort(),
      threw: error ? String(error) : null,
      rootTrashed: h.state().folders.root?.trashed,
    }),
  )
  expect(before.length).toBeGreaterThan(0)
})
