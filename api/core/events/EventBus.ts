import { getRedisClient, getSubscriberClient } from '../redis/connection.js'
import { logger } from '../logger.js'
import { BaseEvent, EventSubscription } from './types.js'
import { v4 as uuidv4 } from 'uuid'

class EventBus {
    private subscriptions: Map<string, EventSubscription[]> = new Map()
    private isSubscribedToRedis = false

    constructor() {
        // Initialize immediately if needed, or lazy load
    }

    private async ensureRedisSubscription() {
        if (this.isSubscribedToRedis) return

        const sub = getSubscriberClient()

        // Subscribe to a global channel or pattern
        await sub.subscribe('ayazma:events')

        sub.on('message', async (channel, message) => {
            if (channel === 'ayazma:events') {
                try {
                    const event: BaseEvent = JSON.parse(message)
                    await this.handleIncomingEvent(event)
                } catch (err) {
                    logger.error({ err, message }, 'Failed to parse or handle incoming event')
                }
            }
        })

        this.isSubscribedToRedis = true
        logger.info('EventBus subscribed to Redis channel: ayazma:events')
    }

    private async handleIncomingEvent(event: BaseEvent) {
        const handlers = this.subscriptions.get(event.type) || []
        if (handlers.length > 0) {
            logger.debug({ type: event.type, handlerCount: handlers.length }, 'Processing event')

            // Execute handlers in parallel (or could be sequential if needed)
            await Promise.allSettled(handlers.map(async (sub) => {
                try {
                    await sub.handler(event)
                } catch (err) {
                    logger.error({ err, eventId: event.id, eventType: event.type }, 'Error in event handler')
                }
            }))
        }
    }

    public async publish(type: string, payload: any, metadata?: Record<string, any>): Promise<string> {
        const event: BaseEvent = {
            id: uuidv4(),
            type,
            timestamp: Date.now(),
            payload,
            metadata
        }

        const pub = getRedisClient()
        await pub.publish('ayazma:events', JSON.stringify(event))

        logger.debug({ eventId: event.id, type }, 'Event published')
        return event.id
    }

    public async subscribe(eventType: string, handler: (event: BaseEvent) => Promise<void>): Promise<string> {
        await this.ensureRedisSubscription()

        const subscriptionId = uuidv4()
        const subscription: EventSubscription = {
            id: subscriptionId,
            eventType,
            handler
        }

        const current = this.subscriptions.get(eventType) || []
        this.subscriptions.set(eventType, [...current, subscription])

        logger.info({ eventType, subscriptionId }, 'Subscribed to event')
        return subscriptionId
    }

    public unsubscribe(eventType: string, subscriptionId: string) {
        const current = this.subscriptions.get(eventType)
        if (current) {
            this.subscriptions.set(eventType, current.filter(s => s.id !== subscriptionId))
        }
    }
}

export const eventBus = new EventBus()
