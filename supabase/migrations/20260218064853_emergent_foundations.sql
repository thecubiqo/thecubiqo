-- =============================================================================
-- EMERGENT FOUNDATIONS MIGRATION
-- =============================================================================
-- Description: Core tables for Orgs, Projects, and Secrets
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
-- 1. ORGANIZATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER emergent_orgs_updated_at
  BEFORE UPDATE ON emergent_orgs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. ORG MEMBERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES emergent_orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- =============================================================================
-- 3. PROJECTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES emergent_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  stack TEXT DEFAULT 'nextjs',
  framework TEXT DEFAULT 'react',
  language TEXT DEFAULT 'typescript',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE TRIGGER emergent_projects_updated_at
  BEFORE UPDATE ON emergent_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. PROJECT SECRETS
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_project_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, key)
);

CREATE TRIGGER emergent_project_secrets_updated_at
  BEFORE UPDATE ON emergent_project_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE emergent_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergent_org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergent_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergent_project_secrets ENABLE ROW LEVEL SECURITY;

-- Users can view orgs they are members of
CREATE POLICY "Users can view their orgs" ON emergent_orgs
  FOR SELECT
  USING (
    id IN (SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid())
  );

-- Users can view members of their orgs
CREATE POLICY "Users can view members of their orgs" ON emergent_org_members
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid())
  );

-- Users can view projects in their orgs
CREATE POLICY "Users can view projects in their orgs" ON emergent_projects
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid())
  );

-- Only admins/owners can manage secrets
CREATE POLICY "Admins can manage secrets" ON emergent_project_secrets
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
