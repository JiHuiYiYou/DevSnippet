import { useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useUIStore } from '@/stores/useUIStore'
import { useTagStore } from '@/stores/useTagStore'
import { getFileExtension } from '@/lib/helpers'
import type { ContextMenuItem } from '@/stores/useUIStore'

const FILE_ICONS: Record<string, string> = {
  ts: 'TS', tsx: 'TS', js: 'JS', jsx: 'JS',
  py: 'Py', go: 'Go', rs: 'Rs',
  html: '<>', css: '#', sql: 'DB',
  sh: 'sh', json: '{}', yaml: 'Y', yml: 'Y',
  md: 'MD', txt: 'Tx',
}

interface TreeNodeProps {
  folderId: string
  depth: number
  renamingId: string | null
  renameValue: string
  renameExt: string
  onRenameChange: (v: string) => void
  onRenameSubmit: () => void
  onContextMenu: (e: React.MouseEvent, type: 'folder', id: string) => void
  onFileContextMenu: (e: React.MouseEvent, type: 'file', id: string) => void
  onStartRename: (id: string) => void
  onFileStartRename: (id: string, baseName: string, ext: string) => void
  onStartCreate: (parentId: string, type: 'folder' | 'file') => void
}

export default function TreeNode({
  folderId,
  depth,
  renamingId,
  renameValue,
  renameExt,
  onRenameChange,
  onRenameSubmit,
  onContextMenu,
  onFileContextMenu,
  onStartRename,
  onFileStartRename,
  onStartCreate,
}: TreeNodeProps) {
  const folder = useWorkspaceStore((s) => s.folders.find((f) => f.id === folderId))
  const folders = useWorkspaceStore((s) => s.folders)
  const files = useWorkspaceStore((s) => s.files)
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const activeFolderId = useWorkspaceStore((s) => s.activeFolderId)
  const expandedFolderIds = useWorkspaceStore((s) => s.expandedFolderIds)
  const setActiveFolder = useWorkspaceStore((s) => s.setActiveFolder)
  const toggleFolderExpanded = useWorkspaceStore((s) => s.toggleFolderExpanded)
  const moveFile = useWorkspaceStore((s) => s.moveFile)
  const moveFolder = useWorkspaceStore((s) => s.moveFolder)
  const treeFilter = useUIStore((s) => s.treeFilter)
  const openFileInTab = useUIStore((s) => s.openFileInTab)
  const activeFilters = useTagStore((s) => s.activeFilters)

  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)

  if (!folder) return null

  const isExpanded = expandedFolderIds.has(folderId)
  const isActive = activeFolderId === folderId
  const isRenaming = renamingId === folderId
  const paddingLeft = 8 + depth * 16

  const childFolders = folders.filter((f) => f.parentId === folderId)
  let childFiles = files.filter((f) => f.folderId === folderId)

  // Apply tag filter (multi-select: file must have ALL selected tags)
  if (activeFilters.length > 0) {
    childFiles = childFiles.filter((f) =>
      activeFilters.every((tag) => f.tags.includes(tag))
    )
  }

  // Apply tree filter (sidebar search)
  const filterText = treeFilter.toLowerCase().trim()
  if (filterText) {
    childFiles = childFiles.filter((f) => f.name.toLowerCase().includes(filterText))
    const tagMatches = files.filter(
      (f) => f.folderId === folderId && f.tags.some((t) => t.toLowerCase().includes(filterText))
    )
    for (const f of tagMatches) {
      if (!childFiles.includes(f)) childFiles.push(f)
    }
  }

  // Determine if this folder or any child matches the filter
  const hasFilter = filterText || activeFilters.length > 0
  const hasMatchingChildren = hasFilter
    ? childFiles.length > 0 || childFolders.length > 0
    : true

  if (hasFilter && !hasMatchingChildren && !folder.name.toLowerCase().includes(filterText || '')) {
    return null
  }

  // Drag-and-drop handlers for folders (drop target)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleFolderDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(folderId)
  }, [folderId])

  const handleFolderDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(null)
  }, [])

  const handleFolderDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverFolderId(null)
      const fileId = e.dataTransfer.getData('text/file-id')
      const movedFolderId = e.dataTransfer.getData('text/folder-id')
      if (fileId) {
        moveFile(fileId, folderId)
      } else if (movedFolderId && movedFolderId !== folderId) {
        moveFolder(movedFolderId, folderId)
      }
    },
    [folderId, moveFile, moveFolder],
  )

  const handleFileDragStart = useCallback((e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData('text/file-id', fileId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleFolderDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/folder-id', id)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleFileDragEnter = useCallback((e: React.DragEvent, fileId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFileId(fileId)
  }, [])

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFileId(null)
  }, [])

  const handleFileDrop = useCallback(
    (e: React.DragEvent, targetFileId: string) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverFileId(null)
      // Dropping a file onto another file → move to target file's folder
      const fileId = e.dataTransfer.getData('text/file-id')
      if (fileId && fileId !== targetFileId) {
        const targetFile = files.find((f) => f.id === targetFileId)
        if (targetFile) {
          moveFile(fileId, targetFile.folderId)
        }
      }
    },
    [files, moveFile],
  )

  return (
    <div>
      {/* Folder node (drop target for files, also draggable) */}
      <div
        draggable={renamingId !== folderId}
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-xs transition-colors group ${
          dragOverFolderId === folderId
            ? 'bg-accent/20 ring-1 ring-accent'
            : isActive
              ? 'bg-accent/10 text-accent'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => {
          setActiveFolder(folderId)
          toggleFolderExpanded(folderId)
        }}
        onDoubleClick={() => onStartRename(folderId)}
        onContextMenu={(e) => onContextMenu(e, 'folder', folderId)}
        onDragStart={(e) => handleFolderDragStart(e, folderId)}
        onDragOver={handleDragOver}
        onDragEnter={handleFolderDragEnter}
        onDragLeave={handleFolderDragLeave}
        onDrop={handleFolderDrop}
      >
        <span className="w-3 text-center shrink-0 text-gray-400">
          {isExpanded ? '▾' : '▸'}
        </span>
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameSubmit()
              if (e.key === 'Escape') onRenameSubmit()
            }}
            onBlur={onRenameSubmit}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-1 py-0 text-xs rounded border border-accent bg-surface dark:bg-surface-dark focus:outline-none"
          />
        ) : (
          <span className="truncate">{folder.name}</span>
        )}
      </div>

      {/* Children (when expanded) */}
      {isExpanded && (
        <div>
          {childFolders.map((child) => (
            <TreeNode
              key={child.id}
              folderId={child.id}
              depth={depth + 1}
              renamingId={renamingId}
              renameValue={renameValue}
              renameExt={renameExt}
              onRenameChange={onRenameChange}
              onRenameSubmit={onRenameSubmit}
              onContextMenu={onContextMenu}
              onFileContextMenu={onFileContextMenu}
              onStartRename={onStartRename}
              onFileStartRename={onFileStartRename}
              onStartCreate={onStartCreate}
            />
          ))}
          {childFiles.map((file) => {
            const ext = getFileExtension(file.name)
            const icon = FILE_ICONS[ext] ?? '--'
            const isFileActive = file.id === activeFileId
            return (
              <div
                key={file.id}
                draggable={renamingId !== file.id}
                className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded text-xs transition-colors group ${
                  dragOverFileId === file.id
                    ? 'bg-accent/20 ring-1 ring-accent'
                    : isFileActive
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
                style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}
                onClick={() => openFileInTab(file.id)}
                onContextMenu={(e) => onFileContextMenu(e, 'file', file.id)}
                onDoubleClick={() => {
                  const dotIdx = file.name.lastIndexOf('.')
                  if (dotIdx > 0) {
                    onFileStartRename(file.id, file.name.substring(0, dotIdx), file.name.substring(dotIdx))
                  } else {
                    onFileStartRename(file.id, file.name, '')
                  }
                }}
                onDragStart={(e) => handleFileDragStart(e, file.id)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleFileDragEnter(e, file.id)}
                onDragLeave={handleFileDragLeave}
                onDrop={(e) => handleFileDrop(e, file.id)}
              >
                <span className="w-3 text-center shrink-0" />
                <span className="w-5 text-center shrink-0 text-2xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-0.5">
                  {icon}
                </span>
                {renamingId === file.id ? (
                  <div className="flex-1 flex items-center">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => onRenameChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onRenameSubmit()
                        if (e.key === 'Escape') onRenameSubmit()
                      }}
                      onBlur={onRenameSubmit}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 px-1 py-0 text-xs rounded border border-accent bg-surface dark:bg-surface-dark focus:outline-none"
                    />
                    {ext && renameExt !== '__full__' && renameExt !== '__new__' && renameExt !== '' && (
                      <span className="text-gray-400 text-xs">{ext}</span>
                    )}
                  </div>
                ) : (
                  <>
                    <span className="truncate">{file.name}</span>
                    {file.tags.length > 0 && (
                      <span className="text-2xs text-gray-400 ml-1 shrink-0">
                        {file.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}
                        {file.tags.length > 2 && ' +' + (file.tags.length - 2)}
                      </span>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
