import { useCallback, useState } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useUIStore } from '@/stores/useUIStore'
import TagInput from '@/components/tags/TagInput'
import ImageDropZone from './ImageDropZone'
import ImagePathViewer from './ImagePathViewer'

interface UploadedImage {
  path: string
  url: string
}

export default function EditorToolbar() {
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const files = useWorkspaceStore((s) => s.files)
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null
  const contentMap = useEditorStore((s) => s.contentMap)
  const isDirty = useEditorStore((s) => activeFile ? s.isDirty(activeFile.id) : false)
  const previewMode = useUIStore((s) => s.previewMode)
  const togglePreviewMode = useUIStore((s) => s.togglePreviewMode)
  const syncScrollEnabled = useUIStore((s) => s.syncScrollEnabled)
  const setSyncScrollEnabled = useUIStore((s) => s.setSyncScrollEnabled)
  const openModal = useUIStore((s) => s.openModal)
  const selectAllEditor = useUIStore((s) => s.selectAllEditor)
  const triggerEditorPaste = useUIStore((s) => s.triggerEditorPaste)
  const showToast = useUIStore((s) => s.showToast)
  const addFileTag = useWorkspaceStore((s) => s.addFileTag)
  const removeFileTag = useWorkspaceStore((s) => s.removeFileTag)

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])

  const handleImageUploaded = useCallback((imgUrl: string) => {
    // Derive relative path from the absolute URL
    const path = imgUrl.replace(/^https?:\/\/[^/]+/, '')
    setUploadedImages((prev) => {
      // Avoid duplicates
      if (prev.some((img) => img.path === path)) return prev
      return [...prev, { path, url: imgUrl }]
    })
  }, [])

  const handleCopy = useCallback(async () => {
    if (!activeFile) return
    const content = contentMap[activeFile.id] ?? activeFile.content
    try {
      await navigator.clipboard.writeText(content)
      showToast('Copied to clipboard', 'success')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      showToast('Copied to clipboard', 'success')
    }
  }, [activeFile, contentMap, showToast])

  if (!activeFile) return null

  return (
    <div className="shrink-0 border-b border-border dark:border-border-dark bg-panel dark:bg-panel-dark">
      {/* Top row: file info + actions */}
      <div className="h-10 flex items-center px-3 gap-2">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
          {activeFile.name}
          {isDirty && <span className="text-accent ml-1">&#9679;</span>}
        </span>

        <span className="text-2xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase">
          {activeFile.type === 'markdown' ? 'md' : 'txt'}
        </span>

        <div className="flex-1" />

        {!previewMode && (
          <>
            <button
              onClick={selectAllEditor}
              className="px-2 py-1 text-xs rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Select All"
            >
              Sel All
            </button>
            <button
              onClick={handleCopy}
              className="px-2 py-1 text-xs rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Copy to Clipboard"
            >
              Copy
            </button>
            <button
              onClick={triggerEditorPaste}
              className="px-2 py-1 text-xs rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Paste from Clipboard"
            >
              Paste
            </button>
          </>
        )}

        {activeFile.type === 'markdown' && !previewMode && (
          <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
            <input
              type="checkbox"
              checked={syncScrollEnabled}
              onChange={(e) => setSyncScrollEnabled(e.target.checked)}
              className="w-3 h-3 opacity-50 dark:opacity-40 accent-gray-400 dark:accent-gray-600"
            />
            Sync scroll
          </label>
        )}

        <button
          onClick={togglePreviewMode}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            previewMode
              ? 'bg-accent/15 text-accent'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title="Toggle Preview (Ctrl+P)"
        >
          {previewMode ? 'Edit' : 'Preview'}
        </button>

        <button
          onClick={() => openModal('share')}
          className="px-2 py-1 text-xs rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Share"
        >
          Share
        </button>
      </div>

      {/* Bottom row: tags */}
      <div className="px-3 pb-1.5">
        <TagInput
          tags={activeFile.tags}
          onAdd={(tag) => addFileTag(activeFile.id, tag)}
          onRemove={(tag) => removeFileTag(activeFile.id, tag)}
        />
      </div>

      {/* Image upload zone (markdown files in edit mode) */}
      {activeFile.type === 'markdown' && !previewMode && (
        <div className="flex items-stretch">
          <div className="flex-1 min-w-0">
            <ImageDropZone onImageUploaded={handleImageUploaded} />
          </div>
          <ImagePathViewer images={uploadedImages} />
        </div>
      )}
    </div>
  )
}
