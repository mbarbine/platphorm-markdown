import { openApiSpec } from "@/lib/api/openapi"
import { getModelStatus } from "@/lib/model/markdown-model"
import { siteConfig } from "@/lib/platphorm/config"
import { getAuthPolicy } from "@/lib/platform/auth"
import { discoveryComplianceSummary, markdownTools, mcpPrompts, mcpResources, publicRoutes, routeComplianceSummary } from "@/lib/platform/routes"

export async function GET() {
  const content = `# ${siteConfig.name} - Full LLM Context

Version: ${siteConfig.version}
Base URL: ${siteConfig.url}

## Role

MarkdownTree is a browser-first Markdown editor, visual document graph, parser, outline generator, live preview, export utility, structure analyzer, and Markdown API/MCP tool surface.

It is not Trace, Docs, MCP, Claws, Evals, BrowserOps, Sandbox, Webhooks, AgentUI, Base, Monitor, Atlas, Spec, Sheets, SVG, ASCII, Emoji, JSON, XML, or Phorm. Those are integrations or adjacent tools.

## Public-Safe Behavior

- Markdown content is parsed locally in the browser for the editor and graph.
- Public API requests parse or transform submitted Markdown and return the result; they do not claim to persist documents.
- Local non-sensitive drafts are browser-local.
- Share URLs are bounded and URL-only.
- Markdown, HTML, and JSON export are active.
- PDF and PNG export return explicit degraded states.
- Model-backed AI endpoints return degraded states unless a backend provider is configured.

## Auth

${JSON.stringify(getAuthPolicy(), null, 2)}

## Route Compliance

${JSON.stringify(routeComplianceSummary(), null, 2)}

## Discovery Compliance

${JSON.stringify(discoveryComplianceSummary(), null, 2)}

## Public Routes

${publicRoutes.map((route) => `- ${route.path}: ${route.description}`).join("\n")}

## MCP Tools

${markdownTools.map((tool) => `- ${tool}`).join("\n")}

## MCP Resources

${mcpResources.map((resource) => `- ${resource}`).join("\n")}

## MCP Prompts

${mcpPrompts.map((prompt) => `- ${prompt}`).join("\n")}

## Model State

${JSON.stringify(getModelStatus(), null, 2)}

## OpenAPI

\`\`\`json
${JSON.stringify(openApiSpec, null, 2)}
\`\`\`

## Trust Policy

${siteConfig.trustPolicyLine}

Updated: ${new Date().toISOString()}
`

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
