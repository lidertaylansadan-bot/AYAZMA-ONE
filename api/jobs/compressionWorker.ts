/**
 * Compression Worker
 * Starts a BullMQ worker that processes compression jobs using the TextOnlyCompressionService.
 */

import { Worker } from 'bullmq';
import { compressionQueue } from './compressionQueue';
import { redisConnection } from '../config/redis';
import { logger } from '../core/logger';
import { TextOnlyCompressionService } from '../modules/optical-compression/TextOnlyCompressionService';
import { supabase } from '../config/supabase';
import {
    emitCompressionStarted,
    emitCompressionCompleted,
    emitCompressionFailed
} from '../core/telemetry/events.js';

let workerInstance: Worker | null = null;

/**
 * Starts the compression worker.
 * Returns the Worker instance so callers can inspect it if needed.
 */
export function startCompressionWorker(): Worker {
    if (workerInstance) {
        logger.warn('Compression worker already started');
        return workerInstance;
    }

    const service = new TextOnlyCompressionService();

    workerInstance = new Worker<
        import('./compressionQueue').CompressionJobData,
        import('./compressionQueue').CompressionJobResult
    >(
        'compression',
        async (job) => {
            const { documentId, projectId, userId, strategy } = job.data;
            const startTime = Date.now();

            logger.info({ jobId: job.id, documentId, strategy }, 'Processing compression job');

            // Emit telemetry: compression started
            await emitCompressionStarted(documentId, projectId, userId, strategy);

            try {
                // 1️⃣ Load raw chunks for the document
                const { data: rawChunks, error: fetchErr } = await supabase
                    .from('project_document_chunks')
                    .select('id, text, page_number')
                    .eq('document_id', documentId)
                    .order('chunk_index', { ascending: true });

                if (fetchErr) {
                    throw new Error(`Failed to fetch document chunks: ${fetchErr.message}`);
                }

                if (!rawChunks || rawChunks.length === 0) {
                    logger.warn({ documentId }, 'No chunks found for document');
                    await emitCompressionFailed(documentId, projectId, userId, 'No chunks found for document');
                    return {
                        viewId: '',
                        rawTokenCount: 0,
                        compressedTokenCount: 0,
                        tokenSavingEstimate: 0,
                        processingTimeMs: 0,
                    };
                }

                // Map to DocumentChunk interface
                const chunks = rawChunks.map((c) => ({
                    id: c.id,
                    text: c.text,
                    pageNumber: c.page_number,
                }));

                // 2️⃣ Run compression
                const result = await service.compress({
                    documentId,
                    chunks,
                    strategy: strategy as any, // Cast to avoid type mismatch if string vs enum
                });

                // 3️⃣ Store compressed view record
                const { data: viewData, error: insertViewErr } = await supabase
                    .from('document_compressed_views')
                    .insert({
                        document_id: documentId,
                        project_id: projectId,
                        compression_strategy: result.strategy,
                        model_name: result.modelName,
                        raw_token_count: result.rawTokenCount,
                        compressed_token_count: result.compressedTokenCount,
                        token_saving_estimate: result.tokenSavingEstimate,
                        processing_time_ms: result.processingTimeMs,
                        metadata: result.metadata,
                        created_by: userId,
                    })
                    .select('id')
                    .single();

                if (insertViewErr || !viewData) {
                    throw new Error(`Failed to insert compressed view: ${insertViewErr?.message}`);
                }

                const viewId = viewData.id;

                // 4️⃣ Store compressed segments
                if (result.segments.length > 0) {
                    const segmentsToInsert = result.segments.map((seg: any) => ({
                        compressed_view_id: viewId,
                        segment_index: seg.segmentIndex,
                        segment_type: seg.segmentType,
                        payload: seg.payload,
                        source_chunk_ids: seg.sourceChunkIds,
                        page_numbers: seg.pageNumbers,
                        estimated_tokens: seg.estimatedTokens,
                    }));

                    const { error: insertSegmentsErr } = await supabase
                        .from('document_compressed_segments')
                        .insert(segmentsToInsert);

                    if (insertSegmentsErr) {
                        logger.error({ error: insertSegmentsErr, viewId }, 'Failed to insert segments');
                        throw new Error(`Failed to insert compressed segments: ${insertSegmentsErr.message}`);
                    }
                }

                // Emit telemetry: compression completed
                const processingTimeMs = Date.now() - startTime;
                await emitCompressionCompleted(documentId, projectId, userId, {
                    strategy: result.strategy,
                    modelName: result.modelName,
                    rawTokens: result.rawTokenCount,
                    compressedTokens: result.compressedTokenCount,
                    tokenSavingPercent: result.tokenSavingEstimate,
                    durationMs: processingTimeMs,
                    estimatedCost: (result.rawTokenCount / 1000) * 0.001 // Rough estimate
                });

                return {
                    viewId,
                    rawTokenCount: result.rawTokenCount,
                    compressedTokenCount: result.compressedTokenCount,
                    tokenSavingEstimate: result.tokenSavingEstimate,
                    processingTimeMs: result.processingTimeMs,
                } as import('./compressionQueue').CompressionJobResult;
            } catch (error) {
                // Emit telemetry: compression failed
                const errorMessage = error instanceof Error ? error.message : String(error);
                await emitCompressionFailed(documentId, projectId, userId, errorMessage);
                throw error;
            }
        },
        {
            connection: redisConnection,
            concurrency: 2,
        }
    );

    workerInstance.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, error: err?.message }, 'Compression job failed');
    });

    workerInstance.on('completed', (job) => {
        logger.info({ jobId: job.id }, 'Compression job completed');
    });

    logger.info('Compression worker started');
    return workerInstance;
}

/**
 * Gracefully stops the compression worker if it is running.
 */
export async function stopCompressionWorker(): Promise<void> {
    if (workerInstance) {
        await workerInstance.close();
        logger.info('Compression worker stopped');
        workerInstance = null;
    }
}
