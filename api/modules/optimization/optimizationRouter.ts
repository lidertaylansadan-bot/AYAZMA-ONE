import { Router } from 'express'
import { costManager } from './costManager.js'
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js'
import { z } from 'zod'

export const optimizationRouter = Router()

optimizationRouter.get('/budget/:projectId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const { projectId } = req.params

        // Simple ownership check (should be more robust in production)
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

        const result = await costManager.checkBudget(projectId)
        res.json(result)
    } catch (error) {
        res.status(500).json({ error: 'Failed to check budget' })
    }
})

optimizationRouter.get('/recommendations/:projectId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const { projectId } = req.params
        const recommendations = await costManager.getRecommendations(projectId)
        res.json({ recommendations })
    } catch (error) {
        res.status(500).json({ error: 'Failed to get recommendations' })
    }
})
