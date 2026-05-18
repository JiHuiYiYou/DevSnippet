import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useUIStore } from '@/stores/useUIStore'
import TabBar from './TabBar'
import EditorToolbar from '@/components/editor/EditorToolbar'
import EditorArea from '@/components/editor/EditorArea'
import EmptyState from '@/components/common/EmptyState'

export default function MainContent() {
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const activeFileId = useWorkspaceStore((s) => s.activeFileId)
  const files = useWorkspaceStore((s) => s.files)
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null
  const tabs = useUIStore((s) => s.tabs)

  if (workspaces.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <EmptyState
          title="Welcome to DevSnippet"
          description="A lightweight code snippet and idea storage tool for indie developers."
        />
      </main>
    )
  }

  if (!activeWorkspaceId) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <EmptyState
          title="No workspace selected"
          description="Click a workspace tab in the top bar to start browsing"
        />
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TabBar />
      {activeFile ? (
        <>
          <EditorToolbar />
          <EditorArea />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title={tabs.length === 0 ? 'No file selected' : 'Select a file tab'}
            description={tabs.length === 0 ? 'Select a file from the sidebar or right-click a folder to create one' : 'Click a tab above or close all tabs and select a file from the sidebar'}
          />
        </div>
      )}
    </main>
  )
}
