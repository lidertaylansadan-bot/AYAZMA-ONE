/**
 * Compression Job Queue
 * BullMQ queue for async document compression
 */

import { Queue, QueueEvents } from 'bullmq'
import { redisConnection } from '../../config/redis'
import type { CompressionStrategy } from '../optical-compression/types'
import { logger } from '../../core/logger'

// Job data interface
export interface CompressionJobData {
    documentId: string
    projectId: string
    userId: string
    strategy: CompressionStrategy
    targetTokenBudget?: number
}

// Job result interface
export interface CompressionJobResult {
    viewId: string
    rawTokenCount: number
    compressedTokenCount: number
    tokenSavingEstimate: number
    processingTimeMs: number
}

// Create queue
export const compressionQueue = new Queue<CompressionJobData, CompressionJobResult>(
    'compression',
    {
        connection: redisConnection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: {
                age: 24 * 3600, // Keep completed jobs for 24 hours
                count: 1000,
            },
            removeOnFail: {
                age: 7 * 24 * 3600, // Keep failed jobs for 7 days
            },
        },
    }
)

// Queue events for monitoring
export const compressionQueueEvents = new QueueEvents('compression', {
    connection: redisConnection,
})

// Event listeners
compressionQueueEvents.on('completed', ({ jobId, returnvalue }) => {
    logger.info('Compression job completed', {
        jobId,
        result: returnvalue,
    })
})

compressionQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error('Compression job failed', {
        jobId,
        reason: failedReason,
    })
})

compressionQueueEvents.on('progress', ({ jobId, data }) => {
    logger.debug('Compression job progress', {
        jobId,
        progress: data,
    })
})

/**
 * Add compression job to queue
 */
export async function enqueueCompression(
    data: CompressionJobData,
    options?: {
        priority?: number
        delay?: number
    }
): Promise<string> {
    const job = await compressionQueue.add('compress-document', data, {
        priority: options?.priority,
        delay: options?.delay,
    })

    logger.info('Compression job enqueued', {
        jobId: job.id,
        documentId: data.documentId,
        strategy: data.strategy,
    })

    return job.id!
}

/**
 * Get job status
 */
export async function getCompressionJobStatus(jobId: string) {
    const job = await compressionQueue.getJob(jobId)

    if (!job) {
        return null
    }

    const state = await job.getState()
    const progress = job.progress
    const returnValue = job.returnvalue

    return {
        id: job.id,
        state,
        progress,
        data: job.data,
        result: returnValue,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
    }
}

/**
 * Cancel compression job
 */
export async function cancelCompressionJob(jobId: string): Promise<void> {
    const job = await compressionQueue.getJob(jobId)

    if (job) {
        await job.remove()
        logger.info('Compression job cancelled', { jobId })
    }
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        compressionQueue.getWaitingCount(),
        compressionQueue.getActiveCount(),
        compressionQueue.getCompletedCount(),
        compressionQueue.getFailedCount(),
        compressionQueue.getDelayedCount(),
    ])

    return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
    }
}
