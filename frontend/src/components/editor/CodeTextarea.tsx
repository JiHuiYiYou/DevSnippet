import { useRef, useCallback, useEffect } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUIStore } from '@/stores/useUIStore'

interface CodeTextareaProps {
  onCursorLineChange?: (line: number) => void
}

export default function CodeTextarea({ onCursorLineChange }: CodeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const files = useWorkspaceStore((s) => s.files)
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null
  const contentMap = useEditorStore((s) => s.contentMap)
  const setContent = useEditorStore((s) => s.setContent)
  const initContent = useEditorStore((s) => s.initContent)
  const tabSize = useSettingsStore((s) => s.tabSize)
  const fontFamily = useSettingsStore((s) => s.fontFamily)
  const fontSize = useSettingsStore((s) => s.fontSize)
  const jumpToLine = useUIStore((s) => s.jumpToLine)
  const setJumpToLine = useUIStore((s) => s.setJumpToLine)
  const editorSelectAllTick = useUIStore((s) => s.editorSelectAllTick)
  const editorPasteTick = useUIStore((s) => s.editorPasteTick)

  const content = activeFile ? (contentMap[activeFile.id] ?? activeFile.content) : ''

  // Shared auto-height logic: expands both the editor textarea and line-numbers
  // textarea to their full content height, then clamps the scroll container to
  // prevent blank space below the content.
  const applyAutoHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const scrollContainer = ta.closest('.editor-scroll-container') as HTMLElement | null
    const containerH = scrollContainer ? scrollContainer.clientHeight : 0

    // Editor textarea
    ta.style.height = 'auto'
    ta.style.height = Math.max(ta.scrollHeight, containerH) + 'px'

    // Line numbers textarea
    const lineNumTa = scrollContainer?.querySelector('.line-numbers-gutter') as HTMLTextAreaElement | null
    if (lineNumTa) {
      lineNumTa.style.height = 'auto'
      lineNumTa.style.height = Math.max(lineNumTa.scrollHeight, containerH) + 'px'
    }

    // Clamp scroll position to prevent dragging past the content end
    if (scrollContainer) {
      const maxScroll = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight)
      if (scrollContainer.scrollTop > maxScroll) {
        scrollContainer.scrollTop = maxScroll
      }
    }
  }, [])

  // Init content + reset scroll when file changes
  useEffect(() => {
    if (activeFile && contentMap[activeFile.id] === undefined) {
      initContent(activeFile.id, activeFile.content)
    }
    const ta = textareaRef.current
    if (!ta) return
    if (onCursorLineChange) onCursorLineChange(1)
    // Defer scroll reset to after auto-height has updated the textarea height
    requestAnimationFrame(() => {
      const scrollContainer = ta.closest('.editor-scroll-container') as HTMLElement | null
      if (scrollContainer) {
        scrollContainer.scrollTop = 0
      }
      if (ta.scrollTop !== 0) ta.scrollTop = 0
      const lineNumTa = scrollContainer?.querySelector('.line-numbers-gutter') as HTMLTextAreaElement | null
      if (lineNumTa && lineNumTa.scrollTop !== 0) lineNumTa.scrollTop = 0
    })
  }, [activeFile?.id])

  // Auto-height on content change
  useEffect(() => {
    applyAutoHeight()
  }, [content, applyAutoHeight])

  // Auto-height on editor width change (e.g. split pane resize changes wrapping,
  // which changes the textarea's scrollHeight even though content is the same)
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    const observer = new ResizeObserver(() => applyAutoHeight())
    observer.observe(ta)
    return () => observer.disconnect()
  }, [applyAutoHeight])

  // Jump to line
  useEffect(() => {
    if (jumpToLine !== null && textareaRef.current) {
      const textarea = textareaRef.current
      const lineHeight = fontSize * 1.5
      const targetScroll = (jumpToLine - 1) * lineHeight
      const scrollContainer = textarea.closest('.editor-scroll-container') as HTMLElement | null
      if (scrollContainer) {
        scrollContainer.scrollTop = targetScroll
      }
      setJumpToLine(null)
      textarea.focus()
      const lines = content.split('\n')
      let pos = 0
      for (let i = 0; i < Math.min(jumpToLine - 1, lines.length); i++) {
        pos += lines[i].length + 1
      }
      textarea.setSelectionRange(pos, pos)
    }
  }, [jumpToLine, fontSize, setJumpToLine, content])

  // Select All command
  useEffect(() => {
    if (editorSelectAllTick > 0 && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editorSelectAllTick])

  // Paste command
  useEffect(() => {
    if (editorPasteTick === 0 || !activeFile || !textareaRef.current) return
    const textarea = textareaRef.current
    textarea.focus()
    navigator.clipboard.readText().then((clipText) => {
      if (!clipText) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const current = contentMap[activeFile.id] ?? activeFile.content
      const newContent = current.substring(0, start) + clipText + current.substring(end)
      setContent(activeFile.id, newContent)
      requestAnimationFrame(() => {
        textarea.selectionStart = start + clipText.length
        textarea.selectionEnd = start + clipText.length
        applyAutoHeight()
      })
    }).catch(() => {})
  }, [editorPasteTick])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!activeFile) return
      setContent(activeFile.id, e.target.value)
    },
    [activeFile, setContent],
  )

  const handleSelect = useCallback(
    (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      if (!onCursorLineChange) return
      const textarea = e.currentTarget
      const cursorPos = textarea.selectionStart
      const lineNumber = content.substring(0, cursorPos).split('\n').length
      onCursorLineChange(lineNumber)
    },
    [onCursorLineChange, content],
  )

  if (!activeFile) return null

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={handleChange}
      onSelect={handleSelect}
      onClick={handleSelect}
      onKeyUp={handleSelect}
      spellCheck={false}
      className="editor-textarea flex-1 resize-none bg-transparent outline-none border-none text-sm code-font text-gray-800 dark:text-gray-200"
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: 1.5,
        tabSize,
        MozTabSize: String(tabSize),
        overflow: 'hidden',
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: '0.5rem',
        paddingRight: 0,
        margin: 0,
      }}
      placeholder="Start typing..."
    />
  )
}
