import { apiSuccess, errors, corsHeaders } from "@/lib/api/utils"
import { getDocumentStats, parseMarkdownToGraph } from "@/lib/markdown/parser"
import { validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, traceHeaders, traceLink } from "@/lib/platform/trace"

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "stats")
    const body = await request.json()
    const validMarkdown = validateMarkdownInput(body.markdown)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)
    const graph = parseMarkdownToGraph(validMarkdown)
    const response = apiSuccess({
      stats: { ...getDocumentStats(validMarkdown, graph), nodeCount: graph.nodes.length, edgeCount: graph.edges.length },
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error("Stats error:", error)
    return errors.serverError("Failed to calculate stats")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
