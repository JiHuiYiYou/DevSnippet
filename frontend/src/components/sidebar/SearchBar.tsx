import { useRef, useCallback, useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useUIStore } from '@/stores/useUIStore'

export default function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const setActiveFolder = useWorkspaceStore((s) => s.setActiveFolder)
  const openFileInTab = useUIStore((s) => s.openFileInTab)
  const expandParentsOf = useWorkspaceStore((s) => s.expandParentsOf)
  const sidebarSearchFocusTick = useUIStore((s) => s.sidebarSearchFocusTick)
  const setTreeFilter = useUIStore((s) => s.setTreeFilter)
  const files = useWorkspaceStore((s) => s.files)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const folders = useWorkspaceStore((s) => s.folders)

  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; folderPath: string }>>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Ctrl+Shift+F focuses this input
  useEffect(() => {
    if (sidebarSearchFocusTick > 0 && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [sidebarSearchFocusTick])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const updateSuggestions = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSuggestions([])
        setShowDropdown(false)
        return
      }
      const q = query.toLowerCase()
      const matches: Array<{ id: string; name: string; folderPath: string }> = []
      const folderMap = new Map(folders.map((f) => [f.id, f]))
      const workspaceMap = new Map(workspaces.map((w) => [w.id, w]))

      for (const file of files) {
        const nameMatch = file.name.toLowerCase().includes(q)
        const tagMatch = file.tags.some((t) => t.toLowerCase().includes(q))
        if (nameMatch || tagMatch) {
          // Build folder path
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
          const fullPath = (ws?.name ?? '') + (pathParts.length > 0 ? ' / ' + pathParts.join(' / ') : '')
          matches.push({ id: file.id, name: file.name, folderPath: fullPath })
        }
        if (matches.length >= 20) break
      }
      setSuggestions(matches)
      setShowDropdown(matches.length > 0)
    },
    [files, folders, workspaces],
  )

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setValue(val)
      updateSuggestions(val)
      setTreeFilter(val)
    },
    [setTreeFilter, updateSuggestions],
  )

  const handleSelectSuggestion = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId)
      if (file) {
        expandParentsOf(file.folderId)
        setActiveFolder(file.folderId)
        openFileInTab(file.id)
      }
      setValue('')
      setSuggestions([])
      setShowDropdown(false)
    },
    [files, expandParentsOf, setActiveFolder, openFileInTab],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur()
      setValue('')
      setSuggestions([])
      setShowDropdown(false)
      setTreeFilter('')
    }
  }, [setTreeFilter])

  return (
    <div className="p-2 shrink-0 relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder="Search files..."
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
        className="w-full px-2 py-1.5 text-xs rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-2 right-2 top-full mt-0.5 max-h-48 overflow-y-auto bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded shadow-lg z-20"
        >
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSuggestion(s.id)}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <div className="font-medium text-gray-700 dark:text-gray-300 truncate">{s.name}</div>
              <div className="text-2xs text-gray-400 truncate">{s.folderPath}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
