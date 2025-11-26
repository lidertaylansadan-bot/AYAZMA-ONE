/**
 * Audit Service
 * Centralized service for logging and querying agent activities
 */

import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import type {
    AgentActivity,
    AgentRun,
    ActivityQuery,
    ActivityStats,
    ActivityType
} from './types.js'

export class AuditService {
    /**
     * Log an agent activity
     */
    async logActivity(
        projectId: string,
        agentName: string,
        activityType: ActivityType,
        input?: Record<string, any>,
        output?: Record<string, any>,
        metadata?: Record<string, any>
    ): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('agent_activities')
                .insert({
                    project_id: projectId,
                    agent_name: agentName,
                    activity_type: activityType,
                    input_payload: input,
                    output_payload: output,
                    metadata
                })
                .select('id')
                .single()

            if (error) throw error

            logger.debug({ activityId: data.id, agentName, activityType }, 'Activity logged')
            return data.id
        } catch (error) {
            logger.error({ err: error, agentName, activityType }, 'Failed to log activity')
            throw error
        }
    }

    /**
     * Log an agent run start
     */
    async logRunStart(
        userId: string,
        projectId: string,
        agentName: string,
        input?: Record<string, any>
    ): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('agent_runs')
                .insert({
                    user_id: userId,
                    project_id: projectId,
                    agent_name: agentName,
                    status: 'running',
                    input,
                    started_at: new Date().toISOString()
                })
                .select('id')
                .single()

            if (error) throw error

            logger.info({ runId: data.id, agentName }, 'Agent run started')
            return data.id
        } catch (error) {
            logger.error({ err: error, agentName }, 'Failed to log run start')
            throw error
        }
    }

    /**
     * Log an agent run completion
     */
    async logRunComplete(
        runId: string,
        output?: Record<string, any>,
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            const { error } = await supabase
                .from('agent_runs')
                .update({
                    status: 'completed',
                    output,
                    metadata,
                    completed_at: new Date().toISOString()
                })
                .eq('id', runId)

            if (error) throw error

            logger.info({ runId }, 'Agent run completed')
        } catch (error) {
            logger.error({ err: error, runId }, 'Failed to log run completion')
            throw error
        }
    }

    /**
     * Log an agent run failure
     */
    async logRunFailure(
        runId: string,
        errorMessage: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            const { error } = await supabase
                .from('agent_runs')
                .update({
                    status: 'failed',
                    error: errorMessage,
                    metadata,
                    completed_at: new Date().toISOString()
                })
                .eq('id', runId)

            if (error) throw error

            logger.warn({ runId, error: errorMessage }, 'Agent run failed')
        } catch (error) {
            logger.error({ err: error, runId }, 'Failed to log run failure')
            throw error
        }
    }

    /**
     * Query activities with filters
     */
    async queryActivities(query: ActivityQuery): Promise<AgentActivity[]> {
        try {
            let dbQuery = supabase
                .from('agent_activities')
                .select('*')
                .order('created_at', { ascending: false })

            if (query.projectId) {
                dbQuery = dbQuery.eq('project_id', query.projectId)
            }

            if (query.agentName) {
                dbQuery = dbQuery.eq('agent_name', query.agentName)
            }

            if (query.activityType) {
                dbQuery = dbQuery.eq('activity_type', query.activityType)
            }

            if (query.startDate) {
                dbQuery = dbQuery.gte('created_at', query.startDate.toISOString())
            }

            if (query.endDate) {
                dbQuery = dbQuery.lte('created_at', query.endDate.toISOString())
            }

            if (query.limit) {
                dbQuery = dbQuery.limit(query.limit)
            }

            if (query.offset) {
                dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 50) - 1)
            }

            const { data, error } = await dbQuery

            if (error) throw error

            return data.map(row => ({
                id: row.id,
                projectId: row.project_id,
                agentName: row.agent_name,
                activityType: row.activity_type,
                inputPayload: row.input_payload,
                outputPayload: row.output_payload,
                metadata: row.metadata,
                createdAt: new Date(row.created_at)
            }))
        } catch (error) {
            logger.error({ err: error, query }, 'Failed to query activities')
            throw error
        }
    }

    /**
     * Get run history for a project
     */
    async getRunHistory(projectId: string, limit = 50): Promise<AgentRun[]> {
        try {
            const { data, error } = await supabase
                .from('agent_runs')
                .select('*')
                .eq('project_id', projectId)
                .order('started_at', { ascending: false })
                .limit(limit)

            if (error) throw error

            return data.map(row => ({
                id: row.id,
                userId: row.user_id,
                projectId: row.project_id,
                agentName: row.agent_name,
                status: row.status,
                input: row.input,
                output: row.output,
                error: row.error,
                startedAt: new Date(row.started_at),
                completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
                metadata: row.metadata
            }))
        } catch (error) {
            logger.error({ err: error, projectId }, 'Failed to get run history')
            throw error
        }
    }

    /**
     * Get activity statistics
     */
    async getActivityStats(projectId: string, days = 30): Promise<ActivityStats> {
        try {
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)

            const activities = await this.queryActivities({
                projectId,
                startDate
            })

            const byType: Record<string, number> = {}
            const byAgent: Record<string, number> = {}
            let totalDuration = 0
            let durationCount = 0
            let totalCost = 0

            for (const activity of activities) {
                byType[activity.activityType] = (byType[activity.activityType] || 0) + 1
                byAgent[activity.agentName] = (byAgent[activity.agentName] || 0) + 1

                if (activity.metadata?.duration) {
                    totalDuration += activity.metadata.duration
                    durationCount++
                }

                if (activity.metadata?.cost) {
                    totalCost += activity.metadata.cost
                }
            }

            return {
                totalActivities: activities.length,
                byType: byType as Record<ActivityType, number>,
                byAgent,
                avgDuration: durationCount > 0 ? totalDuration / durationCount : undefined,
                totalCost: totalCost > 0 ? totalCost : undefined
            }
        } catch (error) {
            logger.error({ err: error, projectId }, 'Failed to get activity stats')
            throw error
        }
    }
}

export const auditService = new AuditService()
