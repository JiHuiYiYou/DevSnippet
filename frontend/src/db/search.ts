import type { SnippetFile, Folder, Workspace } from '@/types/core'
import type { SearchResult, SearchMode } from '@/types/search'

export function searchFiles(
  query: string,
  mode: SearchMode,
  files: SnippetFile[],
  folders: Folder[],
  workspaces: Workspace[],
): SearchResult[] {
  const q = query.toLowerCase()
  const results: SearchResult[] = []

  const workspaceMap = new Map(workspaces.map((w) => [w.id, w]))
  const folderMap = new Map(folders.map((f) => [f.id, f]))

  function getBreadcrumb(folderId: string): { workspaceName: string; folderNames: string[] } {
    const folderNames: string[] = []
    let currentId: string | null = folderId
    let workspaceId = ''

    while (currentId) {
      const folder = folderMap.get(currentId)
      if (!folder) break
      folderNames.unshift(folder.name)
      workspaceId = folder.workspaceId
      currentId = folder.parentId
    }

    const workspace = workspaceMap.get(workspaceId)
    return {
      workspaceName: workspace?.name ?? 'Unknown',
      folderNames,
    }
  }

  for (const file of files) {
    let matched = false
    let matchType: SearchResult['matchType'] = 'filename'
    let matchContext: string | undefined
    let matchLine: number | undefined

    if (mode === 'filename') {
      matched = file.name.toLowerCase().includes(q)
    } else if (mode === 'tag') {
      matched = file.tags.some((tag) => tag.toLowerCase().includes(q))
      matchType = 'tag'
    } else if (mode === 'fulltext') {
      const content = file.content
      if (file.name.toLowerCase().includes(q)) {
        matched = true
        matchType = 'filename'
      } else {
        const idx = content.toLowerCase().indexOf(q)
        if (idx !== -1) {
          matched = true
          matchType = 'content'
          const lineNumber = content.substring(0, idx).split('\n').length
          matchLine = lineNumber
          const lines = content.split('\n')
          const startLine = Math.max(0, lineNumber - 2)
          const endLine = Math.min(lines.length, lineNumber + 2)
          matchContext = lines.slice(startLine, endLine).join('\n')
        }
      }
    }

    if (matched) {
      results.push({
        type: 'file',
        fileId: file.id,
        fileName: file.name,
        matchType,
        matchContext,
        matchLine,
        breadcrumb: getBreadcrumb(file.folderId),
      })
    }
  }

  return results
}

export function filenameSearch(
  query: string,
  files: SnippetFile[],
): SnippetFile[] {
  const q = query.toLowerCase()
  return files.filter(
    (f) =>
      f.name.toLowerCase().startsWith(q) ||
      f.name.toLowerCase().includes(q),
  )
}
