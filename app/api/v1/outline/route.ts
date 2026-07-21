import { apiSuccess, errors, corsHeaders } from "@/lib/api/utils"
import { generateOutline, parseMarkdownToGraph } from "@/lib/markdown/parser"
import { validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, exportMarkdownSpan, traceHeaders, traceLink } from "@/lib/platform/trace"
import { after } from "next/server"

export async function POST(request: Request) {
  const startedAt = new Date().toISOString()
  const trace = createTraceContext(request.headers, "outline")
  try {
    const body = await request.json()
    const validMarkdown = validateMarkdownInput(body.markdown)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)
    const graph = parseMarkdownToGraph(validMarkdown)
    const outline = generateOutline(validMarkdown, graph)
    const traceExport = process.env.PLATPHORM_API_KEY ? "queued" : "disabled"
    if (traceExport === "queued") {
      after(async () => {
        await exportMarkdownSpan({
          context: trace,
          operation: "outline",
          startTime: startedAt,
          summary: {
            intent: "Generate a structured outline from validated Markdown.",
            input: `Validated ${validMarkdown.length} Markdown characters; raw document content was excluded.`,
            output: `Generated an outline from ${graph.nodes.length} parsed nodes.`,
            evidence: "Trace-linked outline response metadata.",
          },
        })
      })
    }
    const response = apiSuccess({
      outline,
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId), exportStatus: traceExport },
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    response.headers.set("X-PlatPhorm-Trace-Export", traceExport)
    return response
  } catch (error) {
    console.error("Outline error:", error)
    if (process.env.PLATPHORM_API_KEY) {
      after(async () => {
        await exportMarkdownSpan({
          context: trace,
          operation: "outline",
          startTime: startedAt,
          status: "failed",
          summary: {
            intent: "Generate a structured outline from validated Markdown.",
            input: "Markdown validation or parsing failed; raw document content was excluded.",
            output: "No successful outline artifact was claimed.",
            evidence: "Trace-linked failed outline response.",
          },
        })
      })
    }
    return errors.serverError("Failed to generate outline")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
