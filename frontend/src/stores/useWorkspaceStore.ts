import { create } from 'zustand'
import type { Workspace, Folder, SnippetFile, FileType, CodeLanguage } from '@/types/core'
import { uuid } from '@/lib/helpers'
import { MAX_TAGS_PER_FILE } from '@/lib/constants'
import {
  getAllWorkspaces,
  putWorkspace,
  deleteWorkspace as dbDeleteWorkspace,
  getAllFolders,
  putFolder,
  deleteFolder as dbDeleteFolder,
  getAllFiles,
  putFile as dbPutFile,
  deleteFile as dbDeleteFile,
  persistAll,
} from '@/db'

interface WorkspaceStoreState {
  workspaces: Workspace[]
  folders: Folder[]
  files: SnippetFile[]
  activeWorkspaceId: string | null
  activeFolderId: string | null
  activeFileId: string | null
  expandedFolderIds: Set<string>
  isLoaded: boolean
}

interface WorkspaceStoreActions {
  initialize: () => Promise<void>

  createWorkspace: (name: string) => string
  renameWorkspace: (id: string, name: string) => void
  deleteWorkspace: (id: string) => void

  createFolder: (workspaceId: string, name: string, parentId?: string | null) => string
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  moveFolder: (id: string, newParentId: string | null) => void

  createFile: (folderId: string, name: string, type: FileType, language?: CodeLanguage) => string
  renameFile: (id: string, name: string) => void
  deleteFile: (id: string) => void
  copyFile: (id: string) => void
  copyFolder: (id: string) => void
  moveFile: (id: string, newFolderId: string) => void
  updateFileContent: (id: string, content: string) => void
  addFileTag: (fileId: string, tag: string) => { ok: boolean; message?: string }
  removeFileTag: (fileId: string, tag: string) => void

  setActiveWorkspace: (id: string) => void
  setActiveFolder: (id: string) => void
  setActiveFile: (id: string | null) => void
  toggleFolderExpanded: (id: string) => void
  expandParentsOf: (folderId: string) => void

  persist: () => Promise<void>
}

type Store = WorkspaceStoreState & WorkspaceStoreActions

