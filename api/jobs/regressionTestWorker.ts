/**
 * Regression Test Worker
 * Executes regression tests on a schedule
 */

import { Worker, Queue } from 'bullmq'
import { redisConnection as redis } from '../config/redis.js'
import { logger } from '../core/logger.js'
import { regressionService } from '../modules/testing/regressionService.js'
import { supabase } from '../config/supabase.js'

const QUEUE_NAME = 'regression-tests'

// Create queue for scheduling
export const regressionQueue = new Queue(QUEUE_NAME, { connection: redis })

// Worker to process test jobs
export const regressionWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
        const { testId } = job.data
        logger.info({ jobId: job.id, testId }, 'Processing regression test job')

        try {
            const result = await regressionService.runTest(testId)

            return {
                passed: result.passed,
                timestamp: new Date().toISOString()
            }
        } catch (error) {
            logger.error({ error, jobId: job.id }, 'Regression test job failed')
            throw error
        }
    },
    { connection: redis }
)

// Event listeners
regressionWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, result: job.returnvalue }, 'Regression test job completed')
})

regressionWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Regression test job failed')
})

/**
 * Schedule all active regression tests
 * Typically called nightly
 */
export async function scheduleAllRegressionTests() {
    logger.info('Scheduling all regression tests')

    const { data: tests, error } = await supabase
        .from('regression_tests')
        .select('id, agent_name')

    if (error) {
        logger.error({ error }, 'Failed to fetch regression tests for scheduling')
        return
    }

    if (!tests || tests.length === 0) {
        logger.info('No regression tests found to schedule')
        return
    }

    for (const test of tests) {
        await regressionQueue.add(
            'run-regression-test',
            { testId: test.id },
            {
                jobId: `regression-${test.id}-${Date.now()}`,
                removeOnComplete: true,
                removeOnFail: 100
            }
        )
    }

    logger.info({ count: tests.length }, 'Regression tests scheduled')
}

/**
 * Initialize nightly schedule
 */
export async function initRegressionSchedule() {
    // Add a repeatable job to trigger the full suite
    await regressionQueue.add(
        'nightly-scheduler',
        {},
        {
            repeat: { pattern: '0 2 * * *' }, // Run at 2 AM daily
            jobId: 'nightly-regression-scheduler'
        }
    )
    logger.info('Regression schedule initialized')
}

// Scheduler worker to trigger nightly runs
export const schedulerWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
        if (job.name === 'nightly-scheduler') {
            await scheduleAllRegressionTests()
        }
    },
    { connection: redis }
)
