import type { AiProvider } from './AiProvider.js'
import type { AiRouterInput, AiRouterOutput } from '../types.js'
import { config } from '../../../core/config.js'
import { AppError } from '../../../core/app-error.js'

export class GeminiProvider implements AiProvider {
    name = 'google'

    supportsTask(_taskType: string): boolean {
        return true
    }

    async call(input: AiRouterInput): Promise<AiRouterOutput> {
        if (!config.aiGoogleKey) {
            throw new AppError('AI_PROVIDER_MISCONFIGURED', 'Missing Google API key', 500)
        }

        const model = (input.context?.modelOverride ||
            input.preferences?.model ||
            config.defaultAiModel ||
            'gemini-1.5-flash') as string

        const started = Date.now()

        // Google Generative AI REST API
        const modelId = model.startsWith('models/') ? model : `models/${model}`
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${config.aiGoogleKey}`
        console.log('Gemini API URL:', apiUrl.replace(config.aiGoogleKey || '', 'HIDDEN_KEY'));

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `You are Ayazma ONE assistant. Be concise and helpful.\n\n${input.prompt}`
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                }
            }),
        })

        const latencyMs = Date.now() - started

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}))
            throw new AppError('AI_PROVIDER_ERROR', 'Google AI provider request failed', 502, {
                status: res.status,
                body: errBody,
            })
        }

        const json = await res.json()
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

        // Extract token usage if available
        const usageMetadata = json?.usageMetadata
        const usage = usageMetadata
            ? {
                inputTokens: usageMetadata.promptTokenCount,
                outputTokens: usageMetadata.candidatesTokenCount,
                totalTokens: usageMetadata.totalTokenCount,
                costUsd: undefined,
                latencyMs,
            }
            : { latencyMs }

        return {
            provider: 'google',
            model,
            text,
            raw: json,
            usage,
        }
    }
}
