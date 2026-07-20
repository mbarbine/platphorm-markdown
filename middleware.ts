import { NextRequest, NextResponse } from "next/server"

const TRUSTED_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)*platphormnews\.com$/i
const LOCAL_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i

function isAllowedOrigin(origin: string | null): origin is string {
  if (!origin) return false
  if (TRUSTED_ORIGIN.test(origin)) return true
  return process.env.NODE_ENV !== "production" && LOCAL_ORIGIN.test(origin)
}

function randomHex(bytes: number): string {
  const values = new Uint8Array(bytes)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("")
}

function traceContext(request: NextRequest) {
  const incoming = request.headers.get("traceparent")
  const match = incoming?.match(/^00-([a-f0-9]{32})-([a-f0-9]{16})-[a-f0-9]{2}$/i)
  const traceId = match?.[1] ?? randomHex(16)
  const parentSpanId = match?.[2] ?? null
  const spanId = randomHex(8)
  const requestId = request.headers.get("x-platphorm-request-id") ?? `markdown-${randomHex(8)}`

  return {
    traceId,
    spanId,
    parentSpanId,
    requestId,
    traceparent: `00-${traceId}-${spanId}-01`,
  }
}

function applyHeaders(response: NextResponse, request: NextRequest, trace: ReturnType<typeof traceContext>) {
  const origin = request.headers.get("origin")
  if (isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-PlatPhorm-API-Key, traceparent, tracestate, baggage, X-PlatPhorm-Request-Id, X-PlatPhorm-Source-Site, X-PlatPhorm-Target-Site",
  )
  response.headers.set("Access-Control-Max-Age", "86400")
  response.headers.append("Vary", "Origin")
  response.headers.set("traceparent", trace.traceparent)
  response.headers.set("X-PlatPhorm-Trace-Id", trace.traceId)
  response.headers.set("X-PlatPhorm-Span-Id", trace.spanId)
  if (trace.parentSpanId) response.headers.set("X-PlatPhorm-Parent-Span-Id", trace.parentSpanId)
  response.headers.set("X-PlatPhorm-Request-Id", trace.requestId)
  response.headers.set("X-PlatPhorm-Source-Site", "markdown")
  return response
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin")
  const trace = traceContext(request)

  if (request.method === "OPTIONS") {
    if (origin && !isAllowedOrigin(origin)) {
      return applyHeaders(NextResponse.json({ ok: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin is outside the trusted PlatPhormNews scope." } }, { status: 403 }), request, trace)
    }
    return applyHeaders(new NextResponse(null, { status: 204 }), request, trace)
  }

  const forwarded = new Headers(request.headers)
  forwarded.set("X-PlatPhorm-Trace-Accepted", request.headers.has("traceparent") ? "true" : "false")
  forwarded.set("traceparent", trace.traceparent)
  forwarded.set("X-PlatPhorm-Trace-Id", trace.traceId)
  forwarded.set("X-PlatPhorm-Span-Id", trace.spanId)
  if (trace.parentSpanId) forwarded.set("X-PlatPhorm-Parent-Span-Id", trace.parentSpanId)
  forwarded.set("X-PlatPhorm-Request-Id", trace.requestId)
  forwarded.set("X-PlatPhorm-Source-Site", request.headers.get("X-PlatPhorm-Source-Site") ?? "markdown")

  return applyHeaders(NextResponse.next({ request: { headers: forwarded } }), request, trace)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
}
