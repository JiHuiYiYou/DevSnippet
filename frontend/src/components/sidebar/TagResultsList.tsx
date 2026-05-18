import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useUIStore } from '@/stores/useUIStore'
import { useTagStore } from '@/stores/useTagStore'
import { getFileExtension } from '@/lib/helpers'

const FILE_ICONS: Record<string, string> = {
  ts: 'TS', tsx: 'TS', js: 'JS', jsx: 'JS',
  py: 'Py', go: 'Go', rs: 'Rs',
  html: '<>', css: '#', sql: 'DB',
  sh: 'sh', json: '{}', yaml: 'Y', yml: 'Y',
  md: 'MD', txt: 'Tx',
}

export default function TagResultsList() {
  const files = useWorkspaceStore((s) => s.files)
  const folders = useWorkspaceStore((s) => s.folders)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const setActiveFolder = useWorkspaceStore((s) => s.setActiveFolder)
  const openFileInTab = useUIStore((s) => s.openFileInTab)
  const expandParentsOf = useWorkspaceStore((s) => s.expandParentsOf)
  const activeFilters = useTagStore((s) => s.activeFilters)

  if (activeFilters.length === 0) return null

  // Find files with ALL selected tags
  const matchingFiles = files.filter((f) =>
    activeFilters.every((tag) => f.tags.includes(tag))
  )

  if (matchingFiles.length === 0) {
    return (
      <div className="px-2 py-4 text-xs text-gray-400 text-center">
        No files with tags "{activeFilters.join(', ')}"
      </div>
    )
  }

  const folderMap = new Map(folders.map((f) => [f.id, f]))
  const workspaceMap = new Map(workspaces.map((w) => [w.id, w]))

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between px-1 py-1 mb-1">
        <span className="text-xs font-medium text-accent uppercase tracking-wide">
          {activeFilters.map((t) => `#${t}`).join(' + ')}
        </span>
        <span className="text-2xs text-gray-400">{matchingFiles.length} files</span>
      </div>
      <div>
        {matchingFiles.map((file) => {
          const ext = getFileExtension(file.name)
          const icon = FILE_ICONS[ext] ?? '--'
          const isFileActive = file.id === activeFileId

          // Build breadcrumb
          const pathParts: string[] = []
          let currentId: string | null = file.folderId
          while (currentId) {
            const folder = folderMap.get(currentId)
            if (!folder) break
            pathParts.unshift(folder.name)
            currentId = folder.parentId
          }
          const ws = workspaceMap.get(
            folders.find((f) => f.id === file.folderId)?.workspaceId ?? ''
          )
          const breadcrumb = (ws?.name ?? '') + (pathParts.length ? ' / ' : '') + pathParts.join(' / ')

          return (
            <div
              key={file.id}
              className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-xs transition-colors group ${
                isFileActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
              style={{ paddingLeft: '20px' }}
              onClick={() => {
                expandParentsOf(file.folderId)
                setActiveFolder(file.folderId)
                openFileInTab(file.id)
              }}
            >
              <span className="w-5 text-center shrink-0 text-2xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-0.5">
                {icon}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="truncate">{file.name}</span>
                <span className="text-2xs text-gray-400 truncate">{breadcrumb}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
