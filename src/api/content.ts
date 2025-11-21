import { apiFetch } from '../lib/apiClient'

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

export async function generateContentPlan(projectId: string, payload: { title?: string; description?: string; timeframe?: string; goal?: string }): Promise<{ plan: ContentPlan; items: ContentItem[] }> {
  return apiFetch(`/projects/${projectId}/content/plan/generate`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function listContentPlans(projectId: string): Promise<ContentPlan[]> {
  return apiFetch(`/projects/${projectId}/content/plans`)
}

export async function listContentItems(projectId: string, planId: string): Promise<ContentItem[]> {
  return apiFetch(`/projects/${projectId}/content/plans/${planId}/items`)
}

export async function updateContentItem(itemId: string, patch: Partial<Pick<ContentItem, 'title' | 'description' | 'copy' | 'status' | 'publishDate'>>): Promise<ContentItem> {
  return apiFetch(`/content/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(patch) })
}