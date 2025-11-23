import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry, registerAuthSchemas, registerWizardSchemas } from './registry.js'

export const generateOpenApiSpec = () => {
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
}
