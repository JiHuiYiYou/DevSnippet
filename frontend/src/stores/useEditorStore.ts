import { create } from 'zustand'

interface EditorStoreState {
  contentMap: Record<string, string>
  dirtyFiles: Set<string>
  touchedFiles: Set<string>
}

interface EditorStoreActions {
  setContent: (fileId: string, content: string) => void
  initContent: (fileId: string, content: string) => void
  getContent: (fileId: string) => string | undefined
  markClean: (fileId: string) => void
  markSaved: (fileId: string) => void
  discardChanges: (fileId: string) => void
  isDirty: (fileId: string) => boolean
  isTouched: (fileId: string) => boolean
  saveAll: () => void
}

export const useEditorStore = create<EditorStoreState & EditorStoreActions>((set, get) => ({
  contentMap: {},
  dirtyFiles: new Set<string>(),
  touchedFiles: new Set<string>(),

  setContent: (fileId, content) => {
    set((s) => {
      const newDirty = new Set(s.dirtyFiles)
      newDirty.add(fileId)
      const newTouched = new Set(s.touchedFiles)
      newTouched.add(fileId)
      return {
        contentMap: { ...s.contentMap, [fileId]: content },
        dirtyFiles: newDirty,
        touchedFiles: newTouched,
      }
    })
  },

  initContent: (fileId, content) => {
    set((s) => ({
      contentMap: { ...s.contentMap, [fileId]: content },
    }))
  },

  getContent: (fileId) => {
    return get().contentMap[fileId]
  },

  markClean: (fileId) => {
    set((s) => {
      const newDirty = new Set(s.dirtyFiles)
      newDirty.delete(fileId)
      return { dirtyFiles: newDirty }
    })
  },

  markSaved: (fileId) => {
    set((s) => {
      const newDirty = new Set(s.dirtyFiles)
      newDirty.delete(fileId)
      return { dirtyFiles: newDirty }
    })
  },

  discardChanges: (fileId) => {
    set((s) => {
      const newContent = { ...s.contentMap }
      delete newContent[fileId]
      const newDirty = new Set(s.dirtyFiles)
      newDirty.delete(fileId)
      const newTouched = new Set(s.touchedFiles)
      newTouched.delete(fileId)
      return { contentMap: newContent, dirtyFiles: newDirty, touchedFiles: newTouched }
    })
  },

  isDirty: (fileId) => get().dirtyFiles.has(fileId),
  isTouched: (fileId) => get().touchedFiles.has(fileId),

  saveAll: () => {
    set({ dirtyFiles: new Set<string>() })
  },
}))
