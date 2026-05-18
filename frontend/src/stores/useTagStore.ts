import { create } from 'zustand'

// Manages active tag filters (multi-select) for the sidebar.
// Tag data is stored on SnippetFile.tags in useWorkspaceStore.

interface TagStoreState {
  activeFilters: string[]
}

interface TagStoreActions {
  toggleFilter: (tag: string) => void
  clearFilters: () => void
  setFilters: (tags: string[]) => void
}

export const useTagStore = create<TagStoreState & TagStoreActions>((set, get) => ({
  activeFilters: [],

  toggleFilter: (tag) => {
    const current = get().activeFilters
    if (current.includes(tag)) {
      set({ activeFilters: current.filter((t) => t !== tag) })
    } else {
      set({ activeFilters: [...current, tag] })
    }
  },

  clearFilters: () => set({ activeFilters: [] }),

  setFilters: (tags) => set({ activeFilters: tags }),
}))
