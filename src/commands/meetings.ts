import { CliError } from "@wirecat/cli-base"
import { metaOf } from "@wirecat/cli-base/commands"
import type { EventSink } from "@wirecat/cli-core/cli"
import {
  type Body,
  inCommandRun,
  meetingAnswerBody,
  outputFor,
  overrideSharedContract,
  pagingOf,
  refuseOffline,
  renderAnswer,
  runBudgetOf,
  writeNewFile,
  writesNewFileOnlyWith,
} from "@wirecat/cli-core/cli"
import type { MeetingSource, MeetingStore } from "@wirecat/cli-core/meetings"
import { addMeetingCommands, type MeetingCommandDeps } from "@wirecat/cli-core/meetings/cli"
import type { MessageStore } from "@wirecat/cli-core/store"
import { Command } from "commander"
import { contextOf, notionClientFor, tokenOf } from "../context.js"
import { IDENTITY } from "../identity.js"
import { accountOf, openStore, PROVIDER } from "../library.js"
import { meetingNotesSource } from "../notion/meeting-notes.js"
import { notionPort } from "../notion/port.js"

interface Opened {
  store: MessageStore
  accountId: number
  source: () => MeetingSource
}

const leaves = (command: Command): Command[] => (command.commands.length ? command.commands.flatMap(leaves) : [command])

const noneYet = (profile: string) =>
  new CliError(
    "not_found",
    `profile ${profile} has no meeting notes yet — ${IDENTITY.command} ${profile} meetings sync`,
    {
      reason: "profile.not-synced",
    },
  )

const UNUSED = new Set(["import"])

/**
 * cli-core's `meetings` and `events` commands over Notion AI meeting notes (IDEA-2868 of the Notion roadmap). The
 * meetings live in the shared store under the profile's Notion account, beside its pages, so `search all` finds them.
 */
export const meetingsCommands = (): Command[] => {
  let opened: Opened | undefined
  const answers: (() => void)[] = []
  let events: EventSink = () => {}
  const need = (): Opened => {
    if (!opened) throw new CliError("configuration_error", "the meeting store is not open for this command")
    return opened
  }
  const deps: MeetingCommandDeps = {
    get store(): MeetingStore {
      return need().store.meetings
    },
    get accountId() {
      return need().accountId
    },
    get source() {
      return need().source()
    },
    // The run's sink records each request the source sends inside it (WC-LIFE-15).
    inRun: (command, body) =>
      inCommandRun(command, (sink) => {
        events = sink
        return body()
      }),
    newFileOutput: writesNewFileOnlyWith,
    writeFile: writeNewFile,
    budgetOf: runBudgetOf,
    pagingOf,
    write: (value, _format, command) => {
      const body: Body = meetingAnswerBody(command, value)
      answers.push(() => renderAnswer(command, outputFor(command), body))
    },
  }
  const holder = new Command(IDENTITY.command)
  addMeetingCommands(holder, deps)
  const meetings = holder.commands.find((group) => group.name() === "meetings")
  if (meetings)
    overrideSharedContract(
      meetings,
      "Notion keeps no meeting files to import; its notes come from the API alone.",
      (group) => {
        // commander types the list read-only; removing a subcommand has no other API.
        const mounted = group.commands as Command[]
        for (const one of mounted.filter((leaf) => UNUSED.has(leaf.name()))) mounted.splice(mounted.indexOf(one), 1)
      },
    )
  for (const leaf of holder.commands.flatMap(leaves)) {
    leaf.hook("preAction", async (_leaf, at) => {
      const { env, profile } = contextOf(at)
      const reads = metaOf(at).effects?.local === "read"
      const account = accountOf(env, profile)
      const store = await openStore(env, !reads).catch((error: unknown) => {
        // A read before the first sync finds no store file: the same answer as a store with no meetings.
        if (reads && error instanceof CliError && error.code === "not_found") throw noneYet(profile)
        throw error
      })
      try {
        const key = { provider: PROVIDER.name, account }
        const accountId = reads
          ? (await store.accounts.storedAccount(key))?.id
          : await store.accounts.saveAccount(key, { name: profile })
        if (accountId === undefined) throw noneYet(profile)
        let source: MeetingSource | undefined
        opened = {
          store,
          accountId,
          source: () => {
            if (source) return source
            refuseOffline(at, "Notion")
            const client = notionClientFor(at, tokenOf(at), (event) => events(event))
            source = meetingNotesSource(client, notionPort(client))
            return source
          },
        }
      } catch (error) {
        await store.close()
        throw error
      }
    })
    // WC-LIFE-4: a close that fails can change the answer, so the store closes before anything is printed.
    leaf.hook("postAction", async () => {
      await opened?.store.close()
      opened = undefined
      for (const answer of answers.splice(0)) answer()
    })
  }
  return [...holder.commands]
}
