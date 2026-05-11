import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Editor",
  description:
    "The MarkdownTree editor — paste or write Markdown and see it transform into an interactive graph. Edit, preview, analyze, export, and inspect model availability.",
  alternates: { canonical: "/editor" },
  openGraph: {
    title: "MarkdownTree Editor",
    description: "Visual Markdown editor with graph visualization, live preview, stats, exports, and local drafts.",
    url: "https://markdown.platphormnews.com/editor",
  },
}

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return children
}
