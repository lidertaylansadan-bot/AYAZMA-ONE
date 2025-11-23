import { Job } from 'bullmq'
import { WorkerBase } from '../../../core/workflow/WorkerBase.js'
import { agentRegistry } from '../AgentRegistry.js'
import { AgentContext } from '../types.js'
import { logger } from '../../../core/logger.js'

export class ContentWorker extends WorkerBase<AgentContext> {
    constructor() {
        super('content-agent')
    }

    async process(job: Job<AgentContext>) {
        logger.info({ jobId: job.id }, 'Starting Content Agent Job')

        const agent = agentRegistry.get('content_strategist')
        if (!agent) {
            throw new Error('Content Agent not found in registry')
        }

        const result = await agent.run(job.data)
        return result
    }
}

export const contentWorker = new ContentWorker()
