import { isCliError } from "@wirecat/cli-base"
import { isItemError } from "../notion/errors.js"
import type { NotionPage, NotionReads, NotionUser, NotionUserDetail } from "../notion/reads.js"
import type { NotionIdentity, SyncWarning, UserAccess } from "./files.js"

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

  return async (page: NotionPage): Promise<NotionIdentity[]> => {
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
}
