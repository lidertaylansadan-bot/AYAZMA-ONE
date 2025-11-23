import type { RequestHandler } from 'express'
import { z } from 'zod'
import { AppError } from '../core/app-error.js'

export function validateRequest(schema: {
    body?: z.ZodType<any, any>
    query?: z.ZodType<any, any>
    params?: z.ZodType<any, any>
}): RequestHandler {
    return (req, _res, next) => {
        try {
            if (schema.body) {
                const result = schema.body.safeParse(req.body)
                if (!result.success) {
                    throw new AppError('VALIDATION_ERROR', 'Invalid request body', 400, result.error.flatten())
                }
                req.body = result.data
            }

            if (schema.query) {
                const result = schema.query.safeParse(req.query)
                if (!result.success) {
                    throw new AppError('VALIDATION_ERROR', 'Invalid request query', 400, result.error.flatten())
                }
                req.query = result.data
            }

            if (schema.params) {
                const result = schema.params.safeParse(req.params)
                if (!result.success) {
                    throw new AppError('VALIDATION_ERROR', 'Invalid request params', 400, result.error.flatten())
                }
                req.params = result.data
            }

            next()
        } catch (error) {
            next(error)
        }
    }
}

export function validateBody(schema: z.ZodType<any, any>): RequestHandler {
    return validateRequest({ body: schema })
}
