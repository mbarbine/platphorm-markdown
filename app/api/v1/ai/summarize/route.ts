import { apiError, corsHeaders, errors } from "@/lib/api/utils"
import { getModelStatus, unavailableModelResult } from "@/lib/model/markdown-model"
import { validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, traceLink } from "@/lib/platform/trace"

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "ai-summarize")
    const body = await request.json()
    const validMarkdown = validateMarkdownInput(body.markdown)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)

    const model = getModelStatus()
    if (!model.configured) {
      return apiError("MODEL_UNAVAILABLE", "AI summarization is not configured for this deployment.", 503, {
        ...unavailableModelResult("summarize"),
        trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
      })
    }

    return apiError("MODEL_ADAPTER_NOT_CONNECTED", "Model provider is detected, but summarization execution is not enabled in this Phase 1 adapter.", 501, {
      model,
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
    })
  } catch (error) {
    console.error("Summarize error:", error)
    return errors.serverError("Failed to summarize markdown")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
