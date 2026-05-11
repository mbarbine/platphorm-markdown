import { apiSuccess, corsHeaders, errors } from "@/lib/api/utils"
import { generateBoundedShareUrl, validateMarkdownInput, MAX_SHARE_BYTES } from "@/lib/markdown/render"
import { createTraceContext, traceHeaders, traceLink } from "@/lib/platform/trace"
import { siteConfig } from "@/lib/platphorm/config"

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "share")
    const body = await request.json()
    const validMarkdown = validateMarkdownInput(body.markdown, MAX_SHARE_BYTES)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)

    const origin = body.origin && typeof body.origin === "string" ? body.origin : siteConfig.url
    const shareUrl = generateBoundedShareUrl(validMarkdown, origin)
    if (typeof shareUrl !== "string") return errors.badRequest(shareUrl.message, shareUrl)

    const response = apiSuccess({
      status: "completed",
      storageMode: "url_only",
      persistence: "No server-side Markdown content was stored.",
      maxBytes: MAX_SHARE_BYTES,
      shareUrl,
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error("Share URL error:", error)
    return errors.serverError("Failed to generate share URL")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
