import { OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { registry, registerAuthSchemas, registerWizardSchemas } from './registry.js'

// Extend Zod with OpenAPI capabilities
extendZodWithOpenApi(z)

export const generateOpenApiSpec = () => {
    try {
        registerAuthSchemas()
        registerWizardSchemas()

        const generator = new OpenApiGeneratorV3(registry.definitions)

        return generator.generateDocument({
            openapi: '3.0.0',
            info: {
                version: '1.0.0',
                title: 'AYAZMA-ONE API',
                description: 'API for AYAZMA-ONE Core Panel - Event-Driven Workflow Engine',
            },
            servers: [{ url: '/api' }],
        })
    } catch (error) {
        console.error('Failed to generate OpenAPI spec:', error)
        throw error
    }
}
