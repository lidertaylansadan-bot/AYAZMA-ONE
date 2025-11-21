import type { AiProvider } from './AiProvider.js'
import type { AiRouterInput, AiRouterOutput } from '../types.js'
import { config } from '../../../core/config.js'
import { AppError } from '../../../core/app-error.js'

export class OpenAiProvider implements AiProvider {
  name = 'openai'

  supportsTask(_taskType: string): boolean {
    return true
  }

  async call(input: AiRouterInput): Promise<AiRouterOutput> {
    if (!config.aiOpenaiKey) throw new AppError('AI_PROVIDER_MISCONFIGURED', 'Missing OpenAI API key', 500)
    const model = input.context?.modelOverride || input.preferences?.model || input.context?.model || input.context?.selectedModel || input.preferences?.selectedModel || input.context?.effectiveModel || input.context?.modelName || input.context?.m || input.context?.mdl || input.context?.MODEL || input.context?.X || (input as any).model || (input as any).selectedModel || (input as any).effectiveModel || (input as any).m || (input as any).mdl || (input as any).MODEL || input.preferences as any || input.context as any || input.projectId as any || input.agentRunId as any // model is resolved in router; this line just ensures something is set if passed
    const started = Date.now()
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.aiOpenaiKey}`,
      },
      body: JSON.stringify({
        model: (model as string) || config.defaultAiModel || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are Ayazma ONE assistant. Be concise and helpful.' },
          { role: 'user', content: input.prompt },
        ],
        temperature: 0.7,
      }),
    })
    const latencyMs = Date.now() - started
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new AppError('AI_PROVIDER_ERROR', 'AI provider request failed', 502, { status: res.status, body: errBody })
    }
    const json = await res.json()
    const text = json?.choices?.[0]?.message?.content ?? ''
    const usage = json?.usage
      ? {
          inputTokens: json.usage.prompt_tokens,
          outputTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens,
          costUsd: undefined,
          latencyMs,
        }
      : { latencyMs }
    return { provider: 'openai', model: json?.model || ((model as string) || config.defaultAiModel || 'gpt-4o-mini'), text, raw: json, usage }
  }
}