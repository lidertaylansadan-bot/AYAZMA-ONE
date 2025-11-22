import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { WorkflowDesignerAgent } from '../api/modules/agents/WorkflowDesignerAgent.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../api/.env') })

async function testWorkflowAgent() {
    console.log('Testing WorkflowDesignerAgent with Gemini 2.5 Flash...\n')

    const agent = new WorkflowDesignerAgent()

    // Mock context
    const mockContext = {
        userId: 'test-user-id',
        projectId: 'test-project-id',
        runId: 'test-run-id',
        wizardAnswers: {
            projectName: 'AI-Powered CRM',
            sector: 'SaaS',
            projectType: 'saas',
            description: 'A customer relationship management system with AI-powered lead scoring and automation.'
        }
    }

    try {
        console.log('Running WorkflowDesignerAgent...')
        const result = await agent.run(mockContext)

        console.log('\n✅ SUCCESS! Agent executed successfully.\n')
        console.log('Artifacts generated:', result.artifacts.length)

        result.artifacts.forEach((artifact, index) => {
            console.log(`\n--- Artifact ${index + 1}: ${artifact.title} (${artifact.type}) ---`)
            console.log(artifact.content.substring(0, 500) + '...')
            if (artifact.meta) {
                console.log('\nMetadata:', JSON.stringify(artifact.meta, null, 2))
            }
        })

        // Verify Gemini was used
        const firstArtifact = result.artifacts[0]
        if (firstArtifact.meta?.provider === 'google' || firstArtifact.meta?.model?.includes('gemini')) {
            console.log('\n✅ VERIFIED: Agent used Gemini!')
        } else {
            console.log('\n⚠️ WARNING: Agent may not have used Gemini')
            console.log('Provider:', firstArtifact.meta?.provider)
            console.log('Model:', firstArtifact.meta?.model)
        }
    } catch (error) {
        console.error('\n❌ FAILURE: Agent execution failed')
        console.error('Error:', error)
    }
}

testWorkflowAgent()
