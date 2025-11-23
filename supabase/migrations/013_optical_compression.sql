-- Migration: 013_optical_compression.sql
-- Description: Add tables for optical compression and long-context engine
-- Stage: 4 - Optical Compression & Long-Context Engine

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: document_compressed_views
-- Purpose: Store metadata about compressed document versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_compressed_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES project_documents(id) ON DELETE CASCADE,
    compression_strategy TEXT NOT NULL CHECK (compression_strategy IN ('none', 'text_only', 'optical_v1', 'optical_v2')),
    model_name TEXT NOT NULL, -- e.g., 'gpt-4o-mini', 'deepseek-ocr-v1', 'gemini-pro'
    token_saving_estimate FLOAT, -- Percentage saved (0.0 to 1.0)
    raw_token_count INT, -- Original token count
    compressed_token_count INT, -- Compressed token count
    processing_time_ms INT, -- Time taken to compress
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb -- Additional metadata
);

-- Add indexes
CREATE INDEX idx_compressed_views_document_id ON document_compressed_views(document_id);
CREATE INDEX idx_compressed_views_strategy ON document_compressed_views(compression_strategy);
CREATE INDEX idx_compressed_views_created_at ON document_compressed_views(created_at DESC);

-- Add comments
COMMENT ON TABLE document_compressed_views IS 'Stores metadata about compressed document versions';
COMMENT ON COLUMN document_compressed_views.compression_strategy IS 'Strategy used: none, text_only, optical_v1, optical_v2';
COMMENT ON COLUMN document_compressed_views.token_saving_estimate IS 'Percentage of tokens saved (0.0 to 1.0)';

-- ============================================================================
-- Table: document_compressed_segments
-- Purpose: Store compressed content segments
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_compressed_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compressed_view_id UUID NOT NULL REFERENCES document_compressed_views(id) ON DELETE CASCADE,
    segment_index INT NOT NULL, -- Order of segment in document
    segment_type TEXT NOT NULL CHECK (segment_type IN ('text', 'vision', 'mixed')),
    payload JSONB NOT NULL, -- Compact representation for LLM
    source_chunk_ids UUID[], -- References to project_document_chunks
    page_numbers INT[], -- Page numbers this segment covers
    estimated_tokens INT, -- Estimated token count for this segment
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(compressed_view_id, segment_index)
);

-- Add indexes
CREATE INDEX idx_compressed_segments_view_id ON document_compressed_segments(compressed_view_id);
CREATE INDEX idx_compressed_segments_index ON document_compressed_segments(segment_index);
CREATE INDEX idx_compressed_segments_type ON document_compressed_segments(segment_type);
CREATE INDEX idx_compressed_segments_payload ON document_compressed_segments USING GIN (payload);

-- Add comments
COMMENT ON TABLE document_compressed_segments IS 'Stores compressed content segments';
COMMENT ON COLUMN document_compressed_segments.segment_type IS 'Type: text (summary), vision (image-based), mixed (both)';
COMMENT ON COLUMN document_compressed_segments.payload IS 'Compact JSON representation for LLM context';
COMMENT ON COLUMN document_compressed_segments.source_chunk_ids IS 'Original chunks that were compressed into this segment';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE document_compressed_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_compressed_segments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view compressed views for their own projects
CREATE POLICY compressed_views_select_policy ON document_compressed_views
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_documents pd
            JOIN projects p ON pd.project_id = p.id
            WHERE pd.id = document_compressed_views.document_id
            AND p.owner_id = auth.uid()
        )
    );

-- Policy: Users can insert compressed views for their own projects
CREATE POLICY compressed_views_insert_policy ON document_compressed_views
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_documents pd
            JOIN projects p ON pd.project_id = p.id
            WHERE pd.id = document_id
            AND p.owner_id = auth.uid()
        )
    );

-- Policy: Users can update compressed views for their own projects
CREATE POLICY compressed_views_update_policy ON document_compressed_views
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM project_documents pd
            JOIN projects p ON pd.project_id = p.id
            WHERE pd.id = document_compressed_views.document_id
            AND p.owner_id = auth.uid()
        )
    );

-- Policy: Users can delete compressed views for their own projects
CREATE POLICY compressed_views_delete_policy ON document_compressed_views
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_documents pd
            JOIN projects p ON pd.project_id = p.id
            WHERE pd.id = document_compressed_views.document_id
            AND p.owner_id = auth.uid()
        )
    );

-- Policy: Users can view segments for their own compressed views
CREATE POLICY compressed_segments_select_policy ON document_compressed_segments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM document_compressed_views dcv
            JOIN project_documents pd ON dcv.document_id = pd.id
            JOIN projects p ON pd.project_id = p.id
            WHERE dcv.id = document_compressed_segments.compressed_view_id
            AND p.owner_id = auth.uid()
        )
    );

-- Policy: Users can insert segments for their own compressed views
CREATE POLICY compressed_segments_insert_policy ON document_compressed_segments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM document_compressed_views dcv
            JOIN project_documents pd ON dcv.document_id = pd.id
            JOIN projects p ON pd.project_id = p.id
            WHERE dcv.id = compressed_view_id
            AND p.owner_id = auth.uid()
        )
    );

-- Policy: Users can update segments for their own compressed views
CREATE POLICY compressed_segments_update_policy ON document_compressed_segments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM document_compressed_views dcv
            JOIN project_documents pd ON dcv.document_id = pd.id
            JOIN projects p ON pd.project_id = p.id
            WHERE dcv.id = document_compressed_segments.compressed_view_id
            AND p.owner_id = auth.uid()
        )
    );

-- Policy: Users can delete segments for their own compressed views
CREATE POLICY compressed_segments_delete_policy ON document_compressed_segments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM document_compressed_views dcv
            JOIN project_documents pd ON dcv.document_id = pd.id
            JOIN projects p ON pd.project_id = p.id
            WHERE dcv.id = document_compressed_segments.compressed_view_id
            AND p.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function: Get compression stats for a project
CREATE OR REPLACE FUNCTION get_project_compression_stats(project_id_input UUID)
RETURNS TABLE (
    total_documents INT,
    compressed_documents INT,
    total_raw_tokens BIGINT,
    total_compressed_tokens BIGINT,
    avg_token_saving FLOAT,
    compression_strategies JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT pd.id)::INT AS total_documents,
        COUNT(DISTINCT dcv.document_id)::INT AS compressed_documents,
        COALESCE(SUM(dcv.raw_token_count), 0)::BIGINT AS total_raw_tokens,
        COALESCE(SUM(dcv.compressed_token_count), 0)::BIGINT AS total_compressed_tokens,
        COALESCE(AVG(dcv.token_saving_estimate), 0)::FLOAT AS avg_token_saving,
        COALESCE(
            jsonb_object_agg(
                dcv.compression_strategy,
                COUNT(dcv.id)
            ) FILTER (WHERE dcv.compression_strategy IS NOT NULL),
            '{}'::jsonb
        ) AS compression_strategies
    FROM project_documents pd
    LEFT JOIN document_compressed_views dcv ON pd.id = dcv.document_id
    WHERE pd.project_id = project_id_input
    GROUP BY pd.project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_project_compression_stats(UUID) TO authenticated;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_compressed_views') THEN
        RAISE EXCEPTION 'Table document_compressed_views was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_compressed_segments') THEN
        RAISE EXCEPTION 'Table document_compressed_segments was not created';
    END IF;
    
    RAISE NOTICE 'Migration 013_optical_compression completed successfully';
END $$;
