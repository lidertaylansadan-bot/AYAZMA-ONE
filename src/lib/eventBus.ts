import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

type EventHandler = (payload: any) => void

export class EventBus {
    private channels: Map<string, RealtimeChannel> = new Map()
    private handlers: Map<string, EventHandler[]> = new Map()

    constructor() {
        // Singleton instance logic could go here if needed, 
        // but exporting a const instance is usually enough in JS modules.
    }

    /**
     * Subscribe to a specific event on a channel
     */
    subscribe(channelName: string, event: string, handler: EventHandler) {
        let channel = this.channels.get(channelName)

        if (!channel) {
            channel = supabase.channel(channelName)
            channel.subscribe()
            this.channels.set(channelName, channel)
        }

        // Register handler for local dispatch if needed, 
        // but for Supabase Realtime we bind to the channel event.

        // We need to handle the binding carefully to avoid duplicate bindings 
        // if subscribe is called multiple times for the same channel.
        // Supabase client handles multiplexing, but we should track our handlers.

        const eventKey = `${channelName}:${event}`
        if (!this.handlers.has(eventKey)) {
            this.handlers.set(eventKey, [])

            // Bind the actual Supabase listener once per event type per channel
            channel.on('broadcast', { event }, (payload) => {
                const handlers = this.handlers.get(eventKey) || []
                handlers.forEach(h => h(payload.payload))
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

        // If no more handlers for this channel, we could potentially unsubscribe from Supabase
        // but keeping the channel open is often fine for performance.
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

            // Wait for subscription to be active? 
            // Supabase usually buffers, but for immediate publish we might want to wait.
            // For now, we assume best effort.
        }

        await channel.send({
            type: 'broadcast',
            event,
            payload,
        })
    }
}

export const eventBus = new EventBus()
