import { siteConfig } from "@/lib/platphorm/config"
import { getAuthPolicy } from "@/lib/platform/auth"
import { discoveryComplianceSummary, routeComplianceSummary } from "@/lib/platform/routes"
import { getModelStatus } from "@/lib/model/markdown-model"
import { safeVercelMetadata } from "@/lib/platform/trace"

export function buildHealth(headers?: Headers) {
  const routeCompliance = routeComplianceSummary()
  const discoveryCompliance = discoveryComplianceSummary()
  const model = getModelStatus()
  const requestHeaders = headers ?? new Headers()
  const traceAcceptanceEvidence = requestHeaders.get("x-platphorm-trace-accepted")
  const traceContextAccepted = traceAcceptanceEvidence === "true" || (traceAcceptanceEvidence === null && requestHeaders.has("traceparent"))
  const vercelMetadata = safeVercelMetadata(requestHeaders)
  const vercelMetadataCaptured = Boolean(
    vercelMetadata.id || vercelMetadata.country || vercelMetadata.region || vercelMetadata.city || vercelMetadata.timezone,
  )
  const traceExportEnabled = Boolean(
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  )

  return {
    service: "markdown",
    name: siteConfig.name,
    version: siteConfig.version,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
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
    cache: { status: "not_applicable", message: "Public-safe Markdown tools are deterministic and do not require shared cache state." },
    mcp: { status: "healthy", endpoint: "/api/mcp", jsonRpc: "2.0" },
    model,
    auth: getAuthPolicy(),
    routeComplianceScore: routeCompliance.score,
    observabilityComplianceScore: traceExportEnabled ? 0.9 : 0.75,
    discoveryStatus: discoveryCompliance.status,
    rssStatus: discoveryCompliance.rssStatus,
    sitemapStatus: discoveryCompliance.sitemapStatus,
    llmsStatus: discoveryCompliance.llmsStatus,
    openapiStatus: discoveryCompliance.openapiStatus,
    trustedDomainStatus: "platphormnews_wildcard_public_read",
    traceEnabled: true,
    traceExportEnabled,
    traceContextAccepted,
    traceContextPropagated: traceContextAccepted,
    lastTraceExportAt: null,
    spansEmittedLast24h: null,
    propagationTestStatus: traceExportEnabled ? "not_run" : "degraded_no_external_trace_export_configured",
    redactionStatus: "safe_headers_only",
    vercelMetadataCaptured,
    vercelMetadata,
    lastNetworkSyncAt: null,
    lastSitemapSyncAt: null,
    lastFeedSyncAt: null,
    publicAccess: {
      homepage: "public",
      editor: "public-safe",
      parse: "public-safe",
      graph: "public-safe",
      preview: "public-safe",
      markdownHtmlJsonExports: "public-safe",
      pdfPngExports: "future-protected-degraded",
      aiEnhancements: model.configured ? "credentials-detected-adapter-degraded" : "future-protected-degraded",
      webhooks: "unsupported-degraded",
    },
  }
}
