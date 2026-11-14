/**
 * Notion-hosted file links are signed and valid for an hour
 * ([file object](https://developers.notion.com/reference/file-object)): whoever reads one gets the file. The query
 * carries the signature, so it is cut from every such link before the text is printed or stored. The exact form of the
 * links in Markdown v2 is still to be confirmed on a live page (docs/dev/DESIGN.md, "Live check").
 */
const LINK = /https?:\/\/[^\s<>"'()[\]]+/giu
const FILE_HOSTS = [
  /(^|\.)amazonaws\.com$/u,
  /^file\.notion\.so$/u,
  /(^|\.)notion-static\.com$/u,
  /(^|\.)notionusercontent\.com$/u,
]
const SIGNATURE = /^(x-amz-|signature$|expires$|key-pair-id$|policy$|token$|sig$|se$|sp$|sv$)/iu

const signed = (url: URL) =>
  url.search !== "" &&
  (FILE_HOSTS.some((host) => host.test(url.hostname)) ||
    [...url.searchParams.keys()].some((key) => SIGNATURE.test(key)))

/** The text with the query and fragment cut from each signed link, and how many were cut. */
export const withoutSignedLinks = (text: string): { text: string; removed: number } => {
  let removed = 0
  const clean = text.replace(LINK, (link) => {
    let url: URL
    try {
      url = new URL(link)
    } catch {
      return link
    }
    if (!signed(url)) return link
    removed += 1
    return `${url.origin}${url.pathname}`
  })
  return { text: clean, removed }
}
