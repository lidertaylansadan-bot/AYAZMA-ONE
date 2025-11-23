import { Job } from 'bullmq'
import { WorkerBase } from '../../../core/workflow/WorkerBase.js'
import { agentRegistry } from '../AgentRegistry.js'
import { AgentContext } from '../types.js'
import { logger } from '../../../core/logger.js'

interface DesignJobData extends AgentContext {
    // Add any specific data if needed
}

export class DesignWorker extends WorkerBase<DesignJobData> {
    constructor() {
        super('design-agent')
    }

    async process(job: Job<DesignJobData>) {
        logger.info({ jobId: job.id }, 'Starting Design Agent Job')

        const agent = agentRegistry.get('design_spec')
        if (!agent) {
            throw new Error('Design Agent not found in registry')
        }

        const result = await agent.run(job.data)

        // We could save result to DB here or return it
        // For Flow, returning it is useful
        return result
    }
}

export const designWorker = new DesignWorker()
