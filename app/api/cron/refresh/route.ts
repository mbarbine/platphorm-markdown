import { apiError, apiSuccess } from "@/lib/api/utils"
import { hasValidPlatphormApiKey } from "@/lib/platform/auth"
import { discoveryComplianceSummary, publicRoutes, routeComplianceSummary } from "@/lib/platform/routes"
import { createTraceContext, traceHeaders, traceLink } from "@/lib/platform/trace"

function hasCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

async function handleRefresh(request: Request) {
  const trace = createTraceContext(request.headers, "cron-refresh")
  if (!hasValidPlatphormApiKey(request) && !hasCronSecret(request)) {
    return apiError("AUTH_REQUIRED", "Cron refresh requires PLATPHORM_API_KEY or configured Vercel cron secret.", 401)
  }

  const response = apiSuccess({
    status: "completed",
    bounded: true,
    refreshed: ["route-inventory", "sitemap-canonical-routes", "rss-metadata", "llms-metadata", "health-summary"],
    publicRouteCount: publicRoutes.length,
    routeCompliance: routeComplianceSummary(),
    discoveryCompliance: discoveryComplianceSummary(),
    trace: { traceId: trace.traceId, spanId: trace.spanId, traceUrl: traceLink(trace.traceId) },
  })
  Object.entries(traceHeaders(trace)).forEach(([key, value]) => response.headers.set(key, value))
  return response
}

export async function GET(request: Request) {
  return handleRefresh(request)
}

export async function POST(request: Request) {
  return handleRefresh(request)
}
