import { callLLM } from '../ai/aiRouter.js'
import { logger } from '../../core/logger.js'
import { PromptOptimizationInput, PromptOptimizationResult } from './types.js'

export class PromptOptimizer {
    /**
     * Optimize a prompt based on metrics and goals
     */
    async optimizePrompt(input: PromptOptimizationInput): Promise<PromptOptimizationResult> {
        logger.info({ taskType: input.taskType }, 'Starting prompt optimization')

        try {
            const systemPrompt = `You are an expert Prompt Engineer. Your goal is to optimize the given prompt to improve its performance, clarity, and effectiveness.
            
            Analyze the original prompt and any provided metrics or issues.
            Then, generate an optimized version of the prompt.
            
            Provide your response in the following JSON format:
            {
                "optimizedPrompt": "The new, improved prompt text...",
                "reasoning": "Explanation of why changes were made...",
                "expectedImprovements": ["List of expected improvements..."],
                "diffSummary": "Brief summary of changes (e.g., 'Added context', 'Clarified instructions')"
            }
            `

            const userPrompt = `
            **Original Prompt:**
            ${input.originalPrompt}
            
            ${input.currentMetrics ? `**Current Metrics:**\nScore: ${input.currentMetrics.score}\nIssues: ${input.currentMetrics.issues?.join(', ') || 'None'}` : ''}
            
            ${input.goal ? `**Optimization Goal:**\n${input.goal}` : ''}
            
            ${input.taskType ? `**Task Type:**\n${input.taskType}` : ''}
            `

            const response = await callLLM({
                // @ts-expect-error - provider is not in the type definition but required by implementation
                provider: 'openai',
                model: 'gpt-4o', // Use a high-quality model for optimization
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })

            // @ts-expect-error - content property access
            const content = response.content || JSON.stringify(response)
            const jsonMatch = content.match(/\{[\s\S]*\}/)

            if (!jsonMatch) {
                throw new Error('Failed to parse JSON from optimization response')
            }

            const parsed = JSON.parse(jsonMatch[0])

            return {
                optimizedPrompt: parsed.optimizedPrompt,
                reasoning: parsed.reasoning,
                expectedImprovements: parsed.expectedImprovements || [],
                diffSummary: parsed.diffSummary || 'Optimized prompt'
            }

        } catch (error) {
            logger.error({ error }, 'Prompt optimization failed')
            throw error
        }
    }
}

export const promptOptimizer = new PromptOptimizer()
