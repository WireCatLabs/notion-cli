/**
 * Notion-hosted file links are signed and valid for an hour
 * ([file object](https://developers.notion.com/reference/file-object)): whoever reads one gets the file. The signature
 * is in the query, so every query that carries one is cut before the text is printed or stored. Where a link ends is
 * not known: a file name can hold `(`, `'` or `[`, and Notion's image proxy carries the signed link inside its own
 * path, percent-encoded. So the search is for the query itself, plain or encoded, not for the link around it.
 */
const QUERY = /(?<=\S)(?:\?|%3F)[\w%.~=&;+:@/-]+/giu
const KEYS = "x-amz-[\\w-]+|signature|expirationtimestamp|expires|key-pair-id|policy|token|sig|se|sp|sv"
const SIGNED = new RegExp(`(?:^|\\?|&|;|%3F|%26)(?:${KEYS})(?:=|%3D)`, "iu")

/** The text with every signed query cut, and how many were cut. */
export const withoutSignedLinks = (text: string): { text: string; removed: number } => {
  let removed = 0
  const clean = text.replace(QUERY, (query) => {
    if (!SIGNED.test(query)) return query
    removed += 1
    return ""
  })
  return { text: clean, removed }
}
