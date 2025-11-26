/**
 * Pub/Sub Types
 * Defines typed message interfaces for agent-to-agent communication
 */

export type AgentName =
    | 'design_spec'
    | 'workflow_designer'
    | 'content_strategist'
    | 'orchestrator'

export type MessageType =
    | 'request'
    | 'response'
    | 'notification'
    | 'event'

/**
 * Base message structure for all agent communications
 */
export interface BaseAgentMessage {
    id: string
    type: MessageType
    from: AgentName
    to: AgentName | 'broadcast'
    timestamp: number
    correlationId?: string // For request-response patterns
}

/**
 * Request message sent from one agent to another
 */
export interface AgentRequest extends BaseAgentMessage {
    type: 'request'
    action: string
    payload: any
    timeout?: number // ms
}

/**
 * Response message sent in reply to a request
 */
export interface AgentResponse extends BaseAgentMessage {
    type: 'response'
    correlationId: string // Required for responses
    success: boolean
    result?: any
    error?: {
        code: string
        message: string
    }
}

/**
 * Notification message (fire-and-forget)
 */
export interface AgentNotification extends BaseAgentMessage {
    type: 'notification'
    event: string
    data: any
}

/**
 * Event message for agent lifecycle
 */
export interface AgentEvent extends BaseAgentMessage {
    type: 'event'
    event: AgentEventType
    data: any
}

export type AgentEventType =
    | 'agent.started'
    | 'agent.completed'
    | 'agent.failed'
    | 'agent.progress'
    | 'task.created'
    | 'task.assigned'
    | 'task.completed'
    | 'task.failed'

export type AgentMessage = AgentRequest | AgentResponse | AgentNotification | AgentEvent

/**
 * Message handler function
 */
export type MessageHandler = (message: AgentMessage) => Promise<void> | void

/**
 * Subscription options
 */
export interface SubscriptionOptions {
    filter?: (message: AgentMessage) => boolean
    priority?: number // Higher priority handlers execute first
}
