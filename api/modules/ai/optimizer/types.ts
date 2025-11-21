export interface OptimizationGoal {
  goal: 'min_cost' | 'min_latency' | 'balanced'
}

export interface AiOptimizationSuggestion {
  projectId: string
  current: {
    provider: string
    model: string
    costPreference?: 'low' | 'balanced' | 'best_quality'
    latencyPreference?: 'low' | 'balanced' | 'ok_with_slow'
  }
  suggested: {
    provider: string
    model: string
    costPreference: 'low' | 'balanced' | 'best_quality'
    latencyPreference: 'low' | 'balanced' | 'ok_with_slow'
  }
  rationale: string
}