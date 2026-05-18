export type FileType = 'code' | 'markdown' | 'text'

export type CodeLanguage =
  | 'javascript' | 'typescript' | 'python' | 'go' | 'rust'
  | 'html' | 'css' | 'sql' | 'bash' | 'json' | 'yaml'
  | 'markdown' | 'plaintext'

export interface Workspace {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: string
  workspaceId: string
  parentId: string | null
  name: string
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export interface SnippetFile {
  id: string
  folderId: string
  name: string
  type: FileType
  language: CodeLanguage
  content: string
  tags: string[]
  sortOrder: number
  createdAt: number
  updatedAt: number
}
