import { CliError } from "@wirecat/cli-base"
import { documentIngestion, documentKnowledge } from "@wirecat/cli-core/documents"
import { type DocumentKnowledgePort, factItem, memoryItem } from "@wirecat/cli-core/documents/cli"
import type { MessageStore } from "@wirecat/cli-core/store"
import { PROVIDER } from "./library.js"
import type { NotionFile, NotionIdentity } from "./sync/source.js"

const external = (id: string) => `${id}.md`

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
    return role ? [{ ...person, role }] : []
  })

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
      return store.people.linkIdentities(
        known,
        { provider: PROVIDER.name, id: remoteId },
        { method: "manual", by: PROVIDER.name },
      )
    },
  }
  return port
}
