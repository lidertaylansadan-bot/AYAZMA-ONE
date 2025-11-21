import { supabase } from '../../config/supabase.js'
import { config } from '../../core/config.js'

export interface EffectiveAiConfig {
  provider: string
  model: string
  costPreference?: 'low' | 'balanced' | 'best_quality'
  latencyPreference?: 'low' | 'balanced' | 'ok_with_slow'
}

export async function resolveEffectiveAiConfig(input: {
  userId?: string
  projectId?: string
  preferences?: { costPreference?: string; latencyPreference?: string }
}): Promise<EffectiveAiConfig> {
  let provider = config.defaultAiProvider || 'openai'
  let model = config.defaultAiModel || 'gpt-4o-mini'
  let costPreference: any
  let latencyPreference: any

  if (input.projectId) {
    const { data } = await supabase
      .from('project_ai_settings')
      .select('provider, model, cost_preference, latency_preference')
      .eq('project_id', input.projectId)
      .single()
    if (data) {
      provider = data.provider || provider
      model = data.model || model
      costPreference = data.cost_preference || costPreference
      latencyPreference = data.latency_preference || latencyPreference
    }
  }
  if (input.preferences) {
    costPreference = input.preferences.costPreference || costPreference
    latencyPreference = input.preferences.latencyPreference || latencyPreference
  }
  return { provider, model, costPreference, latencyPreference }
}