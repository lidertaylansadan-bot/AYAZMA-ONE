-- Create wizard sessions tables
CREATE TABLE app_wizard_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workflow_wizard_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE content_wizard_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all wizard tables
ALTER TABLE app_wizard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_wizard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_wizard_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for wizard sessions
CREATE POLICY "Users can view own app wizard sessions" ON app_wizard_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create app wizard sessions" ON app_wizard_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own workflow wizard sessions" ON workflow_wizard_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflow wizard sessions" ON workflow_wizard_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own content wizard sessions" ON content_wizard_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create content wizard sessions" ON content_wizard_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);