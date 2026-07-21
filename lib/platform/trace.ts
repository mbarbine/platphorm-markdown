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

export type MarkdownSpanSummary = {
  intent: string
  input: string
  output: string
  evidence: string
}

function safeSummary(value: string) {
  return value.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").slice(0, 500)
}

async function emitLifecycle(path: string, apiKey: string, context: TraceContext, payload: Record<string, unknown>) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1_800)
  try {
    const response = await fetch(`${process.env.PLATPHORM_TRACE_BASE_URL || "https://trace.platphormnews.com"}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "X-PlatPhorm-API-Key": apiKey,
        ...traceHeaders(context, "trace.platphormnews.com"),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function exportMarkdownSpan(input: {
  context: TraceContext
  operation: string
  startTime: string
  status?: "completed" | "failed"
  summary: MarkdownSpanSummary
}) {
  const apiKey = process.env.PLATPHORM_API_KEY || ""
  if (!apiKey) return { traceId: input.context.traceId, spanId: input.context.spanId, status: "disabled" as const }
  const metadata = {
    traceName: `Markdown ${input.operation}`,
    agentName: "PlatPhorm Markdown",
    sourceDomain: "markdown.platphormnews.com",
    traceClass: "product",
    operationFingerprint: `markdown:${input.operation}:v1`,
    intent: safeSummary(input.summary.intent),
    input: safeSummary(input.summary.input),
    output: safeSummary(input.summary.output),
    evidence: safeSummary(input.summary.evidence),
  }
  const common = {
    traceId: input.context.traceId,
    spanId: input.context.spanId,
    parentSpanId: input.context.parentSpanId,
    name: `Markdown ${input.operation}`,
    kind: "SERVER",
    sourceSite: "markdown.platphormnews.com",
    targetSite: "markdown.platphormnews.com",
    serviceName: "markdown",
    apiOperation: input.operation,
    startTime: input.startTime,
    publicSafe: true,
    protected: false,
    tags: ["product"],
    metadata,
  }
  const started = await emitLifecycle("/api/v1/spans/start", apiKey, input.context, common)
  const terminal = await emitLifecycle(
    input.status === "failed" ? "/api/v1/spans/fail" : "/api/v1/spans/complete",
    apiKey,
    input.context,
    {
      ...common,
      endTime: new Date().toISOString(),
      ...(input.status === "failed" ? { errorCode: "MARKDOWN_OPERATION_FAILED", errorMessage: `Markdown ${input.operation} failed.` } : {}),
    },
  )
  return {
    traceId: input.context.traceId,
    spanId: input.context.spanId,
    status: started && terminal ? "connected" as const : "degraded" as const,
  }
}
