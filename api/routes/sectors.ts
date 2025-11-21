import { Router } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { ProjectService } from '../services/projectService';

const router = Router();

// Get all sector blueprints
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const result = await ProjectService.getSectorBlueprints();
    res.json(result);
  } catch (error) {
    console.error('Get sectors error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get specific sector blueprint
router.get('/:sector_code', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const result = await ProjectService.getSectorBlueprint(req.params.sector_code);
    res.json(result);
  } catch (error) {
    console.error('Get sector error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;