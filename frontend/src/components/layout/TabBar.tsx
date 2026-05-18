import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useEditorStore } from '@/stores/useEditorStore'

export default function TabBar() {
  const tabs = useUIStore((s) => s.tabs)
  const activeTabId = useUIStore((s) => s.activeTabId)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const closeTab = useUIStore((s) => s.closeTab)
  const files = useWorkspaceStore((s) => s.files)
  const touchedFiles = useEditorStore((s) => s.touchedFiles)

  if (tabs.length === 0) return null

  return (
    <div className="h-9 flex items-center bg-panel dark:bg-panel-dark border-b border-border dark:border-border-dark shrink-0 overflow-x-auto select-none">
      {tabs.map((fileId) => {
        const file = files.find((f) => f.id === fileId)
        if (!file) return null
        const isActive = fileId === activeTabId
        const isTouched = touchedFiles.has(fileId)

        return (
          <button
            key={fileId}
            onClick={() => setActiveTab(fileId)}
            className={`group flex items-center gap-1 h-full px-3 text-xs border-r border-border dark:border-border-dark transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-surface dark:bg-surface-dark text-gray-800 dark:text-gray-200 font-semibold'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            } ${!isTouched && !isActive ? 'italic' : ''}`}
          >
            <span className="max-w-[140px] truncate">{file.name}</span>
            <span
              onClick={(e) => {
                e.stopPropagation()
                closeTab(fileId)
              }}
              className="ml-1 w-4 h-4 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Close"
            >
              ×
            </span>
          </button>
        )
      })}
    </div>
  )
}
