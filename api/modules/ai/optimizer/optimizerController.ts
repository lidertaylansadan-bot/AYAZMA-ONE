import type { Request, Response, NextFunction } from 'express'
import { ok } from '../../../core/response.js'
import { AppError } from '../../../core/app-error.js'
import { z } from 'zod'
import { computeProjectOptimizationSuggestion, applyOptimizationSuggestion } from './optimizerService.js'

const bodySchema = z.object({
  goal: z.enum(['min_cost', 'min_latency', 'balanced']),
  apply: z.boolean().optional(),
})

export async function optimizeProject(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'Authentication required', 401)

  const projectId = req.params.id
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError('INVALID_REQUEST', 'Invalid optimization request body', 400, parsed.error.flatten())
  }

  const { goal, apply } = parsed.data
  const suggestion = await computeProjectOptimizationSuggestion(user.id, projectId, { goal })

  if (!suggestion) {
    return ok(res, { suggestion: null, message: 'No optimization suggestions available. Need more usage data.' })
  }

  if (apply) {
    await applyOptimizationSuggestion(user.id, projectId, suggestion, req)
    return ok(res, { suggestion, applied: true, message: 'Optimization applied successfully' })
  }

  return ok(res, { suggestion, applied: false })
}