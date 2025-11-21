import type { Request, Response, NextFunction } from 'express'
import { ok } from '../../core/response.js'
import { routeAiRequest } from './aiRouter.js'

export async function complete(req: Request, res: Response, _next: NextFunction) {
  const { taskType, prompt, context, preferences, projectId } = req.body
  const user = (req as any).user
  const result = await routeAiRequest({ taskType, prompt, context, preferences, userId: user?.id, projectId })
  return ok(res, { provider: result.provider, model: result.model, text: result.text, usage: result.usage })
}