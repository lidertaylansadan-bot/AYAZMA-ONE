// SPDX-License-Identifier: MIT
/**
 * PDF Converter Module
 * Converts PDF pages to images for OCR processing using pdf-poppler
 */

import { convert } from 'pdf-poppler';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../../core/logger.js';

export interface PdfToImageOptions {
    format?: 'png' | 'jpeg';
    scale?: number; // DPI scale (1 = 72 DPI, 2 = 144 DPI, etc.)
    maxPages?: number; // Limit number of pages to convert
}

export interface PageImage {
    pageNumber: number;
    imagePath: string;
}

/**
 * Converts PDF buffer to images, one per page
 * Returns array of page image paths
 */
export async function convertPdfToImages(
    pdfBuffer: Buffer,
    options: PdfToImageOptions = {}
): Promise<PageImage[]> {
    const {
        format = 'png',
        scale = 2, // 144 DPI for good OCR quality
        maxPages = 50
    } = options;

    // Create temp directory for this conversion
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-ocr-'));
    const pdfPath = path.join(tempDir, 'input.pdf');

    try {
        // Write PDF buffer to temp file (pdf-poppler requires file path)
        await fs.writeFile(pdfPath, pdfBuffer);

        logger.info({ tempDir, scale, format }, 'Converting PDF to images');

        // Convert PDF to images
        const convertOptions = {
            format,
            out_dir: tempDir,
            out_prefix: 'page',
            page: null, // Convert all pages
            scale_to: scale * 72, // Convert scale to DPI
        };

        await convert(pdfPath, convertOptions);

        // Find all generated image files
        const files = await fs.readdir(tempDir);
        const imageFiles = files
            .filter(f => f.startsWith('page') && (f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg')))
            .sort(); // Sort to maintain page order

        // Limit to maxPages
        const limitedFiles = imageFiles.slice(0, maxPages);

        // Map to PageImage objects
        const pageImages: PageImage[] = limitedFiles.map((file, index) => ({
            pageNumber: index + 1,
            imagePath: path.join(tempDir, file)
        }));

        logger.info({ pageCount: pageImages.length }, 'PDF converted to images');

        return pageImages;
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : error }, 'PDF to image conversion failed');
        // Clean up temp directory on error
        await cleanupTempDir(tempDir);
        throw error;
    }
}

/**
 * Cleans up temporary directory and all its contents
 */
export async function cleanupTempDir(tempDir: string): Promise<void> {
    try {
        await fs.rm(tempDir, { recursive: true, force: true });
        logger.debug({ tempDir }, 'Cleaned up temp directory');
    } catch (error) {
        logger.warn({ error: error instanceof Error ? error.message : error, tempDir }, 'Failed to clean up temp directory');
    }
}

/**
 * Cleans up specific page images
 */
export async function cleanupPageImages(pageImages: PageImage[]): Promise<void> {
    for (const page of pageImages) {
        try {
            await fs.unlink(page.imagePath);
        } catch (error) {
            logger.warn({ error: error instanceof Error ? error.message : error, path: page.imagePath }, 'Failed to delete page image');
        }
    }
}
