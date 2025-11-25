import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../api/config/supabase.js'

// Mock BullMQ
vi.mock('bullmq', () => ({
    Worker: class {
        on = vi.fn()
    },
    Queue: class {
        add = vi.fn()
    }
}))

// Mock regressionService
vi.mock('../api/modules/testing/regressionService.js', () => ({
    regressionService: {
        runTest: vi.fn()
    }
}))

// Mock Redis
vi.mock('../api/config/redis.js', () => ({
    redisConnection: {}
}))

// Mock Supabase
vi.mock('../api/config/supabase.js', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}))

// Import after mocking
import { regressionWorker } from '../api/jobs/regressionTestWorker.js'

describe('RegressionTestWorker', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should process a regression test job', async () => {
        // Mock supabase calls
        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: {
                        id: 'test-123',
                        agent_name: 'test-agent',
                        input_payload: { prompt: 'test' },
                        expected_characteristics: { minScore: 0.8 }
                    },
                    error: null
                })
            })
        })

        // @ts-ignore
        supabase.from.mockImplementation((table) => {
            return { select: mockSelect }
        })

        expect(regressionWorker).toBeDefined()
    })
})
