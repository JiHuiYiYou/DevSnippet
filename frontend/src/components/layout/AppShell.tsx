import { useUIStore } from '@/stores/useUIStore'
import TitleBar from './TitleBar'
import Sidebar from './Sidebar'
import MainContent from './MainContent'
import GlobalSearchDialog from '@/components/search/GlobalSearchDialog'
import ShareDialog from '@/components/share/ShareDialog'
import Toast from '@/components/common/Toast'
import ContextMenu from '@/components/common/ContextMenu'

export default function AppShell() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  return (
    <div className="h-screen flex flex-col bg-surface dark:bg-surface-dark">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {!sidebarCollapsed && <Sidebar />}
        <MainContent />
      </div>
      <GlobalSearchDialog />
      <ShareDialog />
      <Toast />
      <ContextMenu />
    </div>
  )
}
