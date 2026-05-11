import { generateBoundedShareUrl, renderMarkdownDocument, validateMarkdownInput } from "@/lib/markdown/render"

describe("Markdown render and export helpers", () => {
  it("sanitizes unsafe HTML in exported HTML", () => {
    const html = renderMarkdownDocument("# Hello\n\n<script>alert('x')</script>")
    expect(html).toContain("<h1>Hello</h1>")
    expect(html).not.toContain("<script>")
  })

  it("validates payload size", () => {
    const result = validateMarkdownInput("x".repeat(12), 8)
    expect(typeof result).toBe("object")
  })

  it("generates bounded URL-only share links", () => {
    const url = generateBoundedShareUrl("# Shared", "https://markdown.platphormnews.com")
    expect(url).toEqual(expect.stringContaining("https://markdown.platphormnews.com/editor?content="))
  })
})
