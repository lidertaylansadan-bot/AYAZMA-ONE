import { supabase } from '../../config/supabase.js'
import { AppError } from '../../core/app-error.js'
import { logger } from '../../core/logger.js'
import type { ProjectDocument, DocumentListResponse } from './types.js'

export class DocumentService {
    /**
     * Upload a document to a project
     */
    async uploadDocument(
        projectId: string,
        file: Express.Multer.File,
        userId: string,
        title?: string
    ): Promise<ProjectDocument> {
        // Verify project ownership
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('owner_id', userId)
            .single()

        if (projectError || !project) {
            throw new AppError('PROJECT_NOT_FOUND', 'Project not found or access denied', 404)
        }

        // Generate storage path
        const timestamp = Date.now()
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `${userId}/${projectId}/${timestamp}_${sanitizedFilename}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('project-documents')
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            })

        if (uploadError) {
            logger.error({ err: uploadError }, 'Failed to upload document to storage')
            throw new AppError('UPLOAD_FAILED', 'Failed to upload document', 500)
        }

        // Create document record
        const { data: document, error: dbError } = await supabase
            .from('project_documents')
            .insert({
                project_id: projectId,
                title: title || file.originalname,
                source_type: 'upload',
                original_path: file.originalname,
                storage_path: storagePath,
                mime_type: file.mimetype,
                processing_status: 'pending',
            })
            .select()
            .single()

        if (dbError || !document) {
            // Cleanup storage if DB insert fails
            await supabase.storage.from('project-documents').remove([storagePath])
            logger.error({ err: dbError }, 'Failed to create document record')
            throw new AppError('DB_ERROR', 'Failed to create document record', 500)
        }

        logger.info({ documentId: document.id, projectId }, 'Document uploaded successfully')
        return document as ProjectDocument
    }

    /**
     * List all documents for a project
     */
    async listDocuments(projectId: string, userId: string): Promise<DocumentListResponse> {
        // Verify project ownership
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('owner_id', userId)
            .single()

        if (projectError || !project) {
            throw new AppError('PROJECT_NOT_FOUND', 'Project not found or access denied', 404)
        }

        const { data: documents, error, count } = await supabase
            .from('project_documents')
            .select('*', { count: 'exact' })
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (error) {
            logger.error({ err: error }, 'Failed to list documents')
            throw new AppError('DB_ERROR', 'Failed to list documents', 500)
        }

        return {
            documents: (documents || []) as ProjectDocument[],
            total: count || 0,
        }
    }

    /**
     * Get a single document by ID
     */
    async getDocumentById(documentId: string, userId: string): Promise<ProjectDocument> {
        const { data: document, error } = await supabase
            .from('project_documents')
            .select(`
        *,
        projects!inner(owner_id)
      `)
            .eq('id', documentId)
            .single()

        if (error || !document) {
            throw new AppError('DOCUMENT_NOT_FOUND', 'Document not found', 404)
        }

        // Check ownership via project
        if ((document as any).projects.owner_id !== userId) {
            throw new AppError('FORBIDDEN', 'Access denied', 403)
        }

        return document as ProjectDocument
    }

    /**
     * Delete a document and all its chunks
     */
    async deleteDocument(documentId: string, userId: string): Promise<void> {
        // Get document with ownership check
        const document = await this.getDocumentById(documentId, userId)

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from('project-documents')
            .remove([document.storage_path])

        if (storageError) {
            logger.warn({ err: storageError, documentId }, 'Failed to delete document from storage')
            // Continue with DB deletion even if storage fails
        }

        // Delete from database (chunks will cascade delete)
        const { error: dbError } = await supabase
            .from('project_documents')
            .delete()
            .eq('id', documentId)

        if (dbError) {
            logger.error({ err: dbError }, 'Failed to delete document from database')
            throw new AppError('DB_ERROR', 'Failed to delete document', 500)
        }

        logger.info({ documentId }, 'Document deleted successfully')
    }

    /**
     * Update document processing status
     */
    async updateProcessingStatus(
        documentId: string,
        status: 'pending' | 'processing' | 'completed' | 'failed'
    ): Promise<void> {
        const { error } = await supabase
            .from('project_documents')
            .update({ processing_status: status })
            .eq('id', documentId)

        if (error) {
            logger.error({ err: error, documentId, status }, 'Failed to update processing status')
            throw new AppError('DB_ERROR', 'Failed to update processing status', 500)
        }
    }

    /**
     * Download document content from storage
     */
    async downloadDocument(documentId: string, userId: string): Promise<Buffer> {
        const document = await this.getDocumentById(documentId, userId)

        const { data, error } = await supabase.storage
            .from('project-documents')
            .download(document.storage_path)

        if (error || !data) {
            logger.error({ err: error, documentId }, 'Failed to download document')
            throw new AppError('DOWNLOAD_FAILED', 'Failed to download document', 500)
        }

        return Buffer.from(await data.arrayBuffer())
    }
}

export const documentService = new DocumentService()
