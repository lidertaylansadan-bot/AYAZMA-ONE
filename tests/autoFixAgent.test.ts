import { describe, it, expect, vi, beforeEach } from 'vitest'
import { autoFixAgent } from '../api/modules/agents/autoFixAgent.js'
import { supabase } from '../api/config/supabase.js'

// Mock dependencies
vi.mock('../api/config/supabase.js', () => ({
    supabase: {
        from: vi.fn()
    }
}))

vi.mock('../api/modules/ai/aiRouter.js', () => ({
    callLLM: vi.fn().mockResolvedValue({
        text: JSON.stringify({
            fixedOutput: 'fixed content',
            fixNotes: 'fixed it',
            diffSummary: 'changes made'
        })
    })
}))

vi.mock('../api/core/telemetry/events.js', () => ({
    emitAutoFixCompleted: vi.fn().mockResolvedValue(undefined)
}))

describe('AutoFixAgent', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should attempt auto-fix successfully', async () => {
        // Mock supabase calls
        const mockInsert = vi.fn().mockResolvedValue({ error: null })
        const mockFrom = vi.fn().mockReturnValue({
            insert: mockInsert
        })
        // @ts-ignore
        supabase.from.mockImplementation(mockFrom)

        const result = await autoFixAgent.attemptAutoFix({
            agentRunId: 'run-123',
            userId: 'user-123',
            projectId: 'proj-123',
            originalOutput: 'bad content',
            evalResult: {
                agentRunId: 'run-123',
                userId: 'user-123',
                projectId: 'proj-123',
                taskType: 'generic_chat',
                evaluatedAt: new Date().toISOString(),
                scores: {
                    overall: 0.4,
                    helpfulness: 0.4,
                    factuality: 0.5,
                    coherence: 0.5,
                    safety: 1.0
                },
                metricScores: { helpfulness: 0.4 },
                needsFix: true,
                notes: 'Needs improvement'
            },
            taskType: 'generic_chat',
            userPrompt: 'fix this'
        })

        expect(result.success).toBe(true)
        expect(result.fixedOutput).toBe('fixed content')
        expect(mockFrom).toHaveBeenCalledWith('agent_fixes')
        expect(mockInsert).toHaveBeenCalled()
    })
})
