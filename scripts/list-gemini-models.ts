import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
dotenv.config({ path: path.resolve('api/.env') });

const API_KEY = process.env.AI_GOOGLE_API_KEY;

if (!API_KEY) {
    console.error('Error: AI_GOOGLE_API_KEY is missing');
    process.exit(1);
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error('Error listing models:', data);
            return;
        }

        fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
        console.log('Models written to models.json');

    } catch (error) {
        console.error('Network error:', error);
    }
}

listModels();
