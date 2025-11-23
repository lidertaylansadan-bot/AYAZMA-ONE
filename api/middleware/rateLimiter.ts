import rateLimit from 'express-rate-limit'

// Standard limiter for most routes
export const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.'
        }
    }
})

// Stricter limiter for auth routes (login/register)
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // Limit each IP to 10 failed login attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts, please try again later.'
        }
    }
})

// AI endpoints limiter (expensive operations)
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 20, // Limit each user to 20 AI requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return (req as any).user?.id || req.ip
    },
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'AI request limit exceeded.'
        }
    }
})
