import { Router } from 'express'
import * as telemetryController from './controller.js'

const router = Router()

router.get('/ai/summary', telemetryController.getAiSummary)
router.get('/agents/summary', telemetryController.getAgentsSummary)

export default router