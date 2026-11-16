import { writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Readable } from "node:stream"
import { neverAnswers, runScopeCases } from "@wirecat/cli-core/testing"
import { describe, it } from "vitest"
import { operations } from "./generated/manifest.js"
import { definition } from "./program.js"
import { DATABASE_ID, DISCUSSION_ID, FAKE_TOKEN, fakeNotion, PAGE_ID } from "./testing/fake-notion.js"
import { signedIn } from "./testing/harness.js"

const COVERED = new Set(["retrieve-a-page", "post-search", "patch-page"])

const UPLOAD = join(tmpdir(), `notion-run-scope-${process.pid}.txt`)
writeFileSync(UPLOAD, "Fake upload")

const stdin = () => Object.assign(Readable.from([FAKE_TOKEN]), { isTTY: false })

describe("each remote command runs inside cli-core's run", () => {
  const cases = runScopeCases({
    definition: definition(),
    commands: {
      "session start": ["personal", "session", "start"],
      "session status": ["personal", "session", "status", "--check"],
      "documents get": ["personal", "documents", "get", PAGE_ID],
      "documents add": ["personal", "documents", "add", PAGE_ID],
      "folders add": ["personal", "folders", "add", DATABASE_ID],
      "folders browse": ["personal", "folders", "browse"],
      sync: ["personal", "sync"],
      "documents create": ["personal", "documents", "create", "--parent", PAGE_ID, "--text", "Fake text"],
      "documents update": ["personal", "documents", "update", PAGE_ID, "--text", "Fake text"],
      "documents restore": ["personal", "documents", "restore", PAGE_ID],
      "databases list": ["personal", "databases", "list"],
      "comments list": ["personal", "comments", "list", PAGE_ID],
      "comments create": ["personal", "comments", "create", PAGE_ID, "--text", "Fake text"],
      "comments reply": ["personal", "comments", "reply", DISCUSSION_ID, "--text", "Fake text"],
      "files upload": ["personal", "files", "upload", UPLOAD, "--parent", PAGE_ID],
      "databases show": ["personal", "databases", "show", DATABASE_ID],
      "api retrieve-a-page": ["personal", "api", "retrieve-a-page", "--page-id", PAGE_ID],
      "api post-search": ["personal", "api", "post-search", "--body", "{}"],
      "api patch-page": ["personal", "api", "patch-page", "--page-id", PAGE_ID, "--body", "{}"],
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
      "documents delete": "the same write path as documents restore, behind a question no run here answers",
      "memories extract": "cli-core's shared command; it asks the configured model, never Notion",
      doctor:
        "cli-core's appDoctorCommand answers --online outside a run of its own; drop this once core runs it inside",
    },
    answering: () => ({
      keyring: signedIn(),
      fetch: fakeNotion({ discussions: [DISCUSSION_ID] }).fetch,
      sleep: async () => {},
      stdin: stdin(),
    }),
    silent: () => ({ keyring: signedIn(), fetch: neverAnswers, sleep: async () => {}, stdin: stdin() }),
  })
  for (const one of cases) it(one.name, () => one.run())
})
