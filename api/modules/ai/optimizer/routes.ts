import { Router } from 'express'
import { optimizeProject } from './optimizerController.js'
import { validateBody } from '../../../core/validate.js'
import { z } from 'zod'

const router = Router()

const schema = z.object({
  goal: z.enum(['min_cost', 'min_latency', 'balanced']),
  apply: z.boolean().optional(),
})

router.post('/project/:id', validateBody(schema), optimizeProject)

export default router