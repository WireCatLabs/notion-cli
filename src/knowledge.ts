import { CliError } from "@wirecat/cli-base"
import { documentIngestion, documentKnowledge } from "@wirecat/cli-core/documents"
import { type DocumentKnowledgePort, factItem, memoryItem } from "@wirecat/cli-core/documents/cli"
import type { LinkInput, MessageStore } from "@wirecat/cli-core/store"
import { PROVIDER } from "./library.js"
import type { NotionFile, NotionIdentity } from "./sync/source.js"

const external = (id: string) => `${id}.md`
const PROVENANCE = "notion:pages.retrieve"

export const ingestionOf = (store: MessageStore) =>
  documentIngestion<NotionFile>(store, {
    provider: PROVIDER.name,
    externalId: external,
    catalogInput: (file) => ({
      externalId: external(file.id),
      // A page with sub-pages is a file too: its children name it as their parent, and the catalog nests them.
      kind: file.providerMetadata.kind === "page" || file.providerMetadata.kind === "row" ? "file" : "folder",
      name: file.name,
      parents: file.parents.map(external),
      ...(file.url ? { url: file.url } : {}),
      mime: file.mime,
      ...(file.createdAt ? { createdAt: file.createdAt } : {}),
      ...(file.modifiedAt ? { modifiedAt: file.modifiedAt } : {}),
      metadata: { notion_kind: file.providerMetadata.kind },
    }),
    // A catalog entry comes from the sync's listing, which names no authors; only a page's read does.
    observed: async (principal, file, documentId) => {
      if (file.providerMetadata.people)
        await saveContributors(
          store,
          principal,
          { pageId: file.id, people: file.providerMetadata.people, modifiedAt: file.modifiedAt ?? null },
          documentId,
        )
    },
    frontMatter: ({ metadata }) => ({
      source: PROVIDER.name,
      sourceUrl: metadata.url,
      pageId: metadata.id,
      kind: metadata.providerMetadata.kind,
      modifiedAt: metadata.modifiedAt ?? null,
      properties: metadata.providerMetadata.frontMatter ?? {},
      people: metadata.providerMetadata.people ?? [],
      ...(metadata.providerMetadata.missingBlocks ? { missingBlocks: metadata.providerMetadata.missingBlocks } : {}),
    }),
  })

/** Notion's creator and last editor, in the shared roles; people properties are row data, not authorship. */
const ROLES: Record<string, "owner" | "last-editor"> = { author: "owner", editor: "last-editor" }

const contributors = (frontMatter: unknown) =>
  ((frontMatter as { people?: NotionIdentity[] } | null)?.people ?? []).flatMap((person) => {
    const role = ROLES[person.role]
    // A page this tool wrote names the connection's own bot as its editor; a bot is no one to know.
    return role && !person.bot ? [{ ...person, role }] : []
  })

interface PageAuthors {
  pageId: string
  people?: NotionIdentity[]
  modifiedAt?: string | null
}

/**
 * Saves a page's creator and last editor as Notion identities, merged by exact email with the person who has it, and
 * links the page to their people. Without `register` it only points the links at whoever the identities belong to now;
 * `"all"` saves an identity known by its id alone too, for the owner to link by hand.
 */
const saveContributors = async (
  store: MessageStore,
  principal: string,
  page: PageAuthors,
  documentId: string,
  register: boolean | "all" = true,
) => {
  const found = contributors(page)
  const key = { provider: PROVIDER.name, account: principal }
  // A Notion id alone would make a person with no name or address in every tool's store.
  const known = register === "all" ? found : register ? found.filter((person) => person.name || person.email) : []
  if (known.length) {
    await store.accounts.saveAccount(key, { name: "Notion" })
    const unique = new Map(known.map((person) => [person.id, person]))
    await store.people.savePeople(
      key,
      [...unique.values()].map((person) => ({
        id: person.id,
        name: person.name ?? null,
        ...(person.email ? { email: person.email } : {}),
        ...(person.bot ? { isBot: true } : {}),
      })),
    )
  }
  const links: Omit<LinkInput, "from" | "origin">[] = []
  for (const person of found) {
    const linked = await store.people.personOf({ provider: PROVIDER.name, id: person.id })
    if (linked)
      links.push({
        kind: "related-to",
        to: `person:${linked.uid}`,
        role: person.role,
        evidence: JSON.stringify({ pageId: page.pageId, modifiedAt: page.modifiedAt ?? null, user: person.id }),
        provenance: PROVENANCE,
        confirmed: false,
      })
  }
  await store.notes.replaceFileLinks(documentId, links)
}

/** Every synced Notion page that names this user: a decision about their identity moves the page's links too. */
const refreshLinks = async (store: MessageStore, remoteId: string) => {
  const PAGE = 500
  for (const folder of await store.notes.documentsAccounts()) {
    if (folder.account?.provider !== PROVIDER.name) continue
    for (let offset = 0; ; offset += PAGE) {
      const page = await store.notes.notes({ folderId: folder.id, source: "file", limit: PAGE, offset })
      for (const note of page.items) {
        const data = note.frontMatter as (PageAuthors & { source?: string }) | null
        if (data?.source !== PROVIDER.name || !contributors(data).some((person) => person.id === remoteId)) continue
        await saveContributors(store, folder.account.account, data, note.id, false)
      }
      if (!page.hasMore) break
    }
  }
}

export const knowledgeOf = (store: MessageStore, principal: string): DocumentKnowledgePort => {
  const ingestion = ingestionOf(store)
  const shared = documentKnowledge(store, async (account) =>
    account === principal ? (await ingestion.collection(account, false))?.id : undefined,
  )
  const port: DocumentKnowledgePort = {
    ...shared,
    context: async (account, ref) => ({
      document: await shared.document(account, ref),
      tags: await store.notes.noteTags(ref),
      links: await store.notes.links({ from: ref }),
      notes: await store.notes.notes({ source: "internal", about: ref, limit: 100 }),
      memories: (await store.memories.list({ subject: ref, limit: 100 })).items.map(memoryItem),
      facts: (await store.facts.list({ subject: ref, limit: 100 })).items.map(factItem),
      people: await port.people(account, ref),
    }),
    people: async (account, ref, filter = {}) => {
      const note = await shared.document(account, ref)
      const found = contributors(note.frontMatter).filter(
        (person) =>
          (filter.role === undefined || person.role === filter.role) &&
          (filter.remote_id === undefined || person.id === filter.remote_id),
      )
      return {
        items: await Promise.all(
          found.map(async (person) => {
            const linked = await store.people.personOf({ provider: PROVIDER.name, id: person.id })
            return {
              remote_id: person.id,
              provider: PROVIDER.name,
              role: person.role,
              name: person.name ?? null,
              person: linked ? { ref: `person:${linked.uid}`, ...linked } : null,
            }
          }),
        ),
        coverage: "the page's creator and last editor, as Notion gives them; not every past editor",
      }
    },
    linkPerson: async (account, ref, remoteId, personRef) => {
      const note = await shared.document(account, ref)
      if (!contributors(note.frontMatter).some((person) => person.id === remoteId))
        throw new CliError("not_found", "this Notion user was not seen on the document", {
          reason: "identity.not-seen",
        })
      if (!personRef.startsWith("person:"))
        throw new CliError("validation_error", "the target must be a person: reference", { reason: "identity.target" })
      const person = await store.people.personByUid(personRef.slice("person:".length))
      const known = person?.identities[0]
      if (!known)
        throw new CliError("not_found", "the target person has no known identity", { reason: "identity.no-person" })
      // A copy synced before authors were saved has the user in its front matter only.
      await saveContributors(store, account, note.frontMatter as PageAuthors, note.id, "all")
      const linked = await store.people.linkIdentities(
        known,
        { provider: PROVIDER.name, id: remoteId },
        { method: "manual", by: PROVIDER.name },
      )
      await refreshLinks(store, remoteId)
      return linked
    },
  }
  return port
}
