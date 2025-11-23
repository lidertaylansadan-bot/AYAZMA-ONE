/**
 * Test Runner Script
 * Runs all Stage 2 tests and generates report
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface TestResult {
    suite: string
    passed: number
    failed: number
    skipped: number
    duration: number
    errors: string[]
}

async function runTests(): Promise<void> {
    console.log('🧪 Running Stage 2 Test Suite...\n')

    const results: TestResult[] = []
    const startTime = Date.now()

    // Test suites to run
    const testSuites = [
        { name: 'Document Service', file: 'documentService.test.ts' },
        { name: 'RAG Service', file: 'ragService.test.ts' },
        { name: 'Context Engineer', file: 'contextEngineer.test.ts' },
        { name: 'Agent Runner', file: 'agentRunner.test.ts' },
    ]

    for (const suite of testSuites) {
        console.log(`\n📋 Running ${suite.name}...`)

        try {
            const { stdout, stderr } = await execAsync(
                `npx vitest run tests/${suite.file} --reporter=json`,
                { cwd: process.cwd() }
            )

            // Parse results
            const result = parseTestOutput(stdout, suite.name)
            results.push(result)

            if (result.failed === 0) {
                console.log(`✅ ${suite.name}: All tests passed`)
            } else {
                console.log(`❌ ${suite.name}: ${result.failed} test(s) failed`)
            }
        } catch (error: any) {
            console.log(`❌ ${suite.name}: Test suite failed to run`)
            results.push({
                suite: suite.name,
                passed: 0,
                failed: 1,
                skipped: 0,
                duration: 0,
                errors: [error.message],
            })
        }
    }

    const totalTime = Date.now() - startTime

    // Generate report
    await generateReport(results, totalTime)

    // Print summary
    printSummary(results, totalTime)

    // Exit with error code if any tests failed
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)
    process.exit(totalFailed > 0 ? 1 : 0)
}

function parseTestOutput(output: string, suiteName: string): TestResult {
    try {
        const json = JSON.parse(output)
        return {
            suite: suiteName,
            passed: json.numPassedTests || 0,
            failed: json.numFailedTests || 0,
            skipped: json.numPendingTests || 0,
            duration: json.testResults?.[0]?.perfStats?.runtime || 0,
            errors: json.testResults?.[0]?.failureMessage
                ? [json.testResults[0].failureMessage]
                : [],
        }
    } catch {
        return {
            suite: suiteName,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            errors: ['Failed to parse test output'],
        }
    }
}

async function generateReport(
    results: TestResult[],
    totalTime: number
): Promise<void> {
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0)
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0)
    const totalTests = totalPassed + totalFailed + totalSkipped

    const report = `# Stage 2 Test Report

**Date**: ${new Date().toISOString()}
**Duration**: ${(totalTime / 1000).toFixed(2)}s

## Summary

- **Total Tests**: ${totalTests}
- **Passed**: ${totalPassed} ✅
- **Failed**: ${totalFailed} ❌
- **Skipped**: ${totalSkipped} ⏭️
- **Success Rate**: ${((totalPassed / totalTests) * 100).toFixed(1)}%

## Test Suites

${results
            .map(
                (r) => `### ${r.suite}

- Passed: ${r.passed}
- Failed: ${r.failed}
- Skipped: ${r.skipped}
- Duration: ${(r.duration / 1000).toFixed(2)}s

${r.errors.length > 0 ? `**Errors:**\n\`\`\`\n${r.errors.join('\n')}\n\`\`\`` : ''}
`
            )
            .join('\n')}

## Recommendations

${totalFailed === 0 ? '✅ All tests passed! Stage 2 is ready for production.' : `❌ ${totalFailed} test(s) failed. Please fix before proceeding.`}

${totalSkipped > 0
            ? `⚠️ ${totalSkipped} test(s) skipped. Consider implementing these tests.`
            : ''
        }
`

    const reportPath = path.join(
        process.cwd(),
        '.gemini',
        'antigravity',
        'brain',
        '70c36fc8-8367-4570-9adc-99a07f795161',
        'test-report.md'
    )

    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, report)

    console.log(`\n📄 Report saved to: ${reportPath}`)
}

function printSummary(results: TestResult[], totalTime: number): void {
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0)
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)
    const totalTests = totalPassed + totalFailed

    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${totalPassed} ✅`)
    console.log(`Failed: ${totalFailed} ❌`)
    console.log(`Duration: ${(totalTime / 1000).toFixed(2)}s`)
    console.log(
        `Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`
    )
    console.log('='.repeat(60))

    if (totalFailed === 0) {
        console.log('\n🎉 All tests passed!')
    } else {
        console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review.`)
    }
}

// Run tests
runTests().catch((error) => {
    console.error('Fatal error running tests:', error)
    process.exit(1)
})
