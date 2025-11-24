/**
 * Auto-Fix Agent
 * Automatically corrects low-quality agent outputs based on evaluation feedback
 */

import { callLLM } from '../ai/aiRouter.js'
import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import type { EvalResult } from '../eval/types.js'

export interface AutoFixInput {
    agentRunId: string
    userId: string
    projectId: string
    originalOutput: string
    evalResult: EvalResult
    taskType: string
    userPrompt: string
    context?: string
}

export interface AutoFixResult {
    fixedOutput: string
    fixNotes: string
    diffSummary: string
    success: boolean
}

export class AutoFixAgent {
    /**
     * Attempt to fix a low-quality output
     */
    async attemptAutoFix(input: AutoFixInput): Promise<AutoFixResult> {
        logger.info({ agentRunId: input.agentRunId, taskType: input.taskType }, 'Starting auto-fix attempt')

        try {
            // Build the fix prompt
            const prompt = this.buildFixPrompt(input)

            // Call LLM to generate fix
            const response = await callLLM({
                provider: 'openai',
                model: 'gpt-4o', // Use a capable model for fixing
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert AI editor and quality assurance specialist. Your goal is to improve AI-generated content based on specific evaluation feedback.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2, // Low temperature for precision
                maxTokens: 4000
            })

            // Parse the response
            const result = this.parseFixResponse(response.content)

            // Save the fix to database
            await this.saveFix(input, result)

            logger.info({ agentRunId: input.agentRunId }, 'Auto-fix completed')

            return result
        } catch (error) {
            logger.error({ error, agentRunId: input.agentRunId }, 'Auto-fix failed')
            throw error
        }
    }

    /**
     * Build the prompt for the auto-fix agent
     */
    private buildFixPrompt(input: AutoFixInput): string {
        const { evalResult, originalOutput, userPrompt, taskType } = input

        // Format metric scores for the prompt
        const scoresList = Object.entries(evalResult.metricScores || {})
            .map(([metric, score]) => `- ${metric}: ${score}`)
            .join('\n')

        return `I need you to fix and improve the following AI output which received a low quality score.

**Task Type:** ${taskType}

**Original User Request:**
${userPrompt}

**Evaluation Feedback:**
The output received an overall score of ${evalResult.scores.overall?.toFixed(2) || 'N/A'}.
Specific metric scores:
${scoresList}

**Evaluator Notes:**
${evalResult.notes || 'No specific notes provided.'}

**Original Output:**
${originalOutput}

**Instructions:**
1. Analyze the original output and the evaluation feedback.
2. Rewrite the output to address the identified weaknesses.
3. Ensure the new output fully satisfies the original user request.
4. Maintain the original format/structure unless it was part of the problem.
5. Provide a brief summary of what you changed.

**Response Format:**
You must respond with a JSON object containing the following fields:
{
  "fixedOutput": "<the complete, improved output>",
  "fixNotes": "<explanation of what was fixed and why>",
  "diffSummary": "<brief summary of changes, e.g., 'Added missing citations, corrected factual errors'>"
}

Only return the JSON object.`
    }

    /**
     * Parse the LLM response
     */
    private parseFixResponse(content: string): AutoFixResult {
        try {
            // Extract JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No JSON found in auto-fix response')
            }

            const parsed = JSON.parse(jsonMatch[0])

            return {
                fixedOutput: parsed.fixedOutput,
                fixNotes: parsed.fixNotes || 'Auto-fixed based on evaluation',
                diffSummary: parsed.diffSummary || 'Improved content quality',
                success: true
            }
        } catch (error) {
            logger.error({ error, content }, 'Failed to parse auto-fix response')
            throw new Error('Failed to parse auto-fix response')
        }
    }

    /**
     * Save the fix to the database
     */
    private async saveFix(input: AutoFixInput, result: AutoFixResult): Promise<void> {
        const { error } = await supabase
            .from('agent_fixes')
            .insert({
                agent_run_id: input.agentRunId,
                user_id: input.userId,
                project_id: input.projectId,
                original_output: input.originalOutput,
                fixed_output: result.fixedOutput,
                fix_notes: result.fixNotes,
                diff_summary: result.diffSummary,
                eval_score_before: input.evalResult.scores.overall
            })

        if (error) {
            logger.error({ error }, 'Failed to save agent fix')
            // Don't throw here, we still want to return the result
        }
    }
}

export const autoFixAgent = new AutoFixAgent()
