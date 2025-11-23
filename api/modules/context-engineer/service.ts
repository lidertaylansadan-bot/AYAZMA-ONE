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
        } = input

        try {
            logger.info({ projectId, taskType }, 'Building context')

            const contextSlices: ContextSlice[] = []

            // 1. Gather project metadata (always included, high weight)
            const projectMeta = await this.getProjectMetadata(projectId)
            contextSlices.push(...this.createProjectMetaSlices(projectMeta))

            // 2. Perform RAG search if user goal provided
            if (userGoal && userGoal.trim().length > 0) {
                const ragResults = await ragService.search(projectId, userGoal, {
                    limit: 5,
                    minSimilarity: 0.7,
                })
                contextSlices.push(...this.createDocumentSlices(ragResults))
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
    private createDocumentSlices(ragResults: any[]): ContextSlice[] {
        return ragResults.map((result, index) => ({
            id: `doc_${result.chunkId}`,
            type: 'document' as ContextSourceType,
            content: result.text,
            weight: result.similarity * 0.8, // Scale by similarity
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
     * Get agent history (optional, for future enhancement)
     */
    private async getAgentHistory(
        projectId: string,
        taskType: string
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
