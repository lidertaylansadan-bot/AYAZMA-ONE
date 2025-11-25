-- Add budget and caching settings to project_ai_settings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_ai_settings' AND column_name = 'monthly_budget') THEN
        ALTER TABLE project_ai_settings ADD COLUMN monthly_budget NUMERIC DEFAULT 10.0; -- Default $10 budget
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_ai_settings' AND column_name = 'semantic_caching_enabled') THEN
        ALTER TABLE project_ai_settings ADD COLUMN semantic_caching_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create semantic_cache table
CREATE TABLE IF NOT EXISTS semantic_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_hash TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    response JSONB NOT NULL,
    embedding VECTOR(1536), -- Optional: for true semantic search if pgvector is enabled
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Enable RLS
ALTER TABLE semantic_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for semantic_cache
-- Allow read access to all authenticated users (shared cache)
CREATE POLICY "Allow read access to semantic_cache for authenticated users"
    ON semantic_cache FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert access to authenticated users
CREATE POLICY "Allow insert access to semantic_cache for authenticated users"
    ON semantic_cache FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_semantic_cache_prompt_hash ON semantic_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_expires_at ON semantic_cache(expires_at);
