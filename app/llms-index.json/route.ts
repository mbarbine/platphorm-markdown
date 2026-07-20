import { NextResponse } from "next/server"
import { getModelStatus } from "@/lib/model/markdown-model"
import { siteConfig } from "@/lib/platphorm/config"
import { getAuthPolicy } from "@/lib/platform/auth"
import { discoveryComplianceSummary, markdownTools, mcpPrompts, mcpResources, publicRoutes, routeComplianceSummary } from "@/lib/platform/routes"

export async function GET() {
  return NextResponse.json(
    {
      service: "markdown",
      name: siteConfig.name,
      version: siteConfig.version,
      baseUrl: siteConfig.url,
      updatedAt: new Date().toISOString(),
      endpoints: {
        health: ["/api/health", "/api/v1/health"],
        docs: "/api/docs",
        openapi: ["/openapi.json", "/openapi.yaml"],
        parse: "/api/v1/parse",
        transform: "/api/v1/transform",
        outline: "/api/v1/outline",
        stats: "/api/v1/stats",
        export: ["/api/v1/export", "/api/v1/export/html", "/api/v1/export/json", "/api/v1/export/pdf", "/api/v1/export/png"],
        share: "/api/v1/share",
        ai: ["/api/v1/ai/status", "/api/v1/ai/enhance", "/api/v1/ai/toc", "/api/v1/ai/summarize"],
        mcp: "/api/mcp",
      },
      authPolicy: getAuthPolicy(),
      publicAccess: {
        editor: true,
        parser: true,
        graph: true,
        preview: true,
        markdownHtmlJsonExports: true,
        mcpIntrospection: true,
        futureProtectedActions: getAuthPolicy().futureProtectedActions,
      },
      markdownTools: ["parse", "transform", "outline", "stats", "preview"],
      graphTools: ["transform_markdown_to_graph", "generate_outline", "get_markdown_stats"],
      exportCapabilities: {
        active: ["markdown", "html", "json"],
        degraded: ["pdf", "png"],
        share: "bounded-url-only",
      },
      modelScaffolding: getModelStatus(),
      tools: markdownTools,
      resources: mcpResources,
      prompts: mcpPrompts,
      trustedDomains: ["*.platphormnews.com"],
      routeStandard: routeComplianceSummary(),
      integrations: {
        trace: "W3C response-header propagation active; external export requires OTEL configuration",
        docs: "public documentation links available; publishing unsupported",
        sheets: "unsupported",
        decks: "unsupported",
        browserops: "verification integration not invoked by public endpoint",
        evals: "verification integration not invoked by public endpoint",
        webhooks: "unsupported-degraded",
        sandbox: "not required for browser-first Markdown parsing",
        claws: "remediation discovery only; execution unsupported",
      },
      trustPolicy: siteConfig.trustPolicyLine,
      discovery: {
        publicRoutes,
        compliance: discoveryComplianceSummary(),
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  )
}
