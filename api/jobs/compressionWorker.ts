/**
 * Compression Worker
 * Starts a BullMQ worker that processes compression jobs using the TextOnlyCompressionService.
 */

import { Worker } from 'bullmq';
import { compressionQueue } from './compressionQueue';
import { redisConnection } from '../config/redis';
import { logger } from '../core/logger';
import { TextOnlyCompressionService } from '../optical-compression/TextOnlyCompressionService';
import { supabase } from '../config/supabase';

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
            logger.info('Processing compression job', { jobId: job.id, documentId, strategy });

            // 1️⃣ Load raw chunks for the document
            const { data: rawChunks, error: fetchErr } = await supabase
                .from('project_document_chunks')
                .select('id, text')
                .eq('document_id', documentId);

            if (fetchErr) {
                throw new Error(`Failed to fetch document chunks: ${fetchErr.message}`);
            }

            const rawText = rawChunks?.map((c) => c.text).join('\n') ?? '';

            // 2️⃣ Run compression (currently only text‑only)
            const { viewId, tokenStats, payload } = await service.compress(rawText);

            // 3️⃣ Store compressed view record
            const { error: insertErr } = await supabase.from('document_compressed_views').insert({
                id: viewId,
                document_id: documentId,
                project_id: projectId,
                strategy,
                raw_token_count: tokenStats.raw,
                compressed_token_count: tokenStats.compressed,
                token_saving_estimate: tokenStats.saving,
                processing_time_ms: tokenStats.timeMs,
                payload,
            });

            if (insertErr) {
                throw new Error(`Failed to insert compressed view: ${insertErr.message}`);
            }

            // TODO: optionally split payload into segments and store in document_compressed_segments

            return {
                viewId,
                rawTokenCount: tokenStats.raw,
                compressedTokenCount: tokenStats.compressed,
                tokenSavingEstimate: tokenStats.saving,
                processingTimeMs: tokenStats.timeMs,
            } as import('./compressionQueue').CompressionJobResult;
        },
        {
            connection: redisConnection,
            concurrency: 2,
        }
    );

    workerInstance.on('failed', (job, err) => {
        logger.error('Compression job failed', { jobId: job?.id, error: err?.message });
    });

    workerInstance.on('completed', (job) => {
        logger.info('Compression job completed', { jobId: job.id });
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
