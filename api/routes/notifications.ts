/**
 * Notification API Routes
 */

import { Router } from 'express'
import { notificationService } from '../modules/notifications/NotificationService.js'

const router = Router()

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' })
        }

        const { limit, unreadOnly } = req.query

        const notifications = await notificationService.getUserNotifications(
            userId,
            limit ? parseInt(limit as string) : 50,
            unreadOnly === 'true'
        )

        res.json({ success: true, data: notifications })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', async (req, res, next) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' })
        }

        const count = await notificationService.getUnreadCount(userId)

        res.json({ success: true, data: { count } })
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req, res, next) => {
    try {
        const { id } = req.params

        await notificationService.markAsRead(id)

        res.json({ success: true })
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res, next) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' })
        }

        await notificationService.markAllAsRead(userId)

        res.json({ success: true })
    } catch (error) {
        next(error)
    }
})

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params

        await notificationService.delete(id)

        res.json({ success: true })
    } catch (error) {
        next(error)
    }
})

export default router
