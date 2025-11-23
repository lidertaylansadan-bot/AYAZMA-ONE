import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrchestratorAgent } from '../api/modules/agents/OrchestratorAgent'
import { agentRegistry } from '../api/modules/agents/AgentRegistry'

// Mock dependencies
vi.mock('../api/modules/agents/AgentRegistry', () => ({
    agentRegistry: {
        get: vi.fn()
    }
}))

describe('OrchestratorAgent', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('runs design, workflow, and content agents sequentially', async () => {
        // Setup mocks
        const mockDesignAgent = { run: vi.fn().mockResolvedValue({ artifacts: [{ id: 'design1' }] }) }
        const mockWorkflowAgent = { run: vi.fn().mockResolvedValue({ artifacts: [{ id: 'workflow1' }] }) }
        const mockContentAgent = { run: vi.fn().mockResolvedValue({ artifacts: [{ id: 'content1' }] }) }

        vi.mocked(agentRegistry.get)
            .mockReturnValueOnce(mockDesignAgent as any)
            .mockReturnValueOnce(mockWorkflowAgent as any)
            .mockReturnValueOnce(mockContentAgent as any)

        // Execute
        const agent = new OrchestratorAgent()
        const context = { userId: 'u1', projectId: 'p1', input: {} }
        const result = await agent.run(context as any)

        // Verify
        expect(agentRegistry.get).toHaveBeenCalledWith('design_spec')
        expect(agentRegistry.get).toHaveBeenCalledWith('workflow_designer')
        expect(agentRegistry.get).toHaveBeenCalledWith('content_strategist')

        expect(mockDesignAgent.run).toHaveBeenCalledWith(context)
        expect(mockWorkflowAgent.run).toHaveBeenCalledWith(context)
        expect(mockContentAgent.run).toHaveBeenCalledWith(context)

        expect(result.artifacts).toHaveLength(3)
        expect(result.artifacts).toEqual([{ id: 'design1' }, { id: 'workflow1' }, { id: 'content1' }])
    })
})
