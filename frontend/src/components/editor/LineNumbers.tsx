import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface LineNumbersProps {
  currentLine?: number
}

export default function LineNumbers({ currentLine = 1 }: LineNumbersProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const files = useWorkspaceStore((s) => s.files)
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null
  const contentMap = useEditorStore((s) => s.contentMap)
  const fontSize = useSettingsStore((s) => s.fontSize)
  const fontFamily = useSettingsStore((s) => s.fontFamily)

  const content = activeFile ? (contentMap[activeFile.id] ?? activeFile.content) : ''
  const logicalLines = content ? content.split('\n') : ['']

  const [charWidth, setCharWidth] = useState(0)
  const [editorWidth, setEditorWidth] = useState(0)

  // Ensure measurement div exists in the DOM
  const getMeasureEl = useCallback((): HTMLDivElement => {
    if (!measureRef.current) {
      measureRef.current = document.createElement('div')
      measureRef.current.style.cssText =
        'position:absolute;visibility:hidden;pointer-events:none;white-space:pre-wrap;overflow-wrap:break-word;top:-9999px;left:-9999px;padding:0;margin:0;border:none;'
      document.body.appendChild(measureRef.current)
    }
    return measureRef.current
  }, [])

  // Cleanup measurement div on unmount
  useEffect(() => {
    return () => {
      if (measureRef.current) {
        document.body.removeChild(measureRef.current)
        measureRef.current = null
      }
    }
  }, [])

  // Measure monospace character width with a hidden canvas
  const measureCharWidth = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const fontStr = `${fontSize}px ${fontFamily}`
    ctx.font = fontStr
    const metrics = ctx.measureText('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')
    setCharWidth(metrics.width / 62)
  }, [fontFamily, fontSize])

  useEffect(() => {
    measureCharWidth()
  }, [measureCharWidth])

  // Observe editor textarea width
  useEffect(() => {
    const checkWidth = () => {
      const scrollContainer = textareaRef.current?.closest('.editor-scroll-container')
      const editorTa = scrollContainer?.querySelector('.editor-textarea') as HTMLTextAreaElement | null
      if (editorTa) {
        const style = getComputedStyle(editorTa)
        const padLeft = parseFloat(style.paddingLeft) || 0
        const padRight = parseFloat(style.paddingRight) || 0
        setEditorWidth(editorTa.clientWidth - padLeft - padRight)
      }
    }
    checkWidth()
    const observer = new ResizeObserver(checkWidth)
    const scrollContainer = textareaRef.current?.closest('.editor-scroll-container')
    const editorTa = scrollContainer?.querySelector('.editor-textarea')
    if (editorTa) observer.observe(editorTa)
    return () => observer.disconnect()
  }, [activeFile?.id])

  // Build line numbers text.
  // Uses a hidden div styled identically to the textarea to measure actual
  // visual line counts for long lines (browser word-wrap ≠ char-count math).
  const { text: numbersText, lineMap } = useMemo(() => {
    if (!charWidth || !editorWidth || editorWidth <= 0) {
      return {
        text: Array.from({ length: logicalLines.length }, (_, i) => String(i + 1)).join('\n'),
        lineMap: Array.from({ length: logicalLines.length }, (_, i) => i + 1),
      }
    }

    const charsPerLine = Math.max(1, Math.floor(editorWidth / charWidth))
    const lineHeightPx = fontSize * 1.5
    const parts: string[] = []
    const lineMap: number[] = []
    const measureEl = getMeasureEl()
    // Sync measurement div styling to match textarea text layout exactly
    measureEl.style.fontFamily = fontFamily
    measureEl.style.fontSize = `${fontSize}px`
    measureEl.style.lineHeight = '1.5'
    measureEl.style.width = `${editorWidth}px`

    for (let i = 0; i < logicalLines.length; i++) {
      const lineLen = logicalLines[i].length
      let wraps: number

      // Only measure lines that might wrap — short lines always fit in 1 visual line.
      // Use a conservative threshold (0.9) to catch lines near the boundary where
      // word-wrap behavior can differ from pure character-count prediction.
      if (lineLen <= charsPerLine * 0.9) {
        wraps = 1
      } else {
        // Measure actual visual line count using the browser's own layout engine
        measureEl.textContent = logicalLines[i]
        const height = measureEl.offsetHeight
        wraps = Math.max(1, Math.round(height / lineHeightPx))
      }

      parts.push(String(i + 1))
      lineMap.push(i + 1)
      for (let w = 1; w < wraps; w++) {
        parts.push('')
        lineMap.push(i + 1)
      }
    }
    return { text: parts.join('\n'), lineMap }
  }, [logicalLines, charWidth, editorWidth, fontSize, fontFamily, getMeasureEl])

  // Calculate which visual lines to highlight for the current logical line
  const highlightStart = lineMap.indexOf(currentLine)
  const highlightEnd = highlightStart >= 0 ? lineMap.lastIndexOf(currentLine) : -1

  const lineHeightPx = fontSize * 1.5
  const activeTop = highlightStart >= 0 ? highlightStart * lineHeightPx : 0
  const activeBottom = highlightEnd >= 0 ? (highlightEnd + 1) * lineHeightPx : activeTop + lineHeightPx

  return (
    <textarea
      ref={textareaRef}
      readOnly
      value={numbersText}
      className="line-numbers-gutter shrink-0 select-none resize-none text-right bg-gray-50/50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600 code-font pointer-events-none"
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: 1.5,
        width: '3rem',
        paddingTop: 0,
        paddingBottom: 0,
        paddingRight: '0.5rem',
        paddingLeft: '0.25rem',
        margin: 0,
        overflow: 'hidden',
        border: 'none',
        outline: 'none',
        borderRight: '1px solid #e5e7eb',
        backgroundImage: highlightStart >= 0
          ? `linear-gradient(to bottom, transparent ${activeTop}px, rgba(59,130,246,0.12) ${activeTop}px, rgba(59,130,246,0.12) ${activeBottom}px, transparent ${activeBottom}px)`
          : 'none',
        backgroundAttachment: 'local',
      }}
      tabIndex={-1}
    />
  )
}
