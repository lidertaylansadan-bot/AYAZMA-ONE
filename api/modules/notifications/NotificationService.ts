/**
 * Notification Service
 * Handles creating and managing user notifications
 */

import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import type { CreateNotificationInput, Notification } from './types.js'

export class NotificationService {
    /**
     * Create a new notification
     */
    async create(input: CreateNotificationInput): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    user_id: input.userId,
                    title: input.title,
                    message: input.message,
                    type: input.type,
                    category: input.category,
                    action_url: input.actionUrl,
                    metadata: input.metadata
                })
                .select('id')
                .single()

            if (error) throw error

            logger.debug({ notificationId: data.id, userId: input.userId }, 'Notification created')
            return data.id
        } catch (error) {
            logger.error({ err: error, input }, 'Failed to create notification')
            throw error
        }
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId: string, limit = 50, unreadOnly = false): Promise<Notification[]> {
        try {
            let query = supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (unreadOnly) {
                query = query.eq('read', false)
            }

            const { data, error } = await query

            if (error) throw error

            return data.map(row => ({
                id: row.id,
                userId: row.user_id,
                title: row.title,
                message: row.message,
                type: row.type,
                category: row.category,
                read: row.read,
                actionUrl: row.action_url,
                metadata: row.metadata,
                createdAt: new Date(row.created_at),
                readAt: row.read_at ? new Date(row.read_at) : undefined
            }))
        } catch (error) {
            logger.error({ err: error, userId }, 'Failed to get notifications')
            throw error
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({
                    read: true,
                    read_at: new Date().toISOString()
                })
                .eq('id', notificationId)

            if (error) throw error

            logger.debug({ notificationId }, 'Notification marked as read')
        } catch (error) {
            logger.error({ err: error, notificationId }, 'Failed to mark notification as read')
            throw error
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({
                    read: true,
                    read_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('read', false)

            if (error) throw error

            logger.debug({ userId }, 'All notifications marked as read')
        } catch (error) {
            logger.error({ err: error, userId }, 'Failed to mark all notifications as read')
            throw error
        }
    }

    /**
     * Delete a notification
     */
    async delete(notificationId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)

            if (error) throw error

            logger.debug({ notificationId }, 'Notification deleted')
        } catch (error) {
            logger.error({ err: error, notificationId }, 'Failed to delete notification')
            throw error
        }
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('read', false)

            if (error) throw error

            return count || 0
        } catch (error) {
            logger.error({ err: error, userId }, 'Failed to get unread count')
            return 0
        }
    }

    /**
     * Helper: Notify user about agent completion
     */
    async notifyAgentComplete(userId: string, agentName: string, projectId: string): Promise<void> {
        await this.create({
            userId,
            title: 'Agent Completed',
            message: `${agentName} has finished processing your request`,
            type: 'success',
            category: 'agent',
            actionUrl: `/projects/${projectId}`,
            metadata: { agentName, projectId }
        })
    }

    /**
     * Helper: Notify user about agent failure
     */
    async notifyAgentFailed(userId: string, agentName: string, error: string): Promise<void> {
        await this.create({
            userId,
            title: 'Agent Failed',
            message: `${agentName} encountered an error: ${error}`,
            type: 'error',
            category: 'agent',
            metadata: { agentName, error }
        })
    }

    /**
     * Helper: Notify user about project update
     */
    async notifyProjectUpdate(userId: string, projectName: string, update: string): Promise<void> {
        await this.create({
            userId,
            title: 'Project Updated',
            message: `${projectName}: ${update}`,
            type: 'info',
            category: 'project',
            metadata: { projectName, update }
        })
    }
}

export const notificationService = new NotificationService()
