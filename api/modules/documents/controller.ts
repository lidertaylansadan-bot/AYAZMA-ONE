import type { Request, Response } from 'express'
import { documentService } from './service.js'
import { documentProcessor } from './processor.js'
import { AppError } from '../../core/app-error.js'
import { logger } from '../../core/logger.js'

/**
 * Upload a document to a project
 */
export async function uploadDocumentHandler(req: Request, res: Response) {
    try {
        const { projectId } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
        }

        if (!req.file) {
            throw new AppError('NO_FILE', 'No file uploaded', 400)
        }

        // Upload document
        const document = await documentService.uploadDocument(
            projectId,
            req.file,
            userId,
            req.body.title
        )

        // Start processing asynchronously (fire and forget for synchronous MVP)
        // In production, this should use a queue
        documentProcessor.processDocument(document.id, userId).catch(err => {
            logger.error({ err, documentId: document.id }, 'Background processing failed')
        })

        res.status(201).json({
            success: true,
            data: document,
        })
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code,
            })
        } else {
            logger.error({ err: error }, 'Upload handler error')
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            })
        }
    }
}

/**
 * List all documents for a project
 */
export async function listDocumentsHandler(req: Request, res: Response) {
    try {
        const { projectId } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
        }

        const result = await documentService.listDocuments(projectId, userId)

        res.json({
            success: true,
            data: result.documents,
            total: result.total,
        })
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code,
            })
        } else {
            logger.error({ err: error }, 'List documents handler error')
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            })
        }
    }
}

/**
 * Get a single document
 */
export async function getDocumentHandler(req: Request, res: Response) {
    try {
        const { documentId } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
        }

        const document = await documentService.getDocumentById(documentId, userId)

        res.json({
            success: true,
            data: document,
        })
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code,
            })
        } else {
            logger.error({ err: error }, 'Get document handler error')
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            })
        }
    }
}

/**
 * Delete a document
 */
export async function deleteDocumentHandler(req: Request, res: Response) {
    try {
        const { documentId } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
        }

        await documentService.deleteDocument(documentId, userId)

        res.json({
            success: true,
            message: 'Document deleted successfully',
        })
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code,
            })
        } else {
            logger.error({ err: error }, 'Delete document handler error')
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            })
        }
    }
}

/**
 * Get chunks for a document
 */
export async function getDocumentChunksHandler(req: Request, res: Response) {
    try {
        const { documentId } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
        }

        const chunks = await documentProcessor.getDocumentChunks(documentId, userId)

        res.json({
            success: true,
            data: chunks,
            total: chunks.length,
        })
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code,
            })
        } else {
            logger.error({ err: error }, 'Get chunks handler error')
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            })
        }
    }
}

/**
 * Reprocess a failed document
 */
export async function reprocessDocumentHandler(req: Request, res: Response) {
    try {
        const { documentId } = req.params
        const userId = req.user?.id

        if (!userId) {
            throw new AppError('UNAUTHORIZED', 'User not authenticated', 401)
        }

        const result = await documentProcessor.reprocessDocument(documentId, userId)

        res.json({
            success: true,
            data: result,
        })
    } catch (error: any) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code,
            })
        } else {
            logger.error({ err: error }, 'Reprocess handler error')
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            })
        }
    }
}
