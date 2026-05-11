import { siteConfig } from "@/lib/platphorm/config"

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function buildRssFeed() {
  const buildDate = new Date().toUTCString()
  const items = [
    {
      title: "MarkdownTree Phase 1 public Markdown tools",
      link: `${siteConfig.url}/editor`,
      guid: `${siteConfig.url}/editor#phase-1`,
      description: "Browser-first Markdown editor, real graph transform, outline, preview, stats, and Markdown/HTML/JSON exports.",
    },
    {
      title: "MarkdownTree API and MCP endpoints",
      link: `${siteConfig.url}/api/docs`,
      guid: `${siteConfig.url}/api/docs#openapi`,
      description: "OpenAPI and JSON-RPC MCP surfaces for public-safe Markdown parsing, graphing, outline, stats, and exports.",
    },
    {
      title: "MarkdownTree discovery files",
      link: `${siteConfig.url}/llms.txt`,
      guid: `${siteConfig.url}/llms.txt#discovery`,
      description: "Readable llms.txt, full context, route index, sitemap, trust policy, and well-known discovery files.",
    },
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml"/>
    <generator>${escapeXml(`${siteConfig.name} ${siteConfig.version}`)}</generator>
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${buildDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>`
}

export async function GET() {
  return new Response(buildRssFeed(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
