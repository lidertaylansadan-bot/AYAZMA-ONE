/**
 * Context Engineer Service
 * Gathers and optimizes context for AI agents
 */

import { supabase } from '../../config/supabase.js'
import { ragService } from '../rag/ragService.js'
import { AppError } from '../../core/app-error.js'
import { logger } from '../../core/logger.js'
import { emitContextBuilt } from '../../core/telemetry/events.js'
import type {
    ContextEngineerInput,
    ContextEngineerOutput,
    ContextSlice,
    ContextSourceType,
    ProjectMetadata,
} from './types.js'
import { historyManager } from './HistoryManager.js'
import { permissionService } from '../security/PermissionService.js'
import { contextCompressor } from './ContextCompressor.js'

export class ContextEngineerService {
    private readonly MAX_CONTEXT_TOKENS = 8000 // Reserve tokens for response
    private readonly TOKENS_PER_CHAR = 0.25 // Rough estimate

    /**
     * Build context for an agent task
     */
    async buildContext(input: ContextEngineerInput): Promise<ContextEngineerOutput> {
        const {
            projectId,
            userId,
            taskType,
            userGoal,
            query,
            maxTokens = this.MAX_CONTEXT_TOKENS,
            agentName
        } = input

        try {
            // 0. Check Permissions
            if (agentName) {
                const hasAccess = await permissionService.checkAgentAccess(userId, projectId, agentName)
                if (!hasAccess) {
                    throw new AppError('PERMISSION_DENIED', `Agent ${agentName} does not have access to this project`, 403)
                }
            }

            // 1. Fetch Project Metadata
            const project = await this.getProjectMetadata(projectId)

            // 2. Initial Context Slices (Project Meta)
            let slices = this.createProjectMetaSlices(project)

            // 3. RAG Search (if query provided)
            if (query) {
                const ragResults = await ragService.search({
                    projectId,
                    query,
                    limit: 5,
                    threshold: 0.7
                })
                const docSlices = this.createDocumentSlices(ragResults)
                slices = [...slices, ...docSlices]
            }

            // 4. Compressed Segments (Global Context)
            const segments = await this.getCompressedSegments(projectId)
            const segmentSlices = this.createCompressedSlices(segments)
            slices = [...slices, ...segmentSlices]

            // 5. Agent History (Optional)
            const historySlices = await this.getAgentHistory(projectId, taskType)
            slices = [...slices, ...historySlices]

            // 6. Prioritize and Trim
            const prioritizedSlices = await this.prioritizeSlices(slices, maxTokens)

            // 7. Generate Prompts
            const { systemPrompt, userPrompt } = this.generatePrompts(
                project,
                prioritizedSlices,
                taskType,
                userGoal || query || ''
            )

            // 8. Telemetry
            emitContextBuilt({
                projectId,
                userId,
                taskType,
                sliceCount: prioritizedSlices.length,
                totalTokens: prioritizedSlices.reduce((acc, s) => acc + this.estimateTokens(s.content), 0)
            })

            return {
                contextId: `ctx_${Date.now()}`,
                systemPrompt,
                userPrompt,
                slices: prioritizedSlices,
                metadata: {
                    tokenCount: prioritizedSlices.reduce((acc, s) => acc + this.estimateTokens(s.content), 0),
                    sources: this.countSources(prioritizedSlices)
                }
            }

        } catch (error) {
            logger.error({ err: error, projectId, taskType }, 'Context building failed')
            throw new AppError(
                'CONTEXT_BUILD_FAILED',
                'Failed to build context',
                500
            )
        }
    }

    private async getProjectMetadata(projectId: string): Promise<ProjectMetadata> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single()

        if (error) throw error
        return data
    }

    private createProjectMetaSlices(project: ProjectMetadata): ContextSlice[] {
        return [{
            id: `meta_${project.id}`,
            type: 'project_meta',
            content: `Project: ${project.name}\nDescription: ${project.description}\nSector: ${project.sector}\nType: ${project.projectType}`,
            weight: 1.0,
            sourceMeta: {
                documentTitle: 'Project Metadata'
            }
        }]
    }

    private createDocumentSlices(ragResults: { id: string; content: string; document_id: string; similarity: number }[]): ContextSlice[] {
        return ragResults.map(r => ({
            id: `doc_${r.id}`,
            type: 'document',
            content: r.content,
            weight: r.similarity, // Use similarity as weight
            sourceMeta: {
                documentId: r.document_id,
                similarity: r.similarity
            }
        }))
    }

    private async getCompressedSegments(_projectId: string): Promise<{ id: string; content: string }[]> {
        // Placeholder for fetching pre-computed compressed segments
        // In a real implementation, this would query a 'context_segments' table
        return []
    }

    private createCompressedSlices(segments: { id: string; content: string }[]): ContextSlice[] {
        return segments.map(s => ({
            id: `seg_${s.id}`,
            type: 'compressed_segment',
            content: s.content,
            weight: 0.8,
            sourceMeta: {
                segmentId: s.id
            }
        }))
    }

    private async getAgentHistory(
        projectId: string,
        _taskType: string
    ): Promise<ContextSlice[]> {
        try {
            // Using taskType to filter history if needed, currently fetching all recent
            const history = await historyManager.getProjectHistory(projectId, 5)

            return history.map(entry => ({
                id: `hist_${entry.id}`,
                type: 'agent_history' as ContextSourceType,
                content: `[Previous Agent Action: ${entry.agentName}]\nTask: ${entry.taskType}\nInput: ${JSON.stringify(entry.input)}\nOutput: ${JSON.stringify(entry.output)}`,
                weight: 0.6,
                sourceMeta: {
                    agentName: entry.agentName,
                    activityId: entry.id
                }
            }))
        } catch (error) {
            logger.warn({ err: error, projectId }, 'Failed to fetch agent history')
            return []
        }
    }

    /**
     * Prioritize and trim slices to fit token budget.
     * Compresses low-priority slices if budget is tight.
     */
    private async prioritizeSlices(
        slices: ContextSlice[],
        maxTokens: number
    ): Promise<ContextSlice[]> {
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
                // Token budget exceeded. Try to compress if weight is decent (> 0.4)
                if (slice.weight > 0.4) {
                    const remainingTokens = Math.max(100, maxTokens - currentTokens)
                    // Only compress if we have at least 100 tokens left
                    if (remainingTokens >= 100) {
                        try {
                            const compressedContent = await contextCompressor.compress(slice.content, remainingTokens)
                            const compressedTokens = this.estimateTokens(compressedContent)

                            if (currentTokens + compressedTokens <= maxTokens) {
                                selected.push({
                                    ...slice,
                                    content: compressedContent,
                                    sourceMeta: { ...slice.sourceMeta, compressed: true }
                                })
                                currentTokens += compressedTokens
                                continue // Successfully added compressed slice
                            }
                        } catch (err) {
                            logger.warn({ err }, 'Slice compression failed, skipping slice')
                        }
                    }
                }
                // If we can't compress or fit, we skip this slice (and likely subsequent ones)
                continue
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
