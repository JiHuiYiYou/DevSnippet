import { useEffect, lazy, Suspense } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import AppShell from '@/components/layout/AppShell'

const ShareView = lazy(() => import('@/components/share/ShareView'))

export default function App() {
  const initialize = useWorkspaceStore((s) => s.initialize)
  const isLoaded = useWorkspaceStore((s) => s.isLoaded)

  // Detect share route: /share/:shareId
  const isShareRoute = window.location.pathname.startsWith('/share/')

  useEffect(() => {
    // Skip IndexedDB initialization for share routes (data comes from API)
    if (!isShareRoute) {
      initialize()
    }
  }, [initialize, isShareRoute])

  // Global hooks — only for local mode (not share routes)
  const autoSave = useAutoSave()
  useKeyboardShortcuts()

  if (isShareRoute) {
    return (
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
          <p className="text-gray-400 text-sm">Loading shared content...</p>
        </div>
      }>
        <ShareView />
      </Suspense>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return <AppShell />
}
