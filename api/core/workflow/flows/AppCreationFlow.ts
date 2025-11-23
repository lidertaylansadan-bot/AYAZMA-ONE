import { FlowProducer } from 'bullmq'
import { getRedisClient } from '../../redis/connection.js'
import { AgentContext } from '../../../modules/agents/types.js'
import { logger } from '../../logger.js'

let flowProducer: FlowProducer | null = null

const getFlowProducer = () => {
    if (!flowProducer) {
        const redisClient = getRedisClient()
        if (!redisClient) {
            logger.warn('Redis not available, AppCreationFlow will not work')
            return null
        }
        try {
            flowProducer = new FlowProducer({ connection: redisClient })
        } catch (error) {
            logger.error({ error }, 'Failed to create FlowProducer')
            return null
        }
    }
    return flowProducer
}

export const createAppCreationFlow = async (context: AgentContext) => {
    const producer = getFlowProducer()
    if (!producer) {
        throw new Error('Workflow engine not available - Redis is required for this feature')
    }

    return producer.add({
        name: 'finalize-app',
        queueName: 'app-creation',
        data: context,
        children: [
            {
                name: 'generate-code',
                queueName: 'code-gen', // Future implementation
                data: context,
                children: [
                    {
                        name: 'design-spec',
                        queueName: 'design-agent',
                        data: context,
                        opts: {
                            failParentOnFailure: true
                        }
                    },
                    {
                        name: 'workflow-spec',
                        queueName: 'workflow-agent',
                        data: context,
                        opts: {
                            failParentOnFailure: true
                        }
                    },
                    {
                        name: 'content-strategy',
                        queueName: 'content-agent',
                        data: context,
                        opts: {
                            failParentOnFailure: true
                        }
                    }
                ]
            }
        ]
    })
}