export const useWorkspaceStore = create<Store>((set, get) => ({
  workspaces: [],
  folders: [],
  files: [],
  activeWorkspaceId: null,
  activeFolderId: null,
  activeFileId: null,
  expandedFolderIds: new Set<string>(),
  isLoaded: false,

  initialize: async () => {
    try {
      const [workspaces, folders, files] = await Promise.all([
        getAllWorkspaces(),
        getAllFolders(),
        getAllFiles(),
      ])
      set({ workspaces, folders, files, isLoaded: true })
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err)
      set({ isLoaded: true })
    }
  },

  createWorkspace: (name) => {
    const now = Date.now()
    const ws: Workspace = { id: uuid(), name, createdAt: now, updatedAt: now }
    set((s) => ({ workspaces: [...s.workspaces, ws] }))
    putWorkspace(ws).catch(console.error)
    return ws.id
  },

  renameWorkspace: (id, name) => {
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, name, updatedAt: Date.now() } : w)),
    }))
    const ws = get().workspaces.find((w) => w.id === id)
    if (ws) putWorkspace(ws).catch(console.error)
  },

  deleteWorkspace: (id) => {
    set((s) => {
      const folderIds = s.folders.filter((f) => f.workspaceId === id).map((f) => f.id)
      const childFolderIds = new Set<string>(folderIds)
      const stack = [...folderIds]
      while (stack.length) {
        const fid = stack.pop()!
        const children = s.folders.filter((f) => f.parentId === fid)
        for (const c of children) {
          childFolderIds.add(c.id)
          stack.push(c.id)
        }
      }
      return {
        workspaces: s.workspaces.filter((w) => w.id !== id),
        folders: s.folders.filter((f) => f.workspaceId !== id),
        files: s.files.filter((f) => !childFolderIds.has(f.folderId) && !folderIds.includes(f.folderId)),
        activeWorkspaceId: s.activeWorkspaceId === id ? null : s.activeWorkspaceId,
        activeFolderId: s.activeFolderId && childFolderIds.has(s.activeFolderId) ? null : s.activeFolderId,
        activeFileId: null,
      }
    })
    dbDeleteWorkspace(id).catch(console.error)
  },

  createFolder: (workspaceId, name, parentId = null) => {
    const now = Date.now()
    const folder: Folder = {
      id: uuid(), workspaceId, parentId: parentId ?? null, name,
      sortOrder: 0, createdAt: now, updatedAt: now,
    }
    set((s) => ({ folders: [...s.folders, folder] }))
    if (parentId) get().expandParentsOf(parentId)
    putFolder(folder).catch(console.error)
    return folder.id
  },

  renameFolder: (id, name) => {
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, name, updatedAt: Date.now() } : f)),
    }))
    const folder = get().folders.find((f) => f.id === id)
    if (folder) putFolder(folder).catch(console.error)
  },

  deleteFolder: (id) => {
    set((s) => {
      const toDelete = new Set<string>([id])
      const stack = [id]
      while (stack.length) {
        const fid = stack.pop()!
        const children = s.folders.filter((f) => f.parentId === fid)
        for (const c of children) {
          toDelete.add(c.id)
          stack.push(c.id)
        }
      }
      return {
        folders: s.folders.filter((f) => !toDelete.has(f.id)),
        files: s.files.filter((f) => !toDelete.has(f.folderId)),
        activeFolderId: toDelete.has(s.activeFolderId ?? '') ? null : s.activeFolderId,
        activeFileId: null,
      }
    })
    dbDeleteFolder(id).catch(console.error)
  },

  moveFolder: (id, newParentId) => {
    set((s) => ({
      folders: s.folders.map((f) =>
        f.id === id ? { ...f, parentId: newParentId, updatedAt: Date.now() } : f,
      ),
    }))
    const folder = get().folders.find((f) => f.id === id)
    if (folder) putFolder(folder).catch(console.error)
  },

  createFile: (folderId, name, type, language = 'plaintext') => {
    const now = Date.now()
    // Auto-detect type from extension: .md → markdown, everything else → text
    const dotIdx = name.lastIndexOf('.')
    const ext = dotIdx > 0 ? name.substring(dotIdx + 1).toLowerCase() : ''
    const detectedType = ext === 'md' ? 'markdown' : 'text'
    const detectedLang = ext === 'md' ? 'markdown' : 'plaintext'
    const file: SnippetFile = {
      id: uuid(), folderId, name, type: detectedType, language: detectedLang,
      content: '', tags: [], sortOrder: 0,
      createdAt: now, updatedAt: now,
    }
    set((s) => ({
      files: [...s.files, file],
      activeFileId: file.id,
    }))
    get().expandParentsOf(folderId)
    dbPutFile(file).catch(console.error)
    return file.id
  },

  renameFile: (id, name) => {
    set((s) => {
      const file = s.files.find((f) => f.id === id)
      if (!file) return s
      // Auto-detect type from extension: .md → markdown, else text
      const dotIdx = name.lastIndexOf('.')
      const ext = dotIdx > 0 ? name.substring(dotIdx + 1).toLowerCase() : ''
      const newType = ext === 'md' ? 'markdown' : 'text'
      const newLang = ext === 'md' ? 'markdown' : 'plaintext'
      return {
        files: s.files.map((f) =>
          f.id === id ? { ...f, name, type: newType, language: newLang, updatedAt: Date.now() } : f,
        ),
      }
    })
    const file = get().files.find((f) => f.id === id)
    if (file) dbPutFile(file).catch(console.error)
  },

  deleteFile: (id) => {
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      activeFileId: s.activeFileId === id ? null : s.activeFileId,
    }))
    dbDeleteFile(id).catch(console.error)
  },

  copyFile: (id) => {
    const { files } = get()
    const source = files.find((f) => f.id === id)
    if (!source) return
    const now = Date.now()
    const newFile: SnippetFile = {
      ...source,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
      tags: [...source.tags],
    }
    set((s) => ({ files: [...s.files, newFile] }))
    dbPutFile(newFile).catch(console.error)
  },

  copyFolder: (id) => {
    const { folders, files: allFiles } = get()
    const source = folders.find((f) => f.id === id)
    if (!source) return

    const now = Date.now()
    const idMap = new Map<string, string>()

    // Recursively collect all descendant folders
    const collectDescendants = (parentId: string): Folder[] => {
      const result: Folder[] = []
      for (const cf of folders) {
        if (cf.parentId === parentId) {
          result.push(cf)
          result.push(...collectDescendants(cf.id))
        }
      }
      return result
    }
    const allDescendants = collectDescendants(id)

    // Map old IDs to new IDs
    const newId = uuid()
    idMap.set(id, newId)

    const newFolders: Folder[] = [{
      ...source,
      id: newId,
      createdAt: now,
      updatedAt: now,
    }]

    for (const df of allDescendants) {
      const nid = uuid()
      idMap.set(df.id, nid)
      newFolders.push({
        ...df,
        id: nid,
        parentId: idMap.get(df.parentId!) ?? newId,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Copy all files in copied folders
    const copiedFolderIds = new Set([id, ...allDescendants.map((d) => d.id)])
    const newFiles: SnippetFile[] = []
    for (const file of allFiles) {
      if (copiedFolderIds.has(file.folderId)) {
        newFiles.push({
          ...file,
          id: uuid(),
          folderId: idMap.get(file.folderId) ?? file.folderId,
          tags: [...file.tags],
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    set((s) => ({
      folders: [...s.folders, ...newFolders],
      files: [...s.files, ...newFiles],
    }))

    Promise.all([
      ...newFolders.map((f) => putFolder(f)),
      ...newFiles.map((f) => dbPutFile(f)),
    ]).catch(console.error)
  },

  moveFile: (id, newFolderId) => {
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id ? { ...f, folderId: newFolderId, updatedAt: Date.now() } : f,
      ),
    }))
    const file = get().files.find((f) => f.id === id)
    if (file) dbPutFile(file).catch(console.error)
  },

  updateFileContent: (id, content) => {
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, content, updatedAt: Date.now() } : f)),
    }))
  },

  addFileTag: (fileId, tag) => {
    const normalized = tag.toLowerCase().trim()
    if (!normalized) return { ok: false, message: 'Tag cannot be empty' }
    const { files } = get()
    const file = files.find((f) => f.id === fileId)
    if (!file) return { ok: false, message: 'File not found' }
    if (file.tags.includes(normalized)) return { ok: false, message: 'Tag already exists' }
    if (file.tags.length >= MAX_TAGS_PER_FILE) return { ok: false, message: `Maximum ${MAX_TAGS_PER_FILE} tags` }
    set((s) => ({
      files: s.files.map((f) =>
        f.id === fileId ? { ...f, tags: [...f.tags, normalized], updatedAt: Date.now() } : f,
      ),
    }))
    return { ok: true }
  },

  removeFileTag: (fileId, tag) => {
    set((s) => ({
      files: s.files.map((f) =>
        f.id === fileId ? { ...f, tags: f.tags.filter((t) => t !== tag), updatedAt: Date.now() } : f,
      ),
    }))
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id, activeFolderId: null, activeFileId: null }),
  setActiveFolder: (id) => set({ activeFolderId: id, activeFileId: null }),
  setActiveFile: (id) => set({ activeFileId: id }),

  toggleFolderExpanded: (id) => {
    const expanded = new Set(get().expandedFolderIds)
    if (expanded.has(id)) expanded.delete(id)
    else expanded.add(id)
    set({ expandedFolderIds: expanded })
  },

  expandParentsOf: (folderId) => {
    const { folders } = get()
    const expanded = new Set(get().expandedFolderIds)
    expanded.add(folderId)
    let current = folders.find((f) => f.id === folderId)
    while (current?.parentId) {
      expanded.add(current.parentId)
      current = folders.find((f) => f.id === current!.parentId)
    }
    set({ expandedFolderIds: expanded })
  },

  persist: async () => {
    try {
      await persistAll(get().workspaces, get().folders, get().files)
    } catch (err) {
      console.error('Failed to persist data:', err)
    }
  },
}))
