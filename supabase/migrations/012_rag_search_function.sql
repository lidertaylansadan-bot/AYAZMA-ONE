-- Migration: Add RAG search function for semantic search
-- This function performs vector similarity search on document chunks

-- Create function for semantic search
CREATE OR REPLACE FUNCTION search_document_chunks(
  project_id_input UUID,
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_title TEXT,
  chunk_text TEXT,
  chunk_index INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pdc.id AS chunk_id,
    pdc.document_id,
    pd.title AS document_title,
    pdc.text AS chunk_text,
    pdc.chunk_index,
    1 - (pdc.embedding <=> query_embedding) AS similarity
  FROM project_document_chunks pdc
  JOIN project_documents pd ON pd.id = pdc.document_id
  WHERE 
    pd.project_id = project_id_input
    AND pd.processing_status = 'completed'
    AND 1 - (pdc.embedding <=> query_embedding) > match_threshold
  ORDER BY pdc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION search_document_chunks IS 'Performs semantic search on document chunks using cosine similarity';
