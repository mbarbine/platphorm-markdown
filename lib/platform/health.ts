import { siteConfig } from "@/lib/platphorm/config"
import { getAuthPolicy } from "@/lib/platform/auth"
import { discoveryComplianceSummary, routeComplianceSummary } from "@/lib/platform/routes"
import { getModelStatus } from "@/lib/model/markdown-model"

export function buildHealth() {
  const routeCompliance = routeComplianceSummary()
  const discoveryCompliance = discoveryComplianceSummary()
  const model = getModelStatus()

  return {
    service: "markdown",
    name: siteConfig.name,
    version: siteConfig.version,
    environment: process.env.NODE_ENV ?? "unknown",
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: typeof process.uptime === "function" ? process.uptime() : null,
    database: {
      status: process.env.DATABASE_URL ? "configured" : "degraded",
      storageMode: process.env.DATABASE_URL ? "server_available" : "browser_local_only",
      message: process.env.DATABASE_URL
        ? "Database URL is configured; persistent server features can be layered behind protected actions."
        : "No DATABASE_URL configured. Markdown documents are not stored server-side; local drafts use browser storage.",
    },
    cache: { status: "degraded", message: "No shared cache is required for public-safe Phase 1 Markdown tools." },
    mcp: { status: "healthy", endpoint: "/api/mcp", jsonRpc: "2.0" },
    model,
    auth: getAuthPolicy(),
    routeComplianceScore: routeCompliance.score,
    observabilityComplianceScore: 0.75,
    discoveryStatus: discoveryCompliance.status,
    rssStatus: discoveryCompliance.rssStatus,
    sitemapStatus: discoveryCompliance.sitemapStatus,
    llmsStatus: discoveryCompliance.llmsStatus,
    openapiStatus: discoveryCompliance.openapiStatus,
    trustedDomainStatus: "platphormnews_wildcard_public_read",
    traceEnabled: true,
    traceExportEnabled: false,
    traceContextAccepted: true,
    traceContextPropagated: true,
    lastTraceExportAt: null,
    spansEmittedLast24h: "local_response_headers_only",
    propagationTestStatus: "degraded_no_external_trace_export_configured",
    redactionStatus: "enabled",
    vercelMetadataCaptured: true,
    publicAccess: {
      homepage: "public",
      editor: "public-safe",
      parse: "public-safe",
      graph: "public-safe",
      preview: "public-safe",
      markdownHtmlJsonExports: "public-safe",
      pdfPngExports: "future-protected-degraded",
      aiEnhancements: model.configured ? "future-protected-configured" : "future-protected-degraded",
      webhooks: "unsupported-degraded",
    },
  }
}
