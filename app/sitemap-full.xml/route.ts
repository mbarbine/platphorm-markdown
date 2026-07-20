import { siteConfig } from "@/lib/platphorm/config"
import { publicRoutes } from "@/lib/platform/routes"

const additionalPublicRoutes = [
  "/api/health",
  "/api/v1/health",
  "/llms-full.txt",
  "/robots.txt",
  "/sitemap.xml",
  "/sitemap-main.xml",
  "/sitemap-index.xml",
  "/rss.xml",
  "/feed.xml",
  "/manifest.webmanifest",
  "/humans.txt",
  "/.well-known/agents.json",
  "/.well-known/ai-plugin.json",
  "/.well-known/security.txt",
]

export async function GET() {
  const lastModified = new Date().toISOString()
  const paths = Array.from(new Set([...publicRoutes.map((route) => route.path), ...additionalPublicRoutes]))
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) => `  <url>
    <loc>${siteConfig.url}${path === "/" ? "" : path}</loc>
    <lastmod>${lastModified}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
