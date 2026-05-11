import { NextResponse } from "next/server"
import { siteConfig } from "@/lib/platphorm/config"

export async function GET() {
  return NextResponse.json({
    schema_version: "v1",
    name_for_human: "MarkdownTree",
    name_for_model: "markdowntree",
    description_for_human: "Write, parse, preview, graph, outline, and export Markdown.",
    description_for_model:
      "Use MarkdownTree for public-safe Markdown parsing, graph transformation, outline generation, stats, sanitized HTML export, JSON export, and bounded share URLs. Do not claim PDF, PNG, AI model generation, or server persistence unless the endpoint reports it as available.",
    auth: { type: "none" },
    api: { type: "openapi", url: `${siteConfig.url}/openapi.yaml` },
    logo_url: `${siteConfig.url}/icon-512.jpg`,
    contact_email: "support@platphormnews.com",
    legal_info_url: `${siteConfig.url}/terms`,
  })
}
