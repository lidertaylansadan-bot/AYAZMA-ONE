/**
 * Agent Message Bus
 * Provides typed, reliable messaging between agents using Redis pub/sub and BullMQ
 */

import { v4 as uuidv4 } from 'uuid'
import { Queue, Worker } from 'bullmq'
import { getRedisClient } from '../../core/redis/connection.js'
import { logger } from '../../core/logger.js'
import type {
    AgentMessage,
    AgentName,
    AgentRequest,
    AgentResponse,
    AgentNotification,
    AgentEvent,
    MessageHandler,
    SubscriptionOptions
} from './types.js'

export class AgentMessageBus {
    private messageQueue: Queue
    private handlers: Map<string, Array<{ handler: MessageHandler; options?: SubscriptionOptions }>> = new Map()
    private pendingRequests: Map<string, { resolve: (response: AgentResponse) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }> = new Map()

    constructor() {
        const redis = getRedisClient()

        // Create BullMQ queue for reliable message delivery
        this.messageQueue = new Queue('agent-messages', {
            connection: redis
        })

        // Start worker to process messages
        this.startWorker()
    }

    private startWorker() {
        const redis = getRedisClient()

        const worker = new Worker('agent-messages', async (job) => {
            const message = job.data as AgentMessage
            await this.deliverMessage(message)
        }, {
            connection: redis
        })

        worker.on('failed', (job, err) => {
            logger.error({ err, jobId: job?.id }, 'Message delivery failed')
        })

        logger.info('AgentMessageBus worker started')
    }

    private async deliverMessage(message: AgentMessage) {
        const targetKey = message.to === 'broadcast' ? 'broadcast' : `agent:${message.to}`
        const handlers = this.handlers.get(targetKey) || []

        // Sort by priority
        const sortedHandlers = handlers.sort((a, b) => (b.options?.priority || 0) - (a.options?.priority || 0))

        for (const { handler, options } of sortedHandlers) {
            // Apply filter if present
            if (options?.filter && !options.filter(message)) {
                continue
            }

            try {
                await handler(message)
            } catch (err) {
                logger.error({ err, messageId: message.id, to: message.to }, 'Error in message handler')
            }
        }

        // Handle responses to pending requests
        if (message.type === 'response' && message.correlationId) {
            const pending = this.pendingRequests.get(message.correlationId)
            if (pending) {
                clearTimeout(pending.timeout)
                this.pendingRequests.delete(message.correlationId)

                if (message.success) {
                    pending.resolve(message)
                } else {
                    pending.reject(new Error(message.error?.message || 'Request failed'))
                }
            }
        }
    }

    /**
     * Send a request to another agent and wait for response
     */
    async request(to: AgentName, action: string, payload: any, timeout = 30000): Promise<AgentResponse> {
        const requestId = uuidv4()
        const message: AgentRequest = {
            id: requestId,
            type: 'request',
            from: 'orchestrator', // TODO: Get from context
            to,
            timestamp: Date.now(),
            correlationId: requestId,
            action,
            payload,
            timeout
        }

        // Add to queue for reliable delivery
        await this.messageQueue.add('message', message)

        // Wait for response
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.pendingRequests.delete(requestId)
                reject(new Error(`Request timeout after ${timeout}ms`))
            }, timeout)

            this.pendingRequests.set(requestId, { resolve, reject, timeout: timeoutHandle })
        })
    }

    /**
     * Send a response to a request
     */
    async respond(request: AgentRequest, success: boolean, result?: any, error?: { code: string; message: string }) {
        const message: AgentResponse = {
            id: uuidv4(),
            type: 'response',
            from: request.to as AgentName, // Responding agent
            to: request.from,
            timestamp: Date.now(),
            correlationId: request.correlationId || request.id,
            success,
            result,
            error
        }

        await this.messageQueue.add('message', message)
    }

    /**
     * Send a notification (fire-and-forget)
     */
    async notify(to: AgentName | 'broadcast', event: string, data: any) {
        const message: AgentNotification = {
            id: uuidv4(),
            type: 'notification',
            from: 'orchestrator', // TODO: Get from context
            to,
            timestamp: Date.now(),
            event,
            data
        }

        await this.messageQueue.add('message', message)
    }

    /**
     * Emit an event
     */
    async emitEvent(event: string, data: any) {
        const message: AgentEvent = {
            id: uuidv4(),
            type: 'event',
            from: 'orchestrator', // TODO: Get from context
            to: 'broadcast',
            timestamp: Date.now(),
            event: event as any,
            data
        }

        await this.messageQueue.add('message', message)
    }

    /**
     * Subscribe to messages for a specific agent
     */
    subscribe(agentName: AgentName | 'broadcast', handler: MessageHandler, options?: SubscriptionOptions): () => void {
        const key = agentName === 'broadcast' ? 'broadcast' : `agent:${agentName}`

        if (!this.handlers.has(key)) {
            this.handlers.set(key, [])
        }

        this.handlers.get(key)!.push({ handler, options })

        logger.info({ agentName, options }, 'Subscribed to agent messages')

        // Return unsubscribe function
        return () => {
            const handlers = this.handlers.get(key)
            if (handlers) {
                const index = handlers.findIndex(h => h.handler === handler)
                if (index > -1) {
                    handlers.splice(index, 1)
                }
            }
        }
    }

    /**
     * Get queue metrics
     */
    async getMetrics() {
        const waiting = await this.messageQueue.getWaitingCount()
        const active = await this.messageQueue.getActiveCount()
        const completed = await this.messageQueue.getCompletedCount()
        const failed = await this.messageQueue.getFailedCount()

        return { waiting, active, completed, failed }
    }
}

export const agentMessageBus = new AgentMessageBus()
