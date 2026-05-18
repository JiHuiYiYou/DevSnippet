import { useEffect } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import { useSearchStore } from '@/stores/useSearchStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { KEYBOARD_SHORTCUTS } from '@/lib/constants'

function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('+')
  const ctrl = parts.includes('Ctrl')
  const shift = parts.includes('Shift')
  const key = parts[parts.length - 1]
  return (
    e.ctrlKey === ctrl &&
    e.shiftKey === shift &&
    e.key.toLowerCase() === key.toLowerCase() &&
    !e.repeat
  )
}

export function useKeyboardShortcuts() {
  const togglePreview = useUIStore((s) => s.togglePreviewMode)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const openSearch = useSearchStore((s) => s.open)
  const focusSidebarSearch = useUIStore((s) => s.focusSidebarSearch)
  const createFile = useWorkspaceStore((s) => s.createFile)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const activeFolderId = useWorkspaceStore((s) => s.activeFolderId)
  const folders = useWorkspaceStore((s) => s.folders)

  useEffect(() => {
    // Skip for share routes
    if (window.location.pathname.startsWith('/share/')) return

    const handler = (e: KeyboardEvent) => {
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.TOGGLE_PREVIEW)) {
        e.preventDefault()
        togglePreview()
      } else if (matchesShortcut(e, KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR)) {
        e.preventDefault()
        toggleSidebar()
      } else if (matchesShortcut(e, KEYBOARD_SHORTCUTS.GLOBAL_SEARCH)) {
        e.preventDefault()
        openSearch()
      } else if (matchesShortcut(e, KEYBOARD_SHORTCUTS.SEARCH_FOCUS)) {
        e.preventDefault()
        focusSidebarSearch()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePreview, toggleSidebar, openSearch, focusSidebarSearch, createFile, activeWorkspaceId, activeFolderId, folders])
}
