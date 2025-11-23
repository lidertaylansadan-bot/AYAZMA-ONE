import { Redis } from 'ioredis'
import { logger } from '../logger.js'

let redisClient: Redis | null = null
let subscriberClient: Redis | null = null

const getRedisUrl = () => {
    return process.env.REDIS_URL || 'redis://localhost:6379'
}

export const getRedisClient = (): Redis | null => {
    if (!redisClient) {
        try {
            const url = getRedisUrl()
            logger.info({ url }, 'Initializing Redis client')
            redisClient = new Redis(url, {
                maxRetriesPerRequest: null, // Required for BullMQ
                enableReadyCheck: false,
                lazyConnect: true, // Don't connect immediately
                retryStrategy(times) {
                    // Stop retrying after 3 attempts
                    if (times > 3) {
                        logger.warn('Redis connection failed after 3 attempts, running without Redis')
                        return null
                    }
                    const delay = Math.min(times * 50, 2000)
                    return delay
                },
            })

            redisClient.on('error', (err) => {
                logger.error({ err }, 'Redis client error - some features may not work')
            })

            redisClient.on('connect', () => {
                logger.info('Redis client connected')
            })

            // Try to connect, but don't fail if it doesn't work
            redisClient.connect().catch((err) => {
                logger.warn({ err }, 'Failed to connect to Redis - workflow features will be disabled')
                redisClient = null
            })
        } catch (error) {
            logger.warn({ error }, 'Failed to initialize Redis client - running without Redis features')
            return null
        }
    }
    return redisClient
}

export const getSubscriberClient = (): Redis | null => {
    if (!subscriberClient) {
        try {
            const url = getRedisUrl()
            logger.info({ url }, 'Initializing Redis subscriber client')
            subscriberClient = new Redis(url, {
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
                lazyConnect: true,
                retryStrategy(times) {
                    if (times > 3) {
                        return null
                    }
                    const delay = Math.min(times * 50, 2000)
                    return delay
                },
            })

            subscriberClient.on('error', (err) => {
                logger.error({ err }, 'Redis subscriber error')
            })

            subscriberClient.connect().catch((err) => {
                logger.warn({ err }, 'Failed to connect Redis subscriber')
                subscriberClient = null
            })
        } catch (error) {
            logger.warn({ error }, 'Failed to initialize Redis subscriber')
            return null
        }
    }
    return subscriberClient
}

export const closeRedisConnections = async () => {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
    }
    if (subscriberClient) {
        await subscriberClient.quit()
        subscriberClient = null
    }
}
