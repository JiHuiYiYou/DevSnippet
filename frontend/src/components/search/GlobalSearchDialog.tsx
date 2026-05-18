import { useEffect, useRef, useCallback } from 'react'
import { useSearchStore } from '@/stores/useSearchStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useUIStore } from '@/stores/useUIStore'
import Modal from '@/components/common/Modal'
import type { SearchResult, SearchMode } from '@/types/search'
import { debounce } from '@/lib/helpers'

const MODE_LABELS: { value: SearchMode; label: string }[] = [
  { value: 'filename', label: 'Name' },
  { value: 'tag', label: 'Tag' },
  { value: 'fulltext', label: 'Content' },
]

export default function GlobalSearchDialog() {
  const isOpen = useSearchStore((s) => s.isOpen)
  const close = useSearchStore((s) => s.close)
  const query = useSearchStore((s) => s.query)
  const setQuery = useSearchStore((s) => s.setQuery)
  const mode = useSearchStore((s) => s.mode)
  const setMode = useSearchStore((s) => s.setMode)
  const results = useSearchStore((s) => s.results)
  const isSearching = useSearchStore((s) => s.isSearching)
  const execute = useSearchStore((s) => s.execute)

  const setActiveFolder = useWorkspaceStore((s) => s.setActiveFolder)
  const expandParentsOf = useWorkspaceStore((s) => s.expandParentsOf)
  const openFileInTab = useUIStore((s) => s.openFileInTab)
  const showToast = useUIStore((s) => s.showToast)

  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedExecuteRef = useRef(debounce(() => {
    useSearchStore.getState().execute()
  }, 200))

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => debouncedExecuteRef.current.cancel()
  }, [])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value)
      debouncedExecuteRef.current()
    },
    [setQuery],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        execute()
      } else if (e.key === 'Escape') {
        close()
      }
    },
    [execute, close],
  )

  const handleSelect = useCallback(
    (result: SearchResult) => {
      expandParentsOf(result.fileId)
      const { files } = useWorkspaceStore.getState()
      const file = files.find((f) => f.id === result.fileId)
      if (file) {
        setActiveFolder(file.folderId)
        openFileInTab(file.id)
      }
      close()
      showToast(`Opened "${result.fileName}"`, 'success')
    },
    [expandParentsOf, setActiveFolder, openFileInTab, close, showToast],
  )

  return (
    <Modal open={isOpen} onClose={close} title="Search">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Search files by name, tag, or content..."
            className="flex-1 px-2 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={() => execute()}
            className="px-3 py-1.5 text-xs rounded bg-accent text-white hover:bg-accent-dark"
          >
            Search
          </button>
        </div>

        <div className="flex gap-1">
          {MODE_LABELS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                mode === m.value
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="max-h-60 overflow-y-auto">
          {isSearching ? (
            <p className="text-xs text-gray-400 text-center py-4">Searching...</p>
          ) : results.length === 0 && query ? (
            <p className="text-xs text-gray-400 text-center py-4">
              No results for "{query}"
            </p>
          ) : (
            results.map((result) => (
              <button
                key={result.fileId}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {result.fileName}
                  </span>
                  <span className="text-2xs text-gray-400">
                    {result.breadcrumb.workspaceName} &rsaquo; {result.breadcrumb.folderNames.join(' › ')}
                  </span>
                </div>
                {result.matchContext && (
                  <pre className="text-2xs text-gray-500 mt-1 truncate max-w-full">
                    {result.matchContext}
                  </pre>
                )}
                {result.matchLine && (
                  <span className="text-2xs text-gray-400">Line {result.matchLine}</span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="text-2xs text-gray-400 text-center">
          Tip: Search by filename, tag, or content in sidebar or press Ctrl+K for global search
        </div>
      </div>
    </Modal>
  )
}
