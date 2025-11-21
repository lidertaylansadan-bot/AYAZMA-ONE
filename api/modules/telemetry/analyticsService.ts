import { supabase } from '../../config/supabase.js'
import type { AiUsageAggregate, ProjectAiUsageSummary, UserAiUsageSummary, AgentStats } from './types.js'

function sinceDate(days?: number) {
  if (!days) return null
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export async function getUserAiUsageSummary(userId: string, days?: number): Promise<UserAiUsageSummary> {
  const fromIso = sinceDate(days)
  let query = supabase.from('ai_usage_logs').select('*').eq('user_id', userId)
  if (fromIso) query = query.gte('created_at', fromIso)
  const { data, error } = await query
  if (error) throw error
  const logs = data || []
  const byProjectMap = new Map<string, ProjectAiUsageSummary>()
  let totalCalls = 0
  let totalTokens = 0
  let latencies: number[] = []
  for (const row of logs) {
    const pid = row.project_id || 'unknown'
    if (!byProjectMap.has(pid)) {
      byProjectMap.set(pid, { projectId: pid, totalCalls: 0, totalTokens: 0, avgLatencyMs: null, byProvider: [], byTaskType: [] })
    }
    const proj = byProjectMap.get(pid)!
    proj.totalCalls += 1
    proj.totalTokens += row.total_tokens || 0
    if (typeof row.latency_ms === 'number') latencies.push(row.latency_ms)
    totalCalls += 1
    totalTokens += row.total_tokens || 0
  }
  // Build per-project breakdowns
  for (const [pid, summary] of byProjectMap.entries()) {
    const projLogs = logs.filter((l: any) => (l.project_id || 'unknown') === pid)
    summary.byProvider = aggregateBy(projLogs, ['provider', 'model'])
    summary.byTaskType = aggregateBy(projLogs, ['task_type'])
    summary.avgLatencyMs = averageLatency(projLogs)
  }
  return {
    totalCalls,
    totalTokens,
    avgLatencyMs: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null,
    byProject: Array.from(byProjectMap.values()),
  }
}

export async function getProjectAiUsageSummary(userId: string, projectId: string, days?: number): Promise<ProjectAiUsageSummary> {
  const fromIso = sinceDate(days)
  let query = supabase.from('ai_usage_logs').select('*').eq('user_id', userId).eq('project_id', projectId)
  if (fromIso) query = query.gte('created_at', fromIso)
  const { data, error } = await query
  if (error) throw error
  const logs = data || []
  const totalCalls = logs.length
  const totalTokens = logs.reduce((sum: number, r: any) => sum + (r.total_tokens || 0), 0)
  const avgLatencyMs = averageLatency(logs)
  const byProvider = aggregateBy(logs, ['provider', 'model'])
  const byTaskType = aggregateBy(logs, ['task_type'])
  return { projectId, totalCalls, totalTokens, avgLatencyMs, byProvider, byTaskType }
}

export async function getAgentStats(userId: string, projectId?: string): Promise<AgentStats> {
  let runsQuery = supabase.from('agent_runs').select('*').eq('user_id', userId)
  if (projectId) runsQuery = runsQuery.eq('project_id', projectId)
  const { data: runs, error: runsErr } = await runsQuery
  if (runsErr) throw runsErr
  const { data: artifacts, error: artErr } = await supabase.from('agent_artifacts').select('*')
  if (artErr) throw artErr
  const byAgent = new Map<string, { runs: number; succeeded: number; failed: number; artifacts: number }>()
  for (const r of runs || []) {
    const key = r.agent_name
    if (!byAgent.has(key)) byAgent.set(key, { runs: 0, succeeded: 0, failed: 0, artifacts: 0 })
    const agg = byAgent.get(key)!
    agg.runs += 1
    if (r.status === 'succeeded') agg.succeeded += 1
    else if (r.status === 'failed') agg.failed += 1
    const countArtifacts = (artifacts || []).filter((a: any) => a.run_id === r.id).length
    agg.artifacts += countArtifacts
  }
  const byAgentName = Array.from(byAgent.entries()).map(([agentName, agg]) => ({
    agentName,
    runs: agg.runs,
    succeeded: agg.succeeded,
    failed: agg.failed,
    avgArtifacts: agg.runs ? Number((agg.artifacts / agg.runs).toFixed(2)) : 0,
  }))
  return { byAgentName }
}

function aggregateBy(rows: any[], keys: string[]): AiUsageAggregate[] {
  const map = new Map<string, AiUsageAggregate>()
  for (const r of rows) {
    const provider = r.provider || 'unknown'
    const model = r.model || 'unknown'
    const taskType = r.task_type || 'unknown'
    const id = keys.map((k) => (k === 'provider' ? provider : k === 'model' ? model : k === 'task_type' ? taskType : r[k] || 'unknown')).join('|')
    const existing = map.get(id)
    if (!existing) {
      map.set(id, {
        provider: provider,
        model: model,
        taskType: taskType,
        totalCalls: 1,
        totalTokens: r.total_tokens || 0,
        avgLatencyMs: typeof r.latency_ms === 'number' ? r.latency_ms : null,
      })
    } else {
      existing.totalCalls += 1
      existing.totalTokens += r.total_tokens || 0
      const lat = typeof r.latency_ms === 'number' ? r.latency_ms : null
      if (lat !== null) {
        const currAvg = existing.avgLatencyMs ?? 0
        const n = existing.totalCalls
        existing.avgLatencyMs = Math.round(((currAvg * (n - 1)) + lat) / n)
      }
    }
  }
  return Array.from(map.values())
}

function averageLatency(rows: any[]): number | null {
  const lats = rows.map((r: any) => r.latency_ms).filter((x: any) => typeof x === 'number')
  if (!lats.length) return null
  return Math.round(lats.reduce((a: number, b: number) => a + b, 0) / lats.length)
}