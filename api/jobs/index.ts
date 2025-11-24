import { compressionWorker } from './compressionWorker.js'
import { selfRepairWorker } from './selfRepairWorker.js'
import { regressionWorker } from './regressionTestWorker.js'
import { closedLoopWorker } from './closedLoopWorker.js'
import { logger } from '../core/logger.js'

export const initWorkers = () => {
    logger.info('Initializing workers...')

    // Workers are automatically started when instantiated
    // We just reference them here to ensure they are loaded
    console.log('Compression worker status:', compressionWorker.isRunning() ? 'running' : 'stopped')
    console.log('Self-repair worker status:', selfRepairWorker.isRunning() ? 'running' : 'stopped')
    console.log('Regression worker status:', regressionWorker.isRunning() ? 'running' : 'stopped')
    console.log('Closed-loop worker status:', closedLoopWorker.isRunning() ? 'running' : 'stopped')
}

export {
    compressionWorker,
    selfRepairWorker,
    regressionWorker,
    closedLoopWorker
}

// Graceful shutdown
const stopAllWorkers = async () => {
    logger.info('Stopping background workers...')
    await compressionWorker.close()
    await selfRepairWorker.close()
    await regressionWorker.close()
    await closedLoopWorker.close()
    logger.info('All workers stopped')
}

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping workers')
    stopAllWorkers().then(() => process.exit(0))
})

process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping workers')
    stopAllWorkers().then(() => process.exit(0))
})
