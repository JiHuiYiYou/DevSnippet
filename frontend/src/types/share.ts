export type ShareScope = 'file' | 'folder' | 'workspace'

export interface ShareConfig {
  entityType: ShareScope
  entityId: string
  password?: string
  expiresInHours?: number
  readonly?: boolean
}

export interface ShareLinkResponse {
  token: string
  url: string
  expiresAt: number | null
  createdAt: number
}
