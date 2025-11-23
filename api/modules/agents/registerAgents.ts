import { agentRegistry } from './AgentRegistry.js'
import { DesignSpecAgent } from './DesignAgent.js'
import { WorkflowDesignerAgent } from './WorkflowDesignerAgent.js'
import { ContentStrategistAgent } from './ContentStrategistAgent.js'
import { OrchestratorAgent } from './OrchestratorAgent.js'
import { ContextEngineerAgent } from './ContextEngineerAgent.js'

export function registerAllAgents() {
    agentRegistry.register(new DesignSpecAgent())
    agentRegistry.register(new WorkflowDesignerAgent())
    agentRegistry.register(new ContentStrategistAgent())
    agentRegistry.register(new OrchestratorAgent())
    agentRegistry.register(new ContextEngineerAgent())
    console.log('All agents registered successfully.')
}
