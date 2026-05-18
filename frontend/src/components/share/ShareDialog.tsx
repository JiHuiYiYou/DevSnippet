import { useState } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import Modal from '@/components/common/Modal'
import ShareLinkDisplay from './ShareLinkDisplay'
import type { ShareScope } from '@/types/share'

export default function ShareDialog() {
  const isOpen = useUIStore((s) => s.activeModal === 'share')
  const closeModal = useUIStore((s) => s.closeModal)
  const showToast = useUIStore((s) => s.showToast)
  const { activeFileId, activeFolderId, activeWorkspaceId, files, folders, workspaces } =
    useWorkspaceStore((s) => ({
      activeFileId: s.activeFileId,
      activeFolderId: s.activeFolderId,
      activeWorkspaceId: s.activeWorkspaceId,
      files: s.files,
      folders: s.folders,
      workspaces: s.workspaces,
    }))
  const activeFile = activeFileId ? files.find((f) => f.id === activeFileId) ?? null : null
  const activeFolder = activeFolderId ? folders.find((f) => f.id === activeFolderId) ?? null : null
  const activeWorkspace = activeWorkspaceId ? workspaces.find((w) => w.id === activeWorkspaceId) ?? null : null
  const shareServerUrl = useSettingsStore((s) => s.shareServerUrl)

  const [scope, setScope] = useState<ShareScope>('file')
  const [password, setPassword] = useState('')
  const [expiry, setExpiry] = useState<string>('24')
  const [readonly, setReadonly] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleShare = async () => {
    if (!shareServerUrl) {
      showToast('Share server not configured. Set server URL in settings.', 'error')
      return
    }

    setLoading(true)
    try {
      const entityId = scope === 'file'
        ? activeFile?.id
        : scope === 'folder'
        ? activeFolder?.id
        : activeWorkspace?.id

      if (!entityId) {
        showToast('No item selected to share', 'error')
        setLoading(false)
        return
      }

      const state = useWorkspaceStore.getState()

      let entityData: unknown
      if (scope === 'file') {
        entityData = state.files.find((f) => f.id === entityId)
      } else if (scope === 'folder') {
        const folder = state.folders.find((f) => f.id === entityId)
        const childFiles = state.files.filter((f) => f.folderId === entityId)
        entityData = { folder, files: childFiles }
      } else {
        entityData = { workspace: state.workspaces.find((w) => w.id === entityId) }
      }

      const response = await fetch(`${shareServerUrl}/api/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: scope,
          entity_data: entityData,
          password: password || undefined,
          expires_in_hours: expiry === 'never' ? undefined : parseInt(expiry),
          readonly,
        }),
      })

      if (!response.ok) throw new Error('Failed to create share link')

      const result = await response.json()
      // Build frontend share URL (opens React share view, not backend HTML page)
      const frontendShareUrl = `${window.location.origin}/share/${result.token}`
      setShareUrl(frontendShareUrl)
      showToast('Share link created!', 'success')
    } catch {
      showToast('Failed to create share link. Is the server running?', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    closeModal()
    setShareUrl(null)
  }

  const isAvailable = shareServerUrl && shareServerUrl.length > 0

  return (
    <Modal open={isOpen} onClose={handleClose} title="Share">
      {!isAvailable ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          <p>Share server is not configured.</p>
          <p className="text-xs mt-1">Set the share server URL in Settings to enable sharing.</p>
        </div>
      ) : shareUrl ? (
        <ShareLinkDisplay url={shareUrl} onClose={handleClose} />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Scope */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Share scope</label>
            <div className="flex gap-1">
              {(
                [
                  ['file', activeFile?.name ?? 'File'],
                  ['folder', activeFolder?.name ?? 'Folder'],
                  ['workspace', activeWorkspace?.name ?? 'Workspace'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setScope(val)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    scope === val
                      ? 'bg-accent/15 text-accent font-medium'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Password (optional)</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty for public access"
              className="w-full px-2 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Read-only */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={readonly}
                onChange={(e) => setReadonly(e.target.checked)}
                className="rounded border-border dark:border-border-dark accent-accent"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Read-only</span>
            </label>
            <p className="text-2xs text-gray-400 mt-0.5 ml-6">Viewers can only read, not select or copy content</p>
          </div>

          {/* Expiry */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Expires in</label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="1">1 hour</option>
              <option value="24">1 day</option>
              <option value="168">7 days</option>
              <option value="never">Never</option>
            </select>
          </div>

          <button
            onClick={handleShare}
            disabled={loading}
            className="w-full py-2 text-sm rounded bg-accent text-white hover:bg-accent-dark disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Generate Share Link'}
          </button>
        </div>
      )}
    </Modal>
  )
}
