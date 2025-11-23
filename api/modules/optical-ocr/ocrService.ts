// SPDX-License-Identifier: MIT
/**
 * OCR Service
 * Provides functions to extract text from scanned/image-based documents.
 * Uses Tesseract.js for local OCR and pdf-poppler for PDF conversion.
 */
import { createWorker } from 'tesseract.js';
import { logger } from '../../core/logger.js';
import type { Buffer } from 'node:buffer';
import { convertPdfToImages, cleanupTempDir, type PageImage } from './pdfConverter.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * OCR result for a single page
 */
export interface PageOcrResult {
    pageNumber: number;
    text: string;
    confidence: number; // 0-100
    processingTimeMs: number;
}

/**
 * Complete PDF OCR result
 */
export interface PdfOcrResult {
    text: string; // Combined text from all pages
    pages: PageOcrResult[];
    totalPages: number;
    averageConfidence: number;
    totalProcessingTimeMs: number;
}

/**
 * Determines if a PDF buffer likely represents a scanned document.
 * Placeholder logic: always returns true for demonstration purposes.
 */
export async function isScannedPdf(buffer: Buffer): Promise<boolean> {
    // In a real implementation, inspect PDF objects to see if there is any extractable text.
    // For now we assume PDFs need OCR unless proven otherwise.
    logger.debug({ size: buffer.length }, 'Checking if PDF is scanned');
    return true;
}

/**
 * Extracts text from an image buffer using Tesseract.js.
 */
export async function extractTextFromImage(buffer: Buffer): Promise<string> {
    let worker: unknown = null;
    try {
        logger.info('Starting OCR on image...');
        // Create worker with English language
        worker = await createWorker('eng');
        // Tesseract.js worker types can be tricky, casting to any for safety in this context
        const { data: { text } } = await (worker as any).recognize(buffer);
        logger.info({ textLength: text.length }, 'OCR completed');
        return text;
    } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : err }, 'OCR failed for image');
        throw err;
    } finally {
        if (worker) {
            await (worker as any).terminate();
        }
    }
}

/**
 * Extracts text from a single page image using OCR
 */
async function extractTextFromPageImage(imagePath: string, pageNumber: number): Promise<PageOcrResult> {
    const startTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let worker: any = null;

    try {
        // Read image file
        const imageBuffer = await fs.readFile(imagePath);

        // Create Tesseract worker
        worker = await createWorker('eng');

        // Perform OCR
        const { data: { text, confidence } } = await worker.recognize(imageBuffer);

        const processingTimeMs = Date.now() - startTime;

        logger.debug({ pageNumber, confidence, processingTimeMs }, 'Page OCR completed');

        return {
            pageNumber,
            text,
            confidence,
            processingTimeMs
        };
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : error, pageNumber }, 'Page OCR failed');
        return {
            pageNumber,
            text: '',
            confidence: 0,
            processingTimeMs: Date.now() - startTime
        };
    } finally {
        if (worker) {
            await worker.terminate();
        }
    }
}

/**
 * Extracts text from a scanned PDF using OCR.
 * Converts PDF pages to images and runs Tesseract on each page.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    const result = await extractTextFromPdfWithDetails(buffer);
    return result.text;
}

/**
 * Extracts text from a scanned PDF with detailed results per page.
 */
export async function extractTextFromPdfWithDetails(buffer: Buffer): Promise<PdfOcrResult> {
    const startTime = Date.now();
    let pageImages: PageImage[] = [];
    let tempDir: string | null = null;

    try {
        logger.info({ size: buffer.length }, 'Starting PDF OCR');

        // Convert PDF to images
        pageImages = await convertPdfToImages(buffer, {
            format: 'png',
            scale: 2, // 144 DPI for good quality
            maxPages: 50 // Limit to prevent excessive processing
        });

        if (pageImages.length === 0) {
            logger.warn('No pages extracted from PDF');
            return {
                text: '',
                pages: [],
                totalPages: 0,
                averageConfidence: 0,
                totalProcessingTimeMs: Date.now() - startTime
            };
        }

        // Extract temp directory from first page path
        tempDir = path.dirname(pageImages[0].imagePath);

        logger.info({ pageCount: pageImages.length }, 'Processing PDF pages with OCR');

        // Process pages sequentially to avoid overwhelming the system
        // TODO: Add parallel processing with concurrency limit
        const pageResults: PageOcrResult[] = [];
        for (const pageImage of pageImages) {
            const result = await extractTextFromPageImage(pageImage.imagePath, pageImage.pageNumber);
            pageResults.push(result);

            // Log warning for low confidence pages
            if (result.confidence < 60) {
                logger.warn({ pageNumber: result.pageNumber, confidence: result.confidence }, 'Low confidence OCR result');
            }
        }

        // Combine all page texts
        const combinedText = pageResults
            .map(p => p.text)
            .filter(t => t.trim().length > 0)
            .join('\n\n');

        // Calculate average confidence
        const avgConfidence = pageResults.length > 0
            ? pageResults.reduce((sum, p) => sum + p.confidence, 0) / pageResults.length
            : 0;

        const totalProcessingTimeMs = Date.now() - startTime;

        logger.info({
            totalPages: pageResults.length,
            averageConfidence: avgConfidence.toFixed(2),
            totalProcessingTimeMs,
            textLength: combinedText.length
        }, 'PDF OCR completed');

        return {
            text: combinedText,
            pages: pageResults,
            totalPages: pageResults.length,
            averageConfidence: avgConfidence,
            totalProcessingTimeMs
        };
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : error }, 'PDF OCR failed');
        return {
            text: '',
            pages: [],
            totalPages: 0,
            averageConfidence: 0,
            totalProcessingTimeMs: Date.now() - startTime
        };
    } finally {
        // Clean up temp directory
        if (tempDir) {
            await cleanupTempDir(tempDir);
        }
    }
}

/**
 * High‑level helper that decides whether OCR is needed and performs it.
 * Returns extracted text (may be empty if OCR not required or fails).
 */
export async function performOcrIfNeeded(buffer: Buffer, mimeType: string): Promise<string> {
    try {
        if (mimeType === 'application/pdf') {
            const needsOcr = await isScannedPdf(buffer);
            if (!needsOcr) return '';
            return await extractTextFromPdf(buffer);
        } else if (mimeType.startsWith('image/')) {
            return await extractTextFromImage(buffer);
        }
        return '';
    } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : err }, 'OCR processing failed');
        return '';
    }
}
