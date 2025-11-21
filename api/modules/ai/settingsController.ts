import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../../config/supabase.js'
import { ok } from '../../core/response.js'
import { AppError } from '../../core/app-error.js'
import { z } from 'zod'

export async function getProjectAiSettings(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
  const projectId = req.params.id
  const { data: project, error: projErr } = await supabase.from('projects').select('id, owner_id').eq('id', projectId).single()
  if (projErr || !project) throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404)
  if (project.owner_id !== user.id) throw new AppError('FORBIDDEN', 'Access denied', 403)
  const { data: settings } = await supabase.from('project_ai_settings').select('*').eq('project_id', projectId).single()
  const result = settings
    ? {
        provider: settings.provider || 'openai',
        model: settings.model || 'gpt-4o-mini',
        costPreference: settings.cost_preference || 'balanced',
        latencyPreference: settings.latency_preference || 'balanced',
      }
    : { provider: 'openai', model: 'gpt-4o-mini', costPreference: 'balanced', latencyPreference: 'balanced' }
  return ok(res, result)
}

const bodySchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  costPreference: z.enum(['low', 'balanced', 'best_quality']),
  latencyPreference: z.enum(['low', 'balanced', 'ok_with_slow']),
})

export async function upsertProjectAiSettings(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
  const projectId = req.params.id
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid body', 400, parsed.error.flatten())
  const { data: project, error: projErr } = await supabase.from('projects').select('id, owner_id').eq('id', projectId).single()
  if (projErr || !project) throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404)
  if (project.owner_id !== user.id) throw new AppError('FORBIDDEN', 'Access denied', 403)
  const payload = {
    project_id: projectId,
    provider: parsed.data.provider,
    model: parsed.data.model,
    cost_preference: parsed.data.costPreference,
    latency_preference: parsed.data.latencyPreference,
    updated_at: new Date().toISOString(),
  }
  // upsert behavior: try update, if 0 rows then insert
  const { data: existing } = await supabase.from('project_ai_settings').select('project_id').eq('project_id', projectId).single()
  if (existing) {
    const { error: updErr } = await supabase.from('project_ai_settings').update(payload).eq('project_id', projectId)
    if (updErr) throw new AppError('AI_SETTINGS_UPDATE_FAILED', 'Failed to update settings', 500, updErr)
  } else {
    const { error: insErr } = await supabase.from('project_ai_settings').insert({ ...payload, created_at: new Date().toISOString() })
    if (insErr) throw new AppError('AI_SETTINGS_INSERT_FAILED', 'Failed to insert settings', 500, insErr)
  }
  return ok(res, {
    provider: payload.provider,
    model: payload.model,
    costPreference: payload.cost_preference,
    latencyPreference: payload.latency_preference,
  })
}