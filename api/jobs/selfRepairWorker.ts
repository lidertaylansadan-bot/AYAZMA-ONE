/**
 * Self-Repair Worker
 * Periodically checks agent health and triggers self-repair if needed
 */

import { Worker, Queue } from 'bullmq'
import { redisConnection as redis } from '../config/redis.js'
import { logger } from '../core/logger.js'
import { selfRepairService } from '../modules/agents/selfRepairService.js'

const QUEUE_NAME = 'self-repair'

// Create queue for scheduling
export const selfRepairQueue = new Queue(QUEUE_NAME, { connection: redis })

// Worker to process repair jobs
export const selfRepairWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
        const { agentName, projectId } = job.data
        logger.info({ jobId: job.id, agentName }, 'Processing self-repair job')

        try {
            const repaired = await selfRepairService.checkAndRepairAgent(agentName, projectId)

            return {
                repaired,
                timestamp: new Date().toISOString()
            }
        } catch (error) {
            logger.error({ error, jobId: job.id }, 'Self-repair job failed')
            throw error
        }
    },
    { connection: redis }
)

// Event listeners
selfRepairWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, result: job.returnvalue }, 'Self-repair job completed')
})

selfRepairWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Self-repair job failed')
})

/**
 * Schedule a self-repair check for an agent
 */
export async function scheduleSelfRepairCheck(agentName: string, projectId?: string) {
    await selfRepairQueue.add(
        'check-agent-health',
        { agentName, projectId },
        {
            jobId: `repair-${agentName}-${Date.now()}`,
            removeOnComplete: true,
            removeOnFail: 100
        }
    )
}

/**
 * Initialize recurring checks for all known agents
 */
export async function initSelfRepairSchedule() {
    const agents = ['design_spec', 'workflow_designer', 'content_strategist', 'orchestrator', 'context_engineer']

    for (const agent of agents) {
        // Add a repeatable job to check every hour
        await selfRepairQueue.add(
            'hourly-health-check',
            { agentName: agent },
            {
                repeat: { pattern: '0 * * * *' }, // Every hour
                jobId: `hourly-check-${agent}`
            }
        )
    }

    logger.info('Self-repair schedule initialized')
}
