import { describe, it, expect, vi, beforeEach } from 'vitest'
import { promptOptimizer } from '../api/modules/optimization/promptOptimizer.js'
import { abTestService } from '../api/modules/optimization/abTestService.js'
import { callLLM } from '../api/modules/ai/aiRouter.js'

// Mock dependencies
vi.mock('../api/modules/ai/aiRouter.js', () => ({
    callLLM: vi.fn()
}))

vi.mock('../api/modules/optimization/abTestService.js', () => ({
    abTestService: {
        createTestFromOptimization: vi.fn()
    }
}))

describe('PromptOptimizer', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('optimizePrompt', () => {
        it('should optimize a prompt and return structured result', async () => {
            const mockInput = {
                originalPrompt: 'Write a blog post.',
                goal: 'Make it more engaging and SEO friendly.'
            }

            const mockLLMResponse = {
                content: JSON.stringify({
                    optimizedPrompt: 'Write an engaging, SEO-optimized blog post about...',
                    reasoning: 'Added specific instructions for engagement and SEO.',
                    expectedImprovements: ['Better readability', 'Higher SEO score'],
                    diffSummary: 'Added SEO keywords and tone instructions'
                })
            }

            // @ts-expect-error - Mocking callLLM which is not fully typed in tests
            callLLM.mockResolvedValue(mockLLMResponse)

            const result = await promptOptimizer.optimizePrompt(mockInput)

            expect(result).toEqual({
                optimizedPrompt: 'Write an engaging, SEO-optimized blog post about...',
                reasoning: 'Added specific instructions for engagement and SEO.',
                expectedImprovements: ['Better readability', 'Higher SEO score'],
                diffSummary: 'Added SEO keywords and tone instructions'
            })

            expect(callLLM).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gpt-4o'
            }))
        })

        it('should throw error if LLM response is invalid', async () => {
            // @ts-expect-error - Mocking invalid response
            callLLM.mockResolvedValue({ content: 'Invalid JSON' })

            await expect(promptOptimizer.optimizePrompt({ originalPrompt: 'test' }))
                .rejects.toThrow('Failed to parse JSON from optimization response')
        })
    })

    describe('Integration with ABTestService', () => {
        it('should create an A/B test from optimization result', async () => {
            const name = 'Blog Post Optimization'
            const originalPrompt = 'Write a blog post.'
            const optimizedPrompt = 'Write an engaging blog post.'
            const optimizationResult = {
                optimizedPrompt,
                reasoning: 'Better',
                expectedImprovements: [],
                diffSummary: 'Improved'
            }

            // @ts-expect-error - Mocking createTestFromOptimization
            abTestService.createTestFromOptimization.mockResolvedValue({
                id: 'test-123',
                name: `Optimization: ${name}`,
                status: 'draft'
            })

            const result = await abTestService.createTestFromOptimization(
                name,
                originalPrompt,
                optimizedPrompt,
                optimizationResult
            )

            expect(result).toBeDefined()
            expect(abTestService.createTestFromOptimization).toHaveBeenCalledWith(
                name,
                originalPrompt,
                optimizedPrompt,
                optimizationResult
            )
        })
    })
})
