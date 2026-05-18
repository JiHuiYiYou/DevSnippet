import { useState, useCallback, useRef, useMemo } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import TagBadge from './TagBadge'

interface TagInputProps {
  tags: string[]
  onAdd: (tag: string) => { ok: boolean; message?: string }
  onRemove: (tag: string) => void
  maxTags?: number
}

export default function TagInput({ tags, onAdd, onRemove, maxTags = 10 }: TagInputProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const allFiles = useWorkspaceStore((s) => s.files)

  // Collect all previously used tags, excluding already-added ones
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const f of allFiles) {
      for (const t of f.tags) {
        if (!tags.includes(t)) tagSet.add(t)
      }
    }
    return Array.from(tagSet).sort()
  }, [allFiles, tags])

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!input.trim()) return allTags.slice(0, 8)
    const q = input.toLowerCase().replace(/^#/, '')
    return allTags.filter((t) => t.toLowerCase().includes(q) && !tags.includes(t)).slice(0, 8)
  }, [input, allTags, tags])

  const commitTag = useCallback(
    (tag: string) => {
      const cleaned = tag.trim().replace(/^#/, '')
      if (!cleaned) return
      const result = onAdd(cleaned)
      if (result.ok) {
        setInput('')
        setError('')
        setShowSuggestions(false)
      } else {
        setError(result.message ?? 'Failed to add tag')
      }
    },
    [onAdd],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        commitTag(input)
      } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
        onRemove(tags[tags.length - 1])
      } else if (e.key === 'Escape') {
        setInput('')
        setError('')
        setShowSuggestions(false)
        inputRef.current?.blur()
      }
    },
    [input, tags, onAdd, onRemove, commitTag],
  )

  // Close suggestions on outside click
  const handleBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 150)
  }, [])

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <div className="flex flex-wrap items-center gap-1">
        {tags.map((tag) => (
          <TagBadge key={tag} tag={tag} onRemove={() => onRemove(tag)} small />
        ))}
        {tags.length < maxTags && (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); setShowSuggestions(true) }}
              onFocus={() => { if (allTags.length > 0) setShowSuggestions(true) }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? 'Add tag...' : ''}
              className="w-20 px-1 py-0 text-xs rounded border border-transparent bg-transparent hover:border-border dark:hover:border-border-dark focus:border-accent focus:outline-none placeholder-gray-400"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-0.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded shadow-lg z-30 max-h-32 overflow-y-auto min-w-[120px]">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => { e.preventDefault(); commitTag(s) }}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {error && <span className="text-2xs text-red-500">{error}</span>}
    </div>
  )
}
