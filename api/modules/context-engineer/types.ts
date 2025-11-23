/**
 * Context Engineer Types
 * Defines interfaces for context gathering and management
 */

export type ContextSourceType =
    | 'project_meta'
    | 'document'
    | 'agent_history'
    | 'user_input'
    | 'system'

export type TaskType =
    | 'design_spec'
    | 'workflow_design'
    | 'content_strategy'
    | 'general'

export interface ContextSlice {
    id: string
    type: ContextSourceType
    content: string
    weight: number
    sourceMeta?: {
        documentId?: string
        documentTitle?: string
        chunkId?: string
        chunkIndex?: number
        agentRunId?: string
        similarity?: number
    }
}

export interface ContextEngineerInput {
    projectId: string
    taskType: TaskType
    userGoal?: string
    maxTokens?: number
    includeHistory?: boolean
}

export interface ContextEngineerOutput {
    systemPrompt: string
    userPrompt: string
    contextSlices: ContextSlice[]
    totalTokens: number
    metadata: {
        projectId: string
        taskType: TaskType
        sliceCount: number
        sources: Record<ContextSourceType, number>
    }
}

export interface ProjectMetadata {
    id: string
    name: string
    description: string | null
    sector: string
    projectType: string
    createdAt: string
}
