import { siteConfig } from "@/lib/platphorm/config"

export async function GET() {
  return Response.json(
    {
      name: siteConfig.name,
      short_name: "MarkdownTree",
      description: siteConfig.description,
      start_url: "/editor",
      scope: "/",
      display: "standalone",
      background_color: "#060c18",
      theme_color: "#10b981",
      icons: [
        { src: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg" },
        { src: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg" },
      ],
      categories: ["productivity", "developer", "utilities"],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=86400",
      },
    },
  )
}
