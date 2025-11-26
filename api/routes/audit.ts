/**
 * Audit API Routes
 * Endpoints for querying audit logs and activity history
 */

import { Router } from 'express'
import { auditService } from '../modules/audit/AuditService.js'
import { AppError } from '../core/app-error.js'

const router = Router()

/**
 * GET /api/audit/activities
 * Query activities with filters
 */
router.get('/activities', async (req, res, next) => {
    try {
        const {
            projectId,
            agentName,
            activityType,
            startDate,
            endDate,
            limit,
            offset
        } = req.query

        const activities = await auditService.queryActivities({
            projectId: projectId as string,
            agentName: agentName as string,
            activityType: activityType as any,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0
        })

        res.json({ success: true, data: activities })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/audit/runs/:projectId
 * Get run history for a project
 */
router.get('/runs/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params
        const { limit } = req.query

        const runs = await auditService.getRunHistory(
            projectId,
            limit ? parseInt(limit as string) : 50
        )

        res.json({ success: true, data: runs })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/audit/stats/:projectId
 * Get activity statistics for a project
 */
router.get('/stats/:projectId', async (req, res, next) => {
    try {
        const { projectId } = req.params
        const { days } = req.query

        const stats = await auditService.getActivityStats(
            projectId,
            days ? parseInt(days as string) : 30
        )

        res.json({ success: true, data: stats })
    } catch (error) {
        next(error)
    }
})

export default router
