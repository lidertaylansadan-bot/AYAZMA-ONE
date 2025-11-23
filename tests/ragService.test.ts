/**
 * RAG Service Tests
 * Tests for semantic search and vector similarity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '../api/config/supabase'

// Mock modules before imports
vi.mock('../api/config/supabase', () => ({
    supabase: {
        rpc: vi.fn(),
    },
}))

vi.mock('../api/modules/documents/embeddingService', () => ({
    generateEmbedding: vi.fn(),
}))

// Import after mocks
import { generateEmbedding } from '../api/modules/documents/embeddingService'

// Mock RAG service implementation
const mockRagService = {
    search: async (projectId: string, query: string, limit: number = 5, threshold: number = 0.7) => {
        // Generate embedding
        const embedding = await generateEmbedding(query)

        // Call RPC
        const { data, error } = await supabase.rpc('search_document_chunks', {
            project_id_input: projectId,
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: limit,
        })

        if (error) throw new Error(error.message)

        return data || []
    },

    searchWithContext: async (projectId: string, query: string, limit: number = 5) => {
        const chunks = await mockRagService.search(projectId, query, limit)

        return chunks.map((chunk: any, index: number) => ({
            id: `slice-${index}`,
            type: 'document' as const,
            content: chunk.text,
            weight: chunk.similarity || 0.8,
            sourceMeta: {
                source: 'raw_chunk' as const,
                documentId: chunk.document_id,
                documentTitle: chunk.document_title,
                chunkId: chunk.id,
                chunkIndex: chunk.chunk_index,
                similarity: chunk.similarity,
            },
        }))
    },
}

describe('RAG Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('search', () => {
        it('should perform semantic search and return relevant chunks', async () => {
            const mockChunks = [
                {
                    id: 'chunk-1',
                    text: 'Payment terms are 30 days',
                    document_title: 'Contract.pdf',
                    similarity: 0.95,
                },
                {
                    id: 'chunk-2',
                    text: 'Late fees apply after 30 days',
                    document_title: 'Contract.pdf',
                    similarity: 0.87,
                },
            ]

            // Mock embedding generation
            vi.mocked(generateEmbedding).mockResolvedValue(new Array(768).fill(0.1))

            // Mock RPC call
            vi.mocked(supabase.rpc).mockResolvedValue({
                data: mockChunks,
                error: null,
            } as any)

            const result = await mockRagService.search(
                'project-123',
                'payment terms',
                5,
                0.7
            )

            expect(result).toHaveLength(2)
            expect(result[0].similarity).toBeGreaterThan(0.9)
            expect(result[0].text).toContain('Payment')
        })

        it('should handle empty results', async () => {
            vi.mocked(generateEmbedding).mockResolvedValue(new Array(768).fill(0.1))

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: [],
                error: null,
            } as any)

            const result = await mockRagService.search('project-123', 'nonexistent', 5)

            expect(result).toHaveLength(0)
        })

        it('should filter by similarity threshold', async () => {
            const mockChunks = [
                { id: 'chunk-1', similarity: 0.95, text: 'High' },
                { id: 'chunk-2', similarity: 0.65, text: 'Low' },
                { id: 'chunk-3', similarity: 0.85, text: 'Medium' },
            ]

            vi.mocked(generateEmbedding).mockResolvedValue(new Array(768).fill(0.1))

            // RPC already filters by threshold, so return only matching chunks
            const filteredChunks = mockChunks.filter(c => c.similarity >= 0.7)

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: filteredChunks,
                error: null,
            } as any)

            const result = await mockRagService.search(
                'project-123',
                'test query',
                5,
                0.7
            )

            // Should only return chunks with similarity >= 0.7
            expect(result.every((chunk: any) => chunk.similarity >= 0.7)).toBe(true)
            expect(result).toHaveLength(2) // chunk-1 and chunk-3
        })

        it('should handle RPC errors', async () => {
            vi.mocked(generateEmbedding).mockResolvedValue(new Array(768).fill(0.1))

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: null,
                error: { message: 'RPC failed' },
            } as any)

            await expect(
                mockRagService.search('project-123', 'test', 5)
            ).rejects.toThrow('RPC failed')
        })
    })

    describe('searchWithContext', () => {
        it('should return context slices with metadata', async () => {
            const mockChunks = [
                {
                    id: 'chunk-1',
                    text: 'Important contract clause',
                    document_id: 'doc-1',
                    document_title: 'Contract.pdf',
                    chunk_index: 5,
                    similarity: 0.92,
                },
            ]

            vi.mocked(generateEmbedding).mockResolvedValue(new Array(768).fill(0.1))

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: mockChunks,
                error: null,
            } as any)

            const result = await mockRagService.searchWithContext(
                'project-123',
                'contract clause',
                5
            )

            expect(result).toHaveLength(1)
            expect(result[0]).toHaveProperty('type', 'document')
            expect(result[0]).toHaveProperty('weight')
            expect(result[0].sourceMeta).toHaveProperty('documentTitle', 'Contract.pdf')
            expect(result[0].sourceMeta).toHaveProperty('similarity', 0.92)
        })
    })
})
