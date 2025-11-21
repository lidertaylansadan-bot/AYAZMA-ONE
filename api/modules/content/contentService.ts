import { supabase } from '../../config/supabase.js'
import { routeAiRequest } from '../ai/aiRouter.js'
import type { ContentPlan, ContentItem } from './types.js'

export async function createPlanWithItems(userId: string, projectId: string, params: { title?: string; description?: string; timeframe?: string; goal?: string }) {
  const { data: projectRows, error: projErr } = await supabase.from('projects').select('*').eq('id', projectId).limit(1)
  if (projErr) throw projErr
  const project = (projectRows || [])[0]
  const prompt = buildPrompt(project, params)
  const result = await routeAiRequest({ taskType: 'marketing_copy', prompt, userId, projectId })
  let parsed: any = null
  try {
    parsed = JSON.parse(result.text)
  } catch {
    parsed = fallbackParsed(params)
  }
  const planTitle = params.title || parsed.plan_title || 'Content Plan'
  const planDescription = params.description || parsed.plan_description || ''
  const timeframe = params.timeframe || parsed.timeframe || ''
  const { data: planIns, error: planErr } = await supabase.from('content_plans').insert({ project_id: projectId, title: planTitle, description: planDescription, timeframe }).select('*').limit(1)
  if (planErr) throw planErr
  const planRow = (planIns || [])[0]
  const items: ContentItem[] = []
  const now = new Date()
  for (const it of parsed.items || []) {
    const publishDate = it.publish_offset_days ? new Date(now.getTime() + Number(it.publish_offset_days) * 86400000).toISOString() : null
    const { data: itemIns, error: itemErr } = await supabase.from('content_items').insert({
      plan_id: planRow.id,
      project_id: projectId,
      channel: it.channel || 'blog',
      format: it.format || null,
      title: it.title || 'Untitled',
      description: it.description || null,
      copy: it.copy || null,
      status: 'draft',
      publish_date: publishDate,
      meta: it.meta || null,
    }).select('*').limit(1)
    if (itemErr) throw itemErr
    const itemRow = (itemIns || [])[0]
    items.push(mapItem(itemRow))
  }
  return { plan: mapPlan(planRow), items }
}

export async function listPlansForProject(userId: string, projectId: string): Promise<ContentPlan[]> {
  const { data, error } = await supabase.from('content_plans').select('*').eq('project_id', projectId)
  if (error) throw error
  return (data || []).map(mapPlan)
}

export async function listItemsForPlan(userId: string, projectId: string, planId: string): Promise<ContentItem[]> {
  const { data, error } = await supabase.from('content_items').select('*').eq('project_id', projectId).eq('plan_id', planId)
  if (error) throw error
  return (data || []).map(mapItem)
}

export async function updateContentItem(userId: string, itemId: string, patch: Partial<{ title: string; description: string; copy: string; status: string; publishDate: string | null }>): Promise<ContentItem> {
  const payload: any = {}
  if ('title' in patch) payload.title = patch.title
  if ('description' in patch) payload.description = patch.description
  if ('copy' in patch) payload.copy = patch.copy
  if ('status' in patch) payload.status = patch.status
  if ('publishDate' in patch) payload.publish_date = patch.publishDate
  const { data, error } = await supabase.from('content_items').update(payload).eq('id', itemId).select('*').limit(1)
  if (error) throw error
  const row = (data || [])[0]
  return mapItem(row)
}

function mapPlan(row: any): ContentPlan {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description || undefined,
    timeframe: row.timeframe || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapItem(row: any): ContentItem {
  return {
    id: row.id,
    planId: row.plan_id,
    projectId: row.project_id,
    channel: row.channel,
    format: row.format || undefined,
    title: row.title,
    description: row.description || undefined,
    copy: row.copy || undefined,
    status: row.status,
    publishDate: row.publish_date || null,
    meta: row.meta || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function buildPrompt(project: any, params: any) {
  const pName = project?.name || ''
  const pSector = project?.sector || ''
  const timeframe = params?.timeframe || 'next_30_days'
  const goal = params?.goal || 'general'
  const desc = params?.description || ''
  return `Generate a structured JSON content plan for project ${pName} in sector ${pSector}. Timeframe: ${timeframe}. Goal: ${goal}. Description: ${desc}. Return fields: plan_title, plan_description, items[]. Each item: channel, format, title, description, copy, publish_offset_days.`
}

function fallbackParsed(params: any) {
  return {
    plan_title: params?.title || 'Content Plan',
    plan_description: params?.description || '',
    timeframe: params?.timeframe || 'next_30_days',
    items: [
      { channel: 'blog', format: 'article', title: 'Kickoff Post', description: 'Introduce the project', copy: '...', publish_offset_days: 2 },
      { channel: 'x', format: 'thread', title: 'Launch Thread', description: 'Key features', copy: '...', publish_offset_days: 5 },
    ],
  }
}