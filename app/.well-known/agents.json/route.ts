import { NextResponse } from "next/server"
import { siteConfig } from "@/lib/platphorm/config"
import { markdownTools } from "@/lib/platform/routes"

export async function GET() {
  return NextResponse.json({
    service: "markdown",
    name: siteConfig.name,
    url: siteConfig.url,
    purpose: "Markdown editing, parsing, graphing, outlining, preview, and public-safe export tooling.",
    agentOperable: true,
    publicSafeTools: markdownTools,
    unsupportedCapabilities: ["server-side PDF export", "server-side PNG export", "model-backed writing", "server document persistence"],
    mcp: `${siteConfig.url}/api/mcp`,
    trust: `${siteConfig.url}/.well-known/trust.json`,
  })
}
