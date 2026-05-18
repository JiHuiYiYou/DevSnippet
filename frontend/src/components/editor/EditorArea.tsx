import { useRef, useCallback, useState, useEffect } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useEditorStore } from '@/stores/useEditorStore'
import CodeTextarea from './CodeTextarea'
import LineNumbers from './LineNumbers'
import PreviewPane from '@/components/preview/PreviewPane'
import MarkdownPreview from '@/components/preview/MarkdownPreview'

export default function EditorArea() {
  const previewMode = useUIStore((s) => s.previewMode)
  const syncScrollEnabled = useUIStore((s) => s.syncScrollEnabled)
  const editorScrollRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const files = useWorkspaceStore((s) => s.files)
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null
  const contentMap = useEditorStore((s) => s.contentMap)

  const isMarkdown = activeFile?.type === 'markdown'

  // Cursor line tracking (for line numbers highlight)
  const [currentLine, setCurrentLine] = useState(1)

  // Divider drag state
  const [splitRatio, setSplitRatio] = useState(0.5)
  const dragging = useRef(false)

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
  }, [])

  const handleDividerDoubleClick = useCallback(() => {
    setSplitRatio(0.5)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      const rect = containerRef.current.getBoundingClientRect()
      const dividerW = 4
      const minW = 200
      const maxW = rect.width - dividerW - minW
      const leftW = Math.max(minW, Math.min(e.clientX - rect.left, maxW))
      setSplitRatio(leftW / (rect.width - dividerW))
    }
    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Editor scroll → preview sync (for markdown, when sync scroll is enabled)
  // Replicates markdown-live-preview's onDidScrollChange behavior exactly
  const handleEditorScroll = useCallback(() => {
    if (!syncScrollEnabled || !previewRef?.current) return
    const editorEl = editorScrollRef.current
    const previewEl = previewRef.current
    if (!editorEl || !previewEl) return
    const editorMax = editorEl.scrollHeight - editorEl.clientHeight
    if (editorMax <= 0) return
    const scrollRatio = editorEl.scrollTop / editorMax
    const previewMax = previewEl.scrollHeight - previewEl.clientHeight
    if (previewMax <= 0) return
    const targetY = previewMax * scrollRatio
    previewEl.scrollTo(0, targetY)
  }, [syncScrollEnabled])

  // Editor area (shared scroll container with line numbers + auto-height textarea)
  const renderEditor = () => (
    <div
      ref={editorScrollRef}
      className="editor-scroll-container h-full overflow-y-auto"
      onScroll={handleEditorScroll}
    >
      <div className="flex">
        <LineNumbers currentLine={currentLine} />
        <CodeTextarea onCursorLineChange={setCurrentLine} />
      </div>
    </div>
  )

  // Markdown files: split view with live preview
  if (isMarkdown && !previewMode) {
    const content = activeFile ? (contentMap[activeFile.id] ?? activeFile.content) : ''

    return (
      <div ref={containerRef} className="flex-1 overflow-hidden flex">
        {/* Editor pane */}
        <div className="h-full min-w-0" style={{ width: `${splitRatio * 100}%` }}>
          {renderEditor()}
        </div>

        {/* Draggable divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          onDoubleClick={handleDividerDoubleClick}
          className="w-1 bg-gray-300 dark:bg-gray-600 cursor-col-resize hover:bg-accent dark:hover:bg-accent shrink-0 transition-colors"
        />

        {/* Preview pane */}
        <div
          ref={previewRef}
          className="flex-1 h-full overflow-y-auto min-w-0"
        >
          <MarkdownPreview content={content} />
        </div>
      </div>
    )
  }

  // Text files and full-preview mode: toggle behavior
  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Edit mode */}
      <div
        className="h-full"
        style={{ display: previewMode ? 'none' : 'block' }}
      >
        {renderEditor()}
      </div>

      {/* Preview mode */}
      <div
        className="h-full overflow-auto"
        style={{ display: previewMode ? 'block' : 'none' }}
      >
        <PreviewPane />
      </div>
    </div>
  )
}
