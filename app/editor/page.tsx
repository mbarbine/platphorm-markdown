"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useShallow } from "zustand/react/shallow"
import { useMarkdown } from "@/lib/store/use-markdown"
import { EditorToolbar } from "@/components/editor/toolbar"
import { OutlinePanel } from "@/components/editor/outline-panel"
import { MarkdownPreview } from "@/components/editor/markdown-preview"
import { AIChatPanel } from "@/components/editor/ai-chat-panel"
import { SiteHeader } from "@/components/site-header"
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import { downloadFile, generateShareUrl, parseShareUrl } from "@/lib/export/utils"
import { loadDefaultDraft, saveDefaultDraft } from "@/lib/store/local-drafts"

const MarkdownEditor = dynamic(
  () => import("@/components/editor/markdown-editor").then(mod => mod.MarkdownEditor),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-muted" /> }
)

const GraphViewer = dynamic(
  () => import("@/components/editor/graph-viewer").then(mod => mod.GraphViewer),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-muted" /> }
)

export default function EditorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAI, setShowAI] = useState(false)
  const [localDraftStatus, setLocalDraftStatus] = useState<"loading" | "saved" | "saving" | "unavailable">("loading")
  const [shareStatus, setShareStatus] = useState<string>("")

  // ⚡ Bolt: Extracting specific properties with useShallow prevents EditorPage
  // from re-rendering when unrelated store state (like hover or selection) changes.
  const { 
    viewMode, 
    fullscreen, 
    setContent, 
    content, 
    graph,
    viewSettings,
    setLoading 
  } = useMarkdown(
    useShallow((state) => ({
      viewMode: state.viewMode,
      fullscreen: state.fullscreen,
      setContent: state.setContent,
      content: state.content,
      graph: state.graph,
      viewSettings: state.viewSettings,
      setLoading: state.setLoading
    }))
  )

  // Check for shared content in URL on mount
  useEffect(() => {
    const sharedContent = parseShareUrl()
    if (sharedContent) {
      setContent(sharedContent)
      setLocalDraftStatus("saved")
      return
    }

    loadDefaultDraft()
      .then((draft) => {
        if (draft?.content) setContent(draft.content)
        setLocalDraftStatus("saved")
      })
      .catch(() => setLocalDraftStatus("unavailable"))
  }, [setContent])

  useEffect(() => {
    if (!content) return
    setLocalDraftStatus((current) => (current === "unavailable" ? "unavailable" : "saving"))
    const timer = window.setTimeout(() => {
      saveDefaultDraft(content)
        .then(() => setLocalDraftStatus("saved"))
        .catch(() => setLocalDraftStatus("unavailable"))
    }, 700)
    return () => window.clearTimeout(timer)
  }, [content])

  const handleShare = useCallback(async () => {
    try {
      const url = generateShareUrl(content)
      await navigator.clipboard.writeText(url)
      setShareStatus("Share URL copied. Content is encoded in the URL and not stored server-side.")
      window.setTimeout(() => setShareStatus(""), 3500)
    } catch {
      setShareStatus("Share URL could not be copied by this browser.")
    }
  }, [content])

  const handleInsertFromAI = useCallback((text: string) => {
    setContent(content + "\n\n" + text)
  }, [content, setContent])

  const toggleAI = useCallback(() => {
    setShowAI(prev => !prev)
  }, [])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setContent(text)
      }
      reader.readAsText(file)
    }
    // Reset input
    e.target.value = ""
  }, [setContent])

  const handleExport = useCallback(async (format: string) => {
    let exportContent: string
    let filename: string
    let mimeType: string

    switch (format) {
      case "markdown":
        exportContent = content
        filename = "document.md"
        mimeType = "text/markdown"
        break
      case "html": {
        const response = await fetch("/api/v1/export/html", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown: content }),
        })
        if (!response.ok) return
        exportContent = await response.text()
        filename = "document.html"
        mimeType = "text/html"
        break
      }
      case "json":
        exportContent = JSON.stringify({ markdown: content, graph, storageMode: "indexeddb", syncStatus: "local_only" }, null, 2)
        filename = "document.json"
        mimeType = "application/json"
        break
      default:
        return
    }

    downloadFile(exportContent, filename, mimeType)
  }, [content, graph])

  return (
    <div className={cn("flex flex-col h-screen bg-background", fullscreen && "fixed inset-0 z-50")}>
      {!fullscreen && <SiteHeader />}
      
      <EditorToolbar 
        onImport={handleImport} 
        onExport={handleExport} 
        onShare={handleShare}
        onToggleAI={toggleAI}
        showAI={showAI}
        localDraftStatus={localDraftStatus}
        shareStatus={shareStatus}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={showAI ? 75 : 100} minSize={50}>
          <div className="h-full overflow-hidden">
            {viewMode === "editor" && (
              <ResizablePanelGroup direction="horizontal">
                {viewSettings.showOutline && (
                  <>
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                      <OutlinePanel />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                  </>
                )}
                <ResizablePanel defaultSize={80}>
                  <MarkdownEditor />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}

            {viewMode === "split" && (
              <ResizablePanelGroup direction="horizontal">
                {viewSettings.showOutline && (
                  <>
                    <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
                      <OutlinePanel />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                  </>
                )}
                <ResizablePanel defaultSize={35} minSize={25}>
                  <MarkdownEditor />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <GraphViewer />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}

            {viewMode === "graph" && (
              <ResizablePanelGroup direction="horizontal">
                {viewSettings.showOutline && (
                  <>
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                      <OutlinePanel />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                  </>
                )}
                <ResizablePanel defaultSize={80}>
                  <GraphViewer />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}

            {viewMode === "preview" && (
              <ResizablePanelGroup direction="horizontal">
                {viewSettings.showOutline && (
                  <>
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                      <OutlinePanel />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                  </>
                )}
                <ResizablePanel defaultSize={80}>
                  <MarkdownPreview className="bg-card" />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>
        </ResizablePanel>

        {showAI && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <AIChatPanel 
                currentDocument={content} 
                onInsert={handleInsertFromAI} 
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
