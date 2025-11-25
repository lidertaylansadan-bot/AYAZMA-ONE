import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evalService } from '../api/modules/eval/evalService.js'
import { supabase } from '../api/config/supabase.js'
import * as aiRouter from '../api/modules/ai/aiRouter.js'

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

vi.mock('../api/modules/ai/aiRouter.js', () => ({
    callLLM: vi.fn()
}))

describe('EvalService Consensus', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock eval matrix loading
        // @ts-ignore
        evalService.evalMatrix = {
            version: '1.0',
            description: 'Test Matrix',
            taskTypes: {},
            defaultMetrics: {
                description: 'Default',
                metrics: {
                    helpfulness: { weight: 1, description: 'Helpfulness', scale: '0-100' },
                    factuality: { weight: 1, description: 'Factuality', scale: '0-1' }
                }
            },
            qualityThresholds: { needs_fix: 0.6 }
        }
    })

    it('should calculate average scores from multiple models', async () => {
        // Mock LLM responses
        const mockCallLLM = vi.mocked(aiRouter.callLLM)

        mockCallLLM.mockImplementation(async (params) => {
            if (params.model === 'gpt-4') {
                return {
                    text: '',
                    content: JSON.stringify({
                        scores: { helpfulness: 80, factuality: 0.8 },
                        reasoning: 'Good'
                    }),
                    usage: { totalTokens: 100 }
                }
            } else if (params.model === 'claude-3') {
                return {
                    text: '',
                    content: JSON.stringify({
                        scores: { helpfulness: 90, factuality: 0.9 },
                        reasoning: 'Better'
                    }),
                    usage: { totalTokens: 100 }
                }
            }
            return { text: '', content: '{}', usage: {} }
        })

        // Mock supabase insert
        const mockInsert = vi.fn().mockResolvedValue({ error: null })
        // @ts-ignore
        supabase.from.mockReturnValue({ insert: mockInsert })

        const result = await evalService.evaluateAgentRun({
            agentRunId: 'run-1',
            userId: 'user-1',
            projectId: 'proj-1',
            taskType: 'default',
            prompt: 'test',
            output: 'test output',
            models: ['gpt-4', 'claude-3']
        })

        // Verify averages
        // Helpfulness: (80 + 90) / 2 = 85
        // Factuality: (0.8 + 0.9) / 2 = 0.85
        expect(result.scores.helpfulness).toBe(85)
        expect(result.scores.factuality).toBeCloseTo(0.85)

        // Verify consensus details
        expect(result.consensusDetails).toBeDefined()
        expect(result.consensusDetails.models).toHaveLength(2)
        expect(result.consensusDetails.individualResults).toHaveLength(2)
    })

    it('should handle model failures gracefully', async () => {
        // Mock LLM responses
        const mockCallLLM = vi.mocked(aiRouter.callLLM)

        mockCallLLM.mockImplementation(async (params) => {
            if (params.model === 'gpt-4') {
                return {
                    text: '',
                    content: JSON.stringify({
                        scores: { helpfulness: 80, factuality: 0.8 },
                        reasoning: 'Good'
                    }),
                    usage: { totalTokens: 100 }
                }
            } else {
                throw new Error('API Error')
            }
        })

        // Mock supabase insert
        const mockInsert = vi.fn().mockResolvedValue({ error: null })
        // @ts-ignore
        supabase.from.mockReturnValue({ insert: mockInsert })

        const result = await evalService.evaluateAgentRun({
            agentRunId: 'run-1',
            userId: 'user-1',
            projectId: 'proj-1',
            taskType: 'default',
            prompt: 'test',
            output: 'test output',
            models: ['gpt-4', 'claude-3']
        })

        // Should use only successful model scores
        expect(result.scores.helpfulness).toBe(80)

        // Verify consensus details shows failure
        const failedResult = result.consensusDetails.individualResults.find((r: any) => r.model === 'claude-3')
        expect(failedResult.success).toBe(false)
    })
})
