/**
 * Self-Repair Service
 * Monitors agent performance and optimizes configurations
 */

import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import { callLLM } from '../ai/aiRouter.js'
import { logAuditEvent } from '../../core/auditLogger.js'

export interface AgentConfig {
    id: string
    agentName: string
    promptTemplate: string
    temperature: number
    maxTokens: number
    toolConfig: any
    version: number
}

export interface OptimizationSuggestion {
    promptTemplate?: string
    temperature?: number
    maxTokens?: number
    toolConfig?: any
    reasoning: string
}

export class SelfRepairService {
    /**
     * Check if an agent needs repair
     * Triggered when failure rate > threshold (e.g., 60%)
     */
    async checkAndRepairAgent(agentName: string, projectId?: string): Promise<boolean> {
        logger.info({ agentName }, 'Checking agent health for self-repair')

        try {
            // 1. Analyze recent performance (last 10 runs)
            const { data: runs, error } = await supabase
                .from('agent_runs')
                .select(`
          id, 
          status, 
          created_at,
          agent_evaluations!inner(score_helpfulness, needs_fix)
        `)
                .eq('agent_name', agentName)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error
            if (!runs || runs.length < 5) return false // Need minimum data

            // Calculate failure rate (failed status or needs_fix=true)
            const failures = runs.filter(r =>
                r.status === 'failed' ||
                (r.agent_evaluations && r.agent_evaluations[0]?.needs_fix)
            ).length

            const failureRate = failures / runs.length

            // Threshold: 60% failure rate
            if (failureRate < 0.6) {
                logger.info({ agentName, failureRate }, 'Agent health is acceptable')
                return false
            }

            logger.warn({ agentName, failureRate }, 'Agent health critical - initiating self-repair')

            // 2. Get current config
            const currentConfig = await this.getCurrentConfig(agentName)

            // 3. Generate optimization
            const suggestion = await this.generateOptimization(agentName, currentConfig, runs)

            // 4. Apply optimization
            await this.applyOptimization(agentName, currentConfig, suggestion, projectId)

            return true
        } catch (error) {
            logger.error({ error, agentName }, 'Self-repair failed')
            return false
        }
    }

    /**
     * Get current agent configuration
     */
    private async getCurrentConfig(agentName: string): Promise<AgentConfig> {
        const { data, error } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('agent_name', agentName)
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .single()

        if (error || !data) {
            // Return default if no config found
            return {
                id: 'default',
                agentName,
                promptTemplate: '', // Should be loaded from code/file if empty
                temperature: 0.7,
                maxTokens: 2000,
                toolConfig: {},
                version: 0
            }
        }

        return {
            id: data.id,
            agentName: data.agent_name,
            promptTemplate: data.prompt_template,
            temperature: data.temperature,
            maxTokens: data.max_tokens,
            toolConfig: data.tool_config,
            version: data.version
        }
    }

    /**
     * Generate optimization suggestion using LLM
     */
    private async generateOptimization(
        agentName: string,
        config: AgentConfig,
        runs: any[]
    ): Promise<OptimizationSuggestion> {
        // Prepare performance summary for LLM
        const performanceSummary = runs.map(r => ({
            status: r.status,
            needsFix: r.agent_evaluations?.[0]?.needs_fix,
            score: r.agent_evaluations?.[0]?.score_helpfulness
        }))

        const prompt = `
      The AI agent '${agentName}' is underperforming with a failure rate of ${(performanceSummary.filter(r => r.needsFix || r.status === 'failed').length / runs.length * 100).toFixed(0)}%.
      
      Current Configuration:
      - Temperature: ${config.temperature}
      - Max Tokens: ${config.maxTokens}
      - Prompt Template (excerpt): ${config.promptTemplate.substring(0, 500)}...

      Recent Performance:
      ${JSON.stringify(performanceSummary, null, 2)}

      Analyze the failures and suggest configuration changes to improve performance.
      You can modify temperature, maxTokens, or suggest prompt improvements.
      
      Respond with JSON:
      {
        "temperature": <number|null>,
        "maxTokens": <number|null>,
        "promptTemplate": <string|null>,
        "reasoning": "<explanation>"
      }
    `

        const response = await callLLM({
            provider: 'openai',
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are an expert AI systems optimizer.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2
        })

        try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/)
            if (!jsonMatch) throw new Error('No JSON found')
            return JSON.parse(jsonMatch[0])
        } catch (e) {
            logger.error({ error: e }, 'Failed to parse optimization suggestion')
            return { reasoning: 'Failed to generate valid suggestion' }
        }
    }

    /**
     * Apply optimization to database
     */
    private async applyOptimization(
        agentName: string,
        current: AgentConfig,
        suggestion: OptimizationSuggestion,
        projectId?: string
    ): Promise<void> {
        const newVersion = current.version + 1

        const newConfig = {
            agent_name: agentName,
            prompt_template: suggestion.promptTemplate || current.promptTemplate,
            temperature: suggestion.temperature ?? current.temperature,
            max_tokens: suggestion.maxTokens ?? current.maxTokens,
            tool_config: suggestion.toolConfig || current.toolConfig,
            version: newVersion,
            is_active: true
        }

        // Deactivate old config
        if (current.id !== 'default') {
            await supabase
                .from('agent_configs')
                .update({ is_active: false })
                .eq('id', current.id)
        }

        // Insert new config
        const { data, error } = await supabase
            .from('agent_configs')
            .insert(newConfig)
            .select()
            .single()

        if (error) {
            logger.error({ error }, 'Failed to apply agent config optimization')
            throw error
        }

        // Audit log
        await logAuditEvent({
            userId: 'system', // System action
            projectId: projectId || 'system',
            eventType: 'agent_self_repair',
            severity: 'warning',
            metadata: {
                agentName,
                previousVersion: current.version,
                newVersion,
                changes: suggestion,
                reasoning: suggestion.reasoning
            }
        })

        logger.info({ agentName, version: newVersion }, 'Agent self-repair applied successfully')
    }
}

export const selfRepairService = new SelfRepairService()
