-- Migration: Enhanced Agent Evaluations for Multi-Metric Support
-- Stage 6: Self-Evaluation, Auto-Fix & Regression Pipeline
-- Description: Adds task-type specific evaluation support

-- Add new columns to agent_evaluations
ALTER TABLE public.agent_evaluations
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS metric_scores JSONB,
  ADD COLUMN IF NOT EXISTS needs_fix BOOLEAN DEFAULT false;

-- Create index on needs_fix for quick filtering
CREATE INDEX IF NOT EXISTS idx_agent_evaluations_needs_fix 
  ON public.agent_evaluations(needs_fix) 
  WHERE needs_fix = true;

-- Create index on task_type for analytics
CREATE INDEX IF NOT EXISTS idx_agent_evaluations_task_type 
  ON public.agent_evaluations(task_type);

-- Create agent_fixes table for auto-fix tracking
CREATE TABLE IF NOT EXISTS public.agent_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  original_output TEXT NOT NULL,
  fixed_output TEXT NOT NULL,
  fix_notes TEXT,
  diff_summary TEXT,
  eval_score_before NUMERIC(3, 2),
  eval_score_after NUMERIC(3, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for agent_fixes
ALTER TABLE public.agent_fixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_fixes ON public.agent_fixes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_fixes ON public.agent_fixes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for agent_fixes
CREATE INDEX IF NOT EXISTS idx_agent_fixes_agent_run_id 
  ON public.agent_fixes(agent_run_id);

CREATE INDEX IF NOT EXISTS idx_agent_fixes_user_id 
  ON public.agent_fixes(user_id);

CREATE INDEX IF NOT EXISTS idx_agent_fixes_project_id 
  ON public.agent_fixes(project_id);

CREATE INDEX IF NOT EXISTS idx_agent_fixes_created_at 
  ON public.agent_fixes(created_at DESC);

-- Create agent_configs table for self-repair
CREATE TABLE IF NOT EXISTS public.agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  temperature NUMERIC(2, 1) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  tool_config JSONB,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- RLS for agent_configs
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_agent_configs ON public.agent_configs
  FOR SELECT USING (true); -- All authenticated users can read configs

CREATE POLICY insert_agent_configs ON public.agent_configs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY update_agent_configs ON public.agent_configs
  FOR UPDATE USING (auth.uid() = created_by);

-- Create indexes for agent_configs
CREATE INDEX IF NOT EXISTS idx_agent_configs_agent_name 
  ON public.agent_configs(agent_name);

CREATE INDEX IF NOT EXISTS idx_agent_configs_is_active 
  ON public.agent_configs(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_agent_configs_version 
  ON public.agent_configs(agent_name, version DESC);

-- Add config_version to agent_runs for tracking
ALTER TABLE public.agent_runs
  ADD COLUMN IF NOT EXISTS config_version INTEGER DEFAULT 1;

-- Create regression_tests table
CREATE TABLE IF NOT EXISTS public.regression_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  test_name TEXT NOT NULL,
  input_payload JSONB NOT NULL,
  expected_characteristics JSONB NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_run_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('pass', 'fail', 'error', 'pending')),
  UNIQUE(agent_name, test_name)
);

-- RLS for regression_tests
ALTER TABLE public.regression_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_regression_tests ON public.regression_tests
  FOR SELECT USING (true);

CREATE POLICY insert_regression_tests ON public.regression_tests
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY update_regression_tests ON public.regression_tests
  FOR UPDATE USING (auth.uid() = created_by);

-- Create indexes for regression_tests
CREATE INDEX IF NOT EXISTS idx_regression_tests_agent_name 
  ON public.regression_tests(agent_name);

CREATE INDEX IF NOT EXISTS idx_regression_tests_last_status 
  ON public.regression_tests(last_status);

CREATE INDEX IF NOT EXISTS idx_regression_tests_severity 
  ON public.regression_tests(severity);

-- Create regression_results table
CREATE TABLE IF NOT EXISTS public.regression_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.regression_tests(id) ON DELETE CASCADE,
  agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  passed BOOLEAN NOT NULL,
  failure_reason TEXT,
  actual_output JSONB,
  eval_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for regression_results
ALTER TABLE public.regression_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_regression_results ON public.regression_results
  FOR SELECT USING (true);

CREATE POLICY insert_regression_results ON public.regression_results
  FOR INSERT WITH CHECK (true);

-- Create indexes for regression_results
CREATE INDEX IF NOT EXISTS idx_regression_results_test_id 
  ON public.regression_results(test_id);

CREATE INDEX IF NOT EXISTS idx_regression_results_created_at 
  ON public.regression_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_regression_results_passed 
  ON public.regression_results(passed);

-- Add closed_loop_mode to project_ai_settings
ALTER TABLE public.project_ai_settings
  ADD COLUMN IF NOT EXISTS closed_loop_mode BOOLEAN DEFAULT false;

-- Create index for closed_loop_mode
CREATE INDEX IF NOT EXISTS idx_project_ai_settings_closed_loop 
  ON public.project_ai_settings(closed_loop_mode) 
  WHERE closed_loop_mode = true;

-- Add comments for documentation
COMMENT ON COLUMN public.agent_evaluations.task_type IS 'Type of task being evaluated (analysis, design, code_generation, etc.)';
COMMENT ON COLUMN public.agent_evaluations.metric_scores IS 'Task-specific metric scores as JSON';
COMMENT ON COLUMN public.agent_evaluations.needs_fix IS 'Flag indicating if output quality is below threshold and needs auto-fix';

COMMENT ON TABLE public.agent_fixes IS 'Tracks auto-fix attempts and results for low-quality agent outputs';
COMMENT ON TABLE public.agent_configs IS 'Stores agent configuration versions for self-repair and rollback';
COMMENT ON TABLE public.regression_tests IS 'Regression test suite for agents to prevent breaking changes';
COMMENT ON TABLE public.regression_results IS 'Results of regression test executions';

COMMENT ON COLUMN public.project_ai_settings.closed_loop_mode IS 'Enable fully autonomous eval → auto-fix → self-repair loop';
