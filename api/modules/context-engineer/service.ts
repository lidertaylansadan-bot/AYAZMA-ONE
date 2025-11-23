/**
 * Context Engineer Service
 * Gathers and optimizes context for AI agents
 */

import { supabase } from '../../config/supabase.js'
import { ragService } from '../rag/ragService.js'
import { AppError } from '../../core/app-error.js'
import { logger } from '../../core/logger.js'
import type {
    ContextEngineerInput,
    ContextEngineerOutput,
    ContextSlice,
    ContextSourceType,
    ProjectMetadata,
} from './types.js'

export class ContextEngineerService {
    private readonly MAX_CONTEXT_TOKENS = 8000 // Reserve tokens for response
    private readonly TOKENS_PER_CHAR = 0.25 // Rough estimate

    /**
     * Build context for an agent task
     */
    async buildContext(input: ContextEngineerInput): Promise<ContextEngineerOutput> {
        const {
            projectId,
            taskType,
            userGoal = '',
            maxTokens = this.MAX_CONTEXT_TOKENS,
            includeHistory = false,
            contextStrategy = 'raw_only',
        } = input

        try {
            logger.info({ projectId, taskType, contextStrategy }, 'Building context')

            const contextSlices: ContextSlice[] = []

            // 1. Gather project metadata (always included, high weight)
            const projectMeta = await this.getProjectMetadata(projectId)
            contextSlices.push(...this.createProjectMetaSlices(projectMeta))

            // 2. Gather Content based on Strategy

            // A. Raw Context (RAG)
            if (contextStrategy === 'raw_only' || contextStrategy === 'hybrid') {
                if (userGoal && userGoal.trim().length > 0) {
                    const ragResults = await ragService.search(projectId, userGoal, {
                        limit: 10, // Increase limit for hybrid to allow more selection
                        minSimilarity: 0.7,
                    })
                    contextSlices.push(...this.createDocumentSlices(ragResults))
                }
            }

            // B. Compressed Context (Global Overview)
            if (contextStrategy === 'compressed_only' || contextStrategy === 'hybrid') {
                const segments = await this.getCompressedSegments(projectId)
                contextSlices.push(...this.createCompressedSlices(segments))
            }

            // 3. (Optional) Include agent history
            if (includeHistory) {
                const historySlices = await this.getAgentHistory(projectId, taskType)
                contextSlices.push(...historySlices)
            }

            // 4. Weight and prioritize slices
            const prioritizedSlices = this.prioritizeSlices(contextSlices, maxTokens)

            // 5. Generate prompts
            const { systemPrompt, userPrompt } = this.generatePrompts(
                projectMeta,
                prioritizedSlices,
                taskType,
                userGoal
            )

            // 6. Calculate metadata
            const totalTokens = this.estimateTokens(systemPrompt + userPrompt)
            const sources = this.countSources(prioritizedSlices)

            const output: ContextEngineerOutput = {
                systemPrompt,
                userPrompt,
                contextSlices: prioritizedSlices,
                totalTokens,
                metadata: {
                    projectId,
                    taskType,
                    sliceCount: prioritizedSlices.length,
                    sources,
                },
            }

            logger.info(
                {
                    projectId,
                    taskType,
                    sliceCount: prioritizedSlices.length,
                    totalTokens,
                    sources,
                },
                'Context built successfully'
            )

            return output
        } catch (error: any) {
            if (error instanceof AppError) throw error

            logger.error({ err: error, projectId, taskType }, 'Context building failed')
            throw new AppError(
                'CONTEXT_BUILD_FAILED',
                'Failed to build context',
                500
            )
        }
    }

