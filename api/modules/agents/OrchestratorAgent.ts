import { BaseAgent } from './BaseAgent.js'
import type { AgentContext, AgentArtifactPayload, AgentName } from './types.js'
import { agentRegistry } from './AgentRegistry.js'
import { eventBus } from '../../core/eventBus.js'
import { logger } from '../../core/logger.js'

interface Task {
    id: string
    type: string
    agent: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    dependencies: string[]
}

export class OrchestratorAgent extends BaseAgent {
    private tasks: Map<string, Task> = new Map()

    constructor() {
        super('orchestrator', 'Master agent that coordinates Design, Workflow, and Content generation')
        this.setupEventListeners()
    }

    private setupEventListeners() {
        eventBus.subscribe('orchestrator', 'task_completed', (payload) => {
            this.handleTaskCompletion(payload)
        })
    }

    private handleTaskCompletion(payload: any) {
        const { taskId, status, result } = payload
        const task = this.tasks.get(taskId)
        if (task) {
            task.status = status
            logger.info({ taskId, status, resultSummary: result ? 'Result received' : 'No result' }, 'Task status updated')
        }
    }

    async run(context: AgentContext): Promise<{ artifacts: AgentArtifactPayload[] }> {
        const artifacts: AgentArtifactPayload[] = []
        const { projectId } = context

        logger.info({ projectId }, 'Orchestrator starting execution plan')

        // Define tasks
        const tasks: Task[] = [
            { id: 'design', type: 'design_spec', agent: 'design_spec', status: 'pending', dependencies: [] },
            { id: 'workflow', type: 'workflow_design', agent: 'workflow_designer', status: 'pending', dependencies: ['design'] },
            { id: 'content', type: 'content_strategy', agent: 'content_strategist', status: 'pending', dependencies: ['design'] }
        ]

        // Initialize tasks map
        tasks.forEach(t => this.tasks.set(t.id, t))

        // Execute tasks (simplified sequential for now, but ready for async)
        for (const task of tasks) {
            if (task.status === 'pending') {
                try {
                    task.status = 'running'
                    const agent = agentRegistry.get(task.agent as AgentName)

                    // Notify start
                    await eventBus.publish('orchestrator', 'task_started', { taskId: task.id, agent: task.agent })

                    const result = await agent.run(context)
                    artifacts.push(...result.artifacts)

                    task.status = 'completed'

                    // Notify completion
                    await eventBus.publish('orchestrator', 'task_completed', { taskId: task.id, status: 'completed', result })

                } catch (error) {
                    task.status = 'failed'
                    logger.error({ err: error, taskId: task.id }, 'Task failed')
                    await eventBus.publish('orchestrator', 'task_failed', { taskId: task.id, error })
                }
            }
        }

        return { artifacts }
    }
}
