-- Enable RLS on key tables if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS agent_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    input_payload JSONB,
    output_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;

-- Create agent_permissions table
CREATE TABLE IF NOT EXISTS agent_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, agent_name)
);

ALTER TABLE agent_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_permissions

-- Users can view their own permissions
CREATE POLICY "Users can view their own agent permissions"
ON agent_permissions FOR SELECT
USING (auth.uid() = user_id);

-- Users can manage their own permissions
CREATE POLICY "Users can insert their own agent permissions"
ON agent_permissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent permissions"
ON agent_permissions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent permissions"
ON agent_permissions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for Projects (Ensure strict isolation)

-- Drop existing policies if they are too permissive (optional, but safer to be explicit)
-- DROP POLICY IF EXISTS "Users can view own projects" ON projects;

-- Ensure users can only see their own projects
CREATE POLICY "Data Pod: Users can only view own projects"
ON projects FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Data Pod: Users can only update own projects"
ON projects FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Data Pod: Users can only delete own projects"
ON projects FOR DELETE
USING (auth.uid() = owner_id);

CREATE POLICY "Data Pod: Users can insert own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for Project Documents
CREATE POLICY "Data Pod: Users can only view own project documents"
ON project_documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_documents.project_id
        AND projects.owner_id = auth.uid()
    )
);

-- RLS Policies for Agent Activities
CREATE POLICY "Data Pod: Users can only view own agent activities"
ON agent_activities FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = agent_activities.project_id
        AND projects.owner_id = auth.uid()
    )
);
