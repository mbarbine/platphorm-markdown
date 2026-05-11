export const siteConfig = {
  name: "MarkdownTree",
  description: "Browser-first Markdown editor, live preview, structure analyzer, graph viewer, and public Markdown API for the PlatPhormNews web mesh.",
  url: "https://markdown.platphormnews.com",
  ogImage: "https://markdown.platphormnews.com/og-image.jpg",
  links: {
    github: "https://github.com/mbarbine/platphorm-markdown",
    twitter: "https://twitter.com/platphormnews",
  },
  creator: "Platphorm News",
  version: "1.0.0",
  api: {
    version: "v1",
    basePath: "/api/v1",
  },
  features: {
    ai: "degraded",
    mcp: true,
    collaboration: false,
    export: ["markdown", "json", "html"],
    degradedExport: ["pdf", "png"],
    share: "bounded-url",
    storage: "browser-local",
  },
  trustPolicyLine:
    "Public-safe Markdown editing, graph visualization, formatting, preview, local non-sensitive Markdown draft persistence, read-only MCP introspection, RSS/feed consumption, trusted-domain discovery, standard route compliance, Vercel metadata capture, backend model scaffolding, and trace-linked Markdown operations are intentionally supported for public use. PLATPHORM_API_KEY support is scaffolded for future protected backend services, server-side exports, AI enhancement calls, webhook mutation, sync, test-triggering, reporting, administrative actions, and sensitive operations.",
}

export const markdownNodeTypes = {
  heading: { label: "Heading", color: "emerald" },
  paragraph: { label: "Paragraph", color: "slate" },
  code: { label: "Code", color: "violet" },
  codeBlock: { label: "Code Block", color: "violet" },
  link: { label: "Link", color: "blue" },
  image: { label: "Image", color: "pink" },
  list: { label: "List", color: "amber" },
  listItem: { label: "List Item", color: "amber" },
  blockquote: { label: "Quote", color: "purple" },
  table: { label: "Table", color: "teal" },
  tableRow: { label: "Table Row", color: "teal" },
  tableCell: { label: "Table Cell", color: "teal" },
  thematicBreak: { label: "Divider", color: "gray" },
  emphasis: { label: "Emphasis", color: "orange" },
  strong: { label: "Strong", color: "orange" },
  inlineCode: { label: "Inline Code", color: "violet" },
  html: { label: "HTML", color: "red" },
  footnote: { label: "Footnote", color: "cyan" },
  task: { label: "Task", color: "green" },
} as const

export type MarkdownNodeType = keyof typeof markdownNodeTypes
