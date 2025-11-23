import { describe, it, expect, vi, beforeEach } from 'vitest'
import { routeAiRequest } from '../api/modules/ai/aiRouter'
import { providerRegistry } from '../api/modules/ai/providers/ProviderRegistry'
import { resolveEffectiveAiConfig } from '../api/modules/ai/configResolver'
import { logAiUsage } from '../api/modules/ai/usageLogger'

// Mock dependencies
vi.mock('../api/modules/ai/providers/ProviderRegistry', () => ({
    providerRegistry: {
        get: vi.fn()
    }
}))

vi.mock('../api/modules/ai/configResolver', () => ({
    resolveEffectiveAiConfig: vi.fn()
}))

vi.mock('../api/modules/ai/usageLogger', () => ({
    logAiUsage: vi.fn()
}))

vi.mock('../api/core/config', () => ({
    config: {
        defaultAiProvider: 'google',
        defaultAiModel: 'gemini-pro'
    }
}))

describe('aiRouter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('routes request to default provider and logs usage', async () => {
        // Setup mocks
        const mockProvider = {
            call: vi.fn().mockResolvedValue({
                provider: 'google',
                model: 'gemini-pro',
                content: 'Response',
                usage: { inputTokens: 10, outputTokens: 20 }
            })
        }
        vi.mocked(providerRegistry.get).mockReturnValue(mockProvider as any)
        vi.mocked(resolveEffectiveAiConfig).mockResolvedValue({ provider: 'google', model: 'gemini-pro' })

        // Execute
        const input = {
            userId: 'user1',
            projectId: 'proj1',
            taskType: 'generation',
            prompt: 'Hello'
        }
        const result = await routeAiRequest(input)

        // Verify
        expect(resolveEffectiveAiConfig).toHaveBeenCalledWith({ userId: 'user1', projectId: 'proj1', preferences: undefined })
        expect(providerRegistry.get).toHaveBeenCalledWith('google')
        expect(mockProvider.call).toHaveBeenCalled()
        expect(logAiUsage).toHaveBeenCalled()
        expect(result.content).toBe('Response')
    })
})
