import type { RequestHandler } from 'express'
import type { AnyZodObject } from 'zod'
import { AppError } from './app-error.js'

export function validateBody(schema: AnyZodObject): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new AppError('VALIDATION_ERROR', 'Invalid request body', 400, result.error.flatten()))
    }
    req.body = result.data
    next()
  }
}