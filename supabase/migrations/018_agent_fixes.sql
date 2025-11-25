-- Migration: Agent Fixes Table
-- Stores auto-fix attempts and results for low-quality agent outputs

CREATE TABLE IF NOT EXISTS agent_fixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES agent_evaluations(id) ON DELETE SET NULL,
    original_output TEXT NOT NULL,
    fixed_output TEXT NOT NULL,
    fix_notes TEXT,
    diff_summary TEXT,
    eval_score_before DECIMAL(3,2),
    eval_score_after DECIMAL(3,2),
    improvement_percentage DECIMAL(5,2),
    fix_strategy TEXT, -- 'clarification', 'correction', 'enhancement', 'restructure'
    llm_model TEXT,
    llm_tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_fixes_run_id ON agent_fixes(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_agent_fixes_created_at ON agent_fixes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_fixes_improvement ON agent_fixes(improvement_percentage DESC);

-- RLS Policies
ALTER TABLE agent_fixes ENABLE ROW LEVEL SECURITY;

-- Users can view fixes for their own agent runs
CREATE POLICY agent_fixes_select_own ON agent_fixes
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR
        agent_run_id IN (
            SELECT id FROM agent_runs WHERE user_id = auth.uid()
        )
    );

-- Users can insert fixes for their own agent runs
CREATE POLICY agent_fixes_insert_own ON agent_fixes
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        OR
        agent_run_id IN (
            SELECT id FROM agent_runs WHERE user_id = auth.uid()
        )
    );

-- Add comments
COMMENT ON TABLE agent_fixes IS 'Stores auto-fix attempts for low-quality agent outputs';
COMMENT ON COLUMN agent_fixes.fix_strategy IS 'Strategy used for fixing: clarification, correction, enhancement, or restructure';
COMMENT ON COLUMN agent_fixes.improvement_percentage IS 'Percentage improvement in quality score after fix';
