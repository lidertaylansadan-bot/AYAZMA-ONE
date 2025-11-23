/**
 * Compression API routes
 * Provides endpoints to enqueue a compression job and query its status.
 */

import { Router } from 'express';
import { enqueueCompression, getCompressionJobStatus } from '../jobs/compressionQueue.js';
import { logger } from '../core/logger.js';

const router = Router();

// Enqueue a compression job
// Expected body: { documentId: string, projectId: string, strategy?: string }
router.post('/enqueue', async (req, res) => {
    try {
        const { documentId, projectId, strategy = 'text_only' } = req.body;
        if (!documentId || !projectId) {
            return res.status(400).json({ success: false, error: 'documentId and projectId are required' });
        }
        const jobId = await enqueueCompression({
            documentId,
            projectId,
            // Cast to any to avoid TypeScript error for missing user property
            userId: (req as any).user?.id ?? 'system',
            strategy,
        });
        // logger.info expects object first, then message
        logger.info({ jobId, documentId, strategy }, 'Compression job enqueued via API');
        return res.status(202).json({ success: true, jobId });
    } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : err }, 'Failed to enqueue compression job');
        return res.status(500).json({ success: false, error: 'Failed to enqueue compression job' });
    }
});

// Get status of a compression job
router.get('/job/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await getCompressionJobStatus(jobId);
        if (!status) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        return res.json({ success: true, status });
    } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : err }, 'Failed to get compression job status');
        return res.status(500).json({ success: false, error: 'Failed to get job status' });
    }
});

export default router;
