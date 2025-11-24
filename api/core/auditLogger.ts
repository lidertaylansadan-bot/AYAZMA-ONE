import { supabase } from '../config/supabase.js'
import { logger } from './logger.js'
import type { Request } from 'express'

export interface AuditLogParams {
    userId: string
    projectId?: string
    eventType: string
    severity?: 'info' | 'warning' | 'critical'
    metadata?: Record<string, any>
    req?: Request
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
    const { userId, projectId, eventType, severity = 'info', metadata = {}, req } = params

    try {
        // Extract IP and User Agent if request is provided
        const ipAddress = req ? (req.ip || req.headers['x-forwarded-for'] as string) : undefined
        const userAgent = req ? req.headers['user-agent'] : undefined

        // Log to console
        logger.info({
            type: 'AUDIT_LOG',
            userId,
            projectId,
            eventType,
            severity,
            metadata,
            ipAddress
        }, `[Audit] ${eventType}`)

        // Insert into Supabase
        const { error } = await supabase
            .from('audit_log')
            .insert({
                user_id: userId,
                project_id: projectId,
                event_type: eventType,
                severity,
                metadata,
                ip_address: ipAddress,
                user_agent: userAgent
            })

        if (error) {
            logger.error({ err: error, params }, 'Failed to insert audit log')
        }
    } catch (err) {
        logger.error({ err, params }, 'Unexpected error in logAuditEvent')
    }
}
