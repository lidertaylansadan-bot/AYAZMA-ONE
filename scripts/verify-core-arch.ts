import { OrchestratorAgent } from '../api/modules/agents/OrchestratorAgent'
import { eventBus } from '../api/core/eventBus'
import { agentRegistry } from '../api/modules/agents/AgentRegistry'
import { BaseAgent } from '../api/modules/agents/BaseAgent'

// Mock agents to avoid full dependency chain
class MockAgent extends BaseAgent {
    constructor(name: string) {
        super(name, 'Mock Agent')
    }
    async run(context: any) {
        console.log(`[MockAgent:${this.name}] Running...`)
        return { artifacts: [{ type: 'log', title: `Log from ${this.name}`, content: 'Success' }] }
    }
}

// Register mock agents
agentRegistry.register(new MockAgent('design_spec'))
agentRegistry.register(new MockAgent('workflow_designer'))
agentRegistry.register(new MockAgent('content_strategist'))

async function verify() {
    console.log('Starting Core Architecture Verification...')

    // Subscribe to events
    eventBus.subscribe('orchestrator', 'task_started', (payload) => {
        console.log('[EventBus] Task Started:', payload)
    })
    eventBus.subscribe('orchestrator', 'task_completed', (payload) => {
        console.log('[EventBus] Task Completed:', payload)
    })

    const orchestrator = new OrchestratorAgent()

    const context = {
        userId: 'test-user',
        projectId: 'test-project',
        extra: {
            userGoal: 'Build a simple website'
        }
    }

    console.log('Running Orchestrator...')
    const result = await orchestrator.run(context as any)

    console.log('Orchestrator finished.')
    console.log('Artifacts:', result.artifacts.length)

    if (result.artifacts.length === 3) {
        console.log('VERIFICATION SUCCESS: All 3 agents ran and produced artifacts.')
    } else {
        console.error('VERIFICATION FAILED: Expected 3 artifacts, got', result.artifacts.length)
        process.exit(1)
    }
}

verify().catch(console.error)
