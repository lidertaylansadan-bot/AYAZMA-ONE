import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'

interface AiUsageLogInput {
  userId?: string
  projectId?: string
  agentRunId?: string
  provider: string
  model: string
  taskType: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  costUsd?: number
  latencyMs?: number
}

export async function logAiUsage(data: AiUsageLogInput) {
  try {
    await supabase.from('ai_usage_logs').insert({
      user_id: data.userId ?? null,
      project_id: data.projectId ?? null,
      agent_run_id: data.agentRunId ?? null,
      provider: data.provider,
      model: data.model,
      task_type: data.taskType,
      input_tokens: data.inputTokens ?? null,
      output_tokens: data.outputTokens ?? null,
      total_tokens: data.totalTokens ?? null,
      cost_usd: data.costUsd ?? null,
      latency_ms: data.latencyMs ?? null,
    })
  } catch (e: any) {
    logger.error({ err: e?.message }, 'Failed to log AI usage')
  }
}