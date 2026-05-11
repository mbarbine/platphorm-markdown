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
    publicSafeTools: markdownTools.filter((tool) => !["export_pdf", "export_png", "enhance_markdown", "summarize_markdown"].includes(tool)),
    degradedTools: ["export_pdf", "export_png", "enhance_markdown", "summarize_markdown", "create_docs_report", "create_sheet_report", "create_deck_summary"],
    mcp: `${siteConfig.url}/api/mcp`,
    trust: `${siteConfig.url}/.well-known/trust.json`,
  })
}
