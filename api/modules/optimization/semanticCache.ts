import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import crypto from 'crypto'

export class SemanticCache {
    /**
     * Get cached response for a prompt
     */
    async get(prompt: string, provider: string, model: string): Promise<any | null> {
        try {
            const promptHash = this.hashPrompt(prompt)

            const { data, error } = await supabase
                .from('semantic_cache')
                .select('response')
                .eq('prompt_hash', promptHash)
                .eq('provider', provider)
                .eq('model', model)
                .gt('expires_at', new Date().toISOString())
                .single()

            if (error) {
                if (error.code !== 'PGRST116') {
                    logger.warn({ err: error }, 'Error fetching from semantic cache')
                }
                return null
            }

            logger.info({ provider, model }, 'Cache hit')
            return data.response

        } catch (error) {
            logger.error({ err: error }, 'Error in SemanticCache.get')
            return null
        }
    }

    /**
     * Set cached response
     */
    async set(prompt: string, response: any, provider: string, model: string): Promise<void> {
        try {
            const promptHash = this.hashPrompt(prompt)

            const { error } = await supabase
                .from('semantic_cache')
                .insert({
                    prompt_hash: promptHash,
                    prompt_text: prompt, // Store truncated if too long? For now full text.
                    response: response,
                    provider: provider,
                    model: model
                })

            if (error) {
                logger.error({ err: error }, 'Error setting semantic cache')
            }

        } catch (error) {
            logger.error({ err: error }, 'Error in SemanticCache.set')
        }
    }

    private hashPrompt(prompt: string): string {
        return crypto.createHash('sha256').update(prompt).digest('hex')
    }
}

export const semanticCache = new SemanticCache()
