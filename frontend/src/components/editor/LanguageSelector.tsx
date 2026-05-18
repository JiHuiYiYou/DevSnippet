import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import type { CodeLanguage } from '@/types/core'
import { LANGUAGE_LABELS } from '@/lib/constants'

export default function LanguageSelector() {
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const files = useWorkspaceStore((s) => s.files)
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null

  if (!activeFile || activeFile.type !== 'code') return null

  return (
    <select
      value={activeFile.language}
      onChange={(e) =>
        useWorkspaceStore.setState((s) => ({
          files: s.files.map((f) =>
            f.id === activeFile.id ? { ...f, language: e.target.value as CodeLanguage } : f,
          ),
        }))
      }
      className="text-2xs px-1.5 py-0.5 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-gray-500 focus:outline-none focus:ring-1 focus:ring-accent"
    >
      {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}
