export type AgentName = 'design_spec' | 'workflow_designer' | 'content_strategist' | 'orchestrator' | 'context_engineer'

export type AgentStatus = 'pending' | 'running' | 'succeeded' | 'failed'

export interface AgentContext {
  userId: string
  projectId?: string
  sectorCode?: string
  wizardAnswers?: Record<string, any>
  extra?: Record<string, any>
  config?: Record<string, any>
  runId?: string
}

export interface AgentArtifactPayload {
  type: 'plan' | 'task_list' | 'spec' | 'copy' | 'log'
  title: string
  content: string
  meta?: Record<string, any>
}

export interface AgentRun {
  id: string
  agentName: AgentName
  userId: string
  projectId?: string
  status: AgentStatus
  createdAt: string
  updatedAt: string
}

export interface ContextSlice {
  type: string
  content: string
  weight: number
  sourceMeta?: {
    documentId?: string
    chunkId?: string
    [key: string]: any
  }
}