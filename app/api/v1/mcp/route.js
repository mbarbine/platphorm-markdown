export async function GET() {
  return new Response(JSON.stringify({
    ok: true,
    data: {
      service: 'markdown',
      canonicalEndpoint: 'https://markdown.platphormnews.com/api/mcp',
      transport: 'HTTP JSON-RPC 2.0',
      note: 'Use GET /api/mcp for metadata and POST /api/mcp for initialize, ping, tools, resources, and prompts.'
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
