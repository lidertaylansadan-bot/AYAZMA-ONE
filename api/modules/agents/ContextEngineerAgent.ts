/**
 * Context Engineer Agent
 * Gathers and optimizes context for other AI agents
 */

import { BaseAgent } from './BaseAgent.js'
import { contextEngineerService } from '../context-engineer/service.js'
import type { AgentContext, AgentArtifactPayload } from './types.js'
import type { TaskType } from '../context-engineer/types.js'
import { logger } from '../../core/logger.js'

export class ContextEngineerAgent extends BaseAgent {
    constructor() {
        super(
            'context_engineer',
            'Gathers and optimizes project context for AI agents using RAG and metadata'
        )
    }

    async run(context: AgentContext): Promise<{ artifacts: AgentArtifactPayload[] }> {
        const { projectId, extra } = context

        if (!projectId) {
            throw new Error('Context Engineer requires a projectId')
        }

        logger.info({ projectId, agentName: this.name }, 'Context Engineer starting')

        try {
            // Extract parameters from context
            const taskType = (extra?.taskType as TaskType) || 'general'
            const userGoal = extra?.userGoal as string | undefined
            const maxTokens = (extra?.maxTokens as number) || 8000

            // Build context using the service
            const result = await contextEngineerService.buildContext({
                projectId,
                taskType,
                userGoal,
                maxTokens,
                includeHistory: false, // MVP: no history
            })

            // Create artifacts
            const artifacts: AgentArtifactPayload[] = []

            // 1. System Prompt artifact
            artifacts.push({
                type: 'spec',
                title: 'System Prompt',
                content: result.systemPrompt,
                meta: {
                    tokenCount: this.estimateTokens(result.systemPrompt),
                },
            })

            // 2. User Prompt artifact
            artifacts.push({
                type: 'spec',
                title: 'User Prompt',
                content: result.userPrompt,
                meta: {
                    tokenCount: this.estimateTokens(result.userPrompt),
                },
            })

            // 3. Context Summary artifact
            const contextSummary = this.generateContextSummary(result)
            artifacts.push({
                type: 'log',
                title: 'Context Summary',
                content: contextSummary,
                meta: {
                    sliceCount: result.contextSlices.length,
                    totalTokens: result.totalTokens,
                    sources: result.metadata.sources,
                },
            })

            logger.info(
                {
                    projectId,
                    sliceCount: result.contextSlices.length,
                    totalTokens: result.totalTokens,
                },
                'Context Engineer completed'
            )

            return { artifacts }
        } catch (error: any) {
            logger.error({ err: error, projectId }, 'Context Engineer failed')
            throw error
        }
    }

    /**
     * Generate a human-readable summary of the context
     */
    private generateContextSummary(result: any): string {
        const { contextSlices, metadata, totalTokens } = result

        let summary = `# Context Summary\n\n`
        summary += `**Total Slices:** ${metadata.sliceCount}\n`
        summary += `**Total Tokens:** ${totalTokens}\n`
        summary += `**Task Type:** ${metadata.taskType}\n\n`

        summary += `## Sources\n`
        for (const [source, count] of Object.entries(metadata.sources)) {
            summary += `- ${source}: ${count}\n`
        }

        summary += `\n## Context Slices\n\n`
        for (const slice of contextSlices) {
            summary += `### ${slice.type} (weight: ${slice.weight.toFixed(2)})\n`
            summary += `${slice.content.substring(0, 200)}...\n\n`

            if (slice.sourceMeta?.documentTitle) {
                summary += `*Source: ${slice.sourceMeta.documentTitle}*\n\n`
            }
        }

        return summary
    }

    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens(text: string): number {
        return Math.ceil(text.length * 0.25)
    }
}
