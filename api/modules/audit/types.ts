/**
 * Audit Trail Types
 * Defines types for logging and querying agent activities
 */

export type ActivityType =
    | 'agent.started'
    | 'agent.completed'
    | 'agent.failed'
    | 'agent.progress'
    | 'context.built'
    | 'context.compressed'
    | 'permission.checked'
    | 'permission.denied'
    | 'document.processed'
    | 'task.assigned'
    | 'task.completed'

export interface AgentActivity {
    id: string
    projectId: string
    agentName: string
    activityType: ActivityType
    inputPayload?: Record<string, any>
    outputPayload?: Record<string, any>
    metadata?: {
        duration?: number
        tokenCount?: number
        cost?: number
        error?: string
        [key: string]: any
    }
    createdAt: Date
}

export interface AgentRun {
    id: string
    userId: string
    projectId: string
    agentName: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    input?: Record<string, any>
    output?: Record<string, any>
    error?: string
    startedAt: Date
    completedAt?: Date
    metadata?: Record<string, any>
}

export interface ActivityQuery {
    projectId?: string
    agentName?: string
    activityType?: ActivityType
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
}

export interface ActivityStats {
    totalActivities: number
    byType: Record<ActivityType, number>
    byAgent: Record<string, number>
    avgDuration?: number
    totalCost?: number
}
