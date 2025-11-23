/**
 * Text-Only Compression Service
 * Baseline compression provider using LLM-based summarization
 */

import type {
    OpticalCompressionService,
    CompressionInput,
    CompressionResult,
    CompressionSegment,
    SegmentPayload,
} from './types'
import { routeAiRequest } from '../ai/aiRouter'
import { logger } from '../../core/logger'

export class TextOnlyCompressionService implements OpticalCompressionService {
    private readonly strategy = 'text_only' as const
    private readonly modelName: string
    private readonly targetCompressionRatio: number

    constructor(
        modelName: string = 'gpt-4o-mini',
        targetCompressionRatio: number = 0.5 // 50% reduction
    ) {
        this.modelName = modelName
        this.targetCompressionRatio = targetCompressionRatio
    }

    /**
     * Compress document chunks into compact segments
     */
    async compress(input: CompressionInput): Promise<CompressionResult> {
        const startTime = Date.now()

        logger.info('Starting text-only compression', {
            documentId: input.documentId,
            chunkCount: input.chunks.length,
            strategy: this.strategy,
        })

        try {
            // Group chunks into segments (5 chunks per segment for better context)
            const chunkGroups = this.groupChunks(input.chunks, 5)

            // Calculate target tokens
            const rawTokenCount = this.estimateTotalTokens(input.chunks)
            const targetTokens = input.targetTokenBudget || Math.floor(rawTokenCount * this.targetCompressionRatio)
            const tokensPerSegment = Math.floor(targetTokens / chunkGroups.length)

            // Compress each group
            const segments: CompressionSegment[] = []
            for (let i = 0; i < chunkGroups.length; i++) {
                const group = chunkGroups[i]
                const segment = await this.compressGroup(group, i, tokensPerSegment)
                segments.push(segment)
            }

            // Calculate actual token counts
            const compressedTokenCount = segments.reduce((sum, s) => sum + s.estimatedTokens, 0)
            const tokenSavingEstimate = (rawTokenCount - compressedTokenCount) / rawTokenCount

            const processingTimeMs = Date.now() - startTime

            logger.info('Text-only compression completed', {
                documentId: input.documentId,
                rawTokens: rawTokenCount,
                compressedTokens: compressedTokenCount,
                savingPercent: (tokenSavingEstimate * 100).toFixed(1),
                durationMs: processingTimeMs,
            })

            return {
                modelName: this.modelName,
                strategy: this.strategy,
                segments,
                rawTokenCount,
                compressedTokenCount,
                tokenSavingEstimate,
                processingTimeMs,
                metadata: {
                    chunkGroups: chunkGroups.length,
                    avgSegmentTokens: Math.floor(compressedTokenCount / segments.length),
                },
            }
        } catch (error) {
            logger.error('Text-only compression failed', {
                documentId: input.documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            })
            throw error
        }
    }

    /**
     * Compress a group of chunks into a single segment
     */
    private async compressGroup(
        chunks: CompressionInput['chunks'],
        segmentIndex: number,
        targetTokens: number
    ): Promise<CompressionSegment> {
        // Combine chunk texts
        const combinedText = chunks.map((c) => c.text).join('\n\n')

        // Generate compression prompt
        const prompt = this.generateCompressionPrompt(combinedText, targetTokens)

        // Call LLM
        const response = await routeAiRequest({
            provider: 'openai', // or get from config
            model: this.modelName,
            messages: [
                {
                    role: 'system',
                    content: 'You are a document compression expert. Your task is to compress text while preserving all critical information.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3, // Lower temperature for consistency
        })

        // Parse response
        const payload = this.parseCompressionResponse(response.text)

        // Estimate tokens
        const estimatedTokens = this.estimateTokens(JSON.stringify(payload))

        return {
            segmentIndex,
            segmentType: 'text',
            payload,
            sourceChunkIds: chunks.map((c) => c.id),
            pageNumbers: chunks
                .map((c) => c.pageNumber)
                .filter((p): p is number => p !== undefined),
            estimatedTokens,
        }
    }

    /**
     * Generate compression prompt
     */
    private generateCompressionPrompt(text: string, targetTokens: number): string {
        return `Compress the following text while preserving all critical information.

Requirements:
- Maintain factual accuracy
- Preserve key entities (names, dates, numbers, locations)
- Remove redundancy and filler words
- Extract main points and important details
- Target: approximately ${targetTokens} tokens

Text to compress:
${text}

Output format (JSON):
{
  "summary": "Concise summary of the main content",
  "keyPoints": ["point1", "point2", "point3"],
  "entities": ["entity1", "entity2"],
  "references": ["important detail 1", "important detail 2"]
}

Provide the compressed output as valid JSON:`
    }

    /**
     * Parse LLM compression response
     */
    private parseCompressionResponse(responseText: string): SegmentPayload {
        try {
            // Try to extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No JSON found in response')
            }

            const parsed = JSON.parse(jsonMatch[0])

            return {
                summary: parsed.summary || '',
                keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
                entities: Array.isArray(parsed.entities) ? parsed.entities : [],
                references: Array.isArray(parsed.references) ? parsed.references : [],
            }
        } catch (error) {
            logger.warn('Failed to parse compression response, using fallback', {
                error: error instanceof Error ? error.message : 'Unknown error',
            })

            // Fallback: use raw text as summary
            return {
                summary: responseText.substring(0, 500),
                keyPoints: [],
                entities: [],
                references: [],
            }
        }
    }

    /**
     * Group chunks into segments
     */
    private groupChunks(
        chunks: CompressionInput['chunks'],
        groupSize: number
    ): CompressionInput['chunks'][] {
        const groups: CompressionInput['chunks'][] = []

        for (let i = 0; i < chunks.length; i += groupSize) {
            groups.push(chunks.slice(i, i + groupSize))
        }

        return groups
    }

    /**
     * Estimate total tokens for all chunks
     */
    private estimateTotalTokens(chunks: CompressionInput['chunks']): number {
        return chunks.reduce((sum, chunk) => sum + this.estimateTokens(chunk.text), 0)
    }

    /**
     * Estimate token count for text
     * Simple heuristic: ~4 characters per token
     */
    estimateTokens(text: string): number {
        return Math.ceil(text.length / 4)
    }

    /**
     * Get compression strategy name
     */
    getStrategy() {
        return this.strategy
    }
}

/**
 * Factory function to create text-only compression service
 */
export function createTextOnlyCompressionService(
    modelName?: string,
    targetCompressionRatio?: number
): OpticalCompressionService {
    return new TextOnlyCompressionService(modelName, targetCompressionRatio)
}
