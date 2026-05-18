import { useState, useCallback, useRef, useEffect } from 'react'

interface UploadedImage {
  path: string
  url: string
}

interface ImagePathViewerProps {
  images: UploadedImage[]
}

export default function ImagePathViewer({ images }: ImagePathViewerProps) {
  const [open, setOpen] = useState(false)
  const [copiedPath, setCopiedPath] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const copyPath = useCallback(async (path: string) => {
    try {
      await navigator.clipboard.writeText(path)
      setCopiedPath(path)
      setTimeout(() => setCopiedPath(null), 1000)
    } catch {}
  }, [])

  if (images.length === 0) return null

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 text-2xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="View uploaded image paths"
      >
        Imgs
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 z-50 bg-white dark:bg-gray-800 border border-border dark:border-border-dark rounded shadow-lg p-2 min-w-[200px] max-w-[320px]">
          <div className="text-2xs text-gray-500 mb-1.5">
            {images.length} uploaded image{images.length > 1 ? 's' : ''}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto">
            {images.map((img, idx) => (
              <div key={idx} className="relative group flex flex-col items-center">
                <img
                  src={img.url}
                  alt={img.path}
                  className="w-[60px] h-[60px] object-cover rounded cursor-pointer hover:ring-2 hover:ring-accent/50"
                  onClick={() => copyPath(img.path)}
                  title={img.path}
                />
                <span
                  className="text-2xs text-gray-400 cursor-pointer hover:text-accent max-w-[60px] truncate mt-0.5"
                  onClick={() => copyPath(img.path)}
                  title={img.path}
                >
                  {img.path.split('/').pop()}
                </span>
                {copiedPath === img.path && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xs px-1 py-0.5 rounded bg-green-500 text-white whitespace-nowrap">
                    Copied
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
