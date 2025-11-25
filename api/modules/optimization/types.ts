export interface ABTest {
    id: string
    name: string
    variants: Variant[]
    traffic_split: Record<string, number>
    status: 'draft' | 'active' | 'paused' | 'completed'
    start_date?: string
    end_date?: string
}

export interface Variant {
    id: string
    config: Record<string, any>
}

export interface PromptOptimizationInput {
    originalPrompt: string
    currentMetrics?: {
        score: number
        issues?: string[]
    }
    goal?: string
    taskType?: string
}

export interface PromptOptimizationResult {
    optimizedPrompt: string
    reasoning: string
    expectedImprovements: string[]
    diffSummary: string
}
