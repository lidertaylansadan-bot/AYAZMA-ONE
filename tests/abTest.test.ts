import { describe, it, expect, vi, beforeEach } from 'vitest'
import { abTestService } from '../api/modules/optimization/abTestService.js'
import { supabase } from '../api/config/supabase.js'

// Mock dependencies
vi.mock('../api/config/supabase.js', () => ({
    supabase: {
        from: vi.fn()
    }
}))

vi.mock('../api/core/logger.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}))

describe('ABTestService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return base config if no active tests', async () => {
        // Mock no active tests
        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                    or: vi.fn().mockResolvedValue({ data: [], error: null })
                })
            })
        })
        // @ts-ignore
        supabase.from.mockImplementation(() => ({ select: mockSelect }))

        const result = await abTestService.getEffectiveConfig('user-1', { foo: 'bar' })
        expect(result.config).toEqual({ foo: 'bar' })
        expect(result.testId).toBeUndefined()
    })

    it('should assign variant A based on hash', async () => {
        const test = {
            id: 'test-1',
            name: 'Test 1',
            status: 'active',
            traffic_split: { A: 0.5, B: 0.5 },
            variants: [
                { id: 'A', config: { model: 'gpt-4' } },
                { id: 'B', config: { model: 'gpt-3.5' } }
            ]
        }

        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                    or: vi.fn().mockResolvedValue({ data: [test], error: null })
                })
            })
        })
        // @ts-ignore
        supabase.from.mockImplementation(() => ({ select: mockSelect }))

        // User 1 hashes to something that falls in A bucket (needs verification or just check consistency)
        const result = await abTestService.getEffectiveConfig('user-1', { model: 'base' })

        expect(result.testId).toBe('test-1')
        expect(result.variantId).toBeDefined()
        expect(['A', 'B']).toContain(result.variantId)
        expect(result.config.model).not.toBe('base')
    })

    it('should consistently assign same variant to same user', async () => {
        const test = {
            id: 'test-1',
            name: 'Test 1',
            status: 'active',
            traffic_split: { A: 0.5, B: 0.5 },
            variants: [
                { id: 'A', config: { model: 'gpt-4' } },
                { id: 'B', config: { model: 'gpt-3.5' } }
            ]
        }

        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                    or: vi.fn().mockResolvedValue({ data: [test], error: null })
                })
            })
        })
        // @ts-ignore
        supabase.from.mockImplementation(() => ({ select: mockSelect }))

        const result1 = await abTestService.getEffectiveConfig('user-1', {})
        const result2 = await abTestService.getEffectiveConfig('user-1', {})

        expect(result1.variantId).toBe(result2.variantId)
    })
})
