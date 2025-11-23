import { Router } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { ok, fail } from '../core/response.js';
import { validateBody } from '../middleware/validate.js';
import { supabase } from '../config/supabase.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    projectId: z.string().uuid().optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
    due_date: z.string().datetime().optional(),
});

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
    due_date: z.string().datetime().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
});

/**
 * GET /api/tasks
 * List tasks for the authenticated user with optional filters
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }

        const { status, projectId, dueBefore, dueAfter } = req.query;

        let query = supabase
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
        updated_at,
        projects:project_id (name)
      `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        // Apply filters
        if (status && typeof status === 'string') {
            query = query.eq('status', status);
        }

        if (projectId && typeof projectId === 'string') {
            query = query.eq('project_id', projectId);
        }

        if (dueBefore && typeof dueBefore === 'string') {
            query = query.lte('due_date', dueBefore);
        }

        if (dueAfter && typeof dueAfter === 'string') {
            query = query.gte('due_date', dueAfter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching tasks:', error);
            return fail(res, 'TASKS_FETCH_FAILED', 'Failed to fetch tasks', 500);
        }

        // Map to include project_name
        const tasks = (data || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            due_date: task.due_date,
            project_id: task.project_id,
            project_name: task.projects?.name || null,
            created_at: task.created_at,
            updated_at: task.updated_at,
        }));

        return ok(res, tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', authenticateToken, validateBody(createTaskSchema), async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }

        const { title, description, projectId, priority, due_date } = req.body;

        const { data, error } = await supabase
            .from('personal_tasks')
            .insert({
                user_id: req.user.id,
                title,
                description: description || null,
                project_id: projectId || null,
                priority: priority || 'normal',
                due_date: due_date || null,
                status: 'pending',
            })
            .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        project_id,
        created_at,
        updated_at,
        projects:project_id (name)
      `)
            .single();

        if (error) {
            console.error('Error creating task:', error);
            return fail(res, 'TASK_CREATE_FAILED', 'Failed to create task', 500);
        }

        // Map to include project_name
        const task = {
            id: data.id,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            due_date: data.due_date,
            project_id: data.project_id,
            project_name: (data as any).projects?.name || null,
            created_at: data.created_at,
            updated_at: data.updated_at,
        };

        // TODO: Emit telemetry event: cockpit_task_created

        return ok(res, task);
    } catch (error) {
        console.error('Create task error:', error);
        return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
});

/**
 * PATCH /api/tasks/:id
 * Update a task (only own tasks)
 */
router.patch('/:id', authenticateToken, validateBody(updateTaskSchema), async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }

        const taskId = req.params.id;
        const { title, description, status, priority, due_date, projectId } = req.body;

        // First check if task exists and belongs to user
        const { data: existingTask, error: fetchError } = await supabase
            .from('personal_tasks')
            .select('id, user_id, status')
            .eq('id', taskId)
            .single();

        if (fetchError || !existingTask) {
            return fail(res, 'TASK_NOT_FOUND', 'Task not found', 404);
        }

        if (existingTask.user_id !== req.user.id) {
            return fail(res, 'FORBIDDEN', 'Access denied', 403);
        }

        // Build update object
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (status !== undefined) updates.status = status;
        if (priority !== undefined) updates.priority = priority;
        if (due_date !== undefined) updates.due_date = due_date;
        if (projectId !== undefined) updates.project_id = projectId;

        const { data, error } = await supabase
            .from('personal_tasks')
            .update(updates)
            .eq('id', taskId)
            .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        project_id,
        created_at,
        updated_at,
        projects:project_id (name)
      `)
            .single();

        if (error) {
            console.error('Error updating task:', error);
            return fail(res, 'TASK_UPDATE_FAILED', 'Failed to update task', 500);
        }

        // Map to include project_name
        const task = {
            id: data.id,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            due_date: data.due_date,
            project_id: data.project_id,
            project_name: (data as any).projects?.name || null,
            created_at: data.created_at,
            updated_at: data.updated_at,
        };

        // TODO: Emit telemetry event if status changed to 'done': cockpit_task_completed

        return ok(res, task);
    } catch (error) {
        console.error('Update task error:', error);
        return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task (only own tasks)
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        }

        const taskId = req.params.id;

        // First check if task exists and belongs to user
        const { data: existingTask, error: fetchError } = await supabase
            .from('personal_tasks')
            .select('id, user_id')
            .eq('id', taskId)
            .single();

        if (fetchError || !existingTask) {
            return fail(res, 'TASK_NOT_FOUND', 'Task not found', 404);
        }

        if (existingTask.user_id !== req.user.id) {
            return fail(res, 'FORBIDDEN', 'Access denied', 403);
        }

        const { error } = await supabase
            .from('personal_tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            console.error('Error deleting task:', error);
            return fail(res, 'TASK_DELETE_FAILED', 'Failed to delete task', 500);
        }

        return ok(res, { deleted: true });
    } catch (error) {
        console.error('Delete task error:', error);
        return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
});

export default router;
