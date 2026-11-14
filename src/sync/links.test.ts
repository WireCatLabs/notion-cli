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

  it("drops the signature hidden inside Notion's image proxy link and keeps the proxy's own query", () => {
    const link =
      "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2Fx.png" +
      "%3FX-Amz-Signature%3Dabc?table=block&id=1"
    const clean = stripSignedLinks(link)
    expect(clean).not.toMatch(/X-Amz-/i)
    expect(clean).toBe(
      "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2Fx.png?table=block&id=1",
    )
    expect(stripSignedLinks("[f](https://h/x.png?X-Amz-Signature=s&amp;X-Amz-Date=d)")).toBe("[f](https://h/x.png)")
  })

  it("leaves ordinary links alone, query and all", () => {
    const text = "see https://example.com/search?q=notion&page=2 and [doc](https://www.notion.so/abc#block)"
    expect(stripSignedLinks(text)).toBe(text)
    expect(hasSignedLink(text)).toBe(false)
  })
})
