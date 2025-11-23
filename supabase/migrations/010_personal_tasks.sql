-- Personal Tasks Table for Cockpit
-- This table stores user-specific tasks that can be associated with projects

CREATE TABLE IF NOT EXISTS personal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'normal' 
    CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own tasks
CREATE POLICY personal_tasks_select_own 
  ON personal_tasks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY personal_tasks_insert_own 
  ON personal_tasks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY personal_tasks_update_own 
  ON personal_tasks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY personal_tasks_delete_own 
  ON personal_tasks FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user_id ON personal_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_project_id ON personal_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_due_date ON personal_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_status ON personal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_created_at ON personal_tasks(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_personal_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personal_tasks_updated_at
  BEFORE UPDATE ON personal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_tasks_updated_at();
