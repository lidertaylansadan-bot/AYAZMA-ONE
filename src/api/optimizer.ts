import { apiFetch } from '../lib/apiClient'

export interface AiOptimizationSuggestion {
  projectId: string
  current: { provider: string; model: string; costPreference?: 'low' | 'balanced' | 'best_quality'; latencyPreference?: 'low' | 'balanced' | 'ok_with_slow' }
  suggested: { provider: string; model: string; costPreference: 'low' | 'balanced' | 'best_quality'; latencyPreference: 'low' | 'balanced' | 'ok_with_slow' }
  rationale: string
}

export async function getProjectOptimizationSuggestion(projectId: string, goal: 'min_cost' | 'min_latency' | 'balanced'): Promise<{ suggestion: AiOptimizationSuggestion | null }> {
  return apiFetch(`/ai/optimize/project/${projectId}`, { method: 'POST', body: JSON.stringify({ goal, apply: false }) })
}

export async function applyProjectOptimization(projectId: string, goal: 'min_cost' | 'min_latency' | 'balanced'): Promise<{ suggestion: AiOptimizationSuggestion | null; applied: boolean }> {
  return apiFetch(`/ai/optimize/project/${projectId}`, { method: 'POST', body: JSON.stringify({ goal, apply: true }) })
}