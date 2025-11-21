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

export interface AgentStats {
  byAgentName: { agentName: string; runs: number; succeeded: number; failed: number; avgArtifacts: number }[]
}