import { Router } from 'express'
import { optimizeProject } from './optimizerController.js'
import { validateBody } from '../../../core/validate.js'
import { authenticateToken } from '../../../middleware/auth.js'
import { requireOwner } from '../../../middleware/roles.js'
import { z } from 'zod'

const router = Router()

const schema = z.object({
  goal: z.enum(['min_cost', 'min_latency', 'balanced']),
  apply: z.boolean().optional(),
})

router.post('/project/:id', authenticateToken, requireOwner, validateBody(schema), optimizeProject)

export default router