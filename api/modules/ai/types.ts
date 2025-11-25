export type AiTaskType =
  | 'generic_chat'
  | 'app_spec_suggestion'
  | 'feature_brainstorm'
  | 'workflow_suggestion'
  | 'marketing_copy'
  | 'regression_test'

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

  // Low-level overrides
  messages?: any[]
  model?: string
  temperature?: number
  maxTokens?: number
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