import type { Request, Response, NextFunction } from 'express'
import { ok } from '../../core/response.js'
import { supabase } from '../../config/supabase.js'
import { runAgentWithPersistence } from './AgentRunner.js'
import { AppError } from '../../core/app-error.js'

export async function start(req: Request, res: Response, _next: NextFunction) {
  const { agentName, projectId, context } = req.body
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
  const { runId } = await runAgentWithPersistence(agentName, { userId: user.id, projectId, wizardAnswers: context?.wizardAnswers, extra: context?.extra })
  return ok(res, { runId })
}

export async function list(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
  const projectId = req.query.projectId as string | undefined
  let query = supabase.from('agent_runs').select('id, agent_name, status, project_id, created_at, updated_at').eq('user_id', user.id).order('created_at', { ascending: false })
  if (projectId) query = query.eq('project_id', projectId)
  const { data, error } = await query
  if (error) throw new AppError('AGENT_RUN_LIST_FAILED', 'Failed to list agent runs', 500, error)
  const mapped = (data || []).map((r: any) => ({ id: r.id, agentName: r.agent_name, status: r.status, projectId: r.project_id, createdAt: r.created_at, updatedAt: r.updated_at }))
  return ok(res, mapped)
}

export async function detail(req: Request, res: Response, _next: NextFunction) {
  const user = (req as any).user
  if (!user?.id) throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
  const runId = req.params.id
  const { data: run, error: runErr } = await supabase
    .from('agent_runs')
    .select('id, agent_name, status, project_id, created_at, updated_at, user_id')
    .eq('id', runId)
    .single()
  if (runErr || !run) throw new AppError('AGENT_RUN_NOT_FOUND', 'Run not found', 404)
  if (run.user_id !== user.id) throw new AppError('FORBIDDEN', 'Access denied', 403)
  const { data: artifacts, error: artErr } = await supabase
    .from('agent_artifacts')
    .select('id, type, title, content, meta, created_at')
    .eq('run_id', runId)
    .order('created_at', { ascending: false })
  if (artErr) throw new AppError('AGENT_ARTIFACT_LIST_FAILED', 'Failed to list artifacts', 500, artErr)
  const mappedRun = { id: run.id, agentName: run.agent_name, status: run.status, projectId: run.project_id, createdAt: run.created_at, updatedAt: run.updated_at }
  const mappedArtifacts = (artifacts || []).map((a: any) => ({ id: a.id, type: a.type, title: a.title, content: a.content, meta: a.meta || {}, createdAt: a.created_at }))
  return ok(res, { run: mappedRun, artifacts: mappedArtifacts })
}