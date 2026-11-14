import { describe, expect, it } from "vitest"
import { hasSignedLink, stripSignedLinks } from "./links.js"

describe("stripSignedLinks", () => {
  it("drops the signature of a storage link and keeps where the file was", () => {
    const text =
      "![chart](https://prod-files-secure.s3.us-west-2.amazonaws.com/ws/file/chart.png?X-Amz-Algorithm=AWS4" +
      '&X-Amz-Signature=deadbeef) and <file src="https://files.example.com/a.pdf?Expires=1&Signature=x"/>'
    const clean = stripSignedLinks(text)
    expect(clean).toBe(
      "![chart](https://prod-files-secure.s3.us-west-2.amazonaws.com/ws/file/chart.png) and " +
        '<file src="https://files.example.com/a.pdf"/>',
    )
    expect(hasSignedLink(text)).toBe(true)
    expect(hasSignedLink(clean)).toBe(false)
  })

  it("leaves ordinary links alone, query and all", () => {
    const text = "see https://example.com/search?q=notion&page=2 and [doc](https://www.notion.so/abc#block)"
    expect(stripSignedLinks(text)).toBe(text)
    expect(hasSignedLink(text)).toBe(false)
  })
})
