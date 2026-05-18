import { useEffect, useRef } from 'react'
import { useUIStore } from '@/stores/useUIStore'

export default function ContextMenu() {
  const menu = useUIStore((s) => s.contextMenu)
  const hideContextMenu = useUIStore((s) => s.hideContextMenu)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        hideContextMenu()
      }
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideContextMenu()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [menu, hideContextMenu])

  if (!menu) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[140px] bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded shadow-lg py-1 text-xs"
      style={{ left: menu.x, top: menu.y }}
    >
      {menu.items.map((item, i) => (
        <div key={i}>
          {item.divider && <div className="my-1 border-t border-border dark:border-border-dark" />}
          <button
            onClick={() => {
              item.action()
              hideContextMenu()
            }}
            className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              item.danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : ''
            }`}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}
