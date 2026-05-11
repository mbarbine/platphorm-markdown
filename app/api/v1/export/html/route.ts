import { corsHeaders, errors } from "@/lib/api/utils"
import { renderMarkdownDocument, validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, traceHeaders } from "@/lib/platform/trace"

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "export-html")
    const body = await request.json()
    const validMarkdown = validateMarkdownInput(body.markdown)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)
    const response = new Response(renderMarkdownDocument(validMarkdown), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error("HTML export error:", error)
    return errors.serverError("Failed to export HTML")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
