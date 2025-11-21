import { Router } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { ProjectService } from '../services/projectService';
import { ok, fail } from '../core/response.js'
import { validateBody } from '../core/validate.js'
import { createProjectSchema, updateProjectSchema } from '../modules/projects/dto.js'
import { getProjectAiSettings, upsertProjectAiSettings } from '../modules/ai/settingsController.js'
import { z } from 'zod'

const router = Router();

// Get all projects for current user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const result = await ProjectService.getProjects(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get specific project
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const result = await ProjectService.getProject(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create new project
router.post('/', authenticateToken, validateBody(createProjectSchema), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401)
    }

    const { name, description, sector, projectType } = req.body;

    if (!name || !sector || !projectType) {
      return fail(res, 'VALIDATION_ERROR', 'Name, sector, and project type are required', 400)
    }

    const result = await ProjectService.createProject(
      req.user.id,
      name,
      description,
      sector,
      projectType
    );
    if (result.success) return ok(res, result.data)
    return fail(res, 'CREATE_FAILED', result.error || 'Internal error', 500)
  } catch (error) {
    console.error('Create project error:', error);
    return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500)
  }
});

// Update project
router.put('/:id', authenticateToken, validateBody(updateProjectSchema), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401)
    }

    const result = await ProjectService.updateProject(
      req.user.id,
      req.params.id,
      req.body
    );
    if (result.success) return ok(res, result.data)
    return fail(res, 'UPDATE_FAILED', result.error || 'Internal error', 500)
  } catch (error) {
    console.error('Update project error:', error);
    return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500)
  }
});

// Delete project (archive)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const result = await ProjectService.deleteProject(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Project AI settings
router.get('/:id/ai-settings', authenticateToken, async (req, res, next) => {
  try { await getProjectAiSettings(req as any, res as any, next as any) } catch (e) { next(e) }
})

const aiSettingsSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  costPreference: z.enum(['low','balanced','best_quality']),
  latencyPreference: z.enum(['low','balanced','ok_with_slow']),
})

router.put('/:id/ai-settings', authenticateToken, validateBody(aiSettingsSchema), async (req, res, next) => {
  try { await upsertProjectAiSettings(req as any, res as any, next as any) } catch (e) { next(e) }
})

export default router;