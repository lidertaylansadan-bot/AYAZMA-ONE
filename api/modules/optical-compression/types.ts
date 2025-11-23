/**
 * Optical Compression Types
 * TypeScript interfaces for optical compression system
 */

export type CompressionStrategy = 'none' | 'text_only' | 'optical_v1' | 'optical_v2'

export type SegmentType = 'text' | 'vision' | 'mixed'

// ============================================================================
// Database Models
// ============================================================================

export interface DocumentCompressedView {
    id: string
    document_id: string
    compression_strategy: CompressionStrategy
    model_name: string
    token_saving_estimate?: number
    raw_token_count?: number
    compressed_token_count?: number
    processing_time_ms?: number
    created_at: string
    created_by?: string
    metadata?: Record<string, any>
}

export interface DocumentCompressedSegment {
    id: string
    compressed_view_id: string
    segment_index: number
    segment_type: SegmentType
    payload: SegmentPayload
    source_chunk_ids?: string[]
    page_numbers?: number[]
    estimated_tokens?: number
    created_at: string
}

// ============================================================================
// Payload Types
// ============================================================================

export interface SegmentPayload {
    summary?: string
    keyPoints?: string[]
    entities?: string[]
    references?: string[]
    imageData?: string // Base64 or URL
    metadata?: Record<string, any>
}

// ============================================================================
// Service Input/Output Types
// ============================================================================

export interface CompressionInput {
    documentId: string
    chunks: DocumentChunk[]
    strategy: CompressionStrategy
    targetTokenBudget?: number
    options?: CompressionOptions
}

export interface DocumentChunk {
    id: string
    text: string
    pageNumber?: number
    imageRef?: string
}

export interface CompressionOptions {
    enableOcr?: boolean
    savePageImages?: boolean
    modelOverride?: string
    customPrompt?: string
}

export interface CompressionSegment {
    segmentIndex: number
    segmentType: SegmentType
    payload: SegmentPayload
    sourceChunkIds: string[]
    pageNumbers?: number[]
    estimatedTokens: number
}

export interface CompressionResult {
    modelName: string
    strategy: CompressionStrategy
    segments: CompressionSegment[]
    rawTokenCount: number
    compressedTokenCount: number
    tokenSavingEstimate: number // Percentage (0.0 to 1.0)
    processingTimeMs: number
    metadata?: Record<string, any>
}

// ============================================================================
// Service Interface
// ============================================================================

export interface OpticalCompressionService {
    /**
     * Compress document chunks into compact segments
     */
    compress(input: CompressionInput): Promise<CompressionResult>

    /**
     * Estimate token count for text
     */
    estimateTokens(text: string): number

    /**
     * Get compression strategy name
     */
    getStrategy(): CompressionStrategy
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface ProjectCompressionStats {
    totalDocuments: number
    compressedDocuments: number
    totalRawTokens: number
    totalCompressedTokens: number
    avgTokenSaving: number
    compressionStrategies: Record<CompressionStrategy, number>
}

// ============================================================================
// Telemetry Event Types
// ============================================================================

export interface CompressionStartedEvent {
    event: 'optical_compression_started'
    documentId: string
    projectId: string
    strategy: CompressionStrategy
    userId: string
    timestamp: Date
}

export interface CompressionCompletedEvent {
    event: 'optical_compression_completed'
    documentId: string
    projectId: string
    strategy: CompressionStrategy
    modelName: string
    rawTokens: number
    compressedTokens: number
    tokenSavingPercent: number
    durationMs: number
    estimatedCost?: number
    timestamp: Date
}

export interface CompressionFailedEvent {
    event: 'optical_compression_failed'
    documentId: string
    projectId: string
    strategy: CompressionStrategy
    error: string
    timestamp: Date
}

export type CompressionEvent =
    | CompressionStartedEvent
    | CompressionCompletedEvent
    | CompressionFailedEvent
