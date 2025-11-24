import type { Request, Response, NextFunction } from 'express'
import { logger } from '../core/logger.js'

interface RateLimitEntry {
    count: number
    resetTime: number
}

// In-memory store for rate limiting
const ipStore = new Map<string, RateLimitEntry>()
const userStore = new Map<string, RateLimitEntry>()

// Configuration (can be moved to env later)
const IP_LIMIT = 1000 // requests per window
const IP_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

const USER_HEAVY_LIMIT = 60 // requests per window for heavy endpoints
const USER_HEAVY_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
    const now = Date.now()

    for (const [key, entry] of ipStore.entries()) {
        if (entry.resetTime < now) {
            ipStore.delete(key)
        }
    }

    for (const [key, entry] of userStore.entries()) {
        if (entry.resetTime < now) {
            userStore.delete(key)
        }
    }
}, 60 * 1000) // Clean every minute

/**
 * Global IP-based rate limiter
 */
export function ipRateLimiter(req: Request, res: Response, next: NextFunction) {
    const ip = (req.ip || req.headers['x-forwarded-for'] as string || 'unknown').toString()
    const now = Date.now()

    const entry = ipStore.get(ip)

    if (!entry || entry.resetTime < now) {
        // New window
        ipStore.set(ip, {
            count: 1,
            resetTime: now + IP_WINDOW_MS
        })
        return next()
    }

    if (entry.count >= IP_LIMIT) {
        logger.warn({ ip }, 'IP rate limit exceeded')
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            details: 'Too many requests from this IP. Please try again later.'
        })
    }

    entry.count++
    return next()
}

/**
 * User-based rate limiter for heavy endpoints (e.g., agent runs)
 */
export function userHeavyRateLimiter(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).user?.id

    if (!userId) {
        // If no user, skip (auth middleware will handle)
        return next()
    }

    const now = Date.now()
    const entry = userStore.get(userId)

    if (!entry || entry.resetTime < now) {
        // New window
        userStore.set(userId, {
            count: 1,
            resetTime: now + USER_HEAVY_WINDOW_MS
        })
        return next()
    }

    if (entry.count >= USER_HEAVY_LIMIT) {
        logger.warn({ userId }, 'User heavy rate limit exceeded')
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            details: 'Too many agent runs. Please wait before trying again.'
        })
    }

    entry.count++
    return next()
}
