/**
 * Notification Types
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationCategory = 'agent' | 'project' | 'system' | 'task'

export interface Notification {
    id: string
    userId: string
    title: string
    message: string
    type: NotificationType
    category: NotificationCategory
    read: boolean
    actionUrl?: string
    metadata?: Record<string, any>
    createdAt: Date
    readAt?: Date
}

export interface CreateNotificationInput {
    userId: string
    title: string
    message: string
    type: NotificationType
    category: NotificationCategory
    actionUrl?: string
    metadata?: Record<string, any>
}
