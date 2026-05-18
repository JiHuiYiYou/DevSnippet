import SearchBar from '@/components/sidebar/SearchBar'
import DirectoryTree from '@/components/sidebar/DirectoryTree'
import TagFilterBar from '@/components/sidebar/TagFilterBar'

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border dark:border-border-dark bg-panel dark:bg-panel-dark flex flex-col overflow-hidden">
      <SearchBar />
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <DirectoryTree />
      </div>
      <TagFilterBar />
    </aside>
  )
}
