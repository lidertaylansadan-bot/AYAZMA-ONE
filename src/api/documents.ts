import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface ProjectDocument {
    id: string
    project_id: string
    title: string
    source_type: string
    original_path: string
    storage_path: string
    mime_type: string
    processing_status: 'pending' | 'processing' | 'completed' | 'failed'
    created_at: string
    updated_at: string
}

export interface DocumentChunk {
    id: string
    document_id: string
    chunk_index: number
    text: string
    created_at: string
}

export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/projects/${projectId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data || response.data
}

export async function uploadDocument(
    projectId: string,
    file: File,
    title?: string
): Promise<ProjectDocument> {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)

    const response = await axios.post(
        `${API_URL}/projects/${projectId}/documents/upload`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        }
    )
    return response.data.data || response.data
}

export async function deleteDocument(projectId: string, documentId: string): Promise<void> {
    const token = localStorage.getItem('token')
    await axios.delete(`${API_URL}/projects/${projectId}/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
}

export async function getDocumentChunks(
    projectId: string,
    documentId: string
): Promise<DocumentChunk[]> {
    const token = localStorage.getItem('token')
    const response = await axios.get(
        `${API_URL}/projects/${projectId}/documents/${documentId}/chunks`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    )
    return response.data.data || response.data
}

export type CompressionStrategy = 'text-only' | 'optical-v1'

export interface CompressionOptions {
    ocrEnabled?: boolean
    targetTokenBudget?: number
}

export interface CompressionDetails {
    id: string
    documentId: string
    strategy: CompressionStrategy
    modelName: string
    rawTokenCount: number
    compressedTokenCount: number
    tokenSavingEstimate: number
    processingTimeMs: number
    createdAt: string
    segments: {
        segmentIndex: number
        segmentType: string
        pageNumbers: number[]
        estimatedTokens: number
        preview: string
    }[]
}

export async function compressDocument(
    projectId: string,
    documentId: string,
    strategy: CompressionStrategy,
    options?: CompressionOptions
): Promise<void> {
    const token = localStorage.getItem('token')
    await axios.post(
        `${API_URL}/projects/${projectId}/documents/${documentId}/compress`,
        { strategy, options },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    )
}

export async function getCompressionDetails(
    projectId: string,
    documentId: string
): Promise<CompressionDetails | null> {
    const token = localStorage.getItem('token')
    try {
        const response = await axios.get(
            `${API_URL}/projects/${projectId}/documents/${documentId}/compression`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        )
        return response.data.data || response.data
    } catch (error) {
        return null
    }
}
