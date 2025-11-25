import { AppError } from '../../core/app-error.js'
import { logger } from '../../core/logger.js'
import { config } from '../../core/config.js'
import type { AiRouterInput, AiRouterOutput } from './types.js'
const provider = providerRegistry.get(providerName)

// 1. Check budget (only for project-scoped requests)
if (input.projectId && input.projectId !== 'system') {
  const { exceeded } = await costManager.checkBudget(input.projectId)
  if (exceeded) {
    // Log warning but allow for now to avoid hard blocks during development
    logger.warn({ projectId: input.projectId }, 'Project budget exceeded')
  }
}

// 2. Check semantic cache
// Only cache if not explicitly disabled and it's a standard generation task
const cacheEnabled = effective.semanticCachingEnabled !== false // Default to true if undefined
const cacheKey = JSON.stringify(input.messages) // Simple hash of messages for now

if (cacheEnabled) {
  const cached = await semanticCache.get(cacheKey, providerName, model)
  if (cached) {
    return {
      content: cached.content,
      raw: cached.raw,
      usage: { ...cached.usage, latencyMs: 0, costUsd: 0 }, // Cached = free & fast
      provider: providerName,
      model: model
    }
  }
}

try {
  const result = await provider.call({ ...input, context: { ...(input.context || {}), modelOverride: model } })

  // 3. Store in cache
  if (cacheEnabled) {
    await semanticCache.set(cacheKey, result, providerName, model)
  }

  await logAiUsage({
    userId: input.userId,
    projectId: input.projectId,
    agentRunId: input.agentRunId,
    provider: result.provider,
    model: result.model,
    taskType: input.taskType,
    inputTokens: result.usage?.inputTokens,
    outputTokens: result.usage?.outputTokens,
    totalTokens: result.usage?.totalTokens,
    costUsd: result.usage?.costUsd,
    latencyMs: result.usage?.latencyMs,
  })
  return result
} catch (e: any) {
  logger.error({ err: e?.message, provider: providerName }, 'AI request exception')
  if (e instanceof AppError) throw e
  throw new AppError('AI_REQUEST_ERROR', 'Failed to complete AI request', 502)
}
}

/**
 * Simplified wrapper for internal LLM calls
 */
export async function callLLM(input: Omit<AiRouterInput, 'userId' | 'projectId'> & { userId?: string, projectId?: string }): Promise<AiRouterOutput> {
  return routeAiRequest({
    userId: input.userId || 'system',
    projectId: input.projectId || 'system',
    ...input
  })
}