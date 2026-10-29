import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useUIStore } from '@/stores/useUIStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import Sidebar from '@/components/layout/Sidebar'
import TabBar from '@/components/layout/TabBar'
import EditorArea from '@/components/editor/EditorArea'
import EmptyState from '@/components/common/EmptyState'
import Toast from '@/components/common/Toast'
import ContextMenu from '@/components/common/ContextMenu'
import type { Workspace, Folder, SnippetFile } from '@/types/core'

interface ShareData {
  token: string
  entity_type: string
  entity_data: unknown
  password_protected: boolean
  readonly: boolean
}

export default function ShareView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)

  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const previewMode = useUIStore((s) => s.previewMode)
  const setPreviewMode = useUIStore((s) => s.setPreviewMode)
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const files = useWorkspaceStore((s) => s.files)
  const tabs = useUIStore((s) => s.tabs)

  // Extract share ID from URL
  const shareId = window.location.pathname.split('/share/')[1]?.split('/')[0] || ''

  // Fetch share data from backend API
  const fetchShare = useCallback(async (pw?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = pw ? `?password=${encodeURIComponent(pw)}` : ''
      const resp = await fetch(`/api/share/${shareId}${params}`)
      if (!resp.ok) {
        if (resp.status === 401) {
          if (!pw) {
            // Password required — show the prompt
            setNeedsPassword(true)
            setPasswordError('')
          } else {
            setPasswordError('Invalid password')
          }
          setLoading(false)
          return
        }
        if (resp.status === 404) throw new Error('Share link not found')
        if (resp.status === 410) throw new Error('This share link has expired')
        throw new Error(`Failed to load share (${resp.status})`)
      }
      const data: ShareData = await resp.json()
      setShareData(data)
      setNeedsPassword(false)
      populateStores(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load share')
      setLoading(false)
    }
  }, [shareId])

  // Populate Zustand stores with share data so existing components work
  const populateStores = (data: ShareData) => {
    const now = Date.now()

    if (data.entity_type === 'file') {
      const fileData = data.entity_data as SnippetFile
      const ws: Workspace = { id: 'share-ws', name: 'Shared File', createdAt: now, updatedAt: now }
      const folder: Folder = {
        id: 'share-folder', workspaceId: 'share-ws', parentId: null,
        name: 'Shared', sortOrder: 0, createdAt: now, updatedAt: now,
      }
      const file: SnippetFile = {
        ...fileData,
        folderId: 'share-folder',
      }

      useWorkspaceStore.setState({
        workspaces: [ws],
        folders: [folder],
        files: [file],
        activeWorkspaceId: ws.id,
        activeFolderId: folder.id,
        activeFileId: file.id,
        expandedFolderIds: new Set([folder.id]),
        isLoaded: true,
      })

      useEditorStore.getState().initContent(file.id, file.content)
      useUIStore.setState({ tabs: [file.id], activeTabId: file.id })
    } else if (data.entity_type === 'folder') {
      const { folder: folderData, files: folderFiles } = data.entity_data as {
        folder: Folder
        files: SnippetFile[]
      }
      const ws: Workspace = { id: 'share-ws', name: folderData.name, createdAt: now, updatedAt: now }
      const folder: Folder = { ...folderData, workspaceId: 'share-ws' }
      const fileList: SnippetFile[] = folderFiles.map((f) => ({ ...f, folderId: folder.id }))

      // Recursively collect child folders if any
      const allFolders = [folder]
      const allFiles = [...fileList]

      useWorkspaceStore.setState({
        workspaces: [ws],
        folders: allFolders,
        files: allFiles,
        activeWorkspaceId: ws.id,
        activeFolderId: folder.id,
        activeFileId: fileList[0]?.id ?? null,
        expandedFolderIds: new Set([folder.id]),
        isLoaded: true,
      })

      for (const f of fileList) {
        useEditorStore.getState().initContent(f.id, f.content)
      }
      if (fileList.length > 0) {
        useUIStore.setState({ tabs: [fileList[0].id], activeTabId: fileList[0].id })
      }
    } else if (data.entity_type === 'workspace') {
      const { workspace: wsData } = data.entity_data as { workspace: Workspace }
      // For workspace shares, we only get the workspace metadata
      // This is rarely used for sharing actual file content
      const ws: Workspace = { ...wsData, createdAt: now, updatedAt: now }
      useWorkspaceStore.setState({
        workspaces: [ws],
        folders: [],
        files: [],
        activeWorkspaceId: ws.id,
        activeFolderId: null,
        activeFileId: null,
        expandedFolderIds: new Set(),
        isLoaded: true,
      })
    }

    // Force preview mode for readonly shares
    if (data.readonly) {
      useUIStore.setState({ previewMode: true })
    } else {
      useUIStore.setState({ previewMode: true }) // default to preview
    }
  }

  useEffect(() => {
    if (shareId) fetchShare()
  }, [shareId, fetchShare])

  const handlePasswordSubmit = () => {
    setPasswordError('')
    fetchShare(password)
  }

  // ---- Render states ----

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
        <p className="text-gray-400 text-sm">Loading shared content...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-surface dark:bg-surface-dark gap-3">
        <p className="text-red-500 text-sm">{error}</p>
        <a href="/" className="text-xs text-accent hover:underline">Back to DevSnippet</a>
      </div>
    )
  }

  // Password prompt
  if (needsPassword) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-surface dark:bg-surface-dark gap-3">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Protected</h2>
        <p className="text-xs text-gray-500">This shared content requires a password.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          placeholder="Enter password"
          className="px-3 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark focus:outline-none focus:ring-1 focus:ring-accent w-56"
          autoFocus
        />
        {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
        <button
          onClick={handlePasswordSubmit}
          className="px-4 py-1.5 text-sm rounded bg-accent text-white hover:bg-accent-dark transition-colors"
        >
          View Content
        </button>
      </div>
    )
  }

  const isReadonly = shareData?.readonly ?? false
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null

  return (
    <div className="h-screen flex flex-col bg-surface dark:bg-surface-dark">
      {/* Title bar — simplified for share view */}
      <div className="h-10 flex items-center px-3 bg-panel dark:bg-panel-dark border-b border-border dark:border-border-dark select-none shrink-0">
        <span className="text-sm font-semibold text-accent mr-3">DevSnippet</span>

        {isReadonly && (
          <span className="text-2xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            Read-only
          </span>
        )}
        {!isReadonly && (
          <span className="text-2xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            Shared
          </span>
        )}

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="mr-2 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {activeFile ? (
            <>
              {/* Toolbar — simplified for share view */}
              <div className="shrink-0 border-b border-border dark:border-border-dark bg-panel dark:bg-panel-dark">
                <div className="h-10 flex items-center px-3 gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[300px]">
                    {activeFile.name}
                  </span>
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase">
                    {activeFile.type === 'markdown' ? 'md' : 'txt'}
                  </span>
                  <div className="flex-1" />

                  {/* Edit/Preview toggle — hidden for read-only */}
                  {!isReadonly && (
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        previewMode
                          ? 'bg-accent/15 text-accent'
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title="Toggle Preview (Ctrl+P)"
                    >
                      {previewMode ? 'Edit' : 'Preview'}
                    </button>
                  )}
                </div>
              </div>

              <EditorArea />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="Shared Content"
                description={files.length === 0 ? 'No files in this share' : 'Select a file from the sidebar'}
              />
            </div>
          )}
        </main>
      </div>

      <Toast />
      <ContextMenu />
    </div>
  )
}
