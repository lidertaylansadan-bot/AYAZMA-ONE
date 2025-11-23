import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const createWizardSessionSchema = z.object({
  projectId: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  answers: z.record(z.any()).optional().openapi({ example: { step1: 'value1', step2: 'value2' } }),
}).openapi('CreateWizardSessionRequest')

export const wizardSessionResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  project_id: z.string().uuid(),
  answers: z.record(z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).openapi('WizardSessionResponse')

export const wizardJobResponseSchema = z.object({
  jobId: z.string().openapi({ example: 'job_123456' }),
  status: z.enum(['waiting', 'active', 'completed', 'failed']),
  message: z.string().openapi({ example: 'Wizard processing started' }),
}).openapi('WizardJobResponse')