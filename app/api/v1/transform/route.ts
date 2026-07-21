import { apiSuccess, errors, checkRateLimit, corsHeaders } from "@/lib/api/utils"
import { parseMarkdownToGraph, generateOutline, getDocumentStats } from "@/lib/markdown/parser"
import { validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, exportMarkdownSpan, safeVercelMetadata, traceHeaders, traceLink } from "@/lib/platform/trace"
import { headers } from "next/headers"
import { after } from "next/server"

export async function POST(request: Request) {
  const startedAt = new Date().toISOString()
  const trace = createTraceContext(request.headers, "transform")
  try {
    // Rate limiting
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || "anonymous"
    const rateLimit = checkRateLimit(`transform:${ip}`, 60, 60000)
    
    if (!rateLimit.allowed) {
      return errors.rateLimited()
    }

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
    const traceExport = process.env.PLATPHORM_API_KEY ? "queued" : "disabled"
    if (traceExport === "queued") {
      after(async () => {
        await exportMarkdownSpan({
          context: trace,
          operation: "transform",
          startTime: startedAt,
          summary: {
            intent: "Transform Markdown into a graph, outline, and measured document statistics.",
            input: `Validated ${validMarkdown.length} Markdown characters; raw document content was excluded.`,
            output: `Produced ${nodes.length} nodes and ${edges.length} edges.`,
            evidence: "Trace-linked transform response with graph and outline counts.",
          },
        })
      })
    }

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
      traceExport,
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    response.headers.set("X-PlatPhorm-Trace-Export", traceExport)
    return response
  } catch (error) {
    console.error("Transform error:", error)
    if (process.env.PLATPHORM_API_KEY) {
      after(async () => {
        await exportMarkdownSpan({
          context: trace,
          operation: "transform",
          startTime: startedAt,
          status: "failed",
          summary: {
            intent: "Transform Markdown into a graph, outline, and measured document statistics.",
            input: "Markdown request validation failed or the document could not be transformed; raw content was excluded.",
            output: "No successful graph artifact was claimed.",
            evidence: "Trace-linked failed transform response.",
          },
        })
      })
    }
    return errors.serverError("Failed to transform markdown")
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
