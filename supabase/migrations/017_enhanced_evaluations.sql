-- Migration: Enhanced Agent Evaluations for Multi-Metric Scoring
-- Extends the agent_evaluations table to support task-type specific multi-metric evaluation

-- Add new columns to agent_evaluations table
ALTER TABLE agent_evaluations
ADD COLUMN IF NOT EXISTS task_type TEXT,
ADD COLUMN IF NOT EXISTS metric_scores JSONB,
ADD COLUMN IF NOT EXISTS needs_fix BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weighted_score DECIMAL(3,2);

-- Add index for task_type filtering
CREATE INDEX IF NOT EXISTS idx_agent_evaluations_task_type ON agent_evaluations(task_type);

-- Add index for needs_fix filtering (for auto-fix pipeline)
CREATE INDEX IF NOT EXISTS idx_agent_evaluations_needs_fix ON agent_evaluations(needs_fix) WHERE needs_fix = true;

-- Add index for weighted_score range queries
CREATE INDEX IF NOT EXISTS idx_agent_evaluations_weighted_score ON agent_evaluations(weighted_score);

-- Update existing rows to have default values
UPDATE agent_evaluations
SET 
    task_type = COALESCE(task_type, 'general'),
    metric_scores = COALESCE(metric_scores, '{}'),
    needs_fix = COALESCE(needs_fix, false),
    weighted_score = COALESCE(weighted_score, (score_factuality + score_coherence + score_safety + (score_helpfulness / 100)) / 4)
WHERE task_type IS NULL OR weighted_score IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN agent_evaluations.task_type IS 'Type of task being evaluated (analysis, design, workflow, etc.)';
COMMENT ON COLUMN agent_evaluations.metric_scores IS 'JSON object containing individual metric scores from eval matrix';
COMMENT ON COLUMN agent_evaluations.needs_fix IS 'Flag indicating if the output quality is below threshold and needs auto-fix';
COMMENT ON COLUMN agent_evaluations.weighted_score IS 'Final weighted score calculated from metric_scores';
