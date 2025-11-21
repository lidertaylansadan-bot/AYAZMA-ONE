import { BaseAgent } from './BaseAgent.js'
import type { AgentName } from './types.js'
import { AppError } from '../../core/app-error.js'
import { DesignSpecAgent } from './DesignAgent.js'
import { WorkflowDesignerAgent } from './WorkflowDesignerAgent.js'
import { ContentStrategistAgent } from './ContentStrategistAgent.js'

import { OrchestratorAgent } from './OrchestratorAgent.js'

class AgentRegistry {
  private agents = new Map<AgentName, BaseAgent>()

  register(agent: BaseAgent) {
    this.agents.set(agent.name, agent)
  }

  get(name: AgentName): BaseAgent {
    const agent = this.agents.get(name)
    if (!agent) throw new AppError('AGENT_NOT_FOUND', `Agent ${name} not found`, 404)
    return agent
  }

  list(): BaseAgent[] {
    return Array.from(this.agents.values())
  }
}

const registry = new AgentRegistry()
registry.register(new DesignSpecAgent())
registry.register(new WorkflowDesignerAgent())
registry.register(new ContentStrategistAgent())
registry.register(new OrchestratorAgent())

export const agentRegistry = registry