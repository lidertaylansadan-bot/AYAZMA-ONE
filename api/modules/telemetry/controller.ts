import type { Request, Response, NextFunction } from 'express'
import { ok } from '../../core/response.js'
import { AppError } from '../../core/app-error.js'
import { getUserAiUsageSummary, getProjectAiUsageSummary, getAgentStats } from './analyticsService.js'

export async function getAiSummary(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined
  const days = req.query.days ? Number(req.query.days) : undefined
  if (projectId) {
    const summary = await getProjectAiUsageSummary(user.id, projectId, days)
    return ok(res, summary)
  } else {
    const summary = await getUserAiUsageSummary(user.id, days)
    return ok(res, summary)
  }
}

export async function getAgentsSummary(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined
  const stats = await getAgentStats(user.id, projectId)
  return ok(res, stats)
}