import { apiSuccess, corsHeaders, errors } from "@/lib/api/utils"
import { deterministicTableOfContents } from "@/lib/model/markdown-model"
import { validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, traceHeaders, traceLink } from "@/lib/platform/trace"

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "ai-toc")
    const body = await request.json()
    const validMarkdown = validateMarkdownInput(body.markdown)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)
    const response = apiSuccess({
      status: "completed",
      mode: "deterministic",
      toc: deterministicTableOfContents(validMarkdown),
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error("TOC error:", error)
    return errors.serverError("Failed to generate table of contents")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
