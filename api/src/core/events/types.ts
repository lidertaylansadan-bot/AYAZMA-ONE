export interface BaseEvent {
    id: string
    type: string
    timestamp: number
    payload: any
    metadata?: Record<string, any>
}

export interface EventSubscription {
    id: string
    eventType: string
    handler: (event: BaseEvent) => Promise<void>
}

// System Events
export const SYSTEM_EVENTS = {
    AGENT_STARTED: 'agent.started',
    AGENT_COMPLETED: 'agent.completed',
    AGENT_FAILED: 'agent.failed',
    WIZARD_COMPLETED: 'wizard.completed',
    WORKFLOW_STARTED: 'workflow.started',
    WORKFLOW_COMPLETED: 'workflow.completed',
    WORKFLOW_FAILED: 'workflow.failed',
} as const
