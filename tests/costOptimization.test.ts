import { describe, it, expect, vi, beforeEach } from 'vitest'
import { costManager } from '../api/modules/optimization/costManager.js'
import { semanticCache } from '../api/modules/optimization/semanticCache.js'
import { supabase } from '../api/config/supabase.js'

// Mock dependencies
vi.mock('../api/config/supabase.js', () => ({
    supabase: {
        from: vi.fn()
    }
}))

describe('Cost Optimization', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('CostManager', () => {
        it('should check budget and return status', async () => {
            const projectId = 'proj-123'
            const budget = 50.0

            // Mock project settings
            const mockSettingsSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { monthly_budget: budget }, error: null })
                })
            })

            // Mock usage logs
            const mockUsageSelect = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockResolvedValue({ data: [{ cost_usd: 10 }, { cost_usd: 5 }], error: null })
                    })
                })
            })

            // @ts-expect-error - Mocking supabase chain
            supabase.from.mockImplementation((table) => {
                if (table === 'project_ai_settings') return { select: mockSettingsSelect }
                if (table === 'ai_usage_logs') return mockUsageSelect()
                return {}
            })

            const result = await costManager.checkBudget(projectId)

            expect(result).toEqual({
                exceeded: false,
                spend: 15,
                budget: 50
            })
        })

        it('should report exceeded budget', async () => {
            const projectId = 'proj-123'
            const budget = 10.0

            // Mock project settings
            const mockSettingsSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { monthly_budget: budget }, error: null })
                })
            })

            // Mock usage logs
            const mockUsageSelect = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        gte: vi.fn().mockResolvedValue({ data: [{ cost_usd: 8 }, { cost_usd: 3 }], error: null })
                    })
                })
            })

            // @ts-expect-error - Mocking supabase chain
            supabase.from.mockImplementation((table) => {
                if (table === 'project_ai_settings') return { select: mockSettingsSelect }
                if (table === 'ai_usage_logs') return mockUsageSelect()
                return {}
            })

            const result = await costManager.checkBudget(projectId)

            expect(result).toEqual({
                exceeded: true,
                spend: 11,
                budget: 10
            })
        })
    })

    describe('SemanticCache', () => {
        it('should get cached response', async () => {
            const prompt = 'Hello'
            const provider = 'openai'
            const model = 'gpt-4o'
            const cachedResponse = { text: 'Hi there' }

            const mockSelect = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gt: vi.fn().mockReturnValue({
                                    single: vi.fn().mockResolvedValue({ data: { response: cachedResponse }, error: null })
                                })
                            })
                        })
                    })
                })
            })

            // @ts-expect-error - Mocking supabase chain
            supabase.from.mockImplementation(() => mockSelect())

            const result = await semanticCache.get(prompt, provider, model)

            expect(result).toEqual(cachedResponse)
        })

        it('should return null on cache miss', async () => {
            const mockSelect = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                gt: vi.fn().mockReturnValue({
                                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                                })
                            })
                        })
                    })
                })
            })

            // @ts-expect-error - Mocking supabase chain
            supabase.from.mockImplementation(() => mockSelect())

            const result = await semanticCache.get('test', 'openai', 'gpt-4o')

            expect(result).toBeNull()
        })
    })
})
