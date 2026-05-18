import type { Workspace, Folder, SnippetFile } from '@/types/core'
import { getDB } from './schema'

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// --- Workspace CRUD ---

export async function getAllWorkspaces(): Promise<Workspace[]> {
  const db = await getDB()
  return promisify(db.transaction('workspaces', 'readonly').objectStore('workspaces').getAll())
}

export async function putWorkspace(ws: Workspace): Promise<void> {
  const db = await getDB()
  await promisify(db.transaction('workspaces', 'readwrite').objectStore('workspaces').put(ws))
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await getDB()
  await promisify(db.transaction('workspaces', 'readwrite').objectStore('workspaces').delete(id))
}

// --- Folder CRUD ---

export async function getAllFolders(): Promise<Folder[]> {
  const db = await getDB()
  return promisify(db.transaction('folders', 'readonly').objectStore('folders').getAll())
}

export async function putFolder(folder: Folder): Promise<void> {
  const db = await getDB()
  await promisify(db.transaction('folders', 'readwrite').objectStore('folders').put(folder))
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDB()
  await promisify(db.transaction('folders', 'readwrite').objectStore('folders').delete(id))
}

// --- File CRUD ---

export async function getAllFiles(): Promise<SnippetFile[]> {
  const db = await getDB()
  return promisify(db.transaction('files', 'readonly').objectStore('files').getAll())
}

export async function putFile(file: SnippetFile): Promise<void> {
  const db = await getDB()
  await promisify(db.transaction('files', 'readwrite').objectStore('files').put(file))
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB()
  await promisify(db.transaction('files', 'readwrite').objectStore('files').delete(id))
}

// --- Bulk operations ---

export async function persistAll(
  workspaces: Workspace[],
  folders: Folder[],
  files: SnippetFile[],
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['workspaces', 'folders', 'files'], 'readwrite')

  const wsStore = tx.objectStore('workspaces')
  const fStore = tx.objectStore('folders')
  const fileStore = tx.objectStore('files')

  await Promise.all([
    promisify(wsStore.clear()).then(() =>
      Promise.all(workspaces.map((w) => promisify(wsStore.put(w)))),
    ),
    promisify(fStore.clear()).then(() =>
      Promise.all(folders.map((f) => promisify(fStore.put(f)))),
    ),
    promisify(fileStore.clear()).then(() =>
      Promise.all(files.map((f) => promisify(fileStore.put(f)))),
    ),
  ])

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
