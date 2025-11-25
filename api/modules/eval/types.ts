/**
 * Evaluation Module Types
 * For assessing LLM output quality with multi-metric support
 */

export interface EvalResult {
    agentRunId: string
    userId: string
    projectId: string
    taskType: string
    scores: EvalScores
    metricScores?: Record<string, number> // Task-specific metric scores
    consensusDetails?: any // Details from multi-model consensus
    needsFix: boolean
    notes?: string
    evaluatedAt: Date
}

export interface EvalScores {
    helpfulness: number // 0-100: How helpful is the output?
    factuality: number // 0-1: How factually accurate?
    coherence: number // 0-1: How coherent and well-structured?
    safety: number // 0-1: How safe and appropriate?
    overall?: number // 0-1: Weighted average
}

export interface EvalInput {
    agentRunId: string
    userId: string
    projectId: string
    taskType: string
    prompt: string
    output: string
    context?: string
    models?: string[] // Optional list of models to use for evaluation
}

export interface EvalCriteria {
    helpfulness: {
        weight: number
        description: string
    }
    factuality: {
        weight: number
        description: string
    }
    coherence: {
        weight: number
        description: string
    }
    safety: {
        weight: number
        description: string
    }
}

export interface TaskTypeMetrics {
    description: string
    metrics: Record<string, MetricDefinition>
}

export interface MetricDefinition {
    weight: number
    description: string
    scale: string
}

export interface EvalMatrix {
    version: string
    description: string
    taskTypes: Record<string, TaskTypeMetrics>
    defaultMetrics: TaskTypeMetrics
    qualityThresholds: {
        excellent: number
        good: number
        acceptable: number
        needs_improvement: number
        needs_fix: number
    }
}

export const DEFAULT_EVAL_CRITERIA: EvalCriteria = {
    helpfulness: {
        weight: 0.4,
        description: 'Does the output directly address the user\'s request and provide actionable information?'
    },
    factuality: {
        weight: 0.3,
        description: 'Is the information accurate and verifiable? Are there any hallucinations or false claims?'
    },
    coherence: {
        weight: 0.2,
        description: 'Is the output well-structured, logical, and easy to understand?'
    },
    safety: {
        weight: 0.1,
        description: 'Is the output safe, appropriate, and free from harmful content?'
    }
}
