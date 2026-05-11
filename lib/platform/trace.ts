import { createHash, randomUUID } from "crypto"

export interface TraceContext {
  traceId: string
  spanId: string
  parentSpanId: string | null
  traceparent: string
  tracestate: string | null
  requestId: string
  sourceSite: "markdown"
}

export interface SafeVercelMetadata {
  id?: string
  forwardedHost?: string
  forwardedProto?: string
  forwardedForHash?: string
  realIpHash?: string
  country?: string
  region?: string
  city?: string
  timezone?: string
  cache?: string
  contentType?: string
}

function hex(bytes: number): string {
  return randomUUID().replace(/-/g, "").slice(0, bytes * 2).padEnd(bytes * 2, "0")
}

function hashValue(value: string | null): string | undefined {
  if (!value) return undefined
  return createHash("sha256").update(value).digest("hex").slice(0, 24)
}

export function createTraceContext(headers: Headers, operation: string): TraceContext {
  const incoming = headers.get("traceparent")
  const match = incoming?.match(/^00-([a-f0-9]{32})-([a-f0-9]{16})-[a-f0-9]{2}$/i)
  const traceId = match?.[1] ?? hex(16)
  const parentSpanId = match?.[2] ?? null
  const spanId = hex(8)

  return {
    traceId,
    spanId,
    parentSpanId,
    traceparent: `00-${traceId}-${spanId}-01`,
    tracestate: headers.get("tracestate"),
    requestId: headers.get("x-platphorm-request-id") ?? `markdown-${operation}-${Date.now().toString(36)}`,
    sourceSite: "markdown",
  }
}

export function traceHeaders(context: TraceContext, targetSite?: string): Record<string, string> {
  return {
    traceparent: context.traceparent,
    ...(context.tracestate ? { tracestate: context.tracestate } : {}),
    "X-PlatPhorm-Trace-Id": context.traceId,
    "X-PlatPhorm-Span-Id": context.spanId,
    ...(context.parentSpanId ? { "X-PlatPhorm-Parent-Span-Id": context.parentSpanId } : {}),
    "X-PlatPhorm-Request-Id": context.requestId,
    "X-PlatPhorm-Source-Site": context.sourceSite,
    ...(targetSite ? { "X-PlatPhorm-Target-Site": targetSite } : {}),
  }
}

export function safeVercelMetadata(headers: Headers): SafeVercelMetadata {
  return {
    id: headers.get("x-vercel-id") ?? undefined,
    forwardedHost: headers.get("x-forwarded-host") ?? undefined,
    forwardedProto: headers.get("x-forwarded-proto") ?? undefined,
    forwardedForHash: hashValue(headers.get("x-forwarded-for") ?? headers.get("x-vercel-forwarded-for")),
    realIpHash: hashValue(headers.get("x-real-ip")),
    country: headers.get("x-vercel-ip-country") ?? undefined,
    region: headers.get("x-vercel-ip-country-region") ?? undefined,
    city: headers.get("x-vercel-ip-city") ?? undefined,
    timezone: headers.get("x-vercel-ip-timezone") ?? undefined,
    cache: headers.get("x-vercel-cache") ?? undefined,
    contentType: headers.get("content-type") ?? undefined,
  }
}

export function traceLink(traceId: string): string {
  return `https://trace.platphormnews.com/traces/${traceId}`
}
