import { Router } from 'express'
import * as contentController from './controller.js'
import { validateBody } from '../../core/validate.js'
import { z } from 'zod'

const router = Router()

const genSchema = z.object({
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

router.post('/projects/:projectId/content/plan/generate', validateBody(genSchema), contentController.generatePlan)
router.get('/projects/:projectId/content/plans', contentController.listPlans)
router.get('/projects/:projectId/content/plans/:planId/items', contentController.listItemsForPlanHandler)
router.patch('/content/items/:id', validateBody(updateItemSchema), contentController.updateItem)

export default router