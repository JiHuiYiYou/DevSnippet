import { useState } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { ShareScope, ShareLinkResponse } from '@/types/share'

interface UseShareLinkReturn {
  createShareLink: (
    entityType: ShareScope,
    entityId: string,
    password?: string,
    expiresInHours?: number,
  ) => Promise<ShareLinkResponse | null>
  loading: boolean
  error: string | null
}

export function useShareLink(): UseShareLinkReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shareServerUrl = useSettingsStore((s) => s.shareServerUrl)

  const createShareLink = async (
    entityType: ShareScope,
    entityId: string,
    password?: string,
    expiresInHours?: number,
  ): Promise<ShareLinkResponse | null> => {
    if (!shareServerUrl) {
      setError('Share server not configured')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${shareServerUrl}/api/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_data: { entityId },
          password,
          expires_in_hours: expiresInHours,
        }),
      })

      if (!response.ok) {
        const msg = await response.text()
        throw new Error(msg || 'Failed to create share link')
      }

      const result: ShareLinkResponse = await response.json()
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createShareLink, loading, error }
}
