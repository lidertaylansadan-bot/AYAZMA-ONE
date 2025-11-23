/**
 * Test script for PDF OCR functionality
 * Creates a simple test image and verifies OCR works
 */

import { extractTextFromImage } from '../api/modules/optical-ocr/ocrService.js';
import { createCanvas } from 'canvas';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../api/.env') });

async function testImageOcr() {
    console.log('\n=== Testing Image OCR ===\n');

    try {
        // Create a simple test image with text
        const canvas = createCanvas(400, 100);
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 100);

        // Black text
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText('Hello OCR Test', 50, 60);

        // Convert to buffer
        const buffer = canvas.toBuffer('image/png');

        console.log('Created test image with text: "Hello OCR Test"');
        console.log('Running OCR...\n');

        // Run OCR
        const text = await extractTextFromImage(buffer);

        console.log('OCR Result:', text);
        console.log('Text length:', text.length);

        if (text.toLowerCase().includes('hello')) {
            console.log('\n✅ SUCCESS: OCR detected "hello" in the text');
            return true;
        } else {
            console.log('\n❌ FAIL: OCR did not detect expected text');
            return false;
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error);
        return false;
    }
}

async function testOcrSystem() {
    console.log('Starting OCR System Tests...\n');

    const imageOcrSuccess = await testImageOcr();

    console.log('\n=== Test Summary ===');
    console.log('Image OCR:', imageOcrSuccess ? '✅ PASS' : '❌ FAIL');
    console.log('\nNote: PDF OCR requires pdf-poppler system binaries.');
    console.log('To test PDF OCR, upload a scanned PDF through the UI.');
}

testOcrSystem();
