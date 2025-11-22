import dotenv from 'dotenv';
import path from 'path';
import { GeminiProvider } from '../api/modules/ai/providers/GeminiProvider';

// Load env vars
dotenv.config({ path: path.resolve('api/.env') });

async function main() {
    console.log('Testing Gemini Integration...');
    console.log('API Key present:', !!process.env.AI_GOOGLE_API_KEY);

    if (!process.env.AI_GOOGLE_API_KEY) {
        console.error('Error: AI_GOOGLE_API_KEY is missing in api/.env');
        process.exit(1);
    }

    const provider = new GeminiProvider();

    try {
        console.log('Sending request to Gemini (model: gemini-pro)...');
        const result = await provider.call({
            prompt: 'Hello, are you working? Reply with "Yes, I am Gemini!"',
            context: { modelOverride: 'gemini-2.5-flash' },
            preferences: {}
        });

        console.log('Success!');
        console.log('Response:', result.text);
        console.log('Model:', result.model);
        console.log('Usage:', result.usage);
    } catch (error) {
        console.error('Error calling Gemini:', error);
        // @ts-ignore
        if (error.details) {
            // @ts-ignore
            console.error('Details:', JSON.stringify(error.details, null, 2));
        }
    }
}

main();
