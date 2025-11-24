import { Worker, Queue } from 'bullmq'
import { redisConnection as redis } from '../config/redis.js'
import { logger } from '../core/logger.js'
import { evalService } from '../modules/eval/evalService.js'
import { autoFixAgent } from '../modules/agents/autoFixAgent.js'
import { runAgentWithPersistence } from '../modules/agents/AgentRunner.js'
import { supabase } from '../config/supabase.js'

const QUEUE_NAME = 'closed-loop-pipeline'

export const closedLoopQueue = new Queue(QUEUE_NAME, { connection: redis })

export const closedLoopWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
        const { type, runId, projectId, userId, iterationCount = 0 } = job.data
        logger.info({ jobId: job.id, type, runId }, 'Processing closed-loop job')

        try {
            // Fetch run details
            const { data: runData, error: runError } = await supabase
                .from('agent_runs')
                .select('*')
                .eq('id', runId)
                .single()

            if (runError || !runData) {
                throw new Error(`Agent run not found: ${runId}`)
            }

            if (type === 'evaluate_run') {
                // 1. Evaluate
                const result = await evalService.evaluateAgentRun({
                    agentRunId: runId,
                    projectId,
                    userId,
                    taskType: runData.agent_name as any, // Assuming agent name maps to task type for now, or we need a mapping
                    prompt: runData.context?.prompt || 'No prompt',
                    output: typeof runData.output === 'string' ? runData.output : JSON.stringify(runData.output)
                })

                // 2. Check if fix needed
                if (result.needsFix) {
                    // Check iteration limit
                    const { data: settings } = await supabase
                        .from('project_ai_settings')
                        .select('max_iterations')
                        .eq('project_id', projectId)
                        .single()

                    const maxIterations = settings?.max_iterations || 3

                    if (iterationCount < maxIterations) {
                        await closedLoopQueue.add('auto_fix', {
                            runId,
                            projectId,
                            userId,
                            evalResult: result,
                            iterationCount
                        })
                    } else {
                        logger.warn({ runId }, 'Max iterations reached for closed loop')
                        await supabase.from('agent_runs').update({ closed_loop_status: 'max_iterations_reached' }).eq('id', runId)
                    }
                } else {
                    await supabase.from('agent_runs').update({ closed_loop_status: 'completed' }).eq('id', runId)
                }

                return { action: 'evaluated', needsFix: result.needsFix }
            }

            if (type === 'auto_fix') {
                const { evalResult } = job.data
                // 1. Auto-Fix
                const fixResult = await autoFixAgent.attemptAutoFix({
                    agentRunId: runId,
                    evalResult,
                    projectId,
                    userId,
                    taskType: runData.agent_name as any,
                    userPrompt: runData.context?.prompt || 'No prompt',
                    originalOutput: typeof runData.output === 'string' ? runData.output : JSON.stringify(runData.output)
                })

                // 2. Re-Run (Create new run with fixed context/instructions)
                // We need to fetch the original run to get the agent name and context
                const { data: originalRun } = await supabase
                    .from('agent_runs')
                    .select('agent_name, context')
                    .eq('id', runId)
                    .single()

                if (!originalRun) throw new Error('Original run not found')

                // Merge fix into context or instructions
                // For now, we'll assume the agent can take "previous_feedback" or "correction" in context
                const newContext = {
                    ...originalRun.context,
                    previous_output: fixResult.fixedOutput, // Or use the fix as a guide
                    feedback: evalResult.feedback,
                    correction_instruction: fixResult.fixNotes
                }

                // Trigger re-run
                // This will create a NEW run entry
                const { runId: newRunId } = await runAgentWithPersistence(
                    originalRun.agent_name,
                    newContext
                )

                // Update new run with parent info
                await supabase.from('agent_runs').update({
                    parent_run_id: runId,
                    iteration_count: iterationCount + 1,
                    closed_loop_status: 'in_progress'
                }).eq('id', newRunId)

                // Enqueue evaluation for the NEW run
                await closedLoopQueue.add('evaluate_run', {
                    runId: newRunId,
                    projectId,
                    userId,
                    iterationCount: iterationCount + 1
                })

                return { action: 'fixed_and_rerun', newRunId }
            }
        } catch (error) {
            logger.error({ error, jobId: job.id }, 'Closed-loop job failed')
            await supabase.from('agent_runs').update({ closed_loop_status: 'failed' }).eq('id', runId)
            throw error
        }
    },
    { connection: redis }
)

closedLoopWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, result: job.returnvalue }, 'Closed-loop job completed')
})

closedLoopWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Closed-loop job failed')
})
