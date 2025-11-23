import { Job } from 'bullmq'
import { WorkerBase } from '../../../core/workflow/WorkerBase.js'
import { agentRegistry } from '../AgentRegistry.js'
import { AgentContext } from '../types.js'
import { logger } from '../../../core/logger.js'

export class WorkflowWorker extends WorkerBase<AgentContext> {
    constructor() {
        super('workflow-agent')
    }

    async process(job: Job<AgentContext>) {
        logger.info({ jobId: job.id }, 'Starting Workflow Agent Job')

        const agent = agentRegistry.get('workflow_designer')
        if (!agent) {
            throw new Error('Workflow Agent not found in registry')
        }

        const result = await agent.run(job.data)
        return result
    }
}

export const workflowWorker = new WorkflowWorker()
