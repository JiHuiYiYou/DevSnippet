import { useEffect, useRef, useCallback } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUIStore } from '@/stores/useUIStore'

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const files = useWorkspaceStore((s) => s.files)
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null
  const updateFileContent = useWorkspaceStore((s) => s.updateFileContent)
  const persist = useWorkspaceStore((s) => s.persist)
  const contentMap = useEditorStore((s) => s.contentMap)
  const markSaved = useEditorStore((s) => s.markSaved)
  const delay = useSettingsStore((s) => s.autoSaveDelayMs)

  const save = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!activeFile) return
    const content = contentMap[activeFile.id]
    if (content !== undefined) {
      updateFileContent(activeFile.id, content)
      persist()
    }
  }, [activeFile, contentMap, updateFileContent, persist])

  const explicitSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!activeFile) return
    const content = contentMap[activeFile.id]
    if (content !== undefined) {
      updateFileContent(activeFile.id, content)
      markSaved(activeFile.id)
      persist()
      useUIStore.getState().showToast('Saved', 'success')
    }
  }, [activeFile, contentMap, updateFileContent, markSaved, persist])

  // Auto-save on content change (debounced)
  useEffect(() => {
    // Skip auto-save for share routes (data is from API, not IndexedDB)
    if (window.location.pathname.startsWith('/share/')) return
    if (!activeFile) return
    const content = contentMap[activeFile.id]
    if (content === undefined) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(save, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [activeFile?.id, contentMap[activeFile?.id ?? ''] ?? '', delay, save])

  // Ctrl+S handler — explicit save with visual feedback
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        explicitSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [explicitSave])

  // Warn before closing with actual unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      // Skip for share routes
      if (window.location.pathname.startsWith('/share/')) return
      const editorState = useEditorStore.getState()
      const workspaceState = useWorkspaceStore.getState()
      for (const fileId of editorState.dirtyFiles) {
        const current = editorState.contentMap[fileId]
        const saved = workspaceState.files.find((f) => f.id === fileId)?.content
        if (current !== undefined && current !== saved) {
          e.preventDefault()
          e.returnValue = ''
          return
        }
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  return { save: explicitSave }
}
