const URL_IN_TEXT = /https?:\/\/[^\s"'<>()[\]`]+/g
// Notion's own file links are pre-signed storage links; the signature, not the host, is what makes one a secret.
const SIGNED_PARAM = /^(x-amz-.+|signature|expires|sig|se|sp|sv|token|key-pair-id|policy)$/i
// Notion's image proxy carries the signed link inside its path, encoded: notion.so/image/https%3A%2F%2F…%3FX-Amz-…
const NESTED = /^(.*?\/)(https?(?:%3A|:).*)$/i

const unsigned = (link: string): string => {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return link
  }
  const nested = url.pathname.match(NESTED)
  if (nested) {
    let inner: string
    try {
      inner = decodeURIComponent(nested[2] as string)
    } catch {
      inner = ""
    }
    const clean = inner && unsigned(inner)
    if (clean !== inner) url.pathname = `${nested[1]}${encodeURIComponent(clean)}`
  }
  if ([...url.searchParams.keys()].some((key) => SIGNED_PARAM.test(key.replace(/^amp;/, "")))) url.search = ""
  const out = url.toString()
  return out === new URL(link).toString() ? link : out
}

/**
 * Drops the signature of every signed link, so the text keeps where a file was but never the secret that opens it.
 * The signature also changes on every read, so without this an unchanged page would hash differently each sync.
 */
export const stripSignedLinks = (text: string) => text.replace(URL_IN_TEXT, unsigned)

export const hasSignedLink = (text: string) => text.match(URL_IN_TEXT)?.some((link) => unsigned(link) !== link) ?? false
