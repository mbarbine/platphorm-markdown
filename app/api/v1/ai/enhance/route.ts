import { apiError, apiSuccess, corsHeaders, errors } from "@/lib/api/utils"
import { deterministicTableOfContents, getModelStatus, unavailableModelResult } from "@/lib/model/markdown-model"
import { validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, traceHeaders, traceLink } from "@/lib/platform/trace"
import { z } from "zod"

const ActionSchema = z.enum(["improve", "summarize", "expand", "fix-grammar", "generate-toc"])

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "ai-enhance")
    const body = await request.json()
    const validMarkdown = validateMarkdownInput(body.markdown)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)

    const action = ActionSchema.safeParse(body.action)
    if (!action.success) return errors.badRequest(`Invalid action. Supported: ${ActionSchema.options.join(", ")}`)

    if (action.data === "generate-toc") {
      const response = apiSuccess({
        status: "completed",
        mode: "deterministic",
        output: deterministicTableOfContents(validMarkdown),
        trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
      })
      Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
      return response
    }

    const model = getModelStatus()
    if (!model.configured) {
      return apiError("MODEL_UNAVAILABLE", "AI enhancement is not configured for this deployment.", 503, {
        ...unavailableModelResult(action.data),
        trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
      })
    }

    return apiError("MODEL_ADAPTER_NOT_CONNECTED", "Model provider is detected, but generation execution is not enabled in this Phase 1 adapter.", 501, {
      action: action.data,
      model,
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
    })
  } catch (error) {
    console.error("AI enhance error:", error)
    return errors.serverError("AI enhancement failed")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
