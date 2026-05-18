import { useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useUIStore } from '@/stores/useUIStore'
import { useTagStore } from '@/stores/useTagStore'
import type { ContextMenuItem } from '@/stores/useUIStore'
import TreeNode from './TreeNode'
import TagResultsList from './TagResultsList'
import EmptyState from '@/components/common/EmptyState'

export default function DirectoryTree() {
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const folders = useWorkspaceStore((s) => s.folders)
  const files = useWorkspaceStore((s) => s.files)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const activeFolderId = useWorkspaceStore((s) => s.activeFolderId)
  const activeFilters = useTagStore((s) => s.activeFilters)
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace)
  const createFolder = useWorkspaceStore((s) => s.createFolder)
  const createFile = useWorkspaceStore((s) => s.createFile)
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace)
  const deleteFolder = useWorkspaceStore((s) => s.deleteFolder)
  const deleteFile = useWorkspaceStore((s) => s.deleteFile)
  const copyFile = useWorkspaceStore((s) => s.copyFile)
  const copyFolder = useWorkspaceStore((s) => s.copyFolder)
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace)
  const renameFolder = useWorkspaceStore((s) => s.renameFolder)
  const renameFile = useWorkspaceStore((s) => s.renameFile)
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)
  const showContextMenu = useUIStore((s) => s.showContextMenu)
  const openFileInTab = useUIStore((s) => s.openFileInTab)
  const showToast = useUIStore((s) => s.showToast)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [renameExt, setRenameExt] = useState('') // original extension to preserve

  const handleNewWorkspace = useCallback(() => {
    const id = createWorkspace('Workspace')
    setActiveWorkspace(id)
  }, [createWorkspace, setActiveWorkspace])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, type: 'workspace' | 'folder' | 'file', id: string) => {
      e.preventDefault()
      e.stopPropagation()
      const items: ContextMenuItem[] = []
      const ws = useWorkspaceStore.getState()
      if (type === 'workspace') {
        items.push(
          { label: 'New Folder', action: () => {
            const fid = createFolder(id, 'Folder')
            setRenamingId(fid)
            setNewName('Folder')
            setRenameExt('')
          }},
          { label: 'Rename', action: () => { setRenamingId(id); setNewName(ws.workspaces.find((w) => w.id === id)?.name ?? ''); setRenameExt('') } },
          { label: 'Delete', action: () => { deleteWorkspace(id); showToast('Workspace deleted') }, danger: true },
        )
      } else if (type === 'folder') {
        items.push(
          { label: 'New Folder', action: () => {
            const fid = createFolder(activeWorkspaceId!, 'Folder', id)
            setRenamingId(fid)
            setNewName('Folder')
            setRenameExt('')
          }},
          { label: 'New File', action: () => {
            const fid = createFile(id, 'untitled.txt', 'text')
            setRenamingId(fid)
            setNewName('untitled.txt')
            setRenameExt('__new__')
          }},
          { label: 'Copy', action: () => { copyFolder(id); showToast('Folder copied') } },
          { label: 'Rename', action: () => { setRenamingId(id); setNewName(ws.folders.find((f) => f.id === id)?.name ?? ''); setRenameExt('') } },
          { label: 'Delete', action: () => { deleteFolder(id); showToast('Folder deleted') }, danger: true },
        )
      } else if (type === 'file') {
        items.push(
          { label: 'Rename', action: () => {
            const file = ws.files.find((f) => f.id === id)
            if (file) { setRenamingId(id); setNewName(file.name); setRenameExt('__full__') }
          }},
          { label: 'Copy', action: () => { copyFile(id); showToast('File copied') } },
          { label: 'Delete', action: () => { deleteFile(id); showToast('File deleted') }, danger: true },
        )
      }
      showContextMenu(e.clientX, e.clientY, items)
    },
    [showContextMenu, activeWorkspaceId, createFolder, createFile, deleteWorkspace, deleteFolder, deleteFile, copyFile, copyFolder, renameWorkspace, renameFolder, renameFile, showToast, openFileInTab],
  )

  const handleRenameSubmit = useCallback(() => {
    if (!renamingId || !newName.trim()) {
      setRenamingId(null)
      setNewName('')
      setRenameExt('')
      return
    }
    const renameId = renamingId
    const trimmed = newName.trim()
    const ext = renameExt
    // Clear rename state immediately so blur after unmount is a no-op
    setRenamingId(null)
    setNewName('')
    setRenameExt('')
    if (workspaces.find((w) => w.id === renameId)) {
      renameWorkspace(renameId, trimmed)
    } else if (folders.find((f) => f.id === renameId)) {
      renameFolder(renameId, trimmed)
    } else if (ext === '__new__') {
      // New file: allow full name, default .txt if no extension
      const dotIdx = trimmed.lastIndexOf('.')
      const finalName = dotIdx > 0 ? trimmed : `${trimmed}.txt`
      renameFile(renameId, finalName)
      // Defer tab open to next tick so React finishes removing the rename input first
      setTimeout(() => openFileInTab(renameId), 0)
    } else {
      const finalName = ext === '__full__'
        ? trimmed
        : ext
          ? `${trimmed}${ext}`
          : trimmed
      renameFile(renameId, finalName)
    }
  }, [renamingId, newName, renameExt, workspaces, folders, renameWorkspace, renameFolder, renameFile, openFileInTab])

  if (workspaces.length === 0) {
    return (
      <EmptyState
        title="No workspaces"
        description="Create a workspace to get started"
        action={{ label: 'New Workspace', onClick: handleNewWorkspace }}
      />
    )
  }

  if (!activeWorkspaceId) {
    return (
      <div className="text-xs text-gray-400 p-2 text-center mt-4">
        Select a workspace above to browse
      </div>
    )
  }

  // If a tag filter is active, show flat list of matching files
  if (activeFilters.length > 0) {
    return <TagResultsList />
  }

  const rootFolders = folders.filter(
    (f) => f.workspaceId === activeWorkspaceId && f.parentId === null,
  )

  // For +Folder and +File buttons: use activeFolderId if set, otherwise create at root
  const createTargetFolderId = activeFolderId || (rootFolders[0]?.id ?? null)

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between px-1 py-1 mb-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Explorer
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={() => {
              const fid = activeFolderId
                ? createFolder(activeWorkspaceId, 'Folder', activeFolderId)
                : createFolder(activeWorkspaceId, 'Folder')
              setRenamingId(fid)
              setNewName('Folder')
              setRenameExt('')
            }}
            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 text-xs"
            title={activeFolderId ? 'New Folder under selected' : 'New Folder at Root'}
          >
            +Folder
          </button>
          <button
            onClick={() => {
              let fileId: string
              if (createTargetFolderId) {
                fileId = createFile(createTargetFolderId, 'untitled.txt', 'text')
              } else {
                const fid = createFolder(activeWorkspaceId, 'Folder')
                fileId = createFile(fid, 'untitled.txt', 'text')
              }
              setRenamingId(fileId)
              setNewName('untitled.txt')
              setRenameExt('__new__')
            }}
            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 text-xs"
            title={activeFolderId ? 'New File under selected' : 'Quick New File'}
          >
            +File
          </button>
        </div>
      </div>

      {rootFolders.map((folder) => (
        <TreeNode
          key={folder.id}
          folderId={folder.id}
          depth={0}
          renamingId={renamingId}
          renameValue={newName}
          renameExt={renameExt}
          onRenameChange={setNewName}
          onRenameSubmit={handleRenameSubmit}
          onContextMenu={handleContextMenu}
          onFileContextMenu={handleContextMenu}
          onStartRename={(id) => { setRenamingId(id); setRenameExt('') }}
          onFileStartRename={(id, baseName, ext) => {
            setRenamingId(id)
            setNewName(baseName)
            setRenameExt(ext)
          }}
          onStartCreate={(parentId, type) => {
            if (type === 'folder') {
              const fid = createFolder(activeWorkspaceId, 'Folder', parentId)
              setRenamingId(fid)
              setNewName('Folder')
              setRenameExt('')
            } else {
              const fid = createFile(parentId, 'untitled.txt', 'text')
              setRenamingId(fid)
              setNewName('untitled.txt')
              setRenameExt('__new__')
            }
          }}
        />
      ))}

      {rootFolders.length === 0 && (
        <div className="text-xs text-gray-400 p-2 text-center">
          No folders yet. Click +Folder to start.
        </div>
      )}
    </div>
  )
}
