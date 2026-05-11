import { apiError, corsHeaders, errors } from "@/lib/api/utils"
import { getModelStatus } from "@/lib/model/markdown-model"
import { createTraceContext, traceLink } from "@/lib/platform/trace"

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "ai-chat")
    const body = await request.json()
    if (!Array.isArray(body.messages)) return errors.badRequest("messages array is required")

    const model = getModelStatus()
    if (!model.configured) {
      return apiError("MODEL_UNAVAILABLE", "AI chat is unavailable because no backend model provider is configured.", 503, {
        status: "degraded",
        model,
        trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
      })
    }

    return apiError("MODEL_ADAPTER_NOT_CONNECTED", "Model provider is detected, but chat streaming is not enabled in this Phase 1 adapter.", 501, {
      model,
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
    })
  } catch (error) {
    console.error("AI chat error:", error)
    return errors.serverError("AI chat failed")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
