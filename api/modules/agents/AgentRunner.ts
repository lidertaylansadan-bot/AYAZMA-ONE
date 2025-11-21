import { agentRegistry } from './AgentRegistry.js'
import type { AgentName, AgentContext, AgentArtifactPayload } from './types.js'
import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import { AppError } from '../../core/app-error.js'

export async function runAgentWithPersistence(agentName: AgentName, context: AgentContext): Promise<{ runId: string }> {
  const agent = agentRegistry.get(agentName)

  const { data: runPending, error: insertErr } = await supabase
    .from('agent_runs')
    .insert({ user_id: context.userId, project_id: context.projectId ?? null, agent_name: agentName, status: 'pending' })
    .select()
    .single()
  if (insertErr || !runPending) {
    throw new AppError('AGENT_RUN_CREATE_FAILED', 'Failed to create agent run', 500, insertErr)
  }
  const runId = runPending.id as string

  await supabase.from('agent_runs').update({ status: 'running', updated_at: new Date().toISOString() }).eq('id', runId)

  try {
    const { artifacts } = await agent.run({ ...context, runId })
    const rows = artifacts.map((a: AgentArtifactPayload) => ({ run_id: runId, type: a.type, title: a.title, content: a.content, meta: a.meta || null }))
    if (rows.length > 0) {
      const { error: artErr } = await supabase.from('agent_artifacts').insert(rows)
      if (artErr) logger.error({ err: artErr }, 'Failed to insert artifacts')
    }
    await supabase.from('agent_runs').update({ status: 'succeeded', updated_at: new Date().toISOString() }).eq('id', runId)
    logger.info({ runId, agentName }, 'Agent run succeeded')
    return { runId }
  } catch (e: any) {
    await supabase.from('agent_runs').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', runId)
    logger.error({ runId, err: e?.message }, 'Agent run failed')
    throw e instanceof AppError ? e : new AppError('AGENT_RUN_FAILED', 'Agent run failed', 500)
  }
}