import type { Request, Response, NextFunction } from 'express'
import { ok } from '../../../core/response.js'
import { AppError } from '../../../core/app-error.js'
import { z } from 'zod'
import { computeProjectOptimizationSuggestion } from './optimizerService.js'
import { supabase } from '../../../config/supabase.js'

const bodySchema = z.object({
  goal: z.enum(['min_cost', 'min_latency', 'balanced']),
  apply: z.boolean().optional(),
})

export async function optimizeProject(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  const projectId = req.params.id
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) throw new AppError('INVALID_REQUEST', 'Invalid optimization request body', 400, parsed.error.flatten())
  const { goal, apply } = parsed.data
  const suggestion = await computeProjectOptimizationSuggestion(user.id, projectId, { goal })
  if (!suggestion) return ok(res, { suggestion: null })
  if (apply) {
    const { data, error } = await supabase
      .from('project_ai_settings')
      .upsert({
        project_id: projectId,
        provider: suggestion.suggested.provider,
        model: suggestion.suggested.model,
        cost_preference: suggestion.suggested.costPreference,
        latency_preference: suggestion.suggested.latencyPreference,
      }, { onConflict: 'project_id' })
    if (error) throw error
    return ok(res, { suggestion, applied: true })
  }
  return ok(res, { suggestion, applied: false })
}