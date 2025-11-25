import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'

export class CostManager {
    /**
     * Check if a project has exceeded its budget
     */
    async checkBudget(projectId: string): Promise<{ exceeded: boolean, spend: number, budget: number }> {
        try {
            // 1. Get project settings (budget)
            const { data: settings, error: settingsError } = await supabase
                .from('project_ai_settings')
                .select('monthly_budget')
                .eq('project_id', projectId)
                .single()

            if (settingsError && settingsError.code !== 'PGRST116') {
                logger.error({ err: settingsError, projectId }, 'Error fetching project budget')
                return { exceeded: false, spend: 0, budget: 0 }
            }

            const budget = settings?.monthly_budget || 10.0 // Default $10

            // 2. Calculate current month's spend
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const { data: usage, error: usageError } = await supabase
                .from('ai_usage_logs')
                .select('cost_usd')
                .eq('project_id', projectId)
                .gte('created_at', startOfMonth.toISOString())

            if (usageError) {
                logger.error({ err: usageError, projectId }, 'Error fetching usage logs')
                return { exceeded: false, spend: 0, budget }
            }

            const totalSpend = usage?.reduce((sum, log) => sum + (log.cost_usd || 0), 0) || 0

            return {
                exceeded: totalSpend >= budget,
                spend: totalSpend,
                budget
            }

        } catch (error) {
            logger.error({ err: error, projectId }, 'Error in checkBudget')
            return { exceeded: false, spend: 0, budget: 0 }
        }
    }

    /**
     * Get cost optimization recommendations
     */
    async getRecommendations(projectId: string): Promise<string[]> {
        // Placeholder for future logic
        return [
            'Enable semantic caching to reduce redundant calls.',
            'Use "balanced" cost preference for non-critical tasks.',
            'Review high-cost agents in the Cockpit.'
        ]
    }
}

export const costManager = new CostManager()
