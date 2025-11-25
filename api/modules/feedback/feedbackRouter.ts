import { Router, Response, NextFunction } from 'express'
import { feedbackService } from './feedbackService.js'
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../../middleware/auth.js'
import { z } from 'zod'
import { logger } from '../../core/logger.js'

const router = Router()

// Validation schemas
const submitFeedbackSchema = z.object({
    agentRunId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
})

/**
 * POST /api/feedback
 * Submit feedback for an agent run
 */
router.post('/', requireAuth, async (req: any, res: Response, next: NextFunction) => {
    try {
        const { agentRunId, rating, comment } = submitFeedbackSchema.parse(req.body)
        const userId = (req as AuthenticatedRequest).user!.id

        const feedback = await feedbackService.submitFeedback({
            agentRunId,
            userId,
            rating,
            comment
        })

        res.status(201).json({
            success: true,
            data: feedback
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input',
                    details: error.errors
                }
            })
        } else {
            next(error)
        }
    }
})

/**
 * GET /api/feedback/:runId
 * Get feedback for a specific run
 */
router.get('/:runId', requireAuth, async (req: any, res: Response, next: NextFunction) => {
    try {
        const { runId } = req.params
        const feedback = await feedbackService.getFeedbackForRun(runId)

        if (!feedback) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Feedback not found'
                }
            })
            return
        }

        // Check ownership (optional, depending on requirements)
        if (feedback.userId !== (req as AuthenticatedRequest).user!.id) {
            // Allow if user is admin or project owner (simplified for now)
            // For now, strict ownership check
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied'
                }
            })
            return
        }

        res.json({
            success: true,
            data: feedback
        })
    } catch (error) {
        next(error)
    }
})

export default router
