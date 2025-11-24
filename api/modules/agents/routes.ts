import { Router } from 'express'
import { authenticateToken } from '../../middleware/auth.js'
import { validateBody } from '../../core/validate.js'
import { userHeavyRateLimiter } from '../../middleware/rateLimit.js'
import { z } from 'zod'
import * as controller from './controller.js'

const startSchema = z.object({
  agentName: z.enum(['design_spec', 'workflow_designer', 'content_strategist', 'orchestrator']),
  projectId: z.string().uuid().optional(),
  context: z
    .object({ wizardAnswers: z.record(z.any()).optional(), extra: z.record(z.any()).optional() })
    .optional(),
})

const router = Router()

router.post('/run', authenticateToken, userHeavyRateLimiter, validateBody(startSchema), controller.start)
router.get('/runs', authenticateToken, controller.list)
router.get('/runs/:id', authenticateToken, controller.detail)

export default router