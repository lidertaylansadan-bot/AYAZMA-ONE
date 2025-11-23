import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import { AppError } from '../../core/app-error.js'
import { documentService } from './service.js'
import { textExtractor } from './textExtractor.js'
import { chunker } from './chunker.js'
import { embeddingService } from './embeddingService.js'
import type { ProcessingResult, ChunkOptions } from './types.js'

/**
 * Document processing pipeline: extract → chunk → embed → store
 */
export class DocumentProcessor {
    /**
     * Process a document: extract text, chunk, generate embeddings, store
     */
    async processDocument(
        documentId: string,
        userId: string,
        options: ChunkOptions = {}
    ): Promise<ProcessingResult> {
        logger.info({ documentId }, 'Starting document processing')

        try {
            // Update status to processing
            await documentService.updateProcessingStatus(documentId, 'processing')

            // Step 1: Download document
            const buffer = await documentService.downloadDocument(documentId, userId)
            const document = await documentService.getDocumentById(documentId, userId)

            // Step 2: Extract text
            logger.info({ documentId }, 'Extracting text')
            const text = await textExtractor.extractText(buffer, document.mime_type)

            if (text.length < 100) {
                throw new AppError('DOCUMENT_TOO_SHORT', 'Document text is too short (< 100 chars)', 400)
            }

            // Step 3: Chunk text
            logger.info({ documentId, textLength: text.length }, 'Chunking text')
            const chunks = chunker.chunkText(text, options)

            if (chunks.length === 0) {
                throw new AppError('NO_CHUNKS', 'Failed to create chunks from document', 500)
            }

            logger.info({ documentId, chunkCount: chunks.length }, 'Generated chunks')

            // Step 4: Generate embeddings
            logger.info({ documentId }, 'Generating embeddings')
            const chunkTexts = chunks.map(c => c.text)
            const embeddings = await embeddingService.generateEmbeddings(chunkTexts)

            // Step 5: Store chunks with embeddings
            logger.info({ documentId }, 'Storing chunks')
            const chunkRecords = chunks.map((chunk, idx) => ({
                document_id: documentId,
                chunk_index: chunk.index,
                text: chunk.text,
                embedding: JSON.stringify(embeddings[idx]), // Supabase expects JSON string for vector
            }))

            const { error: insertError } = await supabase
                .from('project_document_chunks')
                .insert(chunkRecords)

            if (insertError) {
                logger.error({ err: insertError, documentId }, 'Failed to insert chunks')
                throw new AppError('DB_ERROR', 'Failed to store document chunks', 500)
            }

            // Update status to completed
            await documentService.updateProcessingStatus(documentId, 'completed')

            // Enqueue compression job (async, don't wait)
            try {
                const { enqueueCompression } = await import('../../jobs/compressionQueue.js')
                const projectId = document.project_id

                await enqueueCompression({
                    documentId,
                    projectId,
                    userId,
                    strategy: 'text_only', // Default strategy
                })

                logger.info({ documentId }, 'Compression job enqueued')
            } catch (compressionError) {
                // Don't fail if compression enqueue fails
                logger.warn({ err: compressionError, documentId }, 'Failed to enqueue compression job')
            }

            logger.info({ documentId, chunksCreated: chunks.length }, 'Document processing completed')

            return {
                documentId,
                chunksCreated: chunks.length,
                status: 'completed',
            }
        } catch (error: any) {
            logger.error({ err: error, documentId }, 'Document processing failed')

            // Update status to failed
            try {
                await documentService.updateProcessingStatus(documentId, 'failed')
            } catch (statusError) {
                logger.error({ err: statusError, documentId }, 'Failed to update status to failed')
            }

            return {
                documentId,
                chunksCreated: 0,
                status: 'failed',
                error: error.message || 'Unknown error',
            }
        }
    }

    /**
     * Get chunks for a document
     */
    async getDocumentChunks(documentId: string, userId: string) {
        // Verify ownership
        await documentService.getDocumentById(documentId, userId)

        const { data: chunks, error } = await supabase
            .from('project_document_chunks')
            .select('id, chunk_index, text, created_at')
            .eq('document_id', documentId)
            .order('chunk_index', { ascending: true })

        if (error) {
            logger.error({ err: error, documentId }, 'Failed to fetch chunks')
            throw new AppError('DB_ERROR', 'Failed to fetch document chunks', 500)
        }

        return chunks || []
    }

    /**
     * Reprocess a failed document
     */
    async reprocessDocument(documentId: string, userId: string): Promise<ProcessingResult> {
        const document = await documentService.getDocumentById(documentId, userId)

        if (document.processing_status !== 'failed') {
            throw new AppError(
                'INVALID_STATUS',
                'Can only reprocess documents with failed status',
                400
            )
        }

        // Delete existing chunks (if any)
        await supabase
            .from('project_document_chunks')
            .delete()
            .eq('document_id', documentId)

        // Reprocess
        return this.processDocument(documentId, userId)
    }
}

export const documentProcessor = new DocumentProcessor()
