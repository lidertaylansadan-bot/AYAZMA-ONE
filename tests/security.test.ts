import { describe, it, expect, vi } from 'vitest'
import { validateRequest } from '../api/middleware/validate'
import { z } from 'zod'
import { AppError } from '../api/core/app-error'

describe('Security Middleware', () => {
    describe('Validation Middleware', () => {
        it('validates request body successfully', () => {
            const schema = { body: z.object({ name: z.string() }) }
            const req = { body: { name: 'test' } } as any
            const next = vi.fn()

            validateRequest(schema)(req, {} as any, next)

            expect(next).toHaveBeenCalledWith()
            expect(req.body).toEqual({ name: 'test' })
        })

        it('throws error for invalid request body', () => {
            const schema = { body: z.object({ name: z.string() }) }
            const req = { body: { name: 123 } } as any
            const next = vi.fn()

            validateRequest(schema)(req, {} as any, next)

            expect(next).toHaveBeenCalledWith(expect.any(AppError))
            const error = next.mock.calls[0][0]
            expect(error.statusCode).toBe(400)
            expect(error.code).toBe('VALIDATION_ERROR')
        })

        it('validates query params', () => {
            const schema = { query: z.object({ page: z.string().transform(Number) }) }
            const req = { query: { page: '1' } } as any
            const next = vi.fn()

            validateRequest(schema)(req, {} as any, next)

            expect(next).toHaveBeenCalledWith()
            expect(req.query).toEqual({ page: 1 })
        })
    })
})
