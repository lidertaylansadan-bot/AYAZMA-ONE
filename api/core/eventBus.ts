import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../config/supabase.js'
import { logger } from './logger.js'

type EventHandler = (payload: any) => void

export class EventBus {
    private channels: Map<string, RealtimeChannel> = new Map()
    private handlers: Map<string, EventHandler[]> = new Map()

    /**
     * Subscribe to a specific event on a channel
     */
    subscribe(channelName: string, event: string, handler: EventHandler) {
        let channel = this.channels.get(channelName)

        if (!channel) {
            channel = supabase.channel(channelName)
            channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger.info({ channel: channelName }, 'EventBus subscribed to channel')
                }
            })
            this.channels.set(channelName, channel)
        }

        const eventKey = `${channelName}:${event}`
        if (!this.handlers.has(eventKey)) {
            this.handlers.set(eventKey, [])

            channel.on('broadcast', { event }, (payload) => {
                const handlers = this.handlers.get(eventKey) || []
                handlers.forEach(h => {
                    try {
                        h(payload.payload)
                    } catch (err) {
                        logger.error({ err, channel: channelName, event }, 'Error in event handler')
                    }
                })
            })
        }

        this.handlers.get(eventKey)?.push(handler)

        return () => this.unsubscribe(channelName, event, handler)
    }

    /**
     * Unsubscribe a handler
     */
    unsubscribe(channelName: string, event: string, handler: EventHandler) {
        const eventKey = `${channelName}:${event}`
        const handlers = this.handlers.get(eventKey)

        if (handlers) {
            const index = handlers.indexOf(handler)
            if (index > -1) {
                handlers.splice(index, 1)
            }
        }
    }

    /**
     * Publish an event to a channel
     */
    async publish(channelName: string, event: string, payload: any) {
        let channel = this.channels.get(channelName)

        if (!channel) {
            channel = supabase.channel(channelName)
            channel.subscribe()
            this.channels.set(channelName, channel)
        }

        await channel.send({
            type: 'broadcast',
            event,
            payload,
        })
    }
}

export const eventBus = new EventBus()
