import { Readable } from "node:stream"
import { neverAnswers, runScopeCases } from "@wirecat/cli-core/testing"
import { describe, it } from "vitest"
import { definition } from "./program.js"
import { fakeComments } from "./testing/fake-comments.js"
import { DATABASE_ID, FAKE_TOKEN, fakeNotion, PAGE_ID } from "./testing/fake-notion.js"
import { bothFakes, signedIn } from "./testing/harness.js"

const stdin = () => Object.assign(Readable.from([FAKE_TOKEN]), { isTTY: false })

describe("each remote command runs inside cli-core's run", () => {
  const cases = runScopeCases({
    definition: definition(),
    commands: {
      "comments list": ["personal", "comments", "list"],
      "comments show": ["personal", "comments", "show", "c1"],
      "comments create": ["personal", "comments", "create", "--text", "Plan"],
      "comments update": ["personal", "comments", "update", "c1", "--text", "Plans"],
      "session start": ["personal", "session", "start"],
      "session status": ["personal", "session", "status", "--check"],
      "documents get": ["personal", "documents", "get", PAGE_ID],
      "databases list": ["personal", "databases", "list"],
      "databases show": ["personal", "databases", "show", DATABASE_ID],
    },
    skip: {
      "mcp serve": "listens until stopped",
      doctor:
        "cli-core's appDoctorCommand answers --online outside a run of its own; drop this once core runs it inside",
    },
    answering: () => ({
      keyring: signedIn(),
      fetch: bothFakes(fakeNotion(), fakeComments()),
      sleep: async () => {},
      stdin: stdin(),
    }),
    silent: () => ({ keyring: signedIn(), fetch: neverAnswers, sleep: async () => {}, stdin: stdin() }),
  })
  for (const one of cases) it(one.name, () => one.run())
})
