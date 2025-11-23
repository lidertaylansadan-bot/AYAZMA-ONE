/**
 * Compression Provider Registry
 * Manages different compression strategies
 */

import type { OpticalCompressionService, CompressionStrategy } from './types'
import { createTextOnlyCompressionService } from './TextOnlyCompressionService'
import { AppError } from '../../core/app-error'

export class CompressionProviderRegistry {
    private providers = new Map<CompressionStrategy, OpticalCompressionService>()

    constructor() {
        // Register default providers
        this.registerDefaults()
    }

    /**
     * Register default compression providers
     */
    private registerDefaults() {
        // Text-only compression (baseline)
        this.register('text_only', createTextOnlyCompressionService())

        // Placeholder for future providers
        // this.register('optical_v1', createOpticalV1CompressionService())
        // this.register('optical_v2', createOpticalV2CompressionService())
    }

    /**
     * Register a compression provider
     */
    register(strategy: CompressionStrategy, provider: OpticalCompressionService) {
        this.providers.set(strategy, provider)
    }

    /**
     * Get a compression provider by strategy
     */
    get(strategy: CompressionStrategy): OpticalCompressionService {
        const provider = this.providers.get(strategy)

        if (!provider) {
            throw new AppError(
                'NOT_FOUND',
                `No compression provider found for strategy: ${strategy}`
            )
        }

        return provider
    }

    /**
     * Check if a strategy is supported
     */
    has(strategy: CompressionStrategy): boolean {
        return this.providers.has(strategy)
    }

    /**
     * Get all supported strategies
     */
    getSupportedStrategies(): CompressionStrategy[] {
        return Array.from(this.providers.keys())
    }
}

// Singleton instance
export const compressionRegistry = new CompressionProviderRegistry()
