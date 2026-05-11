import { NextResponse } from "next/server"
import { generateOutline, getDocumentStats, parseMarkdownToGraph } from "@/lib/markdown/parser"
import { exportMarkdownJson, generateBoundedShareUrl, renderMarkdownDocument, validateMarkdownInput } from "@/lib/markdown/render"
import { deterministicTableOfContents, getModelStatus, unavailableModelResult } from "@/lib/model/markdown-model"
import { siteConfig } from "@/lib/platphorm/config"
import { discoveryComplianceSummary, markdownTools, mcpPrompts, mcpResources, routeComplianceSummary } from "@/lib/platform/routes"
import { buildHealth } from "@/lib/platform/health"
import { getAuthPolicy } from "@/lib/platform/auth"
import { createTraceContext, traceHeaders, traceLink } from "@/lib/platform/trace"

type JsonRpcId = string | number | null
type JsonRpcRequest = {
  jsonrpc?: string
  id?: JsonRpcId
  method?: string
  params?: Record<string, unknown>
}

function rpcResult(id: JsonRpcId | undefined, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result }
}

function rpcError(id: JsonRpcId | undefined, code: number, message: string, details?: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data: details } }
}

function textContent(data: unknown) {
  return [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }]
}

function toolList() {
  return markdownTools.map((name) => ({
    name,
    description: toolDescriptions[name] ?? "MarkdownTree tool",
    inputSchema: {
      type: "object",
      properties: {
        markdown: { type: "string", description: "Markdown content" },
        format: { type: "string", enum: ["markdown", "html", "json", "pdf", "png"] },
      },
    },
  }))
}

const toolDescriptions: Record<(typeof markdownTools)[number], string> = {
  parse_markdown: "Parse Markdown into graph nodes, edges, outline, and stats.",
  transform_markdown_to_graph: "Transform Markdown into a visual document graph.",
  generate_outline: "Generate a heading outline from Markdown.",
  get_markdown_stats: "Count Markdown words, headings, links, images, code blocks, graph nodes, and graph edges.",
  export_markdown: "Return Markdown source as text.",
  export_html: "Return sanitized standalone HTML.",
  export_json: "Return structured Markdown, graph, outline, and stats JSON.",
  export_pdf: "Return an honest degraded state; PDF export is not implemented in Phase 1.",
  export_png: "Return an honest degraded state; PNG graph export is not implemented in Phase 1.",
  generate_share_url: "Generate a bounded URL-only share link. No server content is stored.",
  enhance_markdown: "Return model-backed Markdown enhancement when configured, otherwise degraded state.",
  generate_table_of_contents: "Generate a deterministic table of contents from real headings.",
  summarize_markdown: "Return model-backed summary when configured, otherwise degraded state.",
  get_health: "Return MarkdownTree health and platform state.",
  get_info: "Return MarkdownTree service information.",
  get_route_compliance: "Return standard route compliance state.",
  get_discovery_compliance: "Return discovery file compliance state.",
  create_docs_report: "Return a degraded cross-site report state; Docs publishing is not active in Phase 1.",
  create_sheet_report: "Return a degraded cross-site report state; Sheets reporting is not active in Phase 1.",
  create_deck_summary: "Return a degraded cross-site report state; Deck generation is not active in Phase 1.",
}

function markdownArg(params: Record<string, unknown> | undefined): string | { code: string; message: string } {
  const args = (params?.arguments ?? params ?? {}) as Record<string, unknown>
  return validateMarkdownInput(args.markdown ?? args.content)
}

function degradedReport(target: "docs" | "sheets" | "decks") {
  return {
    status: "degraded",
    target,
    message: `${target} integration is not enabled for Phase 1 MarkdownTree. The tool reports this boundary instead of faking a report.`,
  }
}

function callTool(name: string, params: Record<string, unknown> | undefined, request: Request) {
  const markdown = markdownArg(params)

  switch (name) {
    case "parse_markdown":
    case "transform_markdown_to_graph": {
      if (typeof markdown !== "string") return { isError: true, content: textContent(markdown) }
      const graph = parseMarkdownToGraph(markdown)
      return { content: textContent({ graph, outline: generateOutline(markdown, graph), stats: getDocumentStats(markdown, graph) }) }
    }
    case "generate_outline": {
      if (typeof markdown !== "string") return { isError: true, content: textContent(markdown) }
      return { content: textContent(generateOutline(markdown)) }
    }
    case "get_markdown_stats": {
      if (typeof markdown !== "string") return { isError: true, content: textContent(markdown) }
      const graph = parseMarkdownToGraph(markdown)
      return { content: textContent({ ...getDocumentStats(markdown, graph), nodeCount: graph.nodes.length, edgeCount: graph.edges.length }) }
    }
    case "export_markdown": {
      if (typeof markdown !== "string") return { isError: true, content: textContent(markdown) }
      return { content: [{ type: "text", text: markdown }] }
    }
    case "export_html": {
      if (typeof markdown !== "string") return { isError: true, content: textContent(markdown) }
      return { content: [{ type: "text", text: renderMarkdownDocument(markdown) }] }
    }
    case "export_json": {
      if (typeof markdown !== "string") return { isError: true, content: textContent(markdown) }
      return { content: textContent(exportMarkdownJson(markdown)) }
    }
    case "export_pdf":
    case "export_png":
      return {
        isError: true,
        content: textContent({
          status: "degraded",
          format: name === "export_pdf" ? "pdf" : "png",
          message: "This server-side export format is scaffolded but not implemented in Phase 1.",
        }),
      }
    case "generate_share_url": {
      if (typeof markdown !== "string") return { isError: true, content: textContent(markdown) }
      const url = generateBoundedShareUrl(markdown, new URL(request.url).origin)
      return typeof url === "string"
        ? { content: textContent({ shareUrl: url, storageMode: "url_only" }) }
        : { isError: true, content: textContent(url) }
    }
    case "generate_table_of_contents": {
      if (typeof markdown !== "string") return { isError: true, content: textContent(markdown) }
      return { content: [{ type: "text", text: deterministicTableOfContents(markdown) }] }
    }
    case "enhance_markdown":
      return { isError: true, content: textContent(unavailableModelResult("improve")) }
    case "summarize_markdown":
      return { isError: true, content: textContent(unavailableModelResult("summarize")) }
    case "get_health":
      return { content: textContent(buildHealth()) }
    case "get_info":
      return { content: textContent({ service: "markdown", name: siteConfig.name, url: siteConfig.url, version: siteConfig.version, auth: getAuthPolicy(), model: getModelStatus() }) }
    case "get_route_compliance":
      return { content: textContent(routeComplianceSummary()) }
    case "get_discovery_compliance":
      return { content: textContent(discoveryComplianceSummary()) }
    case "create_docs_report":
      return { isError: true, content: textContent(degradedReport("docs")) }
    case "create_sheet_report":
      return { isError: true, content: textContent(degradedReport("sheets")) }
    case "create_deck_summary":
      return { isError: true, content: textContent(degradedReport("decks")) }
    default:
      return { isError: true, content: textContent({ code: "UNKNOWN_TOOL", message: `Unknown MarkdownTree MCP tool: ${name}` }) }
  }
}

function readResource(uri: string) {
  if (uri === "markdown://examples") {
    return { uri, mimeType: "text/markdown", text: "# MarkdownTree Example\n\nPaste Markdown, inspect the outline, and export HTML or JSON." }
  }
  if (uri === "markdown://templates") {
    return { uri, mimeType: "application/json", text: JSON.stringify([{ name: "Technical Note", markdown: "# Title\n\n## Summary\n\n## Details\n" }], null, 2) }
  }
  if (uri === "markdown://exports") {
    return { uri, mimeType: "application/json", text: JSON.stringify({ active: ["markdown", "html", "json"], degraded: ["pdf", "png"] }, null, 2) }
  }
  if (uri === "markdown://openapi") {
    return { uri, mimeType: "application/json", text: JSON.stringify({ url: `${siteConfig.url}/openapi.json` }, null, 2) }
  }
  if (uri === "markdown://llms") {
    return { uri, mimeType: "application/json", text: JSON.stringify({ summary: `${siteConfig.url}/llms.txt`, full: `${siteConfig.url}/llms-full.txt`, index: `${siteConfig.url}/llms-index.json` }, null, 2) }
  }
  if (uri === "markdown://trust-policy") {
    return { uri, mimeType: "application/json", text: JSON.stringify({ policy: siteConfig.trustPolicyLine }, null, 2) }
  }
  return null
}

function getPrompt(name: string) {
  if (!mcpPrompts.includes(name as (typeof mcpPrompts)[number])) return null
  return {
    name,
    description: `MarkdownTree prompt for ${name.replace(/_/g, " ")}.`,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Use MarkdownTree's parser, outline, graph, stats, and export tools to ${name.replace(/_/g, " ")}. Do not invent unavailable PDF, PNG, AI, or persistence behavior.`,
        },
      },
    ],
  }
}

async function handleRpc(request: JsonRpcRequest, httpRequest: Request) {
  if (request.jsonrpc !== "2.0" || !request.method) return rpcError(request.id, -32600, "Invalid JSON-RPC 2.0 request")

  switch (request.method) {
    case "initialize":
      return rpcResult(request.id, {
        protocolVersion: "2024-11-05",
        serverInfo: { name: "markdowntree", version: siteConfig.version },
        capabilities: { tools: {}, resources: {}, prompts: {} },
      })
    case "ping":
      return rpcResult(request.id, { ok: true, service: "markdown", timestamp: new Date().toISOString() })
    case "tools/list":
      return rpcResult(request.id, { tools: toolList() })
    case "tools/call": {
      const params = request.params ?? {}
      const name = params.name
      if (typeof name !== "string") return rpcError(request.id, -32602, "tools/call requires params.name")
      return rpcResult(request.id, callTool(name, params, httpRequest))
    }
    case "resources/list":
      return rpcResult(request.id, {
        resources: mcpResources.map((uri) => ({
          uri,
          name: uri.replace("markdown://", ""),
          description: `MarkdownTree ${uri.replace("markdown://", "").replace(/[{}]/g, "")} resource`,
          mimeType: uri.includes("llms") || uri.includes("openapi") || uri.includes("trust") ? "application/json" : "text/markdown",
        })),
      })
    case "resources/read": {
      const uri = request.params?.uri
      if (typeof uri !== "string") return rpcError(request.id, -32602, "resources/read requires params.uri")
      const resource = readResource(uri)
      if (!resource) return rpcError(request.id, -32004, "Resource is unavailable or requires a future persistence backend", { uri })
      return rpcResult(request.id, { contents: [resource] })
    }
    case "prompts/list":
      return rpcResult(request.id, { prompts: mcpPrompts.map((name) => ({ name, description: `MarkdownTree prompt for ${name.replace(/_/g, " ")}.` })) })
    case "prompts/get": {
      const name = request.params?.name
      if (typeof name !== "string") return rpcError(request.id, -32602, "prompts/get requires params.name")
      const prompt = getPrompt(name)
      if (!prompt) return rpcError(request.id, -32004, "Prompt not found", { name })
      return rpcResult(request.id, prompt)
    }
    default:
      return rpcError(request.id, -32601, "Method not found")
  }
}

export async function POST(request: Request) {
  let body: unknown
  const trace = createTraceContext(request.headers, "mcp")
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400 })
  }

  const result = Array.isArray(body)
    ? await Promise.all(body.map((item) => handleRpc(item as JsonRpcRequest, request)))
    : await handleRpc(body as JsonRpcRequest, request)

  const response = NextResponse.json(result)
  Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
  return response
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "markdown",
    endpoint: "/api/mcp",
    transport: "http-json-rpc",
    jsonrpc: "2.0",
    methods: ["initialize", "ping", "tools/list", "tools/call", "resources/list", "resources/read", "prompts/list", "prompts/get"],
    tools: markdownTools,
    resources: mcpResources,
    prompts: mcpPrompts,
    publicAccess: "read-only introspection and bounded public-safe Markdown tools",
    auth: getAuthPolicy(),
    trace: { traceRequired: true, traceUrlTemplate: `${traceLink("{traceId}")}` },
  })
}
