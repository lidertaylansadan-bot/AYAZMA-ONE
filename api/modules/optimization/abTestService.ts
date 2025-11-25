import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import crypto from 'crypto'
import { ABTest, Variant } from './types.js'

export class ABTestService {
    /**
     * Get the effective configuration for a user, applying any active A/B tests.
     */
    async getEffectiveConfig(userId: string, baseConfig: Record<string, any>): Promise<{ config: Record<string, any>, testId?: string, variantId?: string }> {
        try {
            // 1. Fetch active A/B tests
            const { data: activeTests, error } = await supabase
                .from('ab_tests')
                .select('*')
                .eq('status', 'active')
                .lte('start_date', new Date().toISOString())
                .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)

            if (error) {
                logger.error({ err: error }, 'Error fetching active A/B tests')
                return { config: baseConfig }
            }

            if (!activeTests || activeTests.length === 0) {
                return { config: baseConfig }
            }

            // For simplicity, we'll just take the first active test for now.
            // In a real system, we might have multiple non-overlapping tests.
            const test = activeTests[0] as ABTest

            // 2. Determine variant
            const variantId = this.assignVariant(userId, test)
            const variant = test.variants.find(v => v.id === variantId)

            if (!variant) {
                logger.warn({ variantId, testId: test.id }, 'Variant not found for test')
                return { config: baseConfig }
            }

            logger.info({ userId, variantId, testId: test.id, testName: test.name }, 'Assigned user to variant')

            // 3. Merge config
            // Variant config overrides base config
            const effectiveConfig = {
                ...baseConfig,
                ...variant.config
            }

            return {
                config: effectiveConfig,
                testId: test.id,
                variantId: variant.id
            }

        } catch (error) {
            logger.error({ err: error }, 'Error in getEffectiveConfig')
            return { config: baseConfig }
        }
    }

    /**
     * Deterministically assign a user to a variant based on traffic split.
     */
    private assignVariant(userId: string, test: ABTest): string {
        // Create a hash of userId + testId to ensure consistent assignment for the same user/test
        const hash = crypto.createHash('md5').update(`${userId}:${test.id}`).digest('hex')

        // Convert first 8 chars of hash to integer (0-4294967295)
        const hashInt = parseInt(hash.substring(0, 8), 16)

        // Normalize to 0-1
        const normalized = hashInt / 0xffffffff

        // Check against traffic split
        let cumulative = 0
        for (const [variantId, percentage] of Object.entries(test.traffic_split)) {
            cumulative += percentage
            if (normalized < cumulative) {
                return variantId
            }
        }

        // Fallback to first variant if something goes wrong (shouldn't happen if percentages sum to 1)
        return test.variants[0].id
    }

    /**
     * Create a new A/B test from an optimized prompt
     */
    async createTestFromOptimization(
        name: string,
        originalPrompt: string,
        optimizedPrompt: string,
        optimizationResult: any
    ): Promise<ABTest | null> {
        try {
            const testId = crypto.randomUUID()

            const newTest: ABTest = {
                id: testId,
                name: `Optimization: ${name}`,
                status: 'draft', // Start as draft for safety
                variants: [
                    {
                        id: 'control',
                        config: { systemPrompt: originalPrompt }
                    },
                    {
                        id: 'variant-a',
                        config: { systemPrompt: optimizedPrompt }
                    }
                ],
                traffic_split: {
                    'control': 0.5,
                    'variant-a': 0.5
                },
                start_date: new Date().toISOString()
            }

            const { error } = await supabase
                .from('ab_tests')
                .insert({
                    id: newTest.id,
                    name: newTest.name,
                    variants: newTest.variants,
                    traffic_split: newTest.traffic_split,
                    status: newTest.status,
                    start_date: newTest.start_date
                })

            if (error) {
                logger.error({ err: error }, 'Failed to create A/B test from optimization')
                return null
            }

            logger.info({ testId: newTest.id }, 'Created A/B test from optimization')
            return newTest

        } catch (error) {
            logger.error({ err: error }, 'Error in createTestFromOptimization')
            return null
        }
    }
}

export const abTestService = new ABTestService()
