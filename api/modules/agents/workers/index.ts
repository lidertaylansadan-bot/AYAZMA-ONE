import { designWorker } from './DesignWorker.js'
import { workflowWorker } from './WorkflowWorker.js'
import { contentWorker } from './ContentWorker.js'
import { logger } from '../../../core/logger.js'

export const initWorkers = () => {
    try {
        logger.info('Initializing Agent Workers...')
        // Workers are instantiated and start listening automatically upon import/instantiation
        // We just reference them here to ensure they are included in the bundle/runtime
        const workers = [designWorker, workflowWorker, contentWorker]
        logger.info({ count: workers.length }, 'Agent Workers Initialized')
    } catch (error) {
        logger.warn({ error }, 'Failed to initialize workers - Redis may not be available. Workflow features will be disabled.')
    }
}
