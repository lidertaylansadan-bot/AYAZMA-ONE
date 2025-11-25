/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import sectorRoutes from './routes/sectors.js'
import wizardRoutes from './routes/wizards.js'
import cockpitRoutes from './routes/cockpit.js'
import tasksRoutes from './routes/tasks.js'
import { errorHandler } from './core/error-handler.js'
import { logger } from './core/logger.js'
import aiRoutes from './modules/ai/aiRoutes.js'
import agentsRoutes from './modules/agents/routes.js'
import telemetryRoutes from './modules/telemetry/routes.js'
import aiOptimizerRoutes from './modules/ai/optimizer/routes.js'
import contentRoutes from './modules/content/routes.js'
import helmet from 'helmet'
import morgan from 'morgan'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config({ path: path.join(__dirname, '.env') })

// Register AI Agents
import { registerAllAgents } from './modules/agents/registerAgents.js'
registerAllAgents()

// Initialize Workers
// Initialize Workers
import { initWorkers } from './modules/agents/workers/index.js'
import { initSelfRepairSchedule } from './jobs/selfRepairWorker.js'
import { initRegressionSchedule } from './jobs/regressionTestWorker.js'

initWorkers()
initSelfRepairSchedule().catch(err => logger.error({ err }, 'Failed to init self-repair schedule'))
initRegressionSchedule().catch(err => logger.error({ err }, 'Failed to init regression schedule'))

const app: express.Application = express()

import { ipRateLimiter } from './middleware/rateLimit.js'

app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(ipRateLimiter) // Global IP-based rate limiting
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/sectors', sectorRoutes)
app.use('/api/wizards', wizardRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/agents', agentsRoutes)
app.use('/api/telemetry', telemetryRoutes)
app.use('/api/ai/optimize', aiOptimizerRoutes)
app.use('/api/cockpit', cockpitRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api', contentRoutes)

import compressionRoutes from './routes/compression.js';
app.use('/api/compression', compressionRoutes);

// TODO: Fix module resolution for health routes
// import healthRoutes from './routes/health.js';
// app.use('/api/health', healthRoutes);

// Temporary basic health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok', stage6: 'partial' });
});

/**
 * error handler middleware
 */
app.use(errorHandler)

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  logger.warn({ path: req.path }, 'API not found')
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API not found' } })
})

export default app
