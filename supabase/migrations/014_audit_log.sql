-- 1. Add role to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner';

-- 2. Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  project_id UUID NULL REFERENCES public.projects(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_select_own ON public.audit_log;
CREATE POLICY audit_log_select_own ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS audit_log_insert_own ON public.audit_log;
CREATE POLICY audit_log_insert_own ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_project_id ON public.audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON public.audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- 3. Create agent_evaluations table
CREATE TABLE IF NOT EXISTS public.agent_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  score_helpfulness NUMERIC CHECK (score_helpfulness >= 0 AND score_helpfulness <= 100),
  score_factuality NUMERIC CHECK (score_factuality >= 0 AND score_factuality <= 1),
  score_coherence NUMERIC CHECK (score_coherence >= 0 AND score_coherence <= 1),
  score_safety NUMERIC CHECK (score_safety >= 0 AND score_safety <= 1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_evaluations_select_own ON public.agent_evaluations;
CREATE POLICY agent_evaluations_select_own ON public.agent_evaluations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS agent_evaluations_insert_own ON public.agent_evaluations;
CREATE POLICY agent_evaluations_insert_own ON public.agent_evaluations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Add auto_optimize to project_ai_settings
ALTER TABLE public.project_ai_settings
ADD COLUMN IF NOT EXISTS auto_optimize BOOLEAN NOT NULL DEFAULT false;
