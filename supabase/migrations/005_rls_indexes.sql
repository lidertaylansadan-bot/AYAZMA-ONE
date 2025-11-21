-- Improve RLS policies to enforce project ownership on wizard sessions

-- Drop existing simple policies
DROP POLICY IF EXISTS "Users can view own app wizard sessions" ON app_wizard_sessions;
DROP POLICY IF EXISTS "Users can create app wizard sessions" ON app_wizard_sessions;
DROP POLICY IF EXISTS "Users can view own workflow wizard sessions" ON workflow_wizard_sessions;
DROP POLICY IF EXISTS "Users can create workflow wizard sessions" ON workflow_wizard_sessions;
DROP POLICY IF EXISTS "Users can view own content wizard sessions" ON content_wizard_sessions;
DROP POLICY IF EXISTS "Users can create content wizard sessions" ON content_wizard_sessions;

-- Replace with ownership-enforced policies
CREATE POLICY "Users can view own app wizard sessions with ownership" ON app_wizard_sessions
  FOR SELECT USING (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert app wizard sessions with ownership" ON app_wizard_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own workflow wizard sessions with ownership" ON workflow_wizard_sessions
  FOR SELECT USING (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workflow wizard sessions with ownership" ON workflow_wizard_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own content wizard sessions with ownership" ON content_wizard_sessions
  FOR SELECT USING (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert content wizard sessions with ownership" ON content_wizard_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

-- Indexes for performance
-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Wizard sessions indexes
CREATE INDEX IF NOT EXISTS idx_app_sessions_project_id ON app_wizard_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_project_id ON workflow_wizard_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_user_id ON workflow_wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_sessions_project_id ON content_wizard_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_content_sessions_user_id ON content_wizard_sessions(user_id);