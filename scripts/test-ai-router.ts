import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { routeAiRequest } from '../api/modules/ai/aiRouter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../api/.env') })

async function testAiRouter() {
    console.log('Testing AI Router with Gemini...')
    try {
        const result = await routeAiRequest({
            taskType: 'app_spec_suggestion',
            prompt: 'Hello, are you Gemini? Reply with "Yes, I am Gemini!"',
            userId: 'test-user',
            projectId: 'test-project',
            preferences: { costPreference: 'low' }
        })

        console.log('Result:', result)
        if (result.provider === 'google' || result.model.includes('gemini')) {
            console.log('SUCCESS: AI Router used Gemini!')
        } else {
            console.error('FAILURE: AI Router used', result.provider, result.model)
        }
    } catch (error) {
        console.error('Error testing AI Router:', error)
    }
}

testAiRouter()
