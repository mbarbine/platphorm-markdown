import { apiError, apiSuccess, errors, corsHeaders } from "@/lib/api/utils"
import { exportMarkdownJson, renderMarkdownDocument, validateMarkdownInput } from "@/lib/markdown/render"
import { createTraceContext, traceHeaders, traceLink } from "@/lib/platform/trace"

type ExportFormat = "markdown" | "json" | "html" | "pdf" | "png"

function degradedExport(format: "pdf" | "png") {
  return apiError("EXPORT_UNAVAILABLE", `${format.toUpperCase()} export is not enabled in Phase 1. Markdown, HTML, and JSON exports are available.`, 501, {
    format,
    status: "degraded",
    futureProtectedAction: "Requires PLATPHORM_API_KEY when enabled.",
  })
}

export async function POST(request: Request) {
  try {
    const trace = createTraceContext(request.headers, "export")
    const body = await request.json()
    const { markdown, format = "json" } = body as { markdown: string; format: ExportFormat }
    const validMarkdown = validateMarkdownInput(markdown)
    if (typeof validMarkdown !== "string") return errors.badRequest(validMarkdown.message, validMarkdown)

    if (!["markdown", "json", "html", "pdf", "png"].includes(format)) {
      return errors.badRequest("Invalid format. Supported: markdown, json, html, pdf, png")
    }

    if (format === "pdf" || format === "png") return degradedExport(format)

    if (format === "markdown") {
      const response = apiSuccess({
        format: "markdown",
        content: validMarkdown,
        mimeType: "text/markdown",
        filename: "document.md",
      })
      Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
      return response
    }

    if (format === "html") {
      const response = apiSuccess({
        format: "html",
        content: renderMarkdownDocument(validMarkdown),
        mimeType: "text/html",
        filename: "document.html",
      })
      Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
      return response
    }

    const response = apiSuccess({
      ...exportMarkdownJson(validMarkdown),
      trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
    })
    Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error("Export error:", error)
    return errors.serverError("Failed to export document")
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
