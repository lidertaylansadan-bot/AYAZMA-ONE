/**
 * Model Selector
 * Intelligently selects the best AI model based on task type and requirements
 */

import { logger } from '../../core/logger.js'

export type TaskType =
    | 'design_spec'
    | 'workflow_design'
    | 'content_strategy'
    | 'code_generation'
    | 'summarization'
    | 'general'

export interface ModelSelection {
    provider: 'google' | 'openai' | 'ollama'
    model: string
    reason: string
}

export interface SelectionCriteria {
    taskType: TaskType
    maxCost?: number  // USD per 1M tokens
    requiresSpeed?: boolean
    requiresQuality?: boolean
    allowLocal?: boolean
}

/**
 * Model database with capabilities and costs
 */
const MODEL_DATABASE = {
    // Google Gemini models
    'google/gemini-2.0-flash-exp': {
        provider: 'google' as const,
        costPer1MTokens: 0.0, // Free tier
        speed: 'fast',
        quality: 'high',
        contextWindow: 1000000,
        bestFor: ['general', 'code_generation', 'design_spec']
    },
    'google/gemini-1.5-flash': {
        provider: 'google' as const,
        costPer1MTokens: 0.075,
        speed: 'fast',
        quality: 'medium',
        contextWindow: 1000000,
        bestFor: ['general', 'summarization']
    },
    'google/gemini-1.5-pro': {
        provider: 'google' as const,
        costPer1MTokens: 1.25,
        speed: 'medium',
        quality: 'very-high',
        contextWindow: 2000000,
        bestFor: ['design_spec', 'workflow_design', 'content_strategy']
    },

    // OpenAI models
    'openai/gpt-4o': {
        provider: 'openai' as const,
        costPer1MTokens: 2.5,
        speed: 'medium',
        quality: 'very-high',
        contextWindow: 128000,
        bestFor: ['design_spec', 'code_generation']
    },
    'openai/gpt-4o-mini': {
        provider: 'openai' as const,
        costPer1MTokens: 0.15,
        speed: 'fast',
        quality: 'high',
        contextWindow: 128000,
        bestFor: ['general', 'summarization']
    },
    'openai/gpt-3.5-turbo': {
        provider: 'openai' as const,
        costPer1MTokens: 0.5,
        speed: 'very-fast',
        quality: 'medium',
        contextWindow: 16000,
        bestFor: ['general']
    },

    // Ollama (local) models
    'ollama/llama2': {
        provider: 'ollama' as const,
        costPer1MTokens: 0,
        speed: 'medium',
        quality: 'medium',
        contextWindow: 4096,
        bestFor: ['general']
    },
    'ollama/mistral': {
        provider: 'ollama' as const,
        costPer1MTokens: 0,
        speed: 'medium',
        quality: 'high',
        contextWindow: 8192,
        bestFor: ['code_generation', 'general']
    },
    'ollama/codellama': {
        provider: 'ollama' as const,
        costPer1MTokens: 0,
        speed: 'medium',
        quality: 'high',
        contextWindow: 16000,
        bestFor: ['code_generation']
    }
}

export class ModelSelector {
    /**
     * Select the best model based on criteria
     */
    selectModel(criteria: SelectionCriteria): ModelSelection {
        const candidates = Object.entries(MODEL_DATABASE)
            .filter(([_, config]) => {
                // Filter by cost
                if (criteria.maxCost !== undefined && config.costPer1MTokens > criteria.maxCost) {
                    return false
                }

                // Filter by local requirement
                if (criteria.allowLocal === false && config.provider === 'ollama') {
                    return false
                }

                // Filter by task type
                if (!config.bestFor.includes(criteria.taskType)) {
                    return false
                }

                return true
            })
            .map(([name, config]) => {
                // Score each model
                let score = 0

                // Task fit
                if (config.bestFor[0] === criteria.taskType) score += 10
                else if (config.bestFor.includes(criteria.taskType)) score += 5

                // Speed requirement
                if (criteria.requiresSpeed) {
                    if (config.speed === 'very-fast') score += 5
                    else if (config.speed === 'fast') score += 3
                }

                // Quality requirement
                if (criteria.requiresQuality) {
                    if (config.quality === 'very-high') score += 5
                    else if (config.quality === 'high') score += 3
                }

                // Cost efficiency (prefer cheaper)
                score += (10 - Math.min(config.costPer1MTokens, 10))

                return { name, config, score }
            })
            .sort((a, b) => b.score - a.score)

        if (candidates.length === 0) {
            // Fallback to default
            logger.warn({ criteria }, 'No suitable model found, using default')
            return {
                provider: 'google',
                model: 'gemini-1.5-flash',
                reason: 'Default fallback'
            }
        }

        const best = candidates[0]
        const [provider, model] = best.name.split('/')

        return {
            provider: provider as 'google' | 'openai' | 'ollama',
            model,
            reason: this.explainSelection(best.config, criteria)
        }
    }

    private explainSelection(config: typeof MODEL_DATABASE[keyof typeof MODEL_DATABASE], criteria: SelectionCriteria): string {
        const reasons: string[] = []

        if (config.bestFor[0] === criteria.taskType) {
            reasons.push(`optimized for ${criteria.taskType}`)
        }

        if (config.costPer1MTokens === 0) {
            reasons.push('free (local)')
        } else if (config.costPer1MTokens < 0.5) {
            reasons.push('cost-effective')
        }

        if (config.speed === 'very-fast' || config.speed === 'fast') {
            reasons.push('fast response')
        }

        if (config.quality === 'very-high' || config.quality === 'high') {
            reasons.push('high quality')
        }

        return reasons.join(', ') || 'best match'
    }

    /**
     * Get model recommendations for a task
     */
    getRecommendations(taskType: TaskType, count = 3): ModelSelection[] {
        const selections: ModelSelection[] = []

        // High quality option
        selections.push(this.selectModel({
            taskType,
            requiresQuality: true
        }))

        // Fast option
        selections.push(this.selectModel({
            taskType,
            requiresSpeed: true
        }))

        // Cost-effective option
        selections.push(this.selectModel({
            taskType,
            maxCost: 0.5
        }))

        // Remove duplicates
        const unique = selections.filter((sel, idx, arr) =>
            arr.findIndex(s => s.provider === sel.provider && s.model === sel.model) === idx
        )

        return unique.slice(0, count)
    }
}

export const modelSelector = new ModelSelector()
