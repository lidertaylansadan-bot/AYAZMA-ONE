/**
 * Policy Engine
 * Enforces business rules and constraints
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../../core/logger.js'
import type { PolicyConfig, PolicyCheckResult } from './types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class PolicyEngine {
    private policy: PolicyConfig | null = null
    private policyPath: string

    constructor(policyPath?: string) {
        this.policyPath = policyPath || path.join(__dirname, '../../../config/policy.json')
    }

    /**
     * Load policy configuration from file
     */
    async loadPolicy(): Promise<void> {
        try {
            const content = await fs.readFile(this.policyPath, 'utf-8')
            this.policy = JSON.parse(content)
            logger.info({ version: this.policy?.version }, 'Policy loaded')
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to load policy')
            throw new Error('Failed to load policy configuration')
        }
    }

    /**
     * Get current policy (load if not loaded)
     */
    private async getPolicy(): Promise<PolicyConfig> {
        if (!this.policy) {
            await this.loadPolicy()
        }
        return this.policy!
    }

    /**
     * Check if an agent can be run
     */
    async canRunAgent(agentName: string): Promise<PolicyCheckResult> {
        const policy = await this.getPolicy()
        const agentPolicy = policy.policies.agents

        if (!agentPolicy.enabled) {
            return {
                allowed: false,
                reason: 'Agent execution is disabled by policy'
            }
        }

        if (!agentPolicy.allowedAgents.includes(agentName)) {
            return {
                allowed: false,
                reason: `Agent '${agentName}' is not in the allowed agents list`,
                metadata: { allowedAgents: agentPolicy.allowedAgents }
            }
        }

        return { allowed: true }
    }

    /**
     * Check if a model can be called
     */
    async canCallModel(provider: string, model: string): Promise<PolicyCheckResult> {
        const policy = await this.getPolicy()
        const aiPolicy = policy.policies.ai

        if (!aiPolicy.enabled) {
            return {
                allowed: false,
                reason: 'AI calls are disabled by policy'
            }
        }

        if (!aiPolicy.allowedProviders.includes(provider)) {
            return {
                allowed: false,
                reason: `Provider '${provider}' is not allowed`,
                metadata: { allowedProviders: aiPolicy.allowedProviders }
            }
        }

        const allowedModels = aiPolicy.allowedModels[provider]
        if (!allowedModels || !allowedModels.includes(model)) {
            return {
                allowed: false,
                reason: `Model '${model}' is not allowed for provider '${provider}'`,
                metadata: { allowedModels: allowedModels || [] }
            }
        }

        return { allowed: true }
    }

    /**
     * Check if a domain can be accessed (for web automation)
     */
    async canAccessDomain(url: string): Promise<PolicyCheckResult> {
        const policy = await this.getPolicy()
        const webPolicy = policy.policies.webAutomation

        if (!webPolicy.enabled) {
            return {
                allowed: false,
                reason: 'Web automation is disabled by policy'
            }
        }

        try {
            const urlObj = new URL(url)
            const hostname = urlObj.hostname

            // Check blocked domains first
            for (const pattern of webPolicy.blockedDomains) {
                if (this.matchDomain(hostname, pattern)) {
                    return {
                        allowed: false,
                        reason: `Domain '${hostname}' is blocked by policy`,
                        metadata: { blockedPattern: pattern }
                    }
                }
            }

            // Check allowed domains
            for (const pattern of webPolicy.allowedDomains) {
                if (this.matchDomain(hostname, pattern)) {
                    return { allowed: true }
                }
            }

            return {
                allowed: false,
                reason: `Domain '${hostname}' is not in the allowed domains list`,
                metadata: { allowedDomains: webPolicy.allowedDomains }
            }
        } catch (error) {
            return {
                allowed: false,
                reason: 'Invalid URL format'
            }
        }
    }

    /**
     * Check if a file upload is allowed
     */
    async canUploadFile(mimeType: string, sizeBytes: number): Promise<PolicyCheckResult> {
        const policy = await this.getPolicy()
        const docPolicy = policy.policies.documents

        if (!docPolicy.enabled) {
            return {
                allowed: false,
                reason: 'Document uploads are disabled by policy'
            }
        }

        const maxSizeBytes = docPolicy.maxFileSizeMB * 1024 * 1024
        if (sizeBytes > maxSizeBytes) {
            return {
                allowed: false,
                reason: `File size exceeds maximum allowed (${docPolicy.maxFileSizeMB}MB)`,
                metadata: { maxSizeMB: docPolicy.maxFileSizeMB, actualSizeMB: sizeBytes / (1024 * 1024) }
            }
        }

        if (!docPolicy.allowedMimeTypes.includes(mimeType)) {
            return {
                allowed: false,
                reason: `File type '${mimeType}' is not allowed`,
                metadata: { allowedMimeTypes: docPolicy.allowedMimeTypes }
            }
        }

        return { allowed: true }
    }

    /**
     * Get default AI provider and model
     */
    async getDefaultAiConfig(): Promise<{ provider: string; model: string }> {
        const policy = await this.getPolicy()
        return {
            provider: policy.policies.ai.defaultProvider,
            model: policy.policies.ai.defaultModel
        }
    }

    /**
     * Check if auto-optimization is enabled
     */
    async isAutoOptimizationEnabled(): Promise<boolean> {
        const policy = await this.getPolicy()
        return policy.policies.optimization.enableAutoOptimization
    }

    /**
     * Match domain against pattern (supports wildcards)
     */
    private matchDomain(hostname: string, pattern: string): boolean {
        // Convert wildcard pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')

        const regex = new RegExp(`^${regexPattern}$`, 'i')
        return regex.test(hostname)
    }
}

// Singleton instance
export const policyEngine = new PolicyEngine()

// Auto-load policy on module import
policyEngine.loadPolicy().catch(err => {
    logger.error({ err }, 'Failed to auto-load policy on startup')
})
