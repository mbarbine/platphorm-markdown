export async function GET() {
  const payload = {
    status: 'ok',
    version: '1.0.0',
    service: '-markdown',
    timestamp: new Date().toISOString(),
    environment: process.env.NEXT_PUBLIC_ENV || process.env.VERCEL_ENV || 'development',
    mcpEnabled: true
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
