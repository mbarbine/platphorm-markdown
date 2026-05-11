import { generateOutline } from "@/lib/markdown/parser"

export type MarkdownModelAction =
  | "improve"
  | "summarize"
  | "expand"
  | "fix-grammar"
  | "generate-toc"
  | "suggest-headings"
  | "explain-graph"

export interface ModelStatus {
  configured: boolean
  status: "available" | "degraded"
  provider: "vercel-ai-gateway" | "openai-compatible" | "none"
  model: string | null
  message: string
}

export function getModelStatus(): ModelStatus {
  const model = process.env.MARKDOWN_MODEL ?? process.env.AI_GATEWAY_MODEL ?? null
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_API_KEY) {
    return {
      configured: true,
      status: "available",
      provider: "vercel-ai-gateway",
      model: model ?? "gateway-default",
      message: "Backend model provider is configured. Model calls remain server-only.",
    }
  }
  if (process.env.OPENAI_API_KEY && model) {
    return {
      configured: true,
      status: "available",
      provider: "openai-compatible",
      model,
      message: "Backend OpenAI-compatible model provider is configured. Model calls remain server-only.",
    }
  }
  return {
    configured: false,
    status: "degraded",
    provider: "none",
    model: null,
    message: "No backend model provider is configured. AI writing assistance is unavailable; deterministic Markdown tools still work.",
  }
}

export function deterministicTableOfContents(markdown: string): string {
  const outline = generateOutline(markdown)
  if (!outline.length) return ""
  return outline
    .map((item) => {
      const slug = item.text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
      return `${"  ".repeat(Math.max(0, item.level - 1))}- [${item.text}](#${slug})`
    })
    .join("\n")
}

export function unavailableModelResult(action: MarkdownModelAction) {
  return {
    status: "degraded",
    action,
    output: null,
    model: getModelStatus(),
    message: "Model-backed Markdown assistance is not configured for this deployment.",
  }
}
