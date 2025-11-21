import { z } from 'zod'

export const createWizardSessionSchema = z.object({
  projectId: z.string().uuid(),
  answers: z.record(z.any()).optional(),
})