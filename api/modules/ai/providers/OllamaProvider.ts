import type { AiProvider } from './AiProvider.js'
import type { AiRouterInput, AiRouterOutput } from '../types.js'
import { AppError } from '../../../core/app-error.js'
import { logger } from '../../../core/logger.js'

/**
 * Ollama Provider for local LLM support
 * Supports Llama, Mistral, and other open-source models
 */
export class OllamaProvider implements AiProvider {
    name = 'ollama'
    private baseUrl: string

    constructor(baseUrl = 'http://localhost:11434') {
        this.baseUrl = baseUrl
    }

    supportsTask(_taskType: string): boolean {
        return true
    }

    async call(input: AiRouterInput): Promise<AiRouterOutput> {
        const model = (input.context?.modelOverride ||
            input.preferences?.model ||
            'llama2') as string

        const started = Date.now()

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt: `You are Ayazma ONE assistant. Be concise and helpful.\n\n${input.prompt}`,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 2048,
                    }
                }),
            })

            const latencyMs = Date.now() - started

            if (!response.ok) {
                const errorText = await response.text()
                logger.error({ status: response.status, error: errorText }, 'Ollama API error')
                throw new AppError(
                    'AI_PROVIDER_ERROR',
                    `Ollama provider request failed: ${response.statusText}`,
                    502,
                    { status: response.status, error: errorText }
                )
            }

            const json = await response.json()
            const text = json.response || ''

            // Estimate token usage (Ollama doesn't provide exact counts)
            const estimatedInputTokens = Math.ceil(input.prompt.length / 4)
            const estimatedOutputTokens = Math.ceil(text.length / 4)

            return {
                provider: 'ollama',
                model,
                text,
                raw: json,
                usage: {
                    inputTokens: estimatedInputTokens,
                    outputTokens: estimatedOutputTokens,
                    totalTokens: estimatedInputTokens + estimatedOutputTokens,
                    costUsd: 0, // Local models are free
                    latencyMs,
                }
            }
        } catch (error) {
            if (error instanceof AppError) throw error

            logger.error({ err: error }, 'Ollama provider error')
            throw new AppError(
                'AI_PROVIDER_ERROR',
                'Failed to connect to Ollama. Make sure Ollama is running.',
                503
            )
        }
    }

    /**
     * Check if Ollama is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
            })
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * List available models
     */
    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`)
            if (!response.ok) return []

            const json = await response.json()
            return json.models?.map((m: any) => m.name) || []
        } catch {
            return []
        }
    }
}
