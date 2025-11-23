import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import {
    createWizardSessionSchema,
    wizardSessionResponseSchema,
    wizardJobResponseSchema
} from '../../modules/wizard/dto.js'
import { z } from 'zod'

export const registry = new OpenAPIRegistry()

export const registerAuthSchemas = () => {
    registry.registerComponent('securitySchemes', 'bearerAuth', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
    })
}

export const registerWizardSchemas = () => {
    // Register wizard endpoints
    registry.registerPath({
        method: 'post',
        path: '/api/wizards/app',
        summary: 'Create App Wizard Session',
        description: 'Creates a new app wizard session and triggers the AppCreationFlow',
        tags: ['Wizards'],
        security: [{ bearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createWizardSessionSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Wizard session created and flow started',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean(),
                            data: z.object({
                                session: wizardSessionResponseSchema,
                                job: wizardJobResponseSchema.nullable(),
                                warning: z.string().optional(),
                            }),
                        }),
                    },
                },
            },
            401: {
                description: 'Unauthorized',
            },
            400: {
                description: 'Validation error',
            },
        },
    })

    registry.registerPath({
        method: 'get',
        path: '/api/wizards/app',
        summary: 'Get App Wizard Sessions',
        description: 'Retrieves all app wizard sessions for a project',
        tags: ['Wizards'],
        security: [{ bearerAuth: [] }],
        request: {
            query: z.object({
                projectId: z.string().uuid(),
            }),
        },
        responses: {
            200: {
                description: 'List of wizard sessions',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean(),
                            data: z.array(wizardSessionResponseSchema),
                        }),
                    },
                },
            },
        },
    })
}
