import type { AgentName, AgentContext, AgentArtifactPayload } from './types.js'

export abstract class BaseAgent {
  public readonly name: AgentName
  public readonly description: string

  constructor(name: AgentName, description: string) {
    this.name = name
    this.description = description
  }

  abstract run(context: AgentContext): Promise<{ artifacts: AgentArtifactPayload[] }>
}