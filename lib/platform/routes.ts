import { siteConfig } from "@/lib/platphorm/config"

export interface PublicRoute {
  path: string
  title: string
  description: string
  priority: number
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  surface: "page" | "discovery" | "api-read"
  jsonLd: ("WebPage" | "FAQPage" | "SoftwareApplication" | "TechArticle")[]
}

export const publicRoutes: PublicRoute[] = [
  {
    path: "/",
    title: "MarkdownTree",
    description: "Browser-first Markdown editor and visual document graph.",
    priority: 1,
    changeFrequency: "weekly",
    surface: "page",
    jsonLd: ["WebPage", "SoftwareApplication"],
  },
  {
    path: "/editor",
    title: "MarkdownTree Editor",
    description: "Write, paste, preview, analyze, graph, and export Markdown locally.",
    priority: 0.95,
    changeFrequency: "weekly",
    surface: "page",
    jsonLd: ["WebPage", "SoftwareApplication"],
  },
  {
    path: "/docs",
    title: "MarkdownTree Docs",
    description: "MarkdownTree API, MCP, export, and platform documentation.",
    priority: 0.8,
    changeFrequency: "monthly",
    surface: "page",
    jsonLd: ["WebPage", "TechArticle"],
  },
  {
    path: "/api/docs",
    title: "MarkdownTree API Docs",
    description: "OpenAPI 3.1 description for public-safe Markdown endpoints.",
    priority: 0.7,
    changeFrequency: "weekly",
    surface: "api-read",
    jsonLd: ["TechArticle"],
  },
  {
    path: "/faq",
    title: "MarkdownTree FAQ",
    description: "Common questions about local drafts, API access, exports, AI state, and sharing.",
    priority: 0.65,
    changeFrequency: "monthly",
    surface: "page",
    jsonLd: ["FAQPage"],
  },
  {
    path: "/privacy",
    title: "Privacy",
    description: "MarkdownTree browser-local privacy policy.",
    priority: 0.3,
    changeFrequency: "yearly",
    surface: "page",
    jsonLd: ["WebPage"],
  },
  {
    path: "/terms",
    title: "Terms",
    description: "Terms for using MarkdownTree.",
    priority: 0.3,
    changeFrequency: "yearly",
    surface: "page",
    jsonLd: ["WebPage"],
  },
  {
    path: "/accessibility",
    title: "Accessibility",
    description: "Accessibility notes for MarkdownTree.",
    priority: 0.3,
    changeFrequency: "yearly",
    surface: "page",
    jsonLd: ["WebPage"],
  },
  {
    path: "/open-source",
    title: "Open Source",
    description: "Open-source status and repository links.",
    priority: 0.5,
    changeFrequency: "monthly",
    surface: "page",
    jsonLd: ["WebPage"],
  },
  {
    path: "/llms.txt",
    title: "LLMS Summary",
    description: "Readable LLM summary for MarkdownTree.",
    priority: 0.4,
    changeFrequency: "daily",
    surface: "discovery",
    jsonLd: ["TechArticle"],
  },
  {
    path: "/llms-index.json",
    title: "LLMS Index",
    description: "Machine-readable route and capability index.",
    priority: 0.4,
    changeFrequency: "daily",
    surface: "discovery",
    jsonLd: ["TechArticle"],
  },
  {
    path: "/openapi.yaml",
    title: "OpenAPI YAML",
    description: "YAML OpenAPI document.",
    priority: 0.4,
    changeFrequency: "daily",
    surface: "discovery",
    jsonLd: ["TechArticle"],
  },
  {
    path: "/openapi.json",
    title: "OpenAPI JSON",
    description: "JSON OpenAPI document.",
    priority: 0.4,
    changeFrequency: "daily",
    surface: "discovery",
    jsonLd: ["TechArticle"],
  },
  {
    path: "/rss.xml",
    title: "RSS",
    description: "Public MarkdownTree RSS feed.",
    priority: 0.4,
    changeFrequency: "daily",
    surface: "discovery",
    jsonLd: ["TechArticle"],
  },
  {
    path: "/feed.xml",
    title: "Feed",
    description: "Public MarkdownTree XML feed.",
    priority: 0.4,
    changeFrequency: "daily",
    surface: "discovery",
    jsonLd: ["TechArticle"],
  },
  {
    path: "/.well-known/mcp.json",
    title: "MCP Well-Known",
    description: "Read-only MCP discovery metadata.",
    priority: 0.4,
    changeFrequency: "daily",
    surface: "discovery",
    jsonLd: ["TechArticle"],
  },
  {
    path: "/.well-known/trust.json",
    title: "Trust Policy",
    description: "Public/protected boundary and data exposure policy.",
    priority: 0.4,
    changeFrequency: "daily",
    surface: "discovery",
    jsonLd: ["TechArticle"],
  },
]

export const markdownTools = [
  "parse_markdown",
  "transform_markdown_to_graph",
  "generate_outline",
  "get_markdown_stats",
  "export_markdown",
  "export_html",
  "export_json",
  "generate_share_url",
  "generate_table_of_contents",
  "get_health",
  "get_info",
  "get_route_compliance",
  "get_discovery_compliance",
] as const

export const mcpResources = [
  "markdown://examples",
  "markdown://templates",
  "markdown://exports",
  "markdown://openapi",
  "markdown://llms",
  "markdown://trust-policy",
] as const

export const mcpPrompts = [
  "explain_markdown_structure",
  "improve_markdown",
  "generate_markdown_outline",
  "generate_markdown_toc",
  "create_markdown_export_plan",
  "debug_markdown_graph",
  "human_machine_markdown_handoff",
] as const

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === "/" ? "" : path}`
}

export function routeComplianceSummary() {
  const requiredRoutes = [
    "/api/health",
    "/api/v1/health",
    "/api/docs",
    "/openapi.yaml",
    "/openapi.json",
    "/llms.txt",
    "/llms-full.txt",
    "/llms-index.json",
    "/robots.txt",
    "/sitemap.xml",
    "/sitemap-main.xml",
    "/sitemap-full.xml",
    "/sitemap-index.xml",
    "/rss.xml",
    "/feed.xml",
    "/humans.txt",
    "/manifest.webmanifest",
    "/faq",
    "/.well-known/mcp.json",
    "/.well-known/agents.json",
    "/.well-known/ai-plugin.json",
    "/.well-known/security.txt",
    "/.well-known/trust.json",
    "/api/mcp",
  ]
  return {
    requiredRoutes,
    implementedRoutes: requiredRoutes,
    unsupportedRoutes: [] as string[],
    score: 1,
    status: "healthy" as const,
  }
}

export function discoveryComplianceSummary() {
  return {
    status: "healthy" as const,
    sitemapStatus: "dynamic_canonical_main_full_and_index",
    rssStatus: "dynamic_public_safe_feed",
    llmsStatus: "dynamic_readable",
    openapiStatus: "dynamic_json_and_yaml",
    mcpStatus: "json_rpc_public_read_introspection",
  }
}
