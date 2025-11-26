-- Migration: Agent Configs Table
-- Stores versioned agent configurations for self-repair and optimization

DROP TABLE IF EXISTS agent_configs CASCADE;

CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    prompt_template TEXT,
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    tool_config JSONB DEFAULT '{}',
    context_strategy TEXT, -- 'full', 'selective', 'minimal'
    optimization_notes TEXT,
    performance_metrics JSONB, -- Stores avg scores, latency, cost
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    replaced_by UUID REFERENCES agent_configs(id) ON DELETE SET NULL
);

-- Ensure unique active version per agent using partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_configs_unique_active 
ON agent_configs(agent_name) 
WHERE is_active = true;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_configs_name ON agent_configs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_configs_active ON agent_configs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agent_configs_version ON agent_configs(agent_name, version DESC);
CREATE INDEX IF NOT EXISTS idx_agent_configs_created_at ON agent_configs(created_at DESC);

-- Add config_version to agent_runs table
ALTER TABLE agent_runs
ADD COLUMN IF NOT EXISTS config_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS config_id UUID REFERENCES agent_configs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agent_runs_config_id ON agent_runs(config_id);

-- RLS Policies
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view configs
CREATE POLICY agent_configs_select_all ON agent_configs
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only admins can insert/update configs (for now, allow all authenticated users)
CREATE POLICY agent_configs_insert_auth ON agent_configs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY agent_configs_update_auth ON agent_configs
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE agent_configs IS 'Versioned agent configurations for self-repair and optimization';
COMMENT ON COLUMN agent_configs.version IS 'Configuration version number, incremented on each update';
COMMENT ON COLUMN agent_configs.is_active IS 'Whether this is the currently active configuration for the agent';
COMMENT ON COLUMN agent_configs.replaced_by IS 'Reference to the config that replaced this one';
COMMENT ON COLUMN agent_configs.performance_metrics IS 'JSON object with avg_score, avg_latency_ms, avg_cost, etc.';
