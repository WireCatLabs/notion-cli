import { closeSync, readSync } from "node:fs"
import { basename } from "node:path"
import { annotate } from "@wirecat/cli-base/commands"
import { itemOf, outputFor, REMOTE_WRITE, renderAnswer } from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { contextOf } from "../context.js"
import { IDENTITY } from "../identity.js"
import { notionId } from "../notion/ids.js"
import { PART_BYTES, SINGLE_PART_BYTES } from "../notion/writes.js"
import { openOwnFile, write } from "./writing.js"

const CLI = IDENTITY.command
const MB = 1024 * 1024

const uploadCommand = () =>
  annotate(new Command("upload"), {
    effects: REMOTE_WRITE,
    offline: false,
    examples: [
      `${CLI} personal files upload report.pdf --parent PAGE_ID`,
      `${CLI} personal files upload photo.png --parent PAGE_ID --dry-run`,
    ],
  })
    .summary("upload a file to the end of a Notion page")
    .description(
      `upload a file and add it to the end of a Notion page, as an image, video, audio, PDF or file block by its ` +
        `type. Up to ${SINGLE_PART_BYTES / MB} MB goes in one request, a larger file in parts of ` +
        `${PART_BYTES / MB} MB. Notion's plan limits the size; a file too large for it is refused. Only a regular ` +
        "file is sent, never a link, a system file or a credential file",
    )
    .argument("<file>", "the file to upload")
    .requiredOption("--parent <id>", "the page to add the file to: its id or its Notion link")
    .action(async function (this: Command, file: string, args: { parent: string }) {
      const page = notionId(args.parent)
      const { fd, size } = openOwnFile(file, contextOf(this).env)
      try {
        const read = (offset: number, length: number) => {
          const bytes = new Uint8Array(length)
          let filled = 0
          while (filled < length) {
            const got = readSync(fd, bytes, filled, length - filled, offset + filled)
            if (got === 0) break
            filled += got
          }
          return filled === length ? bytes : bytes.slice(0, filled)
        }
        const { operationId, done } = await write(this, [], (notion) =>
          notion.upload({ page, filename: basename(file), size, read }),
        )
        renderAnswer(this, outputFor(this), itemOf({ operation_id: operationId, page: { id: page }, ...done }))
      } finally {
        closeSync(fd)
      }
    })

/** `files upload`: a local file onto a Notion page. */
export const filesCommand = () =>
  annotate(new Command("files"), { effects: REMOTE_WRITE })
    .description("upload files to Notion pages")
    .addCommand(uploadCommand())
