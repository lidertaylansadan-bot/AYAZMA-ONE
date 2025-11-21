import { Router } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { ProfileService } from '../services/profileService';
import { ApiResponse } from '../../shared/types';

const router = Router();

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
router.put('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const { fullName } = req.body;
    
    if (!fullName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Full name is required' 
      });
    }

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
