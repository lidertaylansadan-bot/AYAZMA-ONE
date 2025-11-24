-- Add closed_loop_mode to project_ai_settings
ALTER TABLE project_ai_settings
ADD COLUMN IF NOT EXISTS closed_loop_mode BOOLEAN DEFAULT FALSE;

-- Add max_iterations to project_ai_settings (default 3)
ALTER TABLE project_ai_settings
ADD COLUMN IF NOT EXISTS max_iterations INTEGER DEFAULT 3;

-- Add closed_loop_status to agent_runs
ALTER TABLE agent_runs
ADD COLUMN IF NOT EXISTS closed_loop_status TEXT CHECK (closed_loop_status IN ('pending', 'in_progress', 'completed', 'failed', 'max_iterations_reached'));

-- Add iteration_count to agent_runs
ALTER TABLE agent_runs
ADD COLUMN IF NOT EXISTS iteration_count INTEGER DEFAULT 0;

-- Add parent_run_id to agent_runs for tracking iterations
ALTER TABLE agent_runs
ADD COLUMN IF NOT EXISTS parent_run_id UUID REFERENCES agent_runs(id);
