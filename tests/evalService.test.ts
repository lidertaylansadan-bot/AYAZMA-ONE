import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evalService } from '../api/modules/eval/evalService.js'
import { supabase } from '../api/config/supabase.js'

// Mock dependencies
vi.mock('../api/config/supabase.js', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}))

vi.mock('../api/modules/ai/aiRouter.js', () => ({
    callLLM: vi.fn().mockResolvedValue({
        text: JSON.stringify({
            scores: {
                helpfulness: 0.9,
                factuality: 0.8,
                coherence: 0.9,
                safety: 1.0,
                overall: 0.9
            },
            reasoning: 'Good response',
            notes: 'No issues'
        })
    })
}))

describe('EvalService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should evaluate an agent run successfully', async () => {
        // Mock supabase calls
        const mockInsert = vi.fn().mockResolvedValue({ data: {}, error: null })
        const mockFrom = vi.fn().mockReturnValue({
            insert: mockInsert
        })
        // @ts-ignore
        supabase.from.mockImplementation(mockFrom)

        const result = await evalService.evaluateAgentRun({
            agentRunId: 'run-123',
            userId: 'user-123',
            projectId: 'proj-123',
            input: 'test input',
            output: 'test output',
            taskType: 'generic_chat'
        })

        expect(result.scores.overall).toBeGreaterThan(0)
        expect(mockFrom).toHaveBeenCalledWith('agent_evaluations')
        expect(mockInsert).toHaveBeenCalled()
    })

    it('should handle evaluation failure gracefully', async () => {
        // Mock failure
        vi.mocked(supabase.from).mockImplementation(() => {
            throw new Error('DB Error')
        })

        await expect(evalService.evaluateAgentRun({
            agentRunId: 'run-123',
            userId: 'user-123',
            projectId: 'proj-123',
            input: 'test input',
            output: 'test output',
            taskType: 'generic_chat'
        })).rejects.toThrow('DB Error')
    })
})
