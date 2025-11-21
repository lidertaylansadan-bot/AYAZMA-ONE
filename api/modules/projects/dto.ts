import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sector: z.string().min(1),
  projectType: z.enum(['saas', 'web_app', 'mobile_app', 'media', 'hybrid']),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sector: z.string().min(1).optional(),
  project_type: z.enum(['saas', 'web_app', 'mobile_app', 'media', 'hybrid']).optional(),
  status: z.enum(['draft', 'building', 'live', 'archived']).optional(),
})