import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContextCompressor } from '../../api/modules/context-engineer/ContextCompressor'

// Mock LangChain components
const mockInvoke = vi.fn()
const mockPipe = vi.fn(() => ({
    pipe: vi.fn(() => ({
        invoke: mockInvoke
    }))
}))

vi.mock('@langchain/openai', () => ({
    ChatOpenAI: vi.fn().mockImplementation(() => ({}))
}))

vi.mock('@langchain/core/prompts', () => ({
    PromptTemplate: {
        fromTemplate: vi.fn(() => ({
            pipe: mockPipe
        }))
    }
}))

vi.mock('@langchain/core/output_parsers', () => ({
    StringOutputParser: vi.fn()
}))

vi.mock('../../api/core/config', () => ({
    config: {
        aiOpenaiKey: 'test-key'
    }
}))

describe('ContextCompressor', () => {
    let compressor: ContextCompressor

    beforeEach(() => {
        vi.clearAllMocks()
        compressor = new ContextCompressor()
    })

    it('should return original text if it fits within maxTokens', async () => {
        const text = "Short text"
        const maxTokens = 100
        const result = await compressor.compress(text, maxTokens)
        expect(result).toBe(text)
        expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('should compress text if it exceeds maxTokens', async () => {
        const longText = "A".repeat(1000) // ~250 tokens
        const maxTokens = 50
        const compressedText = "Compressed summary"

        mockInvoke.mockResolvedValue(compressedText)

        const result = await compressor.compress(longText, maxTokens)

        expect(result).toBe(`[COMPRESSED]: ${compressedText}`)
        expect(mockInvoke).toHaveBeenCalledWith({
            text: longText,
            maxTokens: maxTokens
        })
    })

    it('should fallback to truncation on error', async () => {
        const longText = "A".repeat(1000)
        const maxTokens = 50

        mockInvoke.mockRejectedValue(new Error('API Error'))

        const result = await compressor.compress(longText, maxTokens)

        expect(result).toContain('[Truncated]')
        expect(result.length).toBeLessThan(longText.length)
    })
})
