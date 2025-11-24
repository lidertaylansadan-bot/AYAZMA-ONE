import { agentRegistry } from './AgentRegistry.js';
import type { AgentName, AgentContext, AgentArtifactPayload } from './types.js';
import { contextEngineerService } from '../context-engineer/service.js';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../core/logger.js';
import { AppError } from '../../core/app-error.js';

/**
 * Type representing a slice of context used for logging.
 */
interface ContextSlice {
  type: string;
  sourceMeta?: {
    documentId?: string;
    chunkId?: string;
  };
  weight: number;
}

/**
 * Runs an agent with persistence, storing run metadata, artifacts, and optionally triggering
 * the closed‑loop evaluation pipeline if the project has `closed_loop_mode` enabled.
 */
export async function runAgentWithPersistence(
  agentName: AgentName,
  context: AgentContext
): Promise<{ runId: string; output?: unknown }> {
  const agent = agentRegistry.get(agentName);

  // 1️⃣ Create a new agent run record (status: pending)
  const { data: runPending, error: insertErr } = await supabase
    .from('agent_runs')
    .insert({
      user_id: context.userId,
      project_id: context.projectId ?? null,
      agent_name: agentName,
      status: 'pending',
    })
    .select()
    .single();

  if (insertErr || !runPending) {
    throw new AppError('AGENT_RUN_CREATE_FAILED', 'Failed to create agent run', 500, insertErr);
  }

  const runId = runPending.id as string;

  // 2️⃣ Mark the run as running
  await supabase
    .from('agent_runs')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', runId);

  try {
    // 3️⃣ Build enriched context if the agent requires it
    let enrichedContext: AgentContext & { runId: string } = { ...context, runId };

    if (agent.needsContext && context.projectId) {
      logger.info({ agentName, projectId: context.projectId }, 'Building context for agent');

      const contextResult = await contextEngineerService.buildContext({
        userId: context.userId,
        projectId: context.projectId,
        taskType: agent.contextTaskType ?? 'general',
        userGoal: (context.extra?.userGoal as string) ?? undefined,
        maxTokens: 8000,
        includeHistory: false,
      });

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
      };

      // Log context usage for analytics
      await logContextUsage(runId, context.projectId, contextResult.contextSlices);

      logger.info(
        {
          agentName,
          sliceCount: contextResult.contextSlices.length,
          totalTokens: contextResult.totalTokens,
        },
        'Context injected into agent'
      );
    }

    // 4️⃣ Execute the agent
    const { artifacts } = await agent.run(enrichedContext);

    // 5️⃣ Persist artifacts (if any)
    const rows = artifacts.map((a: AgentArtifactPayload) => ({
      run_id: runId,
      type: a.type,
      title: a.title,
      content: a.content,
      meta: a.meta ?? null,
    }));

    if (rows.length > 0) {
      const { error: artErr } = await supabase.from('agent_artifacts').insert(rows);
      if (artErr) logger.error({ err: artErr }, 'Failed to insert artifacts');
    }

    // 6️⃣ Mark run as succeeded
    await supabase
      .from('agent_runs')
      .update({ status: 'succeeded', updated_at: new Date().toISOString() })
      .eq('id', runId);

    logger.info({ runId, agentName }, 'Agent run succeeded');

    // 7️⃣ Trigger closed‑loop evaluation if enabled for the project
    if (context.projectId) {
      const { data: settings } = await supabase
        .from('project_ai_settings')
        .select('closed_loop_mode')
        .eq('project_id', context.projectId)
        .single();

      if (settings?.closed_loop_mode) {
        // Dynamically import to avoid circular dependencies
        const { closedLoopQueue } = await import('../../jobs/closedLoopWorker.js');
        await closedLoopQueue.add('evaluate_run', {
          runId,
          projectId: context.projectId,
          userId: context.userId,
          type: 'evaluate_run',
        });
        logger.info({ runId }, 'Triggered closed‑loop evaluation');

        // Mark the run as pending closed‑loop processing
        await supabase
          .from('agent_runs')
          .update({ closed_loop_status: 'pending' })
          .eq('id', runId);
      }
    }

    return { runId, output: artifacts };
  } catch (e: unknown) {
    // 8️⃣ On error, mark the run as failed
    await supabase
      .from('agent_runs')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', runId);
    logger.error({ runId, err: (e as any)?.message }, 'Agent run failed');
    throw e instanceof AppError ? e : new AppError('AGENT_RUN_FAILED', 'Agent run failed', 500);
  }
}

/**
 * Helper: log usage of context slices for a given run.
 */
export async function logContextUsage(
  runId: string,
  projectId: string,
  contextSlices: ContextSlice[]
): Promise<void> {
  try {
    const usageRecords = contextSlices.map((slice) => ({
      agent_run_id: runId,
      project_id: projectId,
      context_source: slice.type,
      document_id: slice.sourceMeta?.documentId ?? null,
      chunk_id: slice.sourceMeta?.chunkId ?? null,
      weight: slice.weight,
    }));

    if (usageRecords.length > 0) {
      const { error } = await supabase.from('agent_context_usages').insert(usageRecords);
      if (error) logger.error({ err: error, runId }, 'Failed to log context usage');
    }
  } catch (error: unknown) {
    logger.error({ err: error, runId }, 'Error logging context usage');
  }
}