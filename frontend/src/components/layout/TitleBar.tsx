import { useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useUIStore } from '@/stores/useUIStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

export default function TitleBar() {
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace)
  const createFolder = useWorkspaceStore((s) => s.createFolder)
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace)
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const showContextMenu = useUIStore((s) => s.showContextMenu)
  const showToast = useUIStore((s) => s.showToast)

  const [renamingWsId, setRenamingWsId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const handleNewWorkspace = () => {
    const id = createWorkspace('Workspace')
    createFolder(id, 'Folder')
    setActiveWorkspace(id)
  }

  const handleDoubleClick = useCallback((wsId: string, name: string) => {
    setRenamingWsId(wsId)
    setRenameValue(name)
  }, [])

  const handleRenameSubmit = useCallback(() => {
    if (renamingWsId && renameValue.trim()) {
      renameWorkspace(renamingWsId, renameValue.trim())
    }
    setRenamingWsId(null)
    setRenameValue('')
  }, [renamingWsId, renameValue, renameWorkspace])

  const handleWorkspaceContextMenu = useCallback(
    (e: React.MouseEvent, wsId: string) => {
      e.preventDefault()
      showContextMenu(e.clientX, e.clientY, [
        { label: 'Rename', action: () => {
          const ws = workspaces.find((w) => w.id === wsId)
          if (ws) { setRenamingWsId(wsId); setRenameValue(ws.name) }
        }},
        { label: 'Delete', action: () => { deleteWorkspace(wsId); showToast('Workspace deleted') }, danger: true },
      ])
    },
    [showContextMenu, workspaces, deleteWorkspace, showToast],
  )

  return (
    <div className="h-10 flex items-center px-3 bg-panel dark:bg-panel-dark border-b border-border dark:border-border-dark select-none shrink-0">
      <button
        onClick={toggleSidebar}
        className="mr-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
        title="Toggle Sidebar (Ctrl+B)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="2" rx="1" />
          <rect x="1" y="7" width="14" height="2" rx="1" />
          <rect x="1" y="12" width="14" height="2" rx="1" />
        </svg>
      </button>

      <span className="text-sm font-semibold text-accent mr-3 shrink-0">DevSnippet</span>

      {/* Workspace tabs */}
      <div className="flex items-center gap-1 text-xs overflow-x-auto" title="Workspaces — top-level containers for your projects. Double-click to rename, right-click for menu.">
        {workspaces.map((ws) => (
          renamingWsId === ws.id ? (
            <input
              key={ws.id}
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') { setRenamingWsId(null); setRenameValue('') }
              }}
              onBlur={handleRenameSubmit}
              className="px-2 py-0.5 text-xs rounded border border-accent bg-surface dark:bg-surface-dark focus:outline-none w-24"
            />
          ) : (
            <button
              key={ws.id}
              onClick={() => setActiveWorkspace(ws.id)}
              onDoubleClick={() => handleDoubleClick(ws.id, ws.name)}
              onContextMenu={(e) => handleWorkspaceContextMenu(e, ws.id)}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                ws.id === activeWorkspaceId
                  ? 'bg-accent text-white font-medium shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {ws.name}
            </button>
          )
        ))}
        <button
          onClick={handleNewWorkspace}
          className="px-2 py-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
          title="New Workspace"
        >
          +
        </button>
      </div>

      <div className="flex-1" />

      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="mr-2 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      <span className="text-2xs text-gray-400">V1.0</span>
    </div>
  )
}
