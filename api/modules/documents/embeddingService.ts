import { AppError } from '../../core/app-error.js'
import { logger } from '../../core/logger.js'

/**
 * Generate embeddings using Google Gemini
 */
export class EmbeddingService {
    private apiKey: string
    private model: string = 'text-embedding-004' // Latest Gemini embedding model

    constructor() {
        this.apiKey = process.env.AI_GOOGLE_API_KEY || ''

        if (!this.apiKey) {
            throw new Error('AI_GOOGLE_API_KEY is required for embedding generation')
        }
    }

    /**
     * Generate embedding for a single text
     */
    async generateEmbedding(text: string): Promise<number[]> {
        if (!text || text.trim().length === 0) {
            throw new AppError('EMPTY_TEXT', 'Cannot generate embedding for empty text', 400)
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: `models/${this.model}`,
                        content: {
                            parts: [{ text }],
                        },
                    }),
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                logger.error({ status: response.status, error: errorText }, 'Embedding API error')
                throw new AppError('EMBEDDING_API_ERROR', `Embedding API failed: ${response.status}`, 502)
            }

            const data = await response.json()

            if (!data.embedding || !data.embedding.values) {
                throw new AppError('INVALID_RESPONSE', 'Invalid embedding response from API', 502)
            }

            return data.embedding.values
        } catch (error: any) {
            logger.error({ err: error }, 'Failed to generate embedding')

            if (error instanceof AppError) throw error

            throw new AppError(
                'EMBEDDING_FAILED',
                `Failed to generate embedding: ${error.message}`,
                500
            )
        }
    }

    /**
     * Generate embeddings for multiple texts in batch
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        // For now, generate one by one (can be optimized with batch API if available)
        const embeddings: number[][] = []

        for (const text of texts) {
            const embedding = await this.generateEmbedding(text)
            embeddings.push(embedding)

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        return embeddings
    }

    /**
     * Get embedding dimension (768 for Gemini text-embedding-004)
     */
    getEmbeddingDimension(): number {
        return 768
    }
}

export const embeddingService = new EmbeddingService()
