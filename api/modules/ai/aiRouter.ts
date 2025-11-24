import { AppError } from '../../core/app-error.js'
import { logger } from '../../core/logger.js'
import { config } from '../../core/config.js'
import type { AiRouterInput, AiRouterOutput } from './types.js'
import { providerRegistry } from './providers/ProviderRegistry.js'
import { resolveEffectiveAiConfig } from './configResolver.js'
import { logAiUsage } from './usageLogger.js'

function selectModel(taskType: string, preferences?: { costPreference?: string; latencyPreference?: string }, defaultModel?: string) {
  // If a specific model is requested in preferences, use it
  if (defaultModel) return defaultModel

  // Default fallback
  return config.defaultAiModel || 'gemini-2.5-flash'
}

export async function routeAiRequest(input: AiRouterInput): Promise<AiRouterOutput> {
  const effective = await resolveEffectiveAiConfig({ userId: input.userId, projectId: input.projectId, preferences: input.preferences })
  const providerName = input.providerOverride || effective.provider || config.defaultAiProvider || 'google'
  const model = selectModel(input.taskType, input.preferences, effective.model)
  const provider = providerRegistry.get(providerName)

  try {
    const result = await provider.call({ ...input, context: { ...(input.context || {}), modelOverride: model } })
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