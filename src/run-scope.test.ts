import { Readable } from "node:stream"
import { neverAnswers, runScopeCases } from "@wirecat/cli-core/testing"
import { describe, it } from "vitest"
import { operations } from "./generated/manifest.js"
import { definition } from "./program.js"
import { DATABASE_ID, FAKE_TOKEN, fakeNotion, PAGE_ID } from "./testing/fake-notion.js"
import { signedIn } from "./testing/harness.js"

const COVERED = new Set(["retrieve-a-page", "post-search", "patch-page"])

const stdin = () => Object.assign(Readable.from([FAKE_TOKEN]), { isTTY: false })

describe("each remote command runs inside cli-core's run", () => {
  const cases = runScopeCases({
    definition: definition(),
    commands: {
      "session start": ["personal", "session", "start"],
      "session status": ["personal", "session", "status", "--check"],
      "documents get": ["personal", "documents", "get", PAGE_ID],
      "databases list": ["personal", "databases", "list"],
      "databases show": ["personal", "databases", "show", DATABASE_ID],
      "api retrieve-a-page": ["personal", "api", "retrieve-a-page", "--page-id", PAGE_ID],
      "api post-search": ["personal", "api", "post-search", "--body", "{}"],
      "api patch-page": ["personal", "api", "patch-page", "--page-id", PAGE_ID, "--body", "{}"],
      "api call": ["personal", "api", "call", "patch-page", "--params", `{"page_id":"${PAGE_ID}"}`, "--body", "{}"],
    },
    skip: {
      ...Object.fromEntries(
        operations
          .filter((operation) => !COVERED.has(operation.command))
          .map((operation) => [
            `api ${operation.command}`,
            "the same generated executor as api retrieve-a-page, post-search and patch-page",
          ]),
      ),
      "mcp serve": "listens until stopped",
      doctor:
        "cli-core's appDoctorCommand answers --online outside a run of its own; drop this once core runs it inside",
    },
    answering: () => ({
      keyring: signedIn(),
      fetch: fakeNotion().fetch,
      sleep: async () => {},
      stdin: stdin(),
    }),
    silent: () => ({ keyring: signedIn(), fetch: neverAnswers, sleep: async () => {}, stdin: stdin() }),
  })
  for (const one of cases) it(one.name, () => one.run())
})
