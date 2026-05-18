import { useMemo } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useTagStore } from '@/stores/useTagStore'

export default function TagFilterBar() {
  const files = useWorkspaceStore((s) => s.files)
  const activeFilters = useTagStore((s) => s.activeFilters)
  const toggleFilter = useTagStore((s) => s.toggleFilter)
  const clearFilters = useTagStore((s) => s.clearFilters)

  // Derive all tags from files
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const f of files) {
      for (const tag of f.tags) tagSet.add(tag)
    }
    return Array.from(tagSet).sort()
  }, [files])

  if (allTags.length === 0) return null

  return (
    <div className="p-2 border-t border-border dark:border-border-dark shrink-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xs text-gray-400 uppercase tracking-wide">Tags</span>
        {activeFilters.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-2xs text-gray-400 hover:text-gray-600"
          >
            clear ({activeFilters.length})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {allTags.map((tag) => {
          const isActive = activeFilters.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggleFilter(tag)}
              className={`px-1.5 py-0.5 rounded text-2xs transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}
