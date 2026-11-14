const URL_IN_TEXT = /https?:\/\/[^\s"'<>()[\]`]+/g
// Notion's own file links are pre-signed storage links; the signature, not the host, is what makes one a secret.
const SIGNED_PARAM = /^(x-amz-.+|signature|expires|sig|se|sp|sv|token|key-pair-id|policy)$/i

const unsigned = (link: string) => {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return link
  }
  if (![...url.searchParams.keys()].some((key) => SIGNED_PARAM.test(key))) return link
  return `${url.origin}${url.pathname}`
}

/**
 * Drops the query of every signed link, so the text keeps where a file was but never the secret that opens it. The
 * signature also changes on every read, so without this an unchanged page would hash differently each sync.
 */
export const stripSignedLinks = (text: string) => text.replace(URL_IN_TEXT, unsigned)

export const hasSignedLink = (text: string) => text.match(URL_IN_TEXT)?.some((link) => unsigned(link) !== link) ?? false
