import { isCliError } from "@wirecat/cli-base"
import type { DocumentSource } from "@wirecat/cli-core/documents"
import { isItemError } from "../notion/errors.js"
import type { NotionPage, NotionReads, NotionUser, NotionUserDetail } from "../notion/reads.js"
import type { NotionFile, NotionIdentity, SyncWarning, UserAccess } from "./files.js"

const CAPABILITY = "give the connection the capability to read user information including email addresses"

/**
 * A page's creator and last editor with their names and email addresses, as `GET /v1/users/{id}` gives them, and the
 * people its people properties name. Each user is asked once per run; after a 403 no one is asked again, and every
 * author is kept by Notion id only (https://developers.notion.com/reference/get-user).
 */
export const pagePeople = (
  reads: Pick<NotionReads, "retrieveUser">,
  warn: (warning: SyncWarning) => void,
  onAccess?: (access: UserAccess) => void,
) => {
  const users = new Map<string, Promise<NotionUserDetail | undefined>>()
  let access: UserAccess | undefined
  const learned = (found: UserAccess) => {
    if (access) return
    access = found
    onAccess?.(found)
    if (found === "none")
      warn({
        code: "permission_error",
        reason: "notion.no-user-information",
        message: `authors and editors are kept by Notion id only: ${CAPABILITY}`,
      })
    else if (found === "names")
      warn({
        code: "permission_error",
        reason: "notion.no-user-email",
        message: `authors and editors are kept without email addresses, so they are not matched to people: ${CAPABILITY}`,
      })
  }
  const userOf = (id: string) => {
    if (access === "none") return Promise.resolve(undefined)
    let found = users.get(id)
    if (!found) {
      found = reads.retrieveUser(id).then(
        (user) => {
          if (user.type === "person") learned(user.person?.email ? "emails" : "names")
          return user
        },
        (error: unknown) => {
          if (isCliError(error) && error.code === "permission_error") learned("none")
          else if (!isItemError(error)) {
            users.delete(id)
            throw error
          }
          return undefined
        },
      )
      users.set(id, found)
    }
    return found
  }

  const people = async (page: NotionPage): Promise<NotionIdentity[]> => {
    const found = new Map<string, NotionIdentity>()
    const add = (user: NotionUser | undefined, role: string, detail?: NotionUserDetail) => {
      if (!user) return
      const name = detail?.name ?? user.name
      const email = detail?.person?.email
      found.set(`${role}:${user.id}`, {
        id: user.id,
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(detail?.type === "bot" ? { bot: true } : {}),
        role,
      })
    }
    add(page.created_by, "author", page.created_by && (await userOf(page.created_by.id)))
    add(page.last_edited_by, "editor", page.last_edited_by && (await userOf(page.last_edited_by.id)))
    for (const [name, value] of Object.entries(page.properties))
      if (value.type === "people") for (const user of value.people) add(user, `property:${name}`)
    return [...found.values()]
  }
  // A read that asked about no one (no author, or every author gone) learned all there was to learn.
  return { people, access: (): UserAccess => access ?? "emails" }
}

/** Pages read again for their authors per sync run, so a large copy catches up over several syncs. */
const AUTHORS_BATCH = 50

/**
 * The pages one run reads again for their authors. A changed version is what makes the engine read a page again.
 * Every page is a folder too, so the engine lists it again under its parent: every answer of the run marks it, or the
 * listing would put the old version back. The text read keeps the real version, so the next sync finds it unchanged.
 */
export const authorRereads = (unauthored?: () => Iterable<NotionFile>) => {
  let batch: Map<string, NotionFile> | undefined
  const held = () => {
    batch ??= new Map([...(unauthored?.() ?? [])].slice(0, AUTHORS_BATCH).map((file) => [file.id, file]))
    return batch
  }
  const marked = (file: NotionFile): NotionFile =>
    held().has(file.id) && !file.version?.endsWith("~authors") ? { ...file, version: `${file.version}~authors` } : file
  const marking = <S extends DocumentSource<NotionFile>>(source: S): S => ({
    ...source,
    metadata: async (id) => marked(await source.metadata(id)),
    children: async (id) => (await source.children(id)).map(marked),
    ...(source.childrenPage
      ? {
          childrenPage: async (id: string, cursor?: string) => {
            const page = await (source.childrenPage as NonNullable<S["childrenPage"]>)(id, cursor)
            return { ...page, files: page.files.map(marked) }
          },
        }
      : {}),
    changes: async (token) => {
      const page = await source.changes(token)
      return { ...page, items: page.items.map((item) => (item.file ? { ...item, file: marked(item.file) } : item)) }
    },
  })
  return { rereads: () => held().values(), marking }
}
