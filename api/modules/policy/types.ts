/**
 * Policy Engine Types
 */

export interface PolicyConfig {
    version: string
    description: string
    policies: {
        agents: AgentPolicy
        ai: AiPolicy
        webAutomation: WebAutomationPolicy
        documents: DocumentPolicy
        security: SecurityPolicy
        optimization: OptimizationPolicy
    }
}

export interface AgentPolicy {
    enabled: boolean
    allowedAgents: string[]
    maxConcurrentRuns: number
    maxRunsPerHour: number
}

export interface AiPolicy {
    enabled: boolean
    allowedProviders: string[]
    allowedModels: Record<string, string[]>
    defaultProvider: string
    defaultModel: string
    maxTokensPerRequest: number
    requireApprovalForExpensiveModels: boolean
}

export interface WebAutomationPolicy {
    enabled: boolean
    allowedDomains: string[]
    blockedDomains: string[]
    maxNavigationsPerSession: number
    maxSessionDurationMinutes: number
    allowJavaScript: boolean
    allowCookies: boolean
}

export interface DocumentPolicy {
    enabled: boolean
    maxFileSizeMB: number
    allowedMimeTypes: string[]
    maxDocumentsPerProject: number
    enableOCR: boolean
    enableCompression: boolean
}

export interface SecurityPolicy {
    enableAuditLogging: boolean
    enableRateLimiting: boolean
    requireAuthentication: boolean
    sessionTimeoutMinutes: number
    maxLoginAttempts: number
    lockoutDurationMinutes: number
}

export interface OptimizationPolicy {
    enableAutoOptimization: boolean
    autoApplyLowRiskChanges: boolean
    evaluationThreshold: number
    costSavingsThresholdPercent: number
}

export interface PolicyCheckResult {
    allowed: boolean
    reason?: string
    metadata?: Record<string, any>
}
