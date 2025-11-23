import type { ChunkOptions } from './types.js'

export interface TextChunk {
    text: string
    index: number
}

/**
 * Chunk text into overlapping segments for RAG
 */
export class Chunker {
    /**
     * Split text into chunks with overlap
     */
    chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
        const maxTokens = options.maxTokens || 800
        const overlapPercent = options.overlapPercent || 15

        // Approximate tokens (rough estimate: 1 token ≈ 4 characters)
        const maxChars = maxTokens * 4
        const overlapChars = Math.floor(maxChars * (overlapPercent / 100))

        // Split into sentences first (preserve sentence boundaries)
        const sentences = this.splitIntoSentences(text)

        const chunks: TextChunk[] = []
        let currentChunk = ''
        let chunkIndex = 0

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i]
            const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence

            if (potentialChunk.length > maxChars && currentChunk.length > 0) {
                // Save current chunk
                chunks.push({
                    text: currentChunk.trim(),
                    index: chunkIndex++,
                })

                // Start new chunk with overlap
                const overlapText = this.getOverlapText(currentChunk, overlapChars)
                currentChunk = overlapText + (overlapText ? ' ' : '') + sentence
            } else {
                currentChunk = potentialChunk
            }
        }

        // Add final chunk if not empty
        if (currentChunk.trim().length > 0) {
            chunks.push({
                text: currentChunk.trim(),
                index: chunkIndex,
            })
        }

        return chunks
    }

    /**
     * Split text into sentences
     */
    private splitIntoSentences(text: string): string[] {
        // Simple sentence splitting (can be improved with NLP libraries)
        return text
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0)
    }

    /**
     * Get the last N characters for overlap
     */
    private getOverlapText(text: string, overlapChars: number): string {
        if (text.length <= overlapChars) return text

        // Try to find a sentence boundary within overlap range
        const overlapSection = text.slice(-overlapChars)
        const lastSentenceEnd = Math.max(
            overlapSection.lastIndexOf('. '),
            overlapSection.lastIndexOf('! '),
            overlapSection.lastIndexOf('? ')
        )

        if (lastSentenceEnd > 0) {
            return overlapSection.slice(lastSentenceEnd + 2)
        }

        // Fallback: use word boundary
        const lastSpace = overlapSection.lastIndexOf(' ')
        if (lastSpace > 0) {
            return overlapSection.slice(lastSpace + 1)
        }

        return overlapSection
    }
}

export const chunker = new Chunker()
