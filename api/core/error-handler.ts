import type { Request, Response, NextFunction } from 'express'
import { AppError } from './app-error.js'
import { logger } from './logger.js'

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, details: err.details }, err.message)
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    })
  }

  logger.error({ err }, 'Unhandled error')
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Server internal error' },
  })
}