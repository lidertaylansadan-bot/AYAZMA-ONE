import express from 'express';
import { healthService } from '../modules/health/healthService.js';
import { logger } from '../core/logger.js';

const router = express.Router();

/**
 * GET /api/health/trends
 * Get health trends for 7-day or 30-day period
 */
router.get('/trends', async (req, res) => {
    try {
        const period = (req.query.period as '7d' | '30d') || '7d';

        if (period !== '7d' && period !== '30d') {
            return res.status(400).json({ error: 'Period must be 7d or 30d' });
        }

        const trends = await healthService.getTrends(period);

        res.json(trends);
    } catch (error) {
        logger.error({ error }, 'Failed to fetch health trends');
        res.status(500).json({ error: 'Failed to fetch health trends' });
    }
});

export default router;
