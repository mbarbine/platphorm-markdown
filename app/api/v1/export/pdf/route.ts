import { apiError, corsHeaders } from "@/lib/api/utils"

export async function POST() {
  return apiError("EXPORT_UNAVAILABLE", "Server-side PDF export is scaffolded but not implemented in Phase 1. Use Markdown, HTML, or JSON export.", 501, {
    format: "pdf",
    status: "degraded",
    futureProtectedAction: "Requires PLATPHORM_API_KEY when enabled.",
  })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
