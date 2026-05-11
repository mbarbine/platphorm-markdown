import { apiSuccess, corsHeaders, errors } from "@/lib/api/utils"
import { exportMarkdownJson, validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, traceHeaders, traceLink } from "@/lib/platform/trace"

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "export-json")
    const body = await request.json()
    const validMarkdown = validateMarkdownInput(body.markdown)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)
    const response = apiSuccess({
      ...exportMarkdownJson(validMarkdown),
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error("JSON export error:", error)
    return errors.serverError("Failed to export JSON")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
