import { agentRegistry } from './AgentRegistry.js'
import type { AgentName, AgentContext, AgentArtifactPayload } from './types.js'
import { contextEngineerService } from '../context-engineer/service.js'
import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import { AppError } from '../../core/app-error.js'

export async function runAgentWithPersistence(
  agentName: AgentName,
  context: AgentContext
): Promise<{ runId: string }> {
  const agent = agentRegistry.get(agentName)

  // Create agent run record
  const { data: runPending, error: insertErr } = await supabase
    .from('agent_runs')
    .insert({
      user_id: context.userId,
      project_id: context.projectId ?? null,
      agent_name: agentName,
      status: 'pending',
    })
    .select()
    .single()

  if (insertErr || !runPending) {
    throw new AppError(
      'AGENT_RUN_CREATE_FAILED',
      'Failed to create agent run',
      500,
      insertErr
    )
  }

  const runId = runPending.id as string

  // Update status to running
  await supabase
    .from('agent_runs')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', runId)

  try {
    // Check if agent needs context
    let enrichedContext = { ...context, runId }

    if (agent.needsContext && context.projectId) {
      logger.info(
        { agentName, projectId: context.projectId },
        'Building context for agent'
      )

      // Build context using Context Engineer Service
      const contextResult = await contextEngineerService.buildContext({
        projectId: context.projectId,
        taskType: agent.contextTaskType || 'general',
        userGoal: context.extra?.userGoal as string | undefined,
        maxTokens: 8000,
        includeHistory: false,
      })

      // Inject context into agent's extra field
      enrichedContext = {
        ...enrichedContext,
        extra: {
          ...enrichedContext.extra,
          contextEngineer: {
            systemPrompt: contextResult.systemPrompt,
            userPrompt: contextResult.userPrompt,
            contextSlices: contextResult.contextSlices,
            metadata: contextResult.metadata,
          },
        },
      }

      // Log context usage to database
      await logContextUsage(
        runId,
        context.projectId,
        contextResult.contextSlices
      )

      logger.info(
        {
          agentName,
          sliceCount: contextResult.contextSlices.length,
          totalTokens: contextResult.totalTokens,
        },
        'Context injected into agent'
      )
    }

    // Run the agent with enriched context
    const { artifacts } = await agent.run(enrichedContext)

    // Save artifacts
    const rows = artifacts.map((a: AgentArtifactPayload) => ({
      run_id: runId,
      type: a.type,
      title: a.title,
      content: a.content,
      meta: a.meta || null,
    }))

    if (rows.length > 0) {
      const { error: artErr } = await supabase
        .from('agent_artifacts')
        .insert(rows)
      if (artErr) logger.error({ err: artErr }, 'Failed to insert artifacts')
    }

    // Update status to succeeded
    await supabase
      .from('agent_runs')
      .update({ status: 'succeeded', updated_at: new Date().toISOString() })
      .eq('id', runId)

    logger.info({ runId, agentName }, 'Agent run succeeded')
    return { runId }
  } catch (e: any) {
    // Update status to failed
    await supabase
      .from('agent_runs')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', runId)

    logger.error({ runId, err: e?.message }, 'Agent run failed')
    throw e instanceof AppError
      ? e
      : new AppError('AGENT_RUN_FAILED', 'Agent run failed', 500)
  }
}

/**
 * Log context usage to agent_context_usages table
 */
async function logContextUsage(
  runId: string,
  projectId: string,
  contextSlices: any[]
): Promise<void> {
  try {
    const usageRecords = contextSlices.map((slice) => ({
      agent_run_id: runId,
      project_id: projectId,
      context_source: slice.type,
      document_id: slice.sourceMeta?.documentId || null,
      chunk_id: slice.sourceMeta?.chunkId || null,
      weight: slice.weight,
    }))

    if (usageRecords.length > 0) {
      const { error } = await supabase
        .from('agent_context_usages')
        .insert(usageRecords)

      if (error) {
        logger.error({ err: error, runId }, 'Failed to log context usage')
      }
    }
  } catch (error: any) {
    logger.error({ err: error, runId }, 'Error logging context usage')
  }
}