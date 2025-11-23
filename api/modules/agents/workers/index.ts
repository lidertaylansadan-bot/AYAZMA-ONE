// Worker initialization for agents and background jobs
import { designWorker } from './DesignWorker.js';
import { workflowWorker } from './WorkflowWorker.js';
import { contentWorker } from './ContentWorker.js';
import { logger } from '../../../core/logger.js';
// Import compression workers starter
import { startAllWorkers } from '../../../jobs/index.js';

export const initWorkers = () => {
    try {
        logger.info('Initializing Agent Workers...');
        // Ensure agent workers are imported (instantiated on import)
        const workers = [designWorker, workflowWorker, contentWorker];
        logger.info({ count: workers.length }, 'Agent Workers Initialized');
        // Start background workers (compression, etc.)
        startAllWorkers();
        logger.info('Background workers initialized');
    } catch (error) {
        logger.warn({ error }, 'Failed to initialize workers - Redis may not be available. Workflow features will be disabled.');
    }
};
