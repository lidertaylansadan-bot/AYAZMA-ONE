import { BaseAgent } from './BaseAgent.js'
import type { AgentContext, AgentArtifactPayload } from './types.js'
import { agentRegistry } from './AgentRegistry.js'

export class OrchestratorAgent extends BaseAgent {
    constructor() {
        super('orchestrator', 'Master agent that coordinates Design, Workflow, and Content generation')
    }

    async run(context: AgentContext): Promise<{ artifacts: AgentArtifactPayload[] }> {
        const artifacts: AgentArtifactPayload[] = []

        // 1. Run Design Agent
        const designAgent = agentRegistry.get('design_spec')
        const designResult = await designAgent.run(context)
        artifacts.push(...designResult.artifacts)

        // 2. Run Workflow Agent
        // We could potentially pass design output to workflow agent here if we wanted to be smarter
        const workflowAgent = agentRegistry.get('workflow_designer')
        const workflowResult = await workflowAgent.run(context)
        artifacts.push(...workflowResult.artifacts)

        // 3. Run Content Agent
        const contentAgent = agentRegistry.get('content_strategist')
        const contentResult = await contentAgent.run(context)
        artifacts.push(...contentResult.artifacts)

        return { artifacts }
    }
}
