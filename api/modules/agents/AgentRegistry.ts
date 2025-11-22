import { BaseAgent } from './BaseAgent.js'
import type { AgentName } from './types.js'
import { AppError } from '../../core/app-error.js'

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
// Agents are registered via registerAgents.ts to avoid circular dependencies


export const agentRegistry = registry