/**
 * Compression Service
 * Main service for document compression operations
 */

import { supabase } from '../../config/supabase'
import { compressionRegistry } from './registry'
import type {
    CompressionInput,
    CompressionResult,
    DocumentCompressedView,
    DocumentCompressedSegment,
    CompressionStrategy,
} from './types'
import { AppError } from '../../core/app-error'
import { logger } from '../../core/logger'

export class CompressionService {
    /**
     * Compress a document
     */
    async compressDocument(
        input: CompressionInput,
        userId: string
    ): Promise<{ viewId: string; result: CompressionResult }> {
        logger.info('Starting document compression', {
            documentId: input.documentId,
            strategy: input.strategy,
            chunkCount: input.chunks.length,
        })

        try {
            // Get compression provider
            const provider = compressionRegistry.get(input.strategy)

            // Perform compression
            const result = await provider.compress(input)

            // Save to database
            const viewId = await this.saveCompressionResult(
                input.documentId,
                result,
                userId
            )

            logger.info('Document compression completed', {
                documentId: input.documentId,
                viewId,
                tokenSaving: (result.tokenSavingEstimate * 100).toFixed(1) + '%',
            })

            return { viewId, result }
        } catch (error) {
            logger.error('Document compression failed', {
                documentId: input.documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            })
            throw error
        }
    }

    /**
     * Save compression result to database
     */
    private async saveCompressionResult(
        documentId: string,
        result: CompressionResult,
        userId: string
    ): Promise<string> {
        // Create compressed view
        const { data: view, error: viewError } = await supabase
            .from('document_compressed_views')
            .insert({
                document_id: documentId,
                compression_strategy: result.strategy,
                model_name: result.modelName,
                token_saving_estimate: result.tokenSavingEstimate,
                raw_token_count: result.rawTokenCount,
                compressed_token_count: result.compressedTokenCount,
                processing_time_ms: result.processingTimeMs,
                created_by: userId,
                metadata: result.metadata || {},
            })
            .select()
            .single()

        if (viewError) {
            throw new AppError('DATABASE_ERROR', 'Failed to create compressed view', {
                cause: viewError,
            })
        }

        // Create segments
        const segments = result.segments.map((segment) => ({
            compressed_view_id: view.id,
            segment_index: segment.segmentIndex,
            segment_type: segment.segmentType,
            payload: segment.payload,
            source_chunk_ids: segment.sourceChunkIds,
            page_numbers: segment.pageNumbers || [],
            estimated_tokens: segment.estimatedTokens,
        }))

        const { error: segmentsError } = await supabase
            .from('document_compressed_segments')
            .insert(segments)

        if (segmentsError) {
            // Rollback: delete view
            await supabase
                .from('document_compressed_views')
                .delete()
                .eq('id', view.id)

            throw new AppError('DATABASE_ERROR', 'Failed to create segments', {
                cause: segmentsError,
            })
        }

        return view.id
    }

    /**
     * Get compressed view by ID
     */
    async getCompressedView(
        viewId: string
    ): Promise<{ view: DocumentCompressedView; segments: DocumentCompressedSegment[] }> {
        // Get view
        const { data: view, error: viewError } = await supabase
            .from('document_compressed_views')
            .select('*')
            .eq('id', viewId)
            .single()

        if (viewError) {
            throw new AppError('NOT_FOUND', 'Compressed view not found', {
                cause: viewError,
            })
        }

        // Get segments
        const { data: segments, error: segmentsError } = await supabase
            .from('document_compressed_segments')
            .select('*')
            .eq('compressed_view_id', viewId)
            .order('segment_index', { ascending: true })

        if (segmentsError) {
            throw new AppError('DATABASE_ERROR', 'Failed to fetch segments', {
                cause: segmentsError,
            })
        }

        return { view, segments: segments || [] }
    }

    /**
     * Get compressed views for a document
     */
    async getDocumentCompressedViews(
        documentId: string
    ): Promise<DocumentCompressedView[]> {
        const { data, error } = await supabase
            .from('document_compressed_views')
            .select('*')
            .eq('document_id', documentId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new AppError('DATABASE_ERROR', 'Failed to fetch compressed views', {
                cause: error,
            })
        }

        return data || []
    }

    /**
     * Delete compressed view
     */
    async deleteCompressedView(viewId: string): Promise<void> {
        const { error } = await supabase
            .from('document_compressed_views')
            .delete()
            .eq('id', viewId)

        if (error) {
            throw new AppError('DATABASE_ERROR', 'Failed to delete compressed view', {
                cause: error,
            })
        }
    }

    /**
     * Get compression stats for a project
     */
    async getProjectCompressionStats(projectId: string) {
        const { data, error } = await supabase.rpc('get_project_compression_stats', {
            project_id_input: projectId,
        })

        if (error) {
            throw new AppError('DATABASE_ERROR', 'Failed to get compression stats', {
                cause: error,
            })
        }

        return data?.[0] || {
            total_documents: 0,
            compressed_documents: 0,
            total_raw_tokens: 0,
            total_compressed_tokens: 0,
            avg_token_saving: 0,
            compression_strategies: {},
        }
    }
}

// Singleton instance
export const compressionService = new CompressionService()
