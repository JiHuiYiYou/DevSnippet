import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useEditorStore } from '@/stores/useEditorStore'
import MarkdownPreview from './MarkdownPreview'

export default function PreviewPane() {
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const files = useWorkspaceStore((s) => s.files)
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null
  const contentMap = useEditorStore((s) => s.contentMap)

  if (!activeFile) return null

  const content = contentMap[activeFile.id] ?? activeFile.content

  if (activeFile.type === 'markdown') {
    return <MarkdownPreview content={content} />
  }

  // Code and text files: plain text display
  return (
    <pre className="p-4 text-sm code-font text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
      {content}
    </pre>
  )
}
