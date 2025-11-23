import { Router } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { ProfileService } from '../services/profileService.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required')
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await ProfileService.getProfile(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/me', authenticateToken, authLimiter, validateBody(updateProfileSchema), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { fullName } = req.body;
    const result = await ProfileService.updateProfile(req.user.id, fullName);
    res.json(result);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
