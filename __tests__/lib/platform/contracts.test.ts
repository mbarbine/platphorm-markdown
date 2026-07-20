jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      headers: { set: jest.fn() },
    })),
  },
}))

import { POST } from "@/app/api/mcp/route"
import { buildHealth } from "@/lib/platform/health"
import { markdownTools, mcpResources, routeComplianceSummary } from "@/lib/platform/routes"
import { siteConfig } from "@/lib/platphorm/config"

function mcpRequest(body: unknown) {
  return {
    url: `${siteConfig.url}/api/mcp`,
    headers: new Headers(),
    json: async () => body,
  } as Request
}

describe("PlatPhorm contract", () => {
  it("advertises only executable Markdown MCP tools", () => {
    expect(markdownTools).toContain("parse_markdown")
    expect(markdownTools).toContain("generate_table_of_contents")
    expect(markdownTools).not.toContain("export_pdf")
    expect(markdownTools).not.toContain("enhance_markdown")
    expect(markdownTools).not.toContain("create_docs_report")
  })

  it("lists only resources with concrete readers", () => {
    expect(mcpResources).toEqual([
      "markdown://examples",
      "markdown://templates",
      "markdown://exports",
      "markdown://openapi",
      "markdown://llms",
      "markdown://trust-policy",
    ])
  })

  it("returns a JSON-RPC error for an empty batch", async () => {
    const response = await POST(mcpRequest([])) as unknown as { body: unknown }
    expect(response.body).toEqual({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32600,
        message: "Invalid JSON-RPC 2.0 request: batch must not be empty",
        data: undefined,
      },
    })
  })

  it("executes a real MCP tool and preserves the request id", async () => {
    const response = await POST(
      mcpRequest({
        jsonrpc: "2.0",
        id: "markdown-test",
        method: "tools/call",
        params: { name: "generate_table_of_contents", arguments: { markdown: "# Alpha\n\n## Beta" } },
      }),
    )

    expect((response as unknown as { body: unknown }).body).toMatchObject({
      jsonrpc: "2.0",
      id: "markdown-test",
      result: { content: [{ type: "text", text: "- [Alpha](#alpha)\n  - [Beta](#beta)" }] },
    })
  })

  it("backs health trace and Vercel claims with request evidence", () => {
    const withoutEvidence = buildHealth(new Headers())
    expect(withoutEvidence.traceContextAccepted).toBe(false)
    expect(withoutEvidence.vercelMetadataCaptured).toBe(false)

    const headers = new Headers({
      traceparent: "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01",
      "x-vercel-id": "iad1::test",
    })
    const withEvidence = buildHealth(headers)
    expect(withEvidence.traceContextAccepted).toBe(true)
    expect(withEvidence.vercelMetadataCaptured).toBe(true)
  })

  it("includes the full discovery routes in its compliance inventory", () => {
    const routes = routeComplianceSummary().implementedRoutes
    expect(routes).toEqual(expect.arrayContaining(["/sitemap-full.xml", "/sitemap-index.xml", "/humans.txt"]))
  })
})
