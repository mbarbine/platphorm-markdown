export const dynamic = "force-dynamic"

function trustedSite(hostname) {
  return hostname === "platphormnews.com" || hostname.endsWith(".platphormnews.com")
}

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const domain = requestUrl.hostname.toLowerCase()
  if (!trustedSite(domain)) {
    if (domain.endsWith(".vercel.app")) {
      return Response.json({
        ok: true,
        data: {
          status: "degraded",
          domain,
          reason: "Centralized route crawling is limited to the canonical PlatPhormNews domain.",
          canonicalChecker: "https://base.platphormnews.com/api/v1/route-compliance",
        },
      })
    }
    return Response.json(
      { ok: false, error: { code: "untrusted_domain", message: "Route compliance is limited to trusted PlatPhormNews sites.", details: { domain } } },
      { status: 400 },
    )
  }

  const target = new URL("https://base.platphormnews.com/api/v1/route-compliance")
  target.searchParams.set("domain", domain)
  target.searchParams.set("mode", "full")
  target.searchParams.set("timeoutMs", requestUrl.searchParams.get("timeoutMs") || "1200")
  return Response.redirect(target, 307)
}
