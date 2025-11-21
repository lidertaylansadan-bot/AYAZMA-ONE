import { apiFetch } from '../lib/apiClient'

export interface AiUsageAggregate {
  provider: string
  model: string
  taskType: string
  totalCalls: number
  totalTokens: number
  avgLatencyMs: number | null
}

export interface ProjectAiUsageSummary {
  projectId: string
  totalCalls: number
  totalTokens: number
  avgLatencyMs: number | null
  byProvider: AiUsageAggregate[]
  byTaskType: AiUsageAggregate[]
}

export interface UserAiUsageSummary {
  totalCalls: number
  totalTokens: number
  avgLatencyMs: number | null
  byProject: ProjectAiUsageSummary[]
}

export async function getUserAiUsageSummary(days?: number): Promise<UserAiUsageSummary> {
  const query = days ? `?days=${days}` : ''
  return apiFetch(`/telemetry/ai/summary${query}`)
}

export async function getProjectAiUsageSummary(projectId: string, days?: number): Promise<ProjectAiUsageSummary> {
  return apiFetch(`/telemetry/ai/summary?projectId=${projectId}${days ? `&days=${days}` : ''}`)
}