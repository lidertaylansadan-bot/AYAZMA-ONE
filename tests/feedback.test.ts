import { describe, it, expect, vi, beforeEach } from 'vitest'
import { feedbackService } from '../api/modules/feedback/feedbackService.js'
import { evalService } from '../api/modules/eval/evalService.js'
import { supabase } from '../api/config/supabase.js'

// Mock dependencies
vi.mock('../api/config/supabase.js', () => ({
    supabase: {
        from: vi.fn()
    }
}))

vi.mock('../api/modules/eval/evalService.js', () => ({
    evalService: {
        incorporateUserFeedback: vi.fn()
    }
}))

describe('FeedbackService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('submitFeedback', () => {
        it('should submit feedback and trigger evaluation update', async () => {
            const mockInput = {
                agentRunId: 'run-123',
                userId: 'user-123',
                rating: 5,
                comment: 'Great job!'
            }

            const mockFeedback = {
                id: 'feedback-1',
                agent_run_id: mockInput.agentRunId,
                user_id: mockInput.userId,
                rating: mockInput.rating,
                comment: mockInput.comment,
                created_at: new Date().toISOString()
            }

            // Mock Supabase insert
            const mockInsert = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockFeedback, error: null })
                })
            })
            // @ts-ignore
            supabase.from.mockImplementation(() => ({ insert: mockInsert }))

            // Mock incorporateUserFeedback
            // @ts-ignore
            evalService.incorporateUserFeedback.mockResolvedValue({})

            const result = await feedbackService.submitFeedback(mockInput)

            expect(result).toEqual({
                id: mockFeedback.id,
                agentRunId: mockFeedback.agent_run_id,
                userId: mockFeedback.user_id,
                rating: mockFeedback.rating,
                comment: mockFeedback.comment,
                createdAt: expect.any(Date)
            })

            expect(supabase.from).toHaveBeenCalledWith('user_feedback')
            expect(mockInsert).toHaveBeenCalledWith({
                agent_run_id: mockInput.agentRunId,
                user_id: mockInput.userId,
                rating: mockInput.rating,
                comment: mockInput.comment
            })

            // Verify that evaluation update was triggered
            expect(evalService.incorporateUserFeedback).toHaveBeenCalledWith(mockInput.agentRunId)
        })

        it('should throw error if rating is invalid', async () => {
            const mockInput = {
                agentRunId: 'run-123',
                userId: 'user-123',
                rating: 6, // Invalid rating
                comment: 'Too good'
            }

            await expect(feedbackService.submitFeedback(mockInput)).rejects.toThrow('Rating must be between 1 and 5')
        })
    })

    describe('getFeedbackForRun', () => {
        it('should return feedback for a run', async () => {
            const mockFeedback = {
                id: 'feedback-1',
                agent_run_id: 'run-123',
                user_id: 'user-123',
                rating: 4,
                comment: 'Good',
                created_at: new Date().toISOString()
            }

            // Mock Supabase select
            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockFeedback, error: null })
                })
            })
            // @ts-ignore
            supabase.from.mockImplementation(() => ({ select: mockSelect }))

            const result = await feedbackService.getFeedbackForRun('run-123')

            expect(result).toEqual({
                id: mockFeedback.id,
                agentRunId: mockFeedback.agent_run_id,
                userId: mockFeedback.user_id,
                rating: mockFeedback.rating,
                comment: mockFeedback.comment,
                createdAt: expect.any(Date)
            })
        })

        it('should return null if no feedback found', async () => {
            // Mock Supabase select returning null
            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                })
            })
            // @ts-ignore
            supabase.from.mockImplementation(() => ({ select: mockSelect }))

            const result = await feedbackService.getFeedbackForRun('run-123')

            expect(result).toBeNull()
        })
    })
})
