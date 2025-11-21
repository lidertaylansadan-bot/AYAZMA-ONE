export type ContentChannel = 'youtube' | 'tiktok' | 'reels' | 'instagram' | 'x' | 'blog'

export interface ContentPlan {
  id: string
  projectId: string
  title: string
  description?: string
  timeframe?: string
  createdAt: string
  updatedAt: string
}

export interface ContentItem {
  id: string
  planId: string
  projectId: string
  channel: ContentChannel | string
  format?: string
  title: string
  description?: string
  copy?: string
  status: string
  publishDate?: string | null
  meta?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}