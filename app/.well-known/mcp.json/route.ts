import { NextResponse } from "next/server"
import { siteConfig } from "@/lib/platphorm/config"
import { getAuthPolicy } from "@/lib/platform/auth"
import { markdownTools, mcpPrompts, mcpResources } from "@/lib/platform/routes"
import { getModelStatus } from "@/lib/model/markdown-model"

export async function GET() {
  return NextResponse.json(
    {
      name: siteConfig.name,
      version: siteConfig.version,
      description: siteConfig.description,
      homepage: siteConfig.url,
      transport: {
        type: "http-json-rpc",
        endpoint: `${siteConfig.url}/api/mcp`,
        jsonrpc: "2.0",
      },
      capabilities: {
        tools: true,
        resources: true,
        prompts: true,
      },
      tools: markdownTools,
      resources: mcpResources,
      prompts: mcpPrompts,
      auth: getAuthPolicy(),
      exportCapabilities: {
        active: ["markdown", "html", "json"],
        degraded: ["pdf", "png"],
      },
      model: getModelStatus(),
      publicAccess: "Read-only MCP introspection and bounded public-safe Markdown parse/graph/export tools are public in Phase 1.",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  )
}
