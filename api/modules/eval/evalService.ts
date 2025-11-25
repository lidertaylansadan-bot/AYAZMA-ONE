/**
 * Evaluation Service
 * Uses LLM to evaluate agent output quality with multi-metric support
 */

import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import { callLLM } from '../ai/aiRouter.js'
import type { EvalInput, EvalResult, EvalScores, EvalMatrix } from './types.js'
import { DEFAULT_EVAL_CRITERIA } from './types.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class EvalService {
    private evalMatrix: EvalMatrix | null = null
    private matrixPath: string

    constructor(matrixPath?: string) {
        this.matrixPath = matrixPath || path.join(__dirname, '../../../config/eval_matrix.json')
    }

    /**
     * Load eval matrix from file
     */
    async loadEvalMatrix(): Promise<void> {
        try {
            const content = await fs.readFile(this.matrixPath, 'utf-8')
            this.evalMatrix = JSON.parse(content)
            logger.info({ version: this.evalMatrix?.version }, 'Eval matrix loaded')
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to load eval matrix')
            throw new Error('Failed to load eval matrix')
        }
    }

    /**
     * Get eval matrix (load if not loaded)
     */
    private async getEvalMatrix(): Promise<EvalMatrix> {
        if (!this.evalMatrix) {
            await this.loadEvalMatrix()
        }
        return this.evalMatrix!
    }

    /**
     * Evaluate agent run using task-type specific metrics
     */
    async evaluateAgentRun(input: EvalInput): Promise<EvalResult> {
        logger.info({ agentRunId: input.agentRunId, taskType: input.taskType, models: input.models }, 'Starting agent run evaluation')

        try {
            const matrix = await this.getEvalMatrix()
            const taskMetrics = matrix.taskTypes[input.taskType] || matrix.defaultMetrics
            const evalPrompt = this.buildMultiMetricPrompt(input, taskMetrics)

            const models = input.models && input.models.length > 0 ? input.models : ['gpt-4o-mini']

            // Single model evaluation
            if (models.length === 1) {
                return this.evaluateSingleModel(input, models[0], evalPrompt, taskMetrics, matrix)
            }

            // Multi-model consensus evaluation
            return this.evaluateWithConsensus(input, models, evalPrompt, taskMetrics, matrix)

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : error,
                agentRunId: input.agentRunId
            }, 'Evaluation failed')
            throw error
        }
    }

    private async evaluateSingleModel(input: EvalInput, model: string, prompt: string, taskMetrics: any, matrix: any): Promise<EvalResult> {
        const response = await callLLM({
            // @ts-ignore - provider is not in the type definition but required by implementation
            provider: 'openai',
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert evaluator of AI-generated content. Provide objective, numerical scores based on the criteria provided. Always output valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.1,
            maxTokens: 800
        })

        // @ts-ignore - content property access
        const { metricScores, reasoning } = this.parseMultiMetricScores(response.content || JSON.stringify(response), taskMetrics)
        const overall = this.calculateWeightedScore(metricScores, taskMetrics)
        const needsFix = overall < (matrix.qualityThresholds.needs_fix || 0.6)

        const result: EvalResult = {
            agentRunId: input.agentRunId,
            userId: input.userId,
            projectId: input.projectId,
            taskType: input.taskType,
            scores: {
                helpfulness: metricScores.helpfulness || 50,
                factuality: metricScores.factuality || 0.5,
                coherence: metricScores.coherence || 0.5,
                safety: metricScores.safety || 1,
                overall
            },
            metricScores,
            needsFix,
            notes: reasoning,
            evaluatedAt: new Date()
        }

        await this.saveEvaluation(result)
        return result
    }

    private async evaluateWithConsensus(input: EvalInput, models: string[], prompt: string, taskMetrics: any, matrix: any): Promise<EvalResult> {
        const promises = models.map(async (model) => {
            try {
                const response = await callLLM({
                    // @ts-ignore
                    provider: 'openai',
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert evaluator of AI-generated content. Provide objective, numerical scores based on the criteria provided. Always output valid JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    maxTokens: 800
                })
                // @ts-ignore
                const { metricScores, reasoning } = this.parseMultiMetricScores(response.content || JSON.stringify(response), taskMetrics)
                return { model, metricScores, reasoning, success: true }
            } catch (error) {
                logger.error({ model, error }, 'Model evaluation failed')
                return { model, metricScores: {}, reasoning: '', success: false }
            }
        })

        const results = await Promise.all(promises)
        const successfulResults = results.filter(r => r.success)

        if (successfulResults.length === 0) {
            throw new Error('All models failed to evaluate')
        }

        // Calculate average scores
        const averagedScores: Record<string, number> = {}
        for (const metricName of Object.keys(taskMetrics.metrics)) {
            let sum = 0
            let count = 0
            for (const result of successfulResults) {
                // @ts-ignore
                if (result.metricScores[metricName] !== undefined) {
                    // @ts-ignore
                    sum += result.metricScores[metricName]
                    count++
                }
            }
            averagedScores[metricName] = count > 0 ? sum / count : 0.5
        }

        const overall = this.calculateWeightedScore(averagedScores, taskMetrics)
        const needsFix = overall < (matrix.qualityThresholds.needs_fix || 0.6)

        // Compile consensus details
        const consensusDetails = {
            models: models,
            individualResults: results.map(r => ({
                model: r.model,
                scores: r.metricScores,
                reasoning: r.reasoning,
                success: r.success
            }))
        }

        const result: EvalResult = {
            agentRunId: input.agentRunId,
            userId: input.userId,
            projectId: input.projectId,
            taskType: input.taskType,
            scores: {
                helpfulness: averagedScores.helpfulness || 50,
                factuality: averagedScores.factuality || 0.5,
                coherence: averagedScores.coherence || 0.5,
                safety: averagedScores.safety || 1,
                overall
            },
            metricScores: averagedScores,
            consensusDetails,
            needsFix,
            notes: 'Multi-model consensus evaluation',
            evaluatedAt: new Date()
        }

        await this.saveEvaluation(result)
        return result
    }

    /**
     * Build multi-metric evaluation prompt
     */
    private buildMultiMetricPrompt(input: EvalInput, taskMetrics: any): string {
        const metricsDescription = Object.entries(taskMetrics.metrics)
            .map(([name, metric]: [string, any]) => {
                return `- **${name}** (${metric.scale}, weight: ${metric.weight}): ${metric.description}`
            })
            .join('\n')

        return `Evaluate the following AI agent output for task type: **${input.taskType}**

**User Prompt:**
${input.prompt}

${input.context ? `**Context:**\n${input.context}\n` : ''}

**Agent Output:**
${input.output}

**Evaluation Criteria:**
${metricsDescription}

Provide your evaluation in the following JSON format:
{
  "scores": {
    ${Object.keys(taskMetrics.metrics).map(name => `"${name}": <number based on scale>`).join(',\n    ')}
  },
  "reasoning": "<brief explanation of scores>"
}

Be objective and precise. Only output the JSON, no additional text.`
    }

    /**
     * Parse multi-metric scores from LLM response
     */
    private parseMultiMetricScores(content: string, taskMetrics: any): { metricScores: Record<string, number>, reasoning: string } {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No JSON found in evaluation response')
            }

            const parsed = JSON.parse(jsonMatch[0])
            const metricScores: Record<string, number> = {}

            // Normalize scores to 0-1 range
            for (const [name, metric] of Object.entries(taskMetrics.metrics) as [string, any][]) {
                const rawScore = parsed.scores?.[name] || 0.5

                // Normalize based on scale
                if (metric.scale === '0-100') {
                    metricScores[name] = Math.max(0, Math.min(100, rawScore))
                } else {
                    metricScores[name] = Math.max(0, Math.min(1, rawScore))
                }
            }

            return {
                metricScores,
                reasoning: parsed.reasoning || 'No reasoning provided'
            }
        } catch (error) {
            logger.error({ error, content }, 'Failed to parse multi-metric scores')

            // Return default scores on parse failure
            const metricScores: Record<string, number> = {}
            for (const name of Object.keys(taskMetrics.metrics)) {
                metricScores[name] = 0.5
            }

            return {
                metricScores,
                reasoning: 'Parse error - default scores applied'
            }
        }
    }

    /**
     * Calculate weighted overall score
     */
    private calculateWeightedScore(metricScores: Record<string, number>, taskMetrics: any): number {
        let totalWeight = 0
        let weightedSum = 0

        for (const [name, metric] of Object.entries(taskMetrics.metrics) as [string, any][]) {
            const score = metricScores[name] || 0.5
            const weight = metric.weight || 0

            // Normalize to 0-1 if needed
            const normalizedScore = metric.scale === '0-100' ? score / 100 : score

            weightedSum += normalizedScore * weight
            totalWeight += weight
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0.5
    }

    /**
     * Save evaluation to database
     */
    private async saveEvaluation(result: EvalResult): Promise<void> {
        const { error } = await supabase
            .from('agent_evaluations')
            .insert({
                agent_run_id: result.agentRunId,
                user_id: result.userId,
                project_id: result.projectId,
                task_type: result.taskType,
                score_helpfulness: result.scores.helpfulness,
                score_factuality: result.scores.factuality,
                score_coherence: result.scores.coherence,
                score_safety: result.scores.safety,
                metric_scores: result.metricScores,
                needs_fix: result.needsFix,
                notes: result.notes
            })

        if (error) {
            logger.error({ error }, 'Failed to save evaluation')
            throw new Error('Failed to save evaluation to database')
        }
    }

    /**
     * Legacy method - kept for backward compatibility
     */
    async evaluateOutput(input: Omit<EvalInput, 'taskType'>): Promise<EvalResult> {
        return this.evaluateAgentRun({
            ...input,
            taskType: 'default'
        })
    }

    /**
     * Get evaluations for a project
     */
    async getProjectEvaluations(projectId: string): Promise<EvalResult[]> {
        const { data, error } = await supabase
            .from('agent_evaluations')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (error) {
            logger.error({ error, projectId }, 'Failed to fetch evaluations')
            throw new Error('Failed to fetch evaluations')
        }

        return (data || []).map(row => ({
            agentRunId: row.agent_run_id,
            userId: row.user_id,
            projectId: row.project_id,
            taskType: row.task_type || 'default',
            scores: {
                helpfulness: row.score_helpfulness,
                factuality: row.score_factuality,
                coherence: row.score_coherence,
                safety: row.score_safety
            },
            metricScores: row.metric_scores,
            needsFix: row.needs_fix || false,
            notes: row.notes,
            evaluatedAt: new Date(row.created_at)
        }))
    }

    /**
     * Get average scores for a project
     */
    async getProjectAverageScores(projectId: string): Promise<EvalScores | null> {
        const evaluations = await this.getProjectEvaluations(projectId)

        if (evaluations.length === 0) {
            return null
        }

        const sum = evaluations.reduce(
            (acc, evaluation) => ({
                helpfulness: acc.helpfulness + evaluation.scores.helpfulness,
                factuality: acc.factuality + evaluation.scores.factuality,
                coherence: acc.coherence + evaluation.scores.coherence,
                safety: acc.safety + evaluation.scores.safety
            }),
            { helpfulness: 0, factuality: 0, coherence: 0, safety: 0 }
        )

        const count = evaluations.length

        return {
            helpfulness: sum.helpfulness / count,
            factuality: sum.factuality / count,
            coherence: sum.coherence / count,
            safety: sum.safety / count,
            overall: (sum.factuality / count + sum.coherence / count + sum.safety / count + (sum.helpfulness / count / 100)) / 4
        }
    }

    /**
     * Incorporate user feedback into evaluation scores
     */
    async incorporateUserFeedback(agentRunId: string): Promise<EvalResult | null> {
        try {
            // 1. Fetch existing evaluation
            const { data: evaluation, error: evalError } = await supabase
                .from('agent_evaluations')
                .select('*')
                .eq('agent_run_id', agentRunId)
                .single()

            if (evalError || !evaluation) {
                logger.warn({ agentRunId }, 'No evaluation found to update with feedback')
                return null
            }

            // 2. Fetch user feedback
            const { data: feedback, error: feedbackError } = await supabase
                .from('user_feedback')
                .select('*')
                .eq('agent_run_id', agentRunId)
                .single()

            if (feedbackError || !feedback) {
                logger.warn({ agentRunId }, 'No feedback found')
                return null
            }

            // 3. Adjust scores based on feedback
            // Normalize user rating (1-5) to 0-1 scale
            const userScore = (feedback.rating - 1) / 4

            // Simple weighted average: 70% automated, 30% user
            // In a real system, this logic would be more sophisticated
            const newOverall = (evaluation.metric_scores.overall || 0.5) * 0.7 + userScore * 0.3

            // Update evaluation record
            const { error: updateError } = await supabase
                .from('agent_evaluations')
                .update({
                    user_feedback_score: userScore,
                    final_score: newOverall,
                    updated_at: new Date()
                })
                .eq('id', evaluation.id)

            if (updateError) {
                throw updateError
            }

            logger.info({ agentRunId, oldScore: evaluation.metric_scores.overall, newScore: newOverall }, 'Evaluation updated with user feedback')

            return {
                ...evaluation,
                scores: {
                    ...evaluation.metric_scores,
                    overall: newOverall
                }
            }

        } catch (error) {
            logger.error({ error, agentRunId }, 'Failed to incorporate user feedback')
            return null
        }
    }
}

// Singleton instance
export const evalService = new EvalService()

// Auto-load eval matrix on module import
evalService.loadEvalMatrix().catch(err => {
    logger.error({ err }, 'Failed to auto-load eval matrix on startup')
})
