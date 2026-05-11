export async function GET() {
  return new Response(
    `Contact: mailto:support@platphormnews.com
Policy: https://markdown.platphormnews.com/.well-known/trust.json
Preferred-Languages: en
Canonical: https://markdown.platphormnews.com/.well-known/security.txt
`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    },
  )
}
