import { apiFetch } from '../lib/apiClient'

export type AiTaskType = 'generic_chat' | 'app_spec_suggestion' | 'feature_brainstorm' | 'workflow_suggestion' | 'marketing_copy'

export interface AiCompleteRequest {
  taskType: AiTaskType
  prompt: string
  context?: Record<string, any>
  preferences?: {
    costPreference?: 'low' | 'balanced' | 'best_quality'
    latencyPreference?: 'low' | 'balanced' | 'ok_with_slow'
  }
}

export interface AiCompleteResponse {
  provider: string
  model: string
  text: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    costUsd?: number
    latencyMs?: number
  }
}

export async function aiComplete(payload: AiCompleteRequest) {
  const res = await apiFetch<AiCompleteResponse>('/ai/complete', { method: 'POST', body: JSON.stringify(payload) })
  return res
}