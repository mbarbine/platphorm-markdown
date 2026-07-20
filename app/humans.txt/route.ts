import { siteConfig } from "@/lib/platphorm/config"

export async function GET() {
  return new Response(
    `/* TEAM */
Publisher: ${siteConfig.creator}
Site: ${siteConfig.url}
Contact: support@platphormnews.com
Repository: ${siteConfig.links.github}

/* PRODUCT */
Name: ${siteConfig.name}
Purpose: Browser-first Markdown editing, preview, structure analysis, graph visualization, and deterministic export tooling.
Version: ${siteConfig.version}

/* STANDARDS */
Platform: PlatPhormNews Agentic Web Mesh
API: ${siteConfig.url}/api/docs
MCP: ${siteConfig.url}/api/mcp
Trust: ${siteConfig.url}/.well-known/trust.json
Updated: ${new Date().toISOString()}
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  )
}
