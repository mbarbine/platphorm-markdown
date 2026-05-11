import { apiError, corsHeaders } from "@/lib/api/utils"

export async function POST() {
  return apiError("EXPORT_UNAVAILABLE", "Server-side PNG graph export is scaffolded but not implemented in Phase 1. The browser graph remains usable; use Markdown, HTML, or JSON export.", 501, {
    format: "png",
    status: "degraded",
    futureProtectedAction: "Requires PLATPHORM_API_KEY when enabled.",
  })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
