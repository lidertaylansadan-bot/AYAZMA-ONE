/**
 * Redis Configuration
 * Connection settings for BullMQ and caching
 */

import Redis from 'ioredis'
import { logger } from '../core/logger'

// Redis connection options
const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
    },
}

// Create Redis connection for BullMQ
export const redisConnection = new Redis(redisOptions)

// Connection event listeners
redisConnection.on('connect', () => {
    logger.info('Redis connected', {
        host: redisOptions.host,
        port: redisOptions.port,
    })
})

redisConnection.on('error', (error) => {
    logger.error('Redis connection error', {
        error: error.message,
    })
})

redisConnection.on('close', () => {
    logger.warn('Redis connection closed')
})

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing Redis connection')
    await redisConnection.quit()
})
