/**
 * Context Engineer Types
 * Defines interfaces for context gathering and management
 */

export type ContextStrategy = 'raw_only' | 'compressed_only' | 'hybrid'

export type ContextSourceType =
    | 'project_meta'
    | 'document'
    | 'compressed_segment'
    | 'agent_history'
    | 'user_input'

export interface ContextEngineerOutput {
    contextId: string
    systemPrompt: string
    userPrompt: string
    slices: ContextSlice[]
    metadata: {
        tokenCount: number
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
