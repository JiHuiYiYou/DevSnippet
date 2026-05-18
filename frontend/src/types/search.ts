export type SearchMode = 'filename' | 'tag' | 'fulltext'

export interface SearchResult {
  type: 'file'
  fileId: string
  fileName: string
  matchType: 'filename' | 'tag' | 'content'
  matchContext?: string
  matchLine?: number
  breadcrumb: {
    workspaceName: string
    folderNames: string[]
  }
}