    /**
     * Get project metadata from database
     */
    private async getProjectMetadata(projectId: string): Promise<ProjectMetadata> {
        const { data, error } = await supabase
            .from('projects')
            .select('id, name, description, sector, project_type, created_at')
            .eq('id', projectId)
            .single()

        if (error || !data) {
            throw new AppError('PROJECT_NOT_FOUND', 'Project not found', 404)
        }

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            sector: data.sector,
            projectType: data.project_type,
            createdAt: data.created_at,
        }
    }

    /**
     * Create context slices from project metadata
     */
    private createProjectMetaSlices(project: ProjectMetadata): ContextSlice[] {
        const slices: ContextSlice[] = []

        // Main project info
        slices.push({
            id: `project_meta_${project.id}`,
            type: 'project_meta',
            content: `Project: ${project.name}\nSector: ${project.sector}\nType: ${project.projectType}${project.description ? `\nDescription: ${project.description}` : ''
                }`,
            weight: 1.0, // Highest weight
        })

        return slices
    }

    /**
     * Create context slices from RAG search results
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createDocumentSlices(ragResults: any[]): ContextSlice[] {
        return ragResults.map((result) => ({
            id: `doc_${result.chunkId}`,
            type: 'document' as ContextSourceType,
            content: result.text,
            weight: result.similarity * 0.85, // Slightly higher weight to prioritize specific hits
            sourceMeta: {
                documentId: result.documentId,
                documentTitle: result.documentTitle,
                chunkId: result.chunkId,
                chunkIndex: result.chunkIndex,
                similarity: result.similarity,
            },
        }))
    }

    /**
     * Fetch compressed segments for a project
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async getCompressedSegments(projectId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('document_compressed_segments')
            .select(`
                id,
                segment_index,
                payload,
                document_compressed_views!inner(
                    document_id,
                    project_documents!inner(project_id)
                )
            `)
            .eq('document_compressed_views.project_documents.project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(20) // Limit to recent segments to avoid overload

        if (error) {
            logger.warn({ err: error }, 'Failed to fetch compressed segments')
            return []
        }
        return data || []
    }

    /**
     * Create context slices from compressed segments
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createCompressedSlices(segments: any[]): ContextSlice[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return segments.map((seg: any) => {
            // Extract summary from payload
            const payload = seg.payload
            const content = payload.summary ||
                (Array.isArray(payload.keyPoints) ? payload.keyPoints.join('\n') : '') ||
                JSON.stringify(payload)

            return {
                id: `seg_${seg.id}`,
                type: 'compressed_segment' as ContextSourceType,
                content: `[Compressed Summary]\n${content}`,
                weight: 0.5, // Medium weight for global context
                sourceMeta: {
                    segmentId: seg.id,
                    segmentIndex: seg.segment_index,
                    documentId: seg.document_compressed_views.document_id,
                },
            }
        })
    }

    /**
     * Get agent history (optional, for future enhancement)
     */
    private async getAgentHistory(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _projectId: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _taskType: string
    ): Promise<ContextSlice[]> {
        // For MVP, return empty array
        // In future, fetch recent successful agent runs
        return []
    }

    /**
     * Prioritize and trim slices to fit token budget
     */
    private prioritizeSlices(
        slices: ContextSlice[],
        maxTokens: number
    ): ContextSlice[] {
        // Sort by weight (descending)
        const sorted = [...slices].sort((a, b) => b.weight - a.weight)

        const selected: ContextSlice[] = []
        let currentTokens = 0

        for (const slice of sorted) {
            const sliceTokens = this.estimateTokens(slice.content)

            if (currentTokens + sliceTokens <= maxTokens) {
                selected.push(slice)
                currentTokens += sliceTokens
            } else {
                // Token budget exceeded
                break
            }
        }

        return selected
    }

    /**
     * Generate system and user prompts from context
     */
    private generatePrompts(
        project: ProjectMetadata,
        slices: ContextSlice[],
        taskType: string,
        userGoal: string
    ): { systemPrompt: string; userPrompt: string } {
        // Build context sections
        const projectContext = slices
            .filter((s) => s.type === 'project_meta')
            .map((s) => s.content)
            .join('\n\n')

        const documentContext = slices
            .filter((s) => s.type === 'document')
            .map((s, i) => `[Document ${i + 1}]\n${s.content}`)
            .join('\n\n')

        // System prompt with context
        const systemPrompt = `You are an AI assistant helping with a ${taskType} task for the project "${project.name}".

PROJECT CONTEXT:
${projectContext}

${documentContext ? `RELEVANT DOCUMENTS:\n${documentContext}\n` : ''}
Use the above context to provide accurate, project-specific responses. Reference specific documents when relevant.`

        // User prompt
        const userPrompt = userGoal || `Help me with ${taskType} for this project.`

        return { systemPrompt, userPrompt }
    }

    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens(text: string): number {
        return Math.ceil(text.length * this.TOKENS_PER_CHAR)
    }

    /**
     * Count context slices by source type
     */
    private countSources(slices: ContextSlice[]): Record<ContextSourceType, number> {
        const counts: Record<string, number> = {}

        for (const slice of slices) {
            counts[slice.type] = (counts[slice.type] || 0) + 1
        }

        return counts as Record<ContextSourceType, number>
    }
}

export const contextEngineerService = new ContextEngineerService()
