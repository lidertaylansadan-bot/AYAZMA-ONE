import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import { AppError } from '../../core/app-error.js'
import { logger } from '../../core/logger.js'

/**
 * Extract text from various document formats
 */
export class TextExtractor {
    /**
     * Extract text from a document buffer based on MIME type
     */
    async extractText(buffer: Buffer, mimeType: string): Promise<string> {
        try {
            switch (mimeType) {
                case 'application/pdf':
                    return await this.extractFromPdf(buffer)

                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                case 'application/msword':
                    return await this.extractFromDocx(buffer)

                case 'text/plain':
                case 'text/markdown':
                    return this.extractFromText(buffer)

                default:
                    throw new AppError(
                        'UNSUPPORTED_FORMAT',
                        `Unsupported document format: ${mimeType}`,
                        400
                    )
            }
        } catch (error: any) {
            logger.error({ err: error, mimeType }, 'Text extraction failed')

            if (error instanceof AppError) throw error

            throw new AppError(
                'EXTRACTION_FAILED',
                `Failed to extract text: ${error.message}`,
                500
            )
        }
    }

    /**
     * Extract text from PDF
     */
    private async extractFromPdf(buffer: Buffer): Promise<string> {
        const data = await pdf(buffer)

        if (!data.text || data.text.trim().length === 0) {
            throw new AppError('EMPTY_DOCUMENT', 'PDF contains no extractable text', 400)
        }

        return this.cleanText(data.text)
    }

    /**
     * Extract text from DOCX
     */
    private async extractFromDocx(buffer: Buffer): Promise<string> {
        const result = await mammoth.extractRawText({ buffer })

        if (!result.value || result.value.trim().length === 0) {
            throw new AppError('EMPTY_DOCUMENT', 'Document contains no extractable text', 400)
        }

        return this.cleanText(result.value)
    }

    /**
     * Extract text from plain text files
     */
    private extractFromText(buffer: Buffer): Promise<string> {
        const text = buffer.toString('utf-8')

        if (!text || text.trim().length === 0) {
            throw new AppError('EMPTY_DOCUMENT', 'Text file is empty', 400)
        }

        return Promise.resolve(this.cleanText(text))
    }

    /**
     * Clean and normalize extracted text
     */
    private cleanText(text: string): string {
        return text
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            // Remove control characters except newlines
            .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
            // Normalize newlines
            .replace(/\r\n/g, '\n')
            // Remove multiple consecutive newlines
            .replace(/\n{3,}/g, '\n\n')
            // Trim
            .trim()
    }
}

export const textExtractor = new TextExtractor()
