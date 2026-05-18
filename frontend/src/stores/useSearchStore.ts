import { create } from 'zustand'
import type { SearchResult, SearchMode } from '@/types/search'
import { searchFiles } from '@/db/search'
import { useWorkspaceStore } from './useWorkspaceStore'

interface SearchStoreState {
  query: string
  mode: SearchMode
  results: SearchResult[]
  isOpen: boolean
  isSearching: boolean
}

interface SearchStoreActions {
  open: () => void
  close: () => void
  setQuery: (q: string) => void
  setMode: (mode: SearchMode) => void
  execute: () => void
}

export const useSearchStore = create<SearchStoreState & SearchStoreActions>((set, get) => ({
  query: '',
  mode: 'filename',
  results: [],
  isOpen: false,
  isSearching: false,

  open: () => set({ isOpen: true, query: '', results: [] }),
  close: () => set({ isOpen: false, query: '', results: [] }),

  setQuery: (q) => set({ query: q }),

  setMode: (mode) => {
    set({ mode })
    const { query } = get()
    if (query) get().execute()
  },

  execute: () => {
    const { query, mode } = get()
    if (!query.trim()) {
      set({ results: [] })
      return
    }
    set({ isSearching: true })
    // search runs synchronously against in-memory arrays; defer to avoid blocking UI
    requestAnimationFrame(() => {
      const { workspaces, folders, files } = useWorkspaceStore.getState()
      const results = searchFiles(query, mode, files, folders, workspaces)
      set({ results, isSearching: false })
    })
  },
}))
