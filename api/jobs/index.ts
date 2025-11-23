/**
 * Worker Starter
 * Initialize all background workers
 */

import { startCompressionWorker } from './compressionWorker'
import { logger } from '../core/logger'

export function startAllWorkers() {
    logger.info('Starting background workers...')

    // Start compression worker
    const compressionWorker = startCompressionWorker()

    logger.info('All workers started successfully')

    return {
        compressionWorker,
    }
}

export function stopAllWorkers() {
    logger.info('Stopping background workers...')

    const { stopCompressionWorker } = require('./compressionWorker')
    stopCompressionWorker()

    logger.info('All workers stopped')
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping workers')
    stopAllWorkers()
    process.exit(0)
})

process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping workers')
    stopAllWorkers()
    process.exit(0)
})
