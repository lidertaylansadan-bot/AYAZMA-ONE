export interface ProjectDocument {
    id: string
    project_id: string
    title: string
    source_type: 'upload' | 'url' | 'note' | 'other'
    original_path?: string
    storage_path: string
    mime_type: string
    processing_status: 'pending' | 'processing' | 'completed' | 'failed'
    created_at: string
    updated_at: string
}

export interface ProjectDocumentChunk {
    id: string
    document_id: string
    chunk_index: number
    text: string
    embedding?: number[] // Vector embedding (768 dimensions for Gemini)
    created_at: string
}

export interface AgentContextUsage {
    id: string
    agent_run_id: string
    project_id?: string
    context_source: 'project_meta' | 'document' | 'history' | 'telemetry' | 'user_profile' | 'other'
    document_id?: string
    chunk_id?: string
    weight: number
    created_at: string
}

export interface UploadDocumentDto {
    projectId: string
    file: Express.Multer.File
    title?: string
}

export interface DocumentListResponse {
    documents: ProjectDocument[]
    total: number
}

export interface ChunkOptions {
    maxTokens?: number // Default: 800
    overlapPercent?: number // Default: 15
}

export interface ProcessingResult {
    documentId: string
    chunksCreated: number
    status: 'completed' | 'failed'
    error?: string
}
