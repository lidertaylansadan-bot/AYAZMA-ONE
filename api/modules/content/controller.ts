import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ok } from '../../core/response.js'
import { AppError } from '../../core/app-error.js'
import { createPlanWithItems, listPlansForProject, listItemsForPlan, updateContentItem } from './contentService.js'

const generateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  timeframe: z.string().optional(),
  goal: z.enum(['awareness', 'launch', 'retention', 'general']).optional(),
})

const updateItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  copy: z.string().optional(),
  status: z.string().optional(),
  publishDate: z.string().nullable().optional(),
})

export async function generatePlan(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  const projectId = req.params.projectId
  const parsed = generateSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError('INVALID_REQUEST', 'Invalid body', 400, parsed.error.flatten())
  const result = await createPlanWithItems(user.id, projectId, parsed.data)
  return ok(res, result)
}

export async function listPlans(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  const projectId = req.params.projectId
  const plans = await listPlansForProject(user.id, projectId)
  return ok(res, plans)
}

export async function listItemsForPlanHandler(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  const projectId = req.params.projectId
  const planId = req.params.planId
  const items = await listItemsForPlan(user.id, projectId, planId)
  return ok(res, items)
}

export async function updateItem(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  const itemId = req.params.id
  const parsed = updateItemSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError('INVALID_REQUEST', 'Invalid body', 400, parsed.error.flatten())
  const item = await updateContentItem(user.id, itemId, parsed.data)
  return ok(res, item)
}