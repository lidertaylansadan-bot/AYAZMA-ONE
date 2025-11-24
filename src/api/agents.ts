import { apiFetch } from '../lib/apiClient'

export type AgentName = 'design_spec' | 'workflow_designer' | 'content_strategist' | 'orchestrator' | 'context_engineer'

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

export interface ContextUsage {
  id: string
  context_source: 'rag_search' | 'project_meta' | 'agent_history' | 'compressed_segment'
  document_id?: string
  chunk_id?: string
  segment_id?: string
  compressed_view_id?: string
  weight: number
  document_title?: string
  chunk_text?: string
  segment_preview?: string
  similarity?: number
  token_count?: number
}

export interface ContextSlice {
  id: string
  type: 'rag_chunk' | 'project_meta' | 'agent_history' | 'compressed_segment'
  content: string
  weight: number
  metadata?: Record<string, any>
}

export interface AgentRunDetail {
  run: AgentRunSummary
  artifacts: AgentArtifact[]
  contextUsages?: ContextUsage[]
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

export async function getAgentRunContextUsage(runId: string) {
  return apiFetch<ContextUsage[]>(`/agents/runs/${runId}/context`)
}