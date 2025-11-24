import type { AiOptimizationSuggestion, OptimizationGoal } from './types.js'
import { resolveEffectiveAiConfig } from '../configResolver.js'
import { supabase } from '../../../config/supabase.js'
import { evalService } from '../../eval/evalService.js'
import { logger } from '../../../core/logger.js'
import { logAuditEvent } from '../../../core/auditLogger.js'

export async function computeProjectOptimizationSuggestion(
  userId: string,
  projectId: string,
  goal: OptimizationGoal
): Promise<AiOptimizationSuggestion | null> {
  // verify some usage exists
  const { data: usage, error } = await supabase
    .from('ai_usage_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  if (error) throw error
  const logs = usage || []
  if (!logs.length) return null

  // Get evaluation scores for quality assessment
  const avgScores = await evalService.getProjectAverageScores(projectId)

  // current effective config
  const effective = await resolveEffectiveAiConfig({ userId, projectId })
  const current = {
    provider: effective.provider || 'openai',
    model: effective.model || 'gpt-4o-mini',
    costPreference: effective.costPreference || 'balanced',
    latencyPreference: effective.latencyPreference || 'balanced',
  }

  // aggregates
  const avgLatency = average(logs.map((l: any) => l.latency_ms).filter((x: any) => typeof x === 'number'))
  const totalCost = logs.reduce((sum: number, l: any) => sum + (l.total_cost || 0), 0)
  const totalTokens = logs.reduce((sum: number, l: any) => sum + (l.total_tokens || 0), 0)
  const heavyTasks = countHeavyTasks(logs)

  // Quality metrics from evaluations
  const qualityScore = avgScores?.overall || 0.5
  const isHighQuality = qualityScore >= 0.7

  // rule-based suggestion with quality consideration
  let suggestedModel = current.model
  let suggestedProvider = current.provider
  let suggestedCost: 'low' | 'balanced' | 'best_quality' = current.costPreference || 'balanced'
  let suggestedLatency: 'low' | 'balanced' | 'ok_with_slow' = current.latencyPreference || 'balanced'
  let rationale = ''

  if (goal.goal === 'min_cost') {
    suggestedCost = 'low'

    // If quality is already high, we can safely downgrade to cheaper model
    if (isHighQuality && (totalTokens > 50000 || heavyTasks > 10)) {
      suggestedModel = 'gpt-4o-mini'
      rationale = `High quality maintained (${(qualityScore * 100).toFixed(0)}%). Switching to cheaper model to reduce costs. Estimated savings: ${((totalCost * 0.3).toFixed(2))} USD/month.`
    } else if (!isHighQuality) {
      // Quality is low, don't downgrade further
      rationale = `Quality score is low (${(qualityScore * 100).toFixed(0)}%). Maintaining current model to improve quality before cost optimization.`
    } else {
      suggestedModel = 'gpt-4o-mini'
      rationale = 'Optimizing for cost with cheaper model and low cost preference.'
    }
  } else if (goal.goal === 'min_latency') {
    suggestedLatency = 'low'

    if ((avgLatency || 0) > 1000) {
      suggestedModel = 'gpt-4o-mini' // Faster model
      rationale = `High latency detected (${avgLatency}ms avg). Switching to faster model.`
    } else {
      rationale = 'Latency is acceptable. Maintaining current configuration.'
    }
  } else {
    // Balanced: optimize for quality + cost
    suggestedCost = 'balanced'
    suggestedLatency = 'balanced'

    if (!isHighQuality && heavyTasks > 5) {
      // Quality is low and we have complex tasks - upgrade
      suggestedModel = 'gpt-4o'
      rationale = `Quality score is low (${(qualityScore * 100).toFixed(0)}%) with ${heavyTasks} complex tasks. Upgrading to better model for improved quality.`
    } else if (isHighQuality && totalCost > 10) {
      // Quality is high and costs are high - downgrade
      suggestedModel = 'gpt-4o-mini'
      rationale = `High quality maintained (${(qualityScore * 100).toFixed(0)}%). Costs are high ($${totalCost.toFixed(2)}). Downgrading to save costs while monitoring quality.`
    } else {
      rationale = 'Usage is balanced. No optimization needed at this time.'
    }
  }

  return {
    projectId,
    current,
    suggested: {
      provider: suggestedProvider,
      model: suggestedModel,
      costPreference: suggestedCost,
      latencyPreference: suggestedLatency,
    },
    rationale,
    metadata: {
      qualityScore: avgScores?.overall,
      avgLatency,
      totalCost,
      totalTokens,
      evaluationCount: avgScores ? 1 : 0
    }
  }
}

/**
 * Apply optimization suggestion to project settings
 */
export async function applyOptimizationSuggestion(
  userId: string,
  projectId: string,
  suggestion: AiOptimizationSuggestion,
  req?: any
): Promise<void> {
  logger.info({ projectId, suggestion }, 'Applying optimization suggestion')

  // Update project AI settings
  const { error } = await supabase
    .from('project_ai_settings')
    .upsert({
      project_id: projectId,
      provider: suggestion.suggested.provider,
      model: suggestion.suggested.model,
      cost_preference: suggestion.suggested.costPreference,
      latency_preference: suggestion.suggested.latencyPreference,
      updated_at: new Date().toISOString()
    })

  if (error) {
    logger.error({ error, projectId }, 'Failed to apply optimization')
    throw new Error('Failed to apply optimization suggestion')
  }

  // Audit log
  await logAuditEvent({
    userId,
    projectId,
    eventType: 'optimization_applied',
    severity: 'info',
    metadata: {
      previous: suggestion.current,
      new: suggestion.suggested,
      rationale: suggestion.rationale,
      automated: false
    },
    req
  })

  logger.info({ projectId }, 'Optimization applied successfully')
}

function average(nums: number[]): number | null {
  if (!nums.length) return null
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

function countHeavyTasks(rows: any[]): number {
  // consider heavy if total_tokens >= 2000
  return rows.filter((r: any) => (r.total_tokens || 0) >= 2000).length
}