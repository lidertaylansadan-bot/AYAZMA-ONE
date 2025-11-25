/**
 * local server entry file, for local development
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './core/config.js'
import { logger } from './core/logger.js'

// Load environment variables from api/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import app from './app.js';
import { ensureBuckets } from './services/storageService.js';

/**
 * start server with port
 */
const server = app.listen(config.port, async () => {
  logger.info({ port: config.port, env: config.env }, 'Server ready')
  try {
    await ensureBuckets()
    logger.info('Storage buckets ensured')

    // Start background workers
    // Workers are initialized in app.ts via initWorkers()
    logger.info('Background workers started')
  } catch (e) {
    logger.error({ err: e }, 'Failed to initialize services')
  }
});

/**
 * close server
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;