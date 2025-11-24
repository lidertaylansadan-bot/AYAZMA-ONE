/**
 * Regression Testing Service
 * Manages and executes regression tests for agents
 */

import { supabase } from '../../config/supabase.js'
import { logger } from '../../core/logger.js'
import { runAgentWithPersistence } from '../agents/AgentRunner.js'
import { evalService } from '../eval/evalService.js'
import { callLLM } from '../ai/aiRouter.js'

export interface RegressionTest {
    id: string
    agentName: string
    testName: string
    inputPayload: any
    expectedCharacteristics: any
    severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface RegressionResult {
    testId: string
    agentRunId: string
    passed: boolean
    failureReason?: string
    actualOutput: any
    evalScores: any
}

export class RegressionService {
    /**
     * Run a specific regression test
     */
    async runTest(testId: string): Promise<RegressionResult> {
        logger.info({ testId }, 'Running regression test')

        try {
            // 1. Fetch test definition
            const { data: test, error } = await supabase
                .from('regression_tests')
                .select('*')
                .eq('id', testId)
                .single()

            if (error || !test) throw new Error(`Test not found: ${testId}`)

            // 2. Run the agent
            // We use a special system user ID for regression tests
            const systemUserId = '00000000-0000-0000-0000-000000000000' // Placeholder, ideally fetch a real system user

            // Note: runAgentWithPersistence expects a real user. 
            // For now, we'll assume the test runner provides a valid userId or we use a service account.
            // In a real scenario, we'd have a dedicated test user.
            // For this implementation, we'll try to find the creator of the test
            const userId = test.created_by || systemUserId

            const { runId, output } = await runAgentWithPersistence(test.agent_name, {
                userId,
                projectId: 'regression-testing', // Virtual project
                ...test.input_payload
            })

            // 3. Evaluate the output
            // First, run standard eval
            const evalResult = await evalService.evaluateAgentRun({
                agentRunId: runId,
                userId,
                projectId: 'regression-testing',
                taskType: 'regression_test',
                prompt: JSON.stringify(test.input_payload),
                output: typeof output === 'string' ? output : JSON.stringify(output)
            })

            // 4. Verify against expected characteristics
            const verification = await this.verifyOutput(
                output,
                test.expected_characteristics,
                evalResult
            )

            // 5. Save result
            const result: RegressionResult = {
                testId: test.id,
                agentRunId: runId,
                passed: verification.passed,
                failureReason: verification.reason,
                actualOutput: output,
                evalScores: evalResult.scores
            }

            await this.saveResult(result)

            // 6. Update test status
            await supabase
                .from('regression_tests')
                .update({
                    last_run_at: new Date().toISOString(),
                    last_status: result.passed ? 'pass' : 'fail'
                })
                .eq('id', testId)

            return result
        } catch (error) {
            logger.error({ error, testId }, 'Regression test failed execution')

            // Update test status to error
            await supabase
                .from('regression_tests')
                .update({
                    last_run_at: new Date().toISOString(),
                    last_status: 'error'
                })
                .eq('id', testId)

            throw error
        }
    }

    /**
     * Verify output against expectations using LLM
     */
    private async verifyOutput(
        actualOutput: any,
        expectedCharacteristics: any,
        evalResult: any
    ): Promise<{ passed: boolean; reason?: string }> {
        // If eval score is very low, fail immediately
        if (evalResult.needsFix) {
            return {
                passed: false,
                reason: `Standard evaluation failed (Score: ${evalResult.scores.overall.toFixed(2)})`
            }
        }

        // Use LLM to check specific characteristics
        const prompt = `
      Verify if the actual output meets the expected characteristics.

      Actual Output:
      ${typeof actualOutput === 'string' ? actualOutput : JSON.stringify(actualOutput)}

      Expected Characteristics:
      ${JSON.stringify(expectedCharacteristics, null, 2)}

      Respond with JSON:
      {
        "passed": boolean,
        "reason": "explanation if failed, or 'OK' if passed"
      }
    `

        const response = await callLLM({
            taskType: 'regression_test',
            providerOverride: 'openai',
            prompt: prompt,
            context: {
                modelOverride: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a QA automation verification engine.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0
            }
        })

        try {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/)
            if (!jsonMatch) return { passed: false, reason: 'Verification failed to parse' }
            return JSON.parse(jsonMatch[0])
        } catch (e) {
            return { passed: false, reason: 'Verification error' }
        }
    }

    /**
     * Save regression result
     */
    private async saveResult(result: RegressionResult): Promise<void> {
        const { error } = await supabase
            .from('regression_results')
            .insert({
                test_id: result.testId,
                agent_run_id: result.agentRunId,
                passed: result.passed,
                failure_reason: result.failureReason,
                actual_output: result.actualOutput,
                eval_scores: result.evalScores
            })

        if (error) {
            logger.error({ error }, 'Failed to save regression result')
        }
    }

    /**
     * Create a new regression test
     */
    async createTest(test: Omit<RegressionTest, 'id'>, userId: string): Promise<string> {
        const { data, error } = await supabase
            .from('regression_tests')
            .insert({
                agent_name: test.agentName,
                test_name: test.testName,
                input_payload: test.inputPayload,
                expected_characteristics: test.expectedCharacteristics,
                severity: test.severity,
                created_by: userId
            })
            .select('id')
            .single()

        if (error) throw error
        return data.id
    }
}

export const regressionService = new RegressionService()
