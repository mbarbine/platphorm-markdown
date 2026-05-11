import { openApiYaml } from "@/lib/api/openapi"

export async function GET() {
  return new Response(openApiYaml(), {
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
