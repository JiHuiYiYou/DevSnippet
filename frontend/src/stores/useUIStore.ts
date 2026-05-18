import { create } from 'zustand'
import { useWorkspaceStore } from './useWorkspaceStore'
import { useEditorStore } from './useEditorStore'

export interface Toast {
  id: string
  message: string
  type: 'info' | 'error' | 'success'
}

export interface ContextMenuItem {
  label: string
  action: () => void
  danger?: boolean
  divider?: boolean
}

interface UIStoreState {
  sidebarCollapsed: boolean
  previewMode: boolean
  activeModal: 'share' | 'global-search' | 'settings' | null
  toasts: Toast[]
  contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null
  jumpToLine: number | null
  sidebarSearchFocusTick: number
  editorSelectAllTick: number
  editorPasteTick: number
  treeFilter: string
  editorScrollTop: number
  syncScrollEnabled: boolean
  tabs: string[]
  activeTabId: string | null
}

interface UIStoreActions {
  toggleSidebar: () => void
  setPreviewMode: (on: boolean) => void
  togglePreviewMode: () => void
  openModal: (name: UIStoreState['activeModal']) => void
  closeModal: () => void
  showToast: (message: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void
  hideContextMenu: () => void
  setJumpToLine: (line: number | null) => void
  focusSidebarSearch: () => void
  selectAllEditor: () => void
  triggerEditorPaste: () => void
  setTreeFilter: (text: string) => void
  setEditorScrollTop: (top: number) => void
  setSyncScrollEnabled: (enabled: boolean) => void
  openFileInTab: (fileId: string) => void
  closeTab: (fileId: string) => void
  setActiveTab: (fileId: string) => void
}

let toastId = 0

export const useUIStore = create<UIStoreState & UIStoreActions>((set, get) => ({
  sidebarCollapsed: false,
  previewMode: false,
  activeModal: null,
  toasts: [],
  contextMenu: null,
  jumpToLine: null,
  sidebarSearchFocusTick: 0,
  editorSelectAllTick: 0,
  editorPasteTick: 0,
  treeFilter: '',
  editorScrollTop: 0,
  syncScrollEnabled: false,
  tabs: [],
  activeTabId: null,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setPreviewMode: (on) => set({ previewMode: on }),
  togglePreviewMode: () => set((s) => ({ previewMode: !s.previewMode })),
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),

  showToast: (message, type = 'info') => {
    const id = `toast-${++toastId}`
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  showContextMenu: (x, y, items) => set({ contextMenu: { x, y, items } }),
  hideContextMenu: () => set({ contextMenu: null }),
  setJumpToLine: (line) => set({ jumpToLine: line }),
  focusSidebarSearch: () => set((s) => ({ sidebarSearchFocusTick: s.sidebarSearchFocusTick + 1 })),
  selectAllEditor: () => set((s) => ({ editorSelectAllTick: s.editorSelectAllTick + 1 })),
  triggerEditorPaste: () => set((s) => ({ editorPasteTick: s.editorPasteTick + 1 })),
  setTreeFilter: (text) => set({ treeFilter: text }),
  setEditorScrollTop: (top) => set({ editorScrollTop: top }),
  setSyncScrollEnabled: (enabled) => set({ syncScrollEnabled: enabled }),

  openFileInTab: (fileId) => {
    const { tabs, activeTabId } = get()
    const workspaceStore = useWorkspaceStore.getState()
    const touchedFiles = useEditorStore.getState().touchedFiles

    // File already in tabs — just switch to it
    if (tabs.includes(fileId)) {
      workspaceStore.expandParentsOf(
        workspaceStore.files.find((f) => f.id === fileId)?.folderId ?? ''
      )
      workspaceStore.setActiveFolder(
        workspaceStore.files.find((f) => f.id === fileId)?.folderId ?? null
      )
      workspaceStore.setActiveFile(fileId)
      set({ activeTabId: fileId })
      return
    }

    // Find any untouched tab to replace (oldest first), not just the active one
    const replaceIdx = tabs.findIndex((t) => !touchedFiles.has(t))

    if (replaceIdx >= 0) {
      // Replace the untouched tab with the new file
      const newTabs = [...tabs]
      newTabs[replaceIdx] = fileId
      workspaceStore.expandParentsOf(
        workspaceStore.files.find((f) => f.id === fileId)?.folderId ?? ''
      )
      workspaceStore.setActiveFolder(
        workspaceStore.files.find((f) => f.id === fileId)?.folderId ?? null
      )
      workspaceStore.setActiveFile(fileId)
      set({ tabs: newTabs, activeTabId: fileId })
      return
    }

    // Max 10 tabs
    if (tabs.length >= 10) {
      get().showToast('Maximum 10 tabs open', 'error')
      return
    }

    // Add new tab
    workspaceStore.expandParentsOf(
      workspaceStore.files.find((f) => f.id === fileId)?.folderId ?? ''
    )
    workspaceStore.setActiveFolder(
      workspaceStore.files.find((f) => f.id === fileId)?.folderId ?? null
    )
    workspaceStore.setActiveFile(fileId)
    set({ tabs: [...tabs, fileId], activeTabId: fileId })
  },

  closeTab: (fileId) => {
    const { tabs, activeTabId } = get()
    const workspaceStore = useWorkspaceStore.getState()
    const newTabs = tabs.filter((t) => t !== fileId)

    if (newTabs.length === 0) {
      workspaceStore.setActiveFile(null)
      set({ tabs: [], activeTabId: null })
      return
    }

    if (fileId === activeTabId) {
      const nextFileId = newTabs[newTabs.length - 1]
      workspaceStore.expandParentsOf(
        workspaceStore.files.find((f) => f.id === nextFileId)?.folderId ?? ''
      )
      workspaceStore.setActiveFolder(
        workspaceStore.files.find((f) => f.id === nextFileId)?.folderId ?? null
      )
      workspaceStore.setActiveFile(nextFileId)
      set({ tabs: newTabs, activeTabId: nextFileId })
    } else {
      set({ tabs: newTabs })
    }
  },

  setActiveTab: (fileId) => {
    const workspaceStore = useWorkspaceStore.getState()
    workspaceStore.expandParentsOf(
      workspaceStore.files.find((f) => f.id === fileId)?.folderId ?? ''
    )
    workspaceStore.setActiveFolder(
      workspaceStore.files.find((f) => f.id === fileId)?.folderId ?? null
    )
    workspaceStore.setActiveFile(fileId)
    set({ activeTabId: fileId })
  },
}))
