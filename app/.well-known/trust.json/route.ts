import { NextResponse } from "next/server"
import { siteConfig } from "@/lib/platphorm/config"
import { getAuthPolicy } from "@/lib/platform/auth"
import { routeComplianceSummary } from "@/lib/platform/routes"

export async function GET() {
  return NextResponse.json(
    {
      service: "markdown",
      name: siteConfig.name,
      url: siteConfig.url,
      policy: siteConfig.trustPolicyLine,
      publicSafeAccess: {
        homepage: true,
        editor: true,
        parsing: true,
        graphVisualization: true,
        outline: true,
        preview: true,
        stats: true,
        markdownHtmlJsonExports: true,
        boundedShareUrl: true,
        mcpIntrospection: true,
        discoveryFiles: true,
      },
      futureProtectedActions: getAuthPolicy().futureProtectedActions,
      auth: getAuthPolicy(),
      domainAllowlist: ["*.platphormnews.com"],
      localDraftPersistence: {
        storageMode: "browser-local",
        policy: "Use browser local draft storage only for non-sensitive Markdown. PLATPHORM_API_KEY is never stored client-side.",
      },
      dataExposure: {
        publicDiscovery: "No private Markdown content is published.",
        exports: "Exports are generated from submitted/local Markdown and not stored server-side in Phase 1.",
        share: "Share URLs are bounded and URL-only; no server share record is claimed.",
        model: "Model inputs stay server-side when providers are configured; no model provider is configured by default.",
      },
      routeStandard: routeComplianceSummary(),
      vercelMetadataPolicy: "Only safe Vercel request metadata may be captured; IP-like fields are hashed.",
      tracePropagationPolicy: "W3C traceparent/tracestate and safe PlatPhorm trace headers are accepted and propagated in responses.",
      securityContact: "support@platphormnews.com",
    },
    {
      headers: { "Cache-Control": "public, max-age=3600" },
    },
  )
}
