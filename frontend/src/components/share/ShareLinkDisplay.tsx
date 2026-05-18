import { useState } from 'react'
import { useUIStore } from '@/stores/useUIStore'

interface Props {
  url: string
  onClose: () => void
}

export default function ShareLinkDisplay({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const showToast = useUIStore((s) => s.showToast)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      showToast('Link copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Failed to copy. Please select and copy manually.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        Your share link is ready. Anyone with this link can view the shared content.
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 px-2 py-1.5 text-xs rounded border border-border dark:border-border-dark bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
          onFocus={(e) => e.target.select()}
        />
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 text-xs rounded text-white transition-colors ${
            copied ? 'bg-emerald-500' : 'bg-accent hover:bg-accent-dark'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <button
        onClick={onClose}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Close
      </button>
    </div>
  )
}
