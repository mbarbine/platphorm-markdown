import { siteConfig } from "@/lib/platphorm/config"

const publicSafe = "Public-safe Phase 1 endpoint. PLATPHORM_API_KEY is not required unless PLATPHORM_REQUIRE_API_KEY is enabled for future protected actions."

function postOperation(summary: string, description: string, schema: string) {
  return {
    summary,
    description,
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: `#/components/schemas/${schema}` },
        },
      },
    },
    responses: {
      "200": {
        description: "Operation completed or returned an honest degraded state.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiResponse" },
          },
        },
      },
      "400": { description: "Invalid request." },
      "429": { description: "Rate limited." },
      "501": { description: "Feature scaffolded but unavailable in Phase 1." },
      "503": { description: "Backend model provider unavailable." },
    },
  }
}

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: `${siteConfig.name} API`,
    description:
      "Public-safe Markdown parsing, graph transformation, outline, stats, export, share, AI degraded-state, and MCP tooling for MarkdownTree.",
    version: siteConfig.version,
    contact: {
      name: siteConfig.creator,
      url: siteConfig.url,
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: siteConfig.url,
      description: "Production",
    },
  ],
  tags: [
    { name: "Health", description: "Health and compliance state" },
    { name: "Markdown", description: "Markdown parse, outline, stats, and graph operations" },
    { name: "Export", description: "Markdown, HTML, JSON, and honest degraded export adapters" },
    { name: "AI", description: "Backend model scaffolding and deterministic fallbacks" },
    { name: "MCP", description: "JSON-RPC 2.0 MCP endpoint and read-only discovery" },
    { name: "Discovery", description: "Public platform discovery files" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: publicSafe,
        responses: {
          "200": {
            description: "Service health summary",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
        },
      },
    },
    "/api/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Versioned health check",
        description: publicSafe,
        responses: { "200": { description: "Service health summary" } },
      },
    },
    "/api/v1/parse": {
      post: { tags: ["Markdown"], ...postOperation("Parse Markdown", "Parse Markdown into concrete graph, outline, and stats data.", "MarkdownRequest") },
    },
    "/api/v1/transform": {
      post: { tags: ["Markdown"], ...postOperation("Transform Markdown to graph", "Parse Markdown and return graph nodes, edges, outline, and stats.", "MarkdownRequest") },
    },
    "/api/v1/outline": {
      post: { tags: ["Markdown"], ...postOperation("Generate outline", "Generate a heading outline from Markdown.", "MarkdownRequest") },
    },
    "/api/v1/stats": {
      post: { tags: ["Markdown"], ...postOperation("Get Markdown stats", "Count words, lines, headings, links, images, code blocks, nodes, and edges.", "MarkdownRequest") },
    },
    "/api/v1/export": {
      post: { tags: ["Export"], ...postOperation("Export Markdown", "Export Markdown as markdown, html, json, or return honest degraded state for pdf/png.", "ExportRequest") },
    },
    "/api/v1/export/html": {
      post: {
        tags: ["Export"],
        summary: "Export HTML",
        description: "Convert Markdown to sanitized standalone HTML.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MarkdownRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Sanitized standalone HTML document.",
            content: {
              "text/html": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/v1/export/json": {
      post: { tags: ["Export"], ...postOperation("Export JSON", "Convert Markdown to structured graph, outline, stats, and source JSON.", "MarkdownRequest") },
    },
    "/api/v1/export/pdf": {
      post: { tags: ["Export"], ...postOperation("PDF export degraded state", "Server-side PDF export is scaffolded and returns an honest unavailable state until configured.", "MarkdownRequest") },
    },
    "/api/v1/export/png": {
      post: { tags: ["Export"], ...postOperation("PNG export degraded state", "Server-side PNG graph export is scaffolded and returns an honest unavailable state until configured.", "MarkdownRequest") },
    },
    "/api/v1/share": {
      post: { tags: ["Export"], ...postOperation("Generate bounded share URL", "Generate a public-safe URL with bounded encoded Markdown content. No server persistence is claimed.", "MarkdownRequest") },
    },
    "/api/v1/ai/status": {
      get: {
        tags: ["AI"],
        summary: "Model status",
        description: "Returns whether backend model integration is configured or degraded.",
        responses: { "200": { description: "Model status" } },
      },
    },
    "/api/v1/ai/enhance": {
      post: { tags: ["AI"], ...postOperation("Enhance Markdown", "Returns an honest degraded state until a model execution adapter is connected.", "AIEnhanceRequest") },
    },
    "/api/v1/ai/toc": {
      post: { tags: ["AI"], ...postOperation("Generate table of contents", "Generate a deterministic table of contents from real headings; model support may be layered later.", "MarkdownRequest") },
    },
    "/api/v1/ai/summarize": {
      post: { tags: ["AI"], ...postOperation("Summarize Markdown", "Returns an honest degraded state until a model execution adapter is connected.", "MarkdownRequest") },
    },
    "/api/mcp": {
      get: {
        tags: ["MCP"],
        summary: "MCP endpoint metadata",
        description: "Read-only MCP metadata and JSON-RPC usage.",
        responses: { "200": { description: "MCP metadata" } },
      },
      post: {
        tags: ["MCP"],
        summary: "MCP JSON-RPC 2.0",
        description: "Accepts JSON-RPC 2.0 objects or batches for real Markdown tools and introspection.",
        responses: { "200": { description: "JSON-RPC 2.0 response" } },
      },
    },
  },
  components: {
    securitySchemes: {
      platphormApiKey: {
        type: "apiKey",
        in: "header",
        name: "X-PlatPhorm-API-Key",
        description: "Future protected-action key. Public-safe Phase 1 endpoints do not require it by default.",
      },
      platphormBearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "PLATPHORM_API_KEY",
        description: "Authorization: Bearer $PLATPHORM_API_KEY for future protected actions.",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          success: { type: "boolean", deprecated: true },
          data: { type: "object" },
          error: { $ref: "#/components/schemas/ApiError" },
          meta: { $ref: "#/components/schemas/ApiMeta" },
        },
        required: ["ok"],
      },
      ApiError: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: { type: "object" },
        },
        required: ["code", "message"],
      },
      ApiMeta: {
        type: "object",
        properties: {
          version: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
          requestId: { type: "string" },
        },
      },
      MarkdownRequest: {
        type: "object",
        properties: {
          markdown: { type: "string", maxLength: 262144 },
          options: { type: "object" },
        },
        required: ["markdown"],
      },
      ExportRequest: {
        type: "object",
        properties: {
          markdown: { type: "string", maxLength: 262144 },
          format: { type: "string", enum: ["markdown", "json", "html", "pdf", "png"] },
        },
        required: ["markdown", "format"],
      },
      AIEnhanceRequest: {
        type: "object",
        properties: {
          markdown: { type: "string", maxLength: 262144 },
          action: { type: "string", enum: ["improve", "summarize", "expand", "fix-grammar", "generate-toc"] },
          context: { type: "string", maxLength: 4096 },
        },
        required: ["markdown", "action"],
      },
    },
  },
}

export function openApiYaml(): string {
  return toYaml(openApiSpec)
}

function toYaml(value: unknown, indent = 0): string {
  const space = " ".repeat(indent)
  if (Array.isArray(value)) {
    return value.map((item) => `${space}- ${formatYamlValue(item, indent + 2).trimStart()}`).join("\n")
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => {
        if (val && typeof val === "object") {
          return `${space}${JSON.stringify(key)}:\n${toYaml(val, indent + 2)}`
        }
        return `${space}${JSON.stringify(key)}: ${formatScalar(val)}`
      })
      .join("\n")
  }
  return `${space}${formatScalar(value)}`
}

function formatYamlValue(value: unknown, indent: number): string {
  if (value && typeof value === "object") return `\n${toYaml(value, indent)}`
  return formatScalar(value)
}

function formatScalar(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}
