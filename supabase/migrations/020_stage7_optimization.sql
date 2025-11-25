-- Create ab_tests table
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    variants JSONB NOT NULL, -- e.g., [{"id": "A", "config": {...}}, {"id": "B", "config": {...}}]
    status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
    traffic_split JSONB NOT NULL DEFAULT '{"A": 0.5, "B": 0.5}',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_run_id UUID REFERENCES agent_runs(id),
    user_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add cost and model columns to agent_evaluations if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_evaluations' AND column_name = 'cost') THEN
        ALTER TABLE agent_evaluations ADD COLUMN cost NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_evaluations' AND column_name = 'model') THEN
        ALTER TABLE agent_evaluations ADD COLUMN model TEXT;
    END IF;

    -- Add metadata column to agent_runs if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_runs' AND column_name = 'metadata') THEN
        ALTER TABLE agent_runs ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for ab_tests
CREATE POLICY "Allow read access to ab_tests for authenticated users"
    ON ab_tests FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow all access to ab_tests for service role"
    ON ab_tests FOR ALL
    TO service_role
    USING (true);

-- Create policies for user_feedback
CREATE POLICY "Allow insert access to user_feedback for authenticated users"
    ON user_feedback FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow read access to user_feedback for own feedback"
    ON user_feedback FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow all access to user_feedback for service role"
    ON user_feedback FOR ALL
    TO service_role
    USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_agent_run_id ON user_feedback(agent_run_id);
