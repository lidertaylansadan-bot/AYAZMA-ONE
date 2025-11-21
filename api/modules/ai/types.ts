export type AiTaskType =
  | 'generic_chat'
  | 'app_spec_suggestion'
  | 'feature_brainstorm'
  | 'workflow_suggestion'
  | 'marketing_copy'

export interface AiPreferences {
  costPreference?: 'low' | 'balanced' | 'best_quality'
  latencyPreference?: 'low' | 'balanced' | 'ok_with_slow'
}

export interface AiRouterInput {
  taskType: AiTaskType
  prompt: string
  context?: Record<string, any>
  preferences?: AiPreferences
  providerOverride?: string
  userId?: string
  projectId?: string
  agentRunId?: string
}

export interface AiRouterOutput {
  provider: string
  model: string
  text: string
  raw?: any
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    costUsd?: number
    latencyMs?: number
  }
}