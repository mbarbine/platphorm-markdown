import { apiSuccess, errors, corsHeaders } from "@/lib/api/utils"
import { generateOutline, getDocumentStats, parseMarkdownToGraph } from "@/lib/markdown/parser"
import { validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, safeVercelMetadata, traceHeaders, traceLink } from "@/lib/platform/trace"

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "parse")
    const body = await request.json()
    const validMarkdown = validateMarkdownInput(body.markdown)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)

    const graph = parseMarkdownToGraph(validMarkdown)
    const response = apiSuccess({
      graph,
      outline: generateOutline(validMarkdown, graph),
      stats: { ...getDocumentStats(validMarkdown, graph), nodeCount: graph.nodes.length, edgeCount: graph.edges.length },
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceparent: trace.traceparent, traceUrl: traceLink(trace.traceId) },
      vercel: safeVercelMetadata(request.headers),
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error("Parse error:", error)
    return errors.serverError("Failed to parse markdown")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
