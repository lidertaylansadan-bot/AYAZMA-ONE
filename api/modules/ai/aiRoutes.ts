import { Router } from 'express'
import { validateBody } from '../../core/validate.js'
import { z } from 'zod'
import * as aiController from './aiController.js'

const aiRequestSchema = z.object({
  taskType: z.enum(['generic_chat', 'app_spec_suggestion', 'feature_brainstorm', 'workflow_suggestion', 'marketing_copy']),
  prompt: z.string().min(1),
  context: z.record(z.any()).optional(),
  preferences: z
    .object({
      costPreference: z.enum(['low', 'balanced', 'best_quality']).optional(),
      latencyPreference: z.enum(['low', 'balanced', 'ok_with_slow']).optional(),
    })
    .optional(),
  projectId: z.string().uuid().optional(),
})

const router = Router()

router.post('/complete', validateBody(aiRequestSchema), aiController.complete)

export default router