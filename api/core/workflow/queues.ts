import { Queue } from 'bullmq'
import { getRedisClient } from '../redis/connection.js'
import { logger } from '../logger.js'

export const QUEUE_NAMES = {
    AGENT_TASKS: 'agent-tasks',
    SYSTEM_EVENTS: 'system-events',
    NOTIFICATIONS: 'notifications',
    WIZARD_PROCESSING: 'wizard-processing',
} as const

const queues: Record<string, Queue> = {}

export const getQueue = (queueName: string): Queue => {
    if (!queues[queueName]) {
        logger.info({ queueName }, 'Initializing BullMQ Queue')
        queues[queueName] = new Queue(queueName, {
            connection: getRedisClient(),
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: {
                    age: 24 * 3600, // Keep for 24 hours
                    count: 1000,
                },
                removeOnFail: {
                    age: 7 * 24 * 3600, // Keep for 7 days
                },
            },
        })
    }
    return queues[queueName]
}

export const closeQueues = async () => {
    await Promise.all(Object.values(queues).map((q) => q.close()))
}
