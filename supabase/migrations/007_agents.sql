-- agent_runs table
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','running','succeeded','failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- agent_artifacts table
CREATE TABLE IF NOT EXISTS agent_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('plan','task_list','spec','copy','log')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS enable
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS policies: only owner (user_id) can read/insert their runs
DROP POLICY IF EXISTS agent_runs_select_own ON agent_runs;
CREATE POLICY agent_runs_select_own ON agent_runs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS agent_runs_insert_own ON agent_runs;
CREATE POLICY agent_runs_insert_own ON agent_runs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS agent_runs_update_own ON agent_runs;
CREATE POLICY agent_runs_update_own ON agent_runs FOR UPDATE USING (auth.uid() = user_id);

-- artifacts policy via run owner
DROP POLICY IF EXISTS agent_artifacts_select_own ON agent_artifacts;
CREATE POLICY agent_artifacts_select_own ON agent_artifacts FOR SELECT USING (
  EXISTS (SELECT 1 FROM agent_runs r WHERE r.id = run_id AND r.user_id = auth.uid())
);

DROP POLICY IF EXISTS agent_artifacts_insert_own ON agent_artifacts;
CREATE POLICY agent_artifacts_insert_own ON agent_artifacts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM agent_runs r WHERE r.id = run_id AND r.user_id = auth.uid())
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_project_id ON agent_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_artifacts_run_id ON agent_artifacts(run_id);