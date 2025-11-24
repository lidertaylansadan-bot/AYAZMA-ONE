import { Router } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { ok, fail } from '../core/response.js';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/cockpit/overview
 * Returns aggregated data for the Cockpit page:
 * - User's projects
 * - Today's tasks (pending/in_progress, due today or overdue)
 * - Recent agent runs (last 10)
 */
router.get('/overview', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }

        const userId = req.user.id;

        // Fetch user's projects
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, status, sector, project_type, updated_at')
            .eq('owner_id', userId)
            .order('updated_at', { ascending: false });

        if (projectsError) {
            console.error('Error fetching projects:', projectsError);
            return fail(res, 'PROJECTS_FETCH_FAILED', 'Failed to fetch projects', 500);
        }

        // Fetch today's tasks (pending/in_progress, due today or no due date)
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        const { data: tasksData, error: tasksError } = await supabase
            .from('personal_tasks')
            .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        project_id,
        created_at,
        projects:project_id (name)
      `)
            .eq('user_id', userId)
            .neq('status', 'done')
            .or(`due_date.lte.${today.toISOString()},due_date.is.null`)
            .order('priority', { ascending: false })
            .order('due_date', { ascending: true, nullsFirst: false });

        if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
            return fail(res, 'TASKS_FETCH_FAILED', 'Failed to fetch tasks', 500);
        }

        // Map tasks to include project_name
        const todayTasks = (tasksData || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            due_date: task.due_date,
            project_id: task.project_id,
            project_name: task.projects?.name || null,
            created_at: task.created_at,
        }));

        // Fetch recent agent runs (last 10)
        const { data: runsData, error: runsError } = await supabase
            .from('agent_runs')
            .select(`
        id,
        agent_name,
        status,
        project_id,
        created_at,
        projects:project_id (name)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (runsError) {
            console.error('Error fetching agent runs:', runsError);
            return fail(res, 'AGENT_RUNS_FETCH_FAILED', 'Failed to fetch agent runs', 500);
        }

        // Map agent runs to include project_name
        const recentAgentRuns = (runsData || []).map((run: any) => ({
            id: run.id,
            agent_name: run.agent_name,
            status: run.status,
            project_id: run.project_id,
            project_name: run.projects?.name || null,
            created_at: run.created_at,
        }));

        return ok(res, {
            projects: projects || [],
            todayTasks,
            recentAgentRuns,
        });
    } catch (error) {
        console.error('Cockpit overview error:', error);
        return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
});

/**
 * GET /api/cockpit/health
 * Returns system health, security events, and optimization status
 */
router.get('/health', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }

        const userId = req.user.id;

        // Get AI quality metrics (from evaluations)
        const { data: evals, error: evalsError } = await supabase
            .from('agent_evaluations')
            .select('score_helpfulness, score_factuality, score_coherence, score_safety, created_at')
            .eq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });

        const avgQuality = evals && evals.length > 0
            ? {
                helpfulness: evals.reduce((sum, e) => sum + (e.score_helpfulness || 0), 0) / evals.length,
                factuality: evals.reduce((sum, e) => sum + (e.score_factuality || 0), 0) / evals.length,
                coherence: evals.reduce((sum, e) => sum + (e.score_coherence || 0), 0) / evals.length,
                safety: evals.reduce((sum, e) => sum + (e.score_safety || 0), 0) / evals.length,
                count: evals.length
            }
            : null;

        // Get cost trends (from ai_usage_logs)
        const { data: usage, error: usageError } = await supabase
            .from('ai_usage_logs')
            .select('total_cost, created_at')
            .eq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const totalCost = usage?.reduce((sum, u) => sum + (u.total_cost || 0), 0) || 0;

        // Get security events (from audit_log)
        const { data: securityEvents, error: securityError } = await supabase
            .from('audit_log')
            .select('event_type, severity, created_at, metadata')
            .eq('user_id', userId)
            .in('severity', ['warning', 'critical'])
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(10);

        // Get optimization status (check if auto_optimize is enabled for any project)
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name')
            .eq('owner_id', userId);

        let optimizationEnabled = false;
        if (projects && projects.length > 0) {
            const { data: settings } = await supabase
                .from('project_ai_settings')
                .select('auto_optimize')
                .in('project_id', projects.map(p => p.id));

            optimizationEnabled = settings?.some(s => s.auto_optimize) || false;
        }

        return ok(res, {
            aiQuality: avgQuality,
            costTrends: {
                totalCost30Days: totalCost,
                usageCount: usage?.length || 0
            },
            securityEvents: securityEvents || [],
            optimization: {
                enabled: optimizationEnabled,
                lastCheck: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Cockpit health error:', error);
        return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
});

export default router;
