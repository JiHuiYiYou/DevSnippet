import { useUIStore } from '@/stores/useUIStore'

const STYLES = {
  info: 'bg-gray-800 text-white',
  error: 'bg-red-600 text-white',
  success: 'bg-emerald-600 text-white',
}

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts)
  const dismissToast = useUIStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-3 py-2 rounded text-xs shadow-lg flex items-center gap-2 min-w-[200px] animate-[fadeIn_0.2s_ease] ${STYLES[toast.type]}`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="opacity-60 hover:opacity-100 shrink-0"
          >
            x
          </button>
        </div>
      ))}
    </div>
  )
}
