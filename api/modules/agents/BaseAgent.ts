import type { AgentName, AgentContext, AgentArtifactPayload } from './types.js'
import type { TaskType } from '../context-engineer/types.js'

export abstract class BaseAgent {
  public readonly name: AgentName
  public readonly description: string
  public readonly needsContext: boolean
  public readonly contextTaskType?: TaskType

  constructor(
    name: AgentName,
    description: string,
    options: { needsContext?: boolean; contextTaskType?: TaskType } = {}
  ) {
    this.name = name
    this.description = description
    this.needsContext = options.needsContext ?? false
    this.contextTaskType = options.contextTaskType
  }

  abstract run(context: AgentContext): Promise<{ artifacts: AgentArtifactPayload[] }>
}