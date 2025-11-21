// Quick test for Google Gemini integration
import { providerRegistry } from './api/modules/ai/providers/ProviderRegistry.js'

async function testGemini() {
    console.log('🧪 Testing Google Gemini Integration...\n')

    try {
        const provider = providerRegistry.get('google')
        console.log('✅ Google provider found:', provider.name)

        const result = await provider.call({
            prompt: 'Say "Hello from Gemini!" and nothing else.',
            context: {},
            preferences: {}
        })

        console.log('\n📤 Response from Gemini:')
        console.log('Model:', result.model)
        console.log('Text:', result.text)
        console.log('Usage:', result.usage)
        console.log('\n✅ Google Gemini is working!')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
        console.error('Details:', error)
    }
}

testGemini()
