-- Migration 011: Project Documents, Chunks, and Context Usage
-- Enables RAG (Retrieval-Augmented Generation) and Context Layer 2.0

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- project_documents table
-- ============================================================================
-- Stores metadata for documents uploaded to projects
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'url', 'note', 'other')),
  original_path TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- project_document_chunks table
-- ============================================================================
-- Stores text chunks with vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS project_document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.project_documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  text TEXT NOT NULL,
  embedding VECTOR(768), -- Google Gemini Embedding dimension
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure unique chunk index per document
  UNIQUE(document_id, chunk_index)
);

-- ============================================================================
-- agent_context_usages table
-- ============================================================================
-- Logs which context sources were used for each agent run
CREATE TABLE IF NOT EXISTS agent_context_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  context_source TEXT NOT NULL CHECK (context_source IN ('project_meta', 'document', 'history', 'telemetry', 'user_profile', 'other')),
  document_id UUID REFERENCES public.project_documents(id) ON DELETE SET NULL,
  chunk_id UUID REFERENCES public.project_document_chunks(id) ON DELETE SET NULL,
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

-- project_documents indexes
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_status ON project_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_project_documents_created_at ON project_documents(created_at DESC);

-- project_document_chunks indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON project_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON project_document_chunks(chunk_index);

-- Vector similarity search index (HNSW for better accuracy)
-- Using cosine distance for similarity
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON project_document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- agent_context_usages indexes
CREATE INDEX IF NOT EXISTS idx_context_usages_run_id ON agent_context_usages(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_context_usages_project_id ON agent_context_usages(project_id);
CREATE INDEX IF NOT EXISTS idx_context_usages_created_at ON agent_context_usages(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_context_usages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies: project_documents
-- ============================================================================

-- Users can view documents from their own projects
CREATE POLICY project_documents_select_own ON project_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  )
);

-- Users can insert documents to their own projects
CREATE POLICY project_documents_insert_own ON project_documents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  )
);

-- Users can update documents in their own projects
CREATE POLICY project_documents_update_own ON project_documents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  )
);

-- Users can delete documents from their own projects
CREATE POLICY project_documents_delete_own ON project_documents
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  )
);

-- ============================================================================
-- RLS Policies: project_document_chunks
-- ============================================================================

-- Users can view chunks from documents in their own projects
CREATE POLICY document_chunks_select_own ON project_document_chunks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_documents pd
    JOIN projects p ON p.id = pd.project_id
    WHERE pd.id = document_id AND p.owner_id = auth.uid()
  )
);

-- System can insert chunks (no user insert policy - handled by backend)
CREATE POLICY document_chunks_insert_system ON project_document_chunks
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_documents pd
    JOIN projects p ON p.id = pd.project_id
    WHERE pd.id = document_id AND p.owner_id = auth.uid()
  )
);

-- Chunks are deleted via CASCADE when document is deleted

-- ============================================================================
-- RLS Policies: agent_context_usages
-- ============================================================================

-- Users can view context usage from their own agent runs
CREATE POLICY context_usages_select_own ON agent_context_usages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM agent_runs r 
    WHERE r.id = agent_run_id AND r.user_id = auth.uid()
  )
);

-- System can insert context usage (no user insert policy - handled by backend)
CREATE POLICY context_usages_insert_system ON agent_context_usages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM agent_runs r 
    WHERE r.id = agent_run_id AND r.user_id = auth.uid()
  )
);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on project_documents
CREATE TRIGGER update_project_documents_updated_at
BEFORE UPDATE ON project_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE project_documents IS 'Stores metadata for documents uploaded to projects for RAG and context';
COMMENT ON TABLE project_document_chunks IS 'Stores text chunks with vector embeddings for semantic search';
COMMENT ON TABLE agent_context_usages IS 'Logs which context sources were used for each agent run';

COMMENT ON COLUMN project_document_chunks.embedding IS 'Vector embedding (768 dimensions for Google Gemini Embedding)';
COMMENT ON COLUMN project_documents.processing_status IS 'Document processing pipeline status: pending -> processing -> completed/failed';
