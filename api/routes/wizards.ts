import { Router } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { WizardService } from '../services/wizardService';
import { ok, fail } from '../core/response.js'
import { validateBody } from '../core/validate.js'
import { createWizardSessionSchema } from '../modules/wizard/dto.js'

const router = Router();

// App Wizard routes
router.get('/app', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    const result = await WizardService.getAppWizardSessions(req.user.id, projectId as string);
    res.json(result);
  } catch (error) {
    console.error('Get app wizard sessions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

router.post('/app', authenticateToken, validateBody(createWizardSessionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401)
    }

    const { projectId, answers } = req.body;
    if (!projectId || !answers) {
      return fail(res, 'VALIDATION_ERROR', 'Project ID and answers are required', 400)
    }

    const result = await WizardService.createAppWizardSession(req.user.id, projectId, answers);
    if (result.success) return ok(res, result.data)
    return fail(res, 'CREATE_FAILED', result.error || 'Internal error', 500)
  } catch (error) {
    console.error('Create app wizard session error:', error);
    return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500)
  }
});

// Workflow Wizard routes
router.get('/workflow', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    const result = await WizardService.getWorkflowWizardSessions(req.user.id, projectId as string);
    res.json(result);
  } catch (error) {
    console.error('Get workflow wizard sessions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

router.post('/workflow', authenticateToken, validateBody(createWizardSessionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401)
    }

    const { projectId, answers } = req.body;
    if (!projectId || !answers) {
      return fail(res, 'VALIDATION_ERROR', 'Project ID and answers are required', 400)
    }

    const result = await WizardService.createWorkflowWizardSession(req.user.id, projectId, answers);
    if (result.success) return ok(res, result.data)
    return fail(res, 'CREATE_FAILED', result.error || 'Internal error', 500)
  } catch (error) {
    console.error('Create workflow wizard session error:', error);
    return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500)
  }
});

// Content Wizard routes
router.get('/content', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    const result = await WizardService.getContentWizardSessions(req.user.id, projectId as string);
    res.json(result);
  } catch (error) {
    console.error('Get content wizard sessions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

router.post('/content', authenticateToken, validateBody(createWizardSessionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return fail(res, 'UNAUTHORIZED', 'User not authenticated', 401)
    }

    const { projectId, answers } = req.body;
    if (!projectId || !answers) {
      return fail(res, 'VALIDATION_ERROR', 'Project ID and answers are required', 400)
    }

    const result = await WizardService.createContentWizardSession(req.user.id, projectId, answers);
    if (result.success) return ok(res, result.data)
    return fail(res, 'CREATE_FAILED', result.error || 'Internal error', 500)
  } catch (error) {
    console.error('Create content wizard session error:', error);
    return fail(res, 'INTERNAL_ERROR', 'Internal server error', 500)
  }
});

export default router;