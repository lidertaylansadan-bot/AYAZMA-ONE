import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AgentMessageBus } from '../../api/modules/pubsub/AgentMessageBus'
import type { AgentRequest, AgentNotification } from '../../api/modules/pubsub/types'

// Mock BullMQ
const mockQueue = {
    add: vi.fn().mockResolvedValue({ id: 'job-1' }),
    getWaitingCount: vi.fn().mockResolvedValue(0),
    getActiveCount: vi.fn().mockResolvedValue(0),
    getCompletedCount: vi.fn().mockResolvedValue(0),
    getFailedCount: vi.fn().mockResolvedValue(0)
}

const mockWorker = {
    on: vi.fn()
}

vi.mock('bullmq', () => ({
    Queue: vi.fn().mockImplementation(() => mockQueue),
    Worker: vi.fn().mockImplementation(() => mockWorker)
}))

// Mock Redis
vi.mock('../../api/core/redis/connection', () => ({
    getRedisClient: vi.fn(() => ({}))
}))

describe('AgentMessageBus', () => {
    let messageBus: AgentMessageBus

    beforeEach(() => {
        vi.clearAllMocks()
        messageBus = new AgentMessageBus()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should subscribe to agent messages', () => {
        const handler = vi.fn()
        const unsubscribe = messageBus.subscribe('design_spec', handler)

        expect(typeof unsubscribe).toBe('function')
    })

    it('should send notifications', async () => {
        await messageBus.notify('design_spec', 'task.created', { taskId: '123' })

        // Verify queue.add was called
        expect(messageBus['messageQueue'].add).toHaveBeenCalled()
    })

    it('should emit events', async () => {
        await messageBus.emitEvent('agent.started', { agentName: 'design_spec' })

        expect(messageBus['messageQueue'].add).toHaveBeenCalled()
    })

    it('should get queue metrics', async () => {
        const metrics = await messageBus.getMetrics()

        expect(metrics).toEqual({
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0
        })
    })

    it('should handle request timeout', async () => {
        const promise = messageBus.request('design_spec', 'generate', { prompt: 'test' }, 100)

        await expect(promise).rejects.toThrow('Request timeout')
    }, 10000)

    it('should deliver messages to subscribed handlers', async () => {
        const handler = vi.fn()
        messageBus.subscribe('design_spec', handler)

        const message: AgentNotification = {
            id: 'msg-1',
            type: 'notification',
            from: 'orchestrator',
            to: 'design_spec',
            timestamp: Date.now(),
            event: 'test.event',
            data: { test: true }
        }

        await messageBus['deliverMessage'](message)

        expect(handler).toHaveBeenCalledWith(message)
    })

    it('should filter messages based on subscription options', async () => {
        const handler = vi.fn()
        messageBus.subscribe('design_spec', handler, {
            filter: (msg) => msg.type === 'request'
        })

        const notification: AgentNotification = {
            id: 'msg-1',
            type: 'notification',
            from: 'orchestrator',
            to: 'design_spec',
            timestamp: Date.now(),
            event: 'test.event',
            data: {}
        }

        await messageBus['deliverMessage'](notification)

        expect(handler).not.toHaveBeenCalled()
    })

    it('should handle broadcast messages', async () => {
        const handler1 = vi.fn()
        const handler2 = vi.fn()

        messageBus.subscribe('broadcast', handler1)
        messageBus.subscribe('broadcast', handler2)

        await messageBus.notify('broadcast', 'system.update', { version: '1.0' })

        // Both handlers should eventually be called when worker processes the message
        // Note: In real scenario, worker would call deliverMessage
    })
})
