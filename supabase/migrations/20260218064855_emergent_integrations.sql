-- =============================================================================
-- EMERGENT INTEGRATIONS & PLAYBOOKS MIGRATION
-- =============================================================================
-- Description: Tables for Integrations, Playbooks, and Templates
-- Author: Antigravity Agent
-- Date: 2026-02-18
-- Version: 1.0.0
-- =============================================================================

-- Auto-update updated_at function (ensure it exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- 1. INTEGRATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  service TEXT NOT NULL, -- e.g., 'github', 'slack', 'vercel'
  config JSONB DEFAULT '{}', -- Encrypted tokens stored elsewhere or here? Assuming here for non-sensitive config
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, service)
);

CREATE TRIGGER emergent_integrations_updated_at
  BEFORE UPDATE ON emergent_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. PLAYBOOKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  service TEXT NOT NULL, -- Service required for this playbook
  code_templates JSONB NOT NULL, -- Array of step templates
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER emergent_playbooks_updated_at
  BEFORE UPDATE ON emergent_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. PLAYBOOK EXECUTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_playbook_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES emergent_playbooks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  logs TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE emergent_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergent_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergent_playbook_executions ENABLE ROW LEVEL SECURITY;

-- Users can view integrations for their projects
CREATE POLICY "Users can view project integrations" ON emergent_integrations
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can manage integrations
CREATE POLICY "Admins can manage integrations" ON emergent_integrations
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      )
    )
  );

-- Anyone can view public playbooks (assuming verified playbooks are public)
CREATE POLICY "Users can view playbooks" ON emergent_playbooks
  FOR SELECT
  USING (true);

-- Only system admins can manage playbooks (or specific creators, simplified here)
-- No INSERT policy for regular users on playbooks table for now.

-- Users can view/create executions for their projects
CREATE POLICY "Users can view project executions" ON emergent_playbook_executions
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can start executions" ON emergent_playbook_executions
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );
