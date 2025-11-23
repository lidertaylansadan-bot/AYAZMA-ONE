-- Test document upload and processing
-- Run this in Supabase SQL Editor or psql

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('project_documents', 'project_document_chunks', 'agent_context_usages')
ORDER BY table_name;

-- 2. Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 3. Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('project_documents', 'project_document_chunks', 'agent_context_usages')
ORDER BY tablename, indexname;

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('project_documents', 'project_document_chunks', 'agent_context_usages')
ORDER BY tablename, policyname;
