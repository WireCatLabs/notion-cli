import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs"
import { CliError } from "@wirecat/cli-base"
import { bufferedInput, commandPath, MAX_BUFFERED_INPUT, terminalAsker } from "@wirecat/cli-core/cli"
import { guardedWrite, guardFor, keyedGuard, levelFor, newOperationId, refusedPlace } from "@wirecat/cli-core/sends"
import type { Command } from "commander"
import { PAGE_WRITE_KEYS, permissions } from "../config.js"
import { contextOf, notionFor, notionWritesFor, tokenOf } from "../context.js"
import { IDENTITY } from "../identity.js"
import type { LiveReads } from "../notion/notion.js"
import type { LiveWrites } from "../notion/writes.js"

/**
 * Every page write's one path, as the template's sample (WC-PERM-13): the level of the command's key and of each
 * extra key refuses or asks once, the send journal records the attempt and never its content (WC-PERM-17), and the
 * answer carries `operation_id` (WC-OUT-10). cli-core has already answered `--dry-run` and refused under
 * `WCNOTION_READ_ONLY`. Never retried: a write that got no answer is `outcome_unknown` (WC-LIFE-9).
 */
export const write = async <T>(
  command: Command,
  extra: readonly string[],
  act: (notion: LiveWrites, reads: LiveReads) => Promise<T>,
) => {
  const context = contextOf(command)
  const { settings, env, renderer } = context
  const path = commandPath(command)
  const key = path.replaceAll(" ", ".")
  const token = tokenOf(command)
  const operationId = newOperationId()
  const levelOf = (one: string) => levelFor(settings.permissions, one, permissions.defaults).level
  const guard = keyedGuard(
    (ask) =>
      guardFor(
        IDENTITY,
        // Notion limits its own rate, so this guard keeps the levels and the journal, not a send cap.
        { ...settings, sendsPerHour: Number.MAX_SAFE_INTEGER, permissionDefaults: permissions.defaults },
        renderer.warn,
        env,
        ask,
      ),
    terminalAsker(command),
    levelOf,
    [...(PAGE_WRITE_KEYS[path] ?? []), ...extra],
  )
  const request = { chatId: null, kind: "edit" as const, key, operationId }
  guard.refuse(request)
  try {
    const done = await guardedWrite(guard, request, () =>
      context.run((events) => act(notionWritesFor(command, token, events), notionFor(command, token, events))),
    )
    return { operationId, done }
  } catch (error) {
    if (error instanceof CliError && error.code === "outcome_unknown")
      throw new CliError("outcome_unknown", error.message, { ...error.details, operation_id: operationId })
    throw error
  }
}

const realOf = (path: string) => {
  try {
    return realpathSync(path)
  } catch {
    return undefined
  }
}

const isLink = (file: string) => {
  try {
    return lstatSync(file).isSymbolicLink()
  } catch {
    return false
  }
}

const refusedFile = (file: string) =>
  new CliError(
    "validation_error",
    `${file} is not read: only a regular file goes to Notion, never a link, a system file, a credential file, a ` +
      "browser profile or a WireCat folder",
    { reason: "file.refused-place", sent: false },
  )

/**
 * One open, then every check on what was opened: a link as the last part is refused (O_NOFOLLOW), so the path
 * cannot be swapped between the check and the read, and a FIFO does not block the open (O_NONBLOCK). An agent steered
 * by a page's text must not publish a key, the process's environment or another tool's settings into Notion.
 * cli-core's readUpload checks the path and reads it later, so it is not used here. The caller closes the descriptor.
 */
export const openOwnFile = (file: string, env: NodeJS.ProcessEnv): { fd: number; size: number } => {
  const outside = (path: string | undefined) => path !== undefined && refusedPlace(path, IDENTITY, env)
  if (outside(file)) throw refusedFile(file)
  // Windows has no O_NOFOLLOW, so a link is refused by its own entry before the open.
  if (constants.O_NOFOLLOW === undefined && isLink(file)) throw refusedFile(file)
  let fd: number
  try {
    fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0))
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === "ELOOP" || code === "EMLINK") throw refusedFile(file)
    throw new CliError("validation_error", `${file}: ${code === "ENOENT" ? "no such file" : "it cannot be read"}`, {
      sent: false,
    })
  }
  try {
    // On Linux the open descriptor names the file it really is, whatever happened to the path since the check.
    const opened = process.platform === "linux" ? realOf(`/proc/self/fd/${fd}`) : undefined
    const stat = fstatSync(fd)
    if (!stat.isFile() || outside(opened)) throw refusedFile(file)
    return { fd, size: stat.size }
  } catch (error) {
    closeSync(fd)
    throw error
  }
}

const readOwnFile = (file: string, env: NodeJS.ProcessEnv): string => {
  const { fd } = openOwnFile(file, env)
  try {
    return readFileSync(fd, "utf8")
  } finally {
    closeSync(fd)
  }
}

/** The page's new text: `--text`, or `--file`, where `-` is stdin. */
export const markdownOf = async (
  command: Command,
  args: { text?: string; file?: string },
  required: boolean,
  what = "the page's new text",
) => {
  if (args.text !== undefined && args.file !== undefined)
    throw new CliError("validation_error", "give the text with --text or --file, not both", { sent: false })
  if (args.text !== undefined) return args.text
  if (args.file === "-") {
    const { environment } = contextOf(command)
    const input = await bufferedInput(environment.stdin ?? process.stdin, {
      maxBytes: MAX_BUFFERED_INPUT,
      ...(environment.signal ? { signal: environment.signal } : {}),
    })
    return input.toString("utf8")
  }
  if (args.file !== undefined) return readOwnFile(args.file, contextOf(command).env)
  if (required) throw new CliError("validation_error", `give ${what} with --text or --file`, { sent: false })
  return undefined
}

export const TEXT_OPTIONS = {
  text: "the text, as Notion-flavoured Markdown",
  file: "read the text from this file; - reads stdin",
}
