/**
 * RAG (Retrieval-Augmented Generation) Service
 * Performs semantic search on document chunks using vector similarity
 */

import { supabase } from '../../config/supabase.js'
import { embeddingService } from '../documents/embeddingService.js'
import { AppError } from '../../core/app-error.js'
import { logger } from '../../core/logger.js'

export interface RagSearchResult {
    chunkId: string
    documentId: string
    documentTitle: string
    text: string
    similarity: number
    chunkIndex: number
}

export interface RagSearchOptions {
    limit?: number
    minSimilarity?: number
}

export class RagService {
    /**
     * Perform semantic search on project documents
     * @param projectId - Project to search within
     * @param query - Search query text
     * @param options - Search options (limit, minSimilarity)
     * @returns Array of relevant document chunks
     */
    async search(
        projectId: string,
        query: string,
        options: RagSearchOptions = {}
    ): Promise<RagSearchResult[]> {
        const { limit = 5, minSimilarity = 0.7 } = options

        try {
            // Generate embedding for the query
            const queryEmbedding = await embeddingService.generateEmbedding(query)

            // Perform vector similarity search using pgvector
            // Using cosine similarity (1 - cosine_distance)
            const { data, error } = await supabase.rpc('search_document_chunks', {
                project_id_input: projectId,
                query_embedding: queryEmbedding,
                match_threshold: minSimilarity,
                match_count: limit,
            })

            if (error) {
                logger.error({ err: error, projectId, query }, 'RAG search failed')
                throw new AppError('RAG_SEARCH_FAILED', `Search failed: ${error.message}`, 500)
            }

            if (!data || data.length === 0) {
                logger.info({ projectId, query }, 'No relevant chunks found')
                return []
            }

            // Map results to RagSearchResult format
            const results: RagSearchResult[] = data.map((row: any) => ({
                chunkId: row.chunk_id,
                documentId: row.document_id,
                documentTitle: row.document_title,
                text: row.chunk_text,
                similarity: row.similarity,
                chunkIndex: row.chunk_index,
            }))

            logger.info(
                { projectId, query, resultCount: results.length },
                'RAG search completed'
            )

            return results
        } catch (error: any) {
            if (error instanceof AppError) throw error

            logger.error({ err: error, projectId, query }, 'RAG search error')
            throw new AppError(
                'RAG_SEARCH_ERROR',
                'Failed to perform semantic search',
                500
            )
        }
    }

    /**
     * Search with automatic query expansion
     * Useful for improving recall on short queries
     */
    async searchWithExpansion(
        projectId: string,
        query: string,
        options: RagSearchOptions = {}
    ): Promise<RagSearchResult[]> {
        // For MVP, just use basic search
        // In future, could use LLM to expand query with synonyms/related terms
        return this.search(projectId, query, options)
    }
}

export const ragService = new RagService()
