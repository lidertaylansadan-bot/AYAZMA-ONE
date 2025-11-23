CREATE TABLE IF NOT EXISTS project_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  provider TEXT,
  model TEXT,
  cost_preference TEXT CHECK (cost_preference IN ('low','balanced','best_quality')),
  latency_preference TEXT CHECK (latency_preference IN ('low','balanced','ok_with_slow')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE project_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_ai_settings_select_owner ON project_ai_settings;
CREATE POLICY project_ai_settings_select_owner ON project_ai_settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
);

DROP POLICY IF EXISTS project_ai_settings_upsert_owner ON project_ai_settings;
CREATE POLICY project_ai_settings_upsert_owner ON project_ai_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
);

DROP POLICY IF EXISTS project_ai_settings_update_owner ON project_ai_settings;
CREATE POLICY project_ai_settings_update_owner ON project_ai_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
);