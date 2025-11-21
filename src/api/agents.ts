import { apiFetch } from '../lib/apiClient'

export type AgentName = 'design_spec' | 'workflow_designer' | 'content_strategist' | 'orchestrator'

export interface AgentRunSummary {
  id: string
  agentName: AgentName
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  projectId?: string
  createdAt: string
  updatedAt: string
}

export interface AgentArtifact {
  id: string
  type: 'plan' | 'task_list' | 'spec' | 'copy' | 'log'
  title: string
  content: string
  meta?: Record<string, any>
  createdAt: string
}

export interface AgentRunDetail {
  run: AgentRunSummary
  artifacts: AgentArtifact[]
}

export async function startAgentRun(payload: { agentName: AgentName; projectId?: string; context?: { wizardAnswers?: Record<string, any>; extra?: Record<string, any> } }) {
  return apiFetch<{ runId: string }>('/agents/run', { method: 'POST', body: JSON.stringify(payload) })
}

export async function listAgentRuns(projectId?: string) {
  const query = projectId ? `?projectId=${projectId}` : ''
  return apiFetch<AgentRunSummary[]>(`/agents/runs${query}`)
}

export async function getAgentRun(runId: string) {
  return apiFetch<AgentRunDetail>(`/agents/runs/${runId}`)
}