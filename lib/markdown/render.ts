import { generateOutline, getDocumentStats, parseMarkdownToGraph } from "@/lib/markdown/parser"

export const MAX_MARKDOWN_BYTES = 256 * 1024
export const MAX_SHARE_BYTES = 48 * 1024

export function validateMarkdownInput(markdown: unknown, maxBytes = MAX_MARKDOWN_BYTES): string | { code: string; message: string } {
  if (typeof markdown !== "string") {
    return { code: "INVALID_MARKDOWN", message: "markdown field is required and must be a string." }
  }
  const size =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(markdown).byteLength
      : Buffer.byteLength(markdown, "utf8")
  if (size > maxBytes) {
    return {
      code: "MARKDOWN_TOO_LARGE",
      message: `Markdown payload exceeds the ${maxBytes} byte public-safe limit.`,
    }
  }
  return markdown
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function safeUrl(value: string): string {
  const trimmed = value.trim()
  if (/^(https?:|mailto:|#|\/)/i.test(trimmed)) return trimmed.replace(/"/g, "%22")
  return "#"
}

export function renderMarkdownBody(markdown: string): string {
  let html = escapeHtml(markdown)

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${escapeHtml(lang || "text")}">${code.trim()}</code></pre>`
  })
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>")
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>")
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>")
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
  html = html.replace(/^[-*_]{3,}\s*$/gm, "<hr />")
  html = html.replace(/^&gt;\s*(.+)$/gm, "<blockquote>$1</blockquote>")
  html = html.replace(/^- \[x\] (.+)$/gim, '<ul class="task-list"><li><input type="checkbox" checked disabled /> $1</li></ul>')
  html = html.replace(/^- \[ \] (.+)$/gim, '<ul class="task-list"><li><input type="checkbox" disabled /> $1</li></ul>')
  html = html.replace(/^[-*+]\s+(.+)$/gm, "<ul><li>$1</li></ul>")
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<ol><li>$1</li></ol>")
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_match, alt, url, title) => {
    return `<img src="${safeUrl(url)}" alt="${alt}"${title ? ` title="${title}"` : ""} />`
  })
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_match, text, url, title) => {
    return `<a href="${safeUrl(url)}"${title ? ` title="${title}"` : ""} rel="noopener noreferrer">${text}</a>`
  })
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>")
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>")
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>")

  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ""
      if (trimmed.startsWith("<")) return trimmed
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`
    })
    .join("\n")

  return html
}

export function renderMarkdownDocument(markdown: string, title = "Exported Markdown"): string {
  const body = renderMarkdownBody(markdown)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { color: #172033; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.65; margin: 0 auto; max-width: 820px; padding: 32px; }
    h1, h2, h3, h4, h5, h6 { line-height: 1.2; margin: 1.6em 0 0.55em; }
    pre { background: #111827; border-radius: 8px; color: #f9fafb; overflow-x: auto; padding: 16px; }
    code { background: #f1f5f9; border-radius: 4px; padding: 0.15em 0.35em; }
    pre code { background: transparent; padding: 0; }
    blockquote { border-left: 4px solid #10b981; color: #475569; margin-left: 0; padding-left: 16px; }
    img { height: auto; max-width: 100%; }
    a { color: #0369a1; }
  </style>
</head>
<body>
${body}
</body>
</html>`
}

export function exportMarkdownJson(markdown: string) {
  const graph = parseMarkdownToGraph(markdown)
  return {
    markdown,
    graph,
    outline: generateOutline(markdown, graph),
    stats: getDocumentStats(markdown, graph),
    exportedAt: new Date().toISOString(),
    storageMode: "none",
  }
}

export function generateBoundedShareUrl(markdown: string, origin: string): string | { code: string; message: string } {
  const valid = validateMarkdownInput(markdown, MAX_SHARE_BYTES)
  if (typeof valid !== "string") return valid
  const encoded = Buffer.from(valid, "utf8").toString("base64url")
  return `${origin.replace(/\/$/, "")}/editor?content=${encoded}`
}

export function parseSharedContentParam(content: string): string | null {
  try {
    return Buffer.from(content, "base64url").toString("utf8")
  } catch {
    return null
  }
}
