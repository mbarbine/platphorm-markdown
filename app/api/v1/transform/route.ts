import { apiSuccess, errors, checkRateLimit, corsHeaders } from "@/lib/api/utils"
import { parseMarkdownToGraph, generateOutline, getDocumentStats } from "@/lib/markdown/parser"
import { validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, safeVercelMetadata, traceHeaders, traceLink } from "@/lib/platform/trace"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    // Rate limiting
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || "anonymous"
    const rateLimit = checkRateLimit(`transform:${ip}`, 60, 60000)
    
    if (!rateLimit.allowed) {
      return errors.rateLimited()
    }

    const trace = createTraceContext(request.headers, "transform")
    const body = await request.json()
    const { markdown, options = {} } = body

    const validMarkdown = validateMarkdownInput(markdown)
    if (typeof validMarkdown !== "string") {
      return errors.badRequest(validMarkdown.message, validMarkdown)
    }

    const graph = parseMarkdownToGraph(validMarkdown)
    const { nodes, edges } = graph
    const outline = generateOutline(validMarkdown, graph)
    const stats = getDocumentStats(validMarkdown, graph)

    const response = apiSuccess({
      nodes,
      edges,
      outline,
      stats: { ...stats, nodeCount: nodes.length, edgeCount: edges.length },
      options,
      trace: {
        traceId: trace.traceId,
        spanId: trace.spanId,
        traceparent: trace.traceparent,
        traceUrl: traceLink(trace.traceId),
      },
      vercel: safeVercelMetadata(request.headers),
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error("Transform error:", error)
    return errors.serverError("Failed to transform markdown")
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
