import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from './auth.js'

/**
 * Middleware to require specific roles for access
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 */
export function requireRole(allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role

        if (!userRole) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                details: 'User role not found'
            })
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                details: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            })
        }

        next()
    }
}

/**
 * Convenience middleware for owner-only endpoints
 */
export const requireOwner = requireRole(['owner'])

/**
 * Convenience middleware for owner or system
 */
export const requireOwnerOrSystem = requireRole(['owner', 'system'])
