import { Redis } from 'ioredis'
import { config } from '../../core/config.js'
import { logger } from '../../core/logger.js'

let redisClient: Redis | null = null
let subscriberClient: Redis | null = null

const getRedisUrl = () => {
    return process.env.REDIS_URL || 'redis://localhost:6379'
}

export const getRedisClient = (): Redis => {
    if (!redisClient) {
        const url = getRedisUrl()
        logger.info({ url }, 'Initializing Redis client')
        redisClient = new Redis(url, {
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000)
                return delay
            },
        })

        redisClient.on('error', (err) => {
            logger.error({ err }, 'Redis client error')
        })

        redisClient.on('connect', () => {
            logger.info('Redis client connected')
        })
    }
    return redisClient
}

export const getSubscriberClient = (): Redis => {
    if (!subscriberClient) {
        const url = getRedisUrl()
        logger.info({ url }, 'Initializing Redis subscriber client')
        subscriberClient = new Redis(url, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000)
                return delay
            },
        })

        subscriberClient.on('error', (err) => {
            logger.error({ err }, 'Redis subscriber error')
        })
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
