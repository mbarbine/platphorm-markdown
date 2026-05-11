import { siteConfig } from "@/lib/platphorm/config"
import { getAuthPolicy } from "@/lib/platform/auth"
import { markdownTools, mcpPrompts, mcpResources, publicRoutes } from "@/lib/platform/routes"
import { getModelStatus } from "@/lib/model/markdown-model"

export async function GET() {
  const model = getModelStatus()
  const auth = getAuthPolicy()
  const content = `# ${siteConfig.name}

${siteConfig.description}

## Product Purpose

MarkdownTree is the canonical Markdown editor and document-structure utility for the PlatPhormNews web mesh. It lets humans and agents write, paste, inspect, format, preview, graph, analyze, export, share, and reason over Markdown documents.

## Public Phase 1 Capabilities

- Browser-first Markdown editing with local non-sensitive draft persistence.
- Real Markdown parsing into graph nodes and edges.
- Outline generation from actual headings.
- Live sanitized HTML preview.
- Document stats for words, lines, headings, links, images, code blocks, nodes, and edges.
- Editor, split, graph, and preview modes.
- Public REST endpoints for parse, transform, outline, stats, Markdown export, HTML export, JSON export, and bounded URL-only sharing.
- Public read-only MCP introspection and bounded Markdown MCP tools.

## Export Capability State

- Active: Markdown, HTML, JSON.
- Degraded: PDF export and PNG graph export are scaffolded but unavailable in Phase 1.
- Share URLs: URL-only and size-bounded; Markdown content is not stored server-side.

## Model Capability State

- Status: ${model.status}
- Provider: ${model.provider}
- Message: ${model.message}
- Deterministic fallback: table of contents generation from real headings.

## Auth Policy

- Public-safe Phase 1 flows are open by default.
- Enforcement flag: PLATPHORM_REQUIRE_API_KEY=${auth.enforcementEnabled ? "true" : "false"}.
- Future protected actions accept only Authorization: Bearer $PLATPHORM_API_KEY or X-PlatPhorm-API-Key.
- PLATPHORM_API_KEY is never stored in browser local drafts, exports, traces, RSS, sitemap, or discovery files.

## Core Endpoints

- GET /api/health
- GET /api/v1/health
- GET /api/docs
- GET /openapi.json
- GET /openapi.yaml
- POST /api/v1/parse
- POST /api/v1/transform
- POST /api/v1/outline
- POST /api/v1/stats
- POST /api/v1/export
- POST /api/v1/export/html
- POST /api/v1/export/json
- POST /api/v1/export/pdf
- POST /api/v1/export/png
- POST /api/v1/share
- GET /api/mcp
- POST /api/mcp

## MCP

- Tools: ${markdownTools.length}
- Resources: ${mcpResources.length}
- Prompts: ${mcpPrompts.length}
- JSON-RPC 2.0 endpoint: ${siteConfig.url}/api/mcp

## Discovery Routes

${publicRoutes.map((route) => `- ${route.path} - ${route.title}`).join("\n")}

## Trace And Integrations

Markdown operations emit W3C trace response headers and safe PlatPhorm trace metadata. External Trace export is currently degraded unless a protected trace exporter is configured.

${siteConfig.trustPolicyLine}
`

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
