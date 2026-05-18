import { useState, useCallback, useRef } from 'react'
import { useUIStore } from '@/stores/useUIStore'

interface ImageDropZoneProps {
  onImageUploaded?: (url: string) => void
}

export default function ImageDropZone({ onImageUploaded }: ImageDropZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const showToast = useUIStore((s) => s.showToast)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        showToast('Only image files are supported', 'error')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image must be under 10MB', 'error')
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const resp = await fetch('http://localhost:8000/api/upload-image', {
          method: 'POST',
          body: formData,
        })
        if (!resp.ok) {
          const err = await resp.json()
          showToast(err.detail || 'Upload failed', 'error')
          return
        }
        const data = await resp.json()
        if (data.ok && data.url) {
          const md = `![${file.name}](${data.url})`
          await navigator.clipboard.writeText(md)
          showToast('Image uploaded — markdown syntax copied!', 'success')
          setCopiedUrl(data.url)
          onImageUploaded?.(data.url)
        }
      } catch {
        showToast('Upload failed — is the backend running?', 'error')
      } finally {
        setUploading(false)
      }
    },
    [showToast, onImageUploaded],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      const files = e.dataTransfer.files
      if (files.length > 0) {
        uploadFile(files[0])
      }
    },
    [uploadFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        uploadFile(files[0])
      }
      if (inputRef.current) inputRef.current.value = ''
    },
    [uploadFile],
  )

  return (
    <div className="border-t border-border dark:border-border-dark px-2 py-1.5">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center justify-center gap-1.5 text-2xs rounded border border-dashed cursor-pointer transition-colors px-2 py-1.5 ${
          dragOver
            ? 'border-accent bg-accent/5 text-accent'
            : 'border-gray-300 dark:border-gray-700 text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploading ? (
          <span>Uploading...</span>
        ) : dragOver ? (
          <span>Drop image here</span>
        ) : copiedUrl ? (
          <span className="text-green-500 truncate max-w-[180px]">
            {copiedUrl} ✓ Copied MD
          </span>
        ) : (
          <span>Drop image here or click (uploads to /images/)</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
