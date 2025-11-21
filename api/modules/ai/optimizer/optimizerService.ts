import type { AiOptimizationSuggestion, OptimizationGoal } from './types.js'
import { resolveEffectiveAiConfig } from '../configResolver.js'
import { supabase } from '../../../config/supabase.js'

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
  const totalTokens = logs.reduce((sum: number, l: any) => sum + (l.total_tokens || 0), 0)
  const heavyTasks = countHeavyTasks(logs)

  // rule-based suggestion
  let suggestedModel = current.model
  let suggestedProvider = current.provider
  let suggestedCost: 'low' | 'balanced' | 'best_quality' = current.costPreference || 'balanced'
  let suggestedLatency: 'low' | 'balanced' | 'ok_with_slow' = current.latencyPreference || 'balanced'
  let rationale = ''

  if (goal.goal === 'min_cost') {
    suggestedCost = 'low'
    // if tokens high, pick cheaper model
    if (totalTokens > 50000 || heavyTasks > 10) suggestedModel = 'gpt-4o-mini'
    rationale = 'Toplam token yüksek; maliyeti düşürmek için daha ekonomik model ve düşük maliyet tercihi önerildi.'
  } else if (goal.goal === 'min_latency') {
    suggestedLatency = 'low'
    if ((avgLatency || 0) > 1000) suggestedModel = 'gpt-4o-mini'
    rationale = 'Ortalama gecikme yüksek; daha hızlı model ve düşük gecikme tercihi önerildi.'
  } else {
    suggestedCost = 'balanced'
    suggestedLatency = 'balanced'
    if (heavyTasks > 5 && (avgLatency || 0) < 800) suggestedModel = 'gpt-4o'
    rationale = 'Kullanım dengeli; kalite ve performans arasında denge için öneri hazırlandı.'
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
  }
}

function average(nums: number[]): number | null {
  if (!nums.length) return null
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

function countHeavyTasks(rows: any[]): number {
  // consider heavy if total_tokens >= 2000
  return rows.filter((r: any) => (r.total_tokens || 0) >= 2000).length
}