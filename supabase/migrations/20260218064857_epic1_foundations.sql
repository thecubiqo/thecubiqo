-- Epic 1: Foundations - Complete Database Schema
-- Migration: 20260218_001_epic1_foundations.sql
-- Author: @guy (Database Administrator)
-- Description: Organizations, Projects, Environments, Secrets, Audit Logs, RBAC

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    billing_tier TEXT DEFAULT 'free' CHECK (billing_tier IN ('free', 'pro', 'enterprise')),
    credits_remaining INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZATION MEMBERS (RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS org_members (
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id)
);

-- Index for faster role checks
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id ON org_members(org_id);

-- Enable Row Level Security
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROJECTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    framework TEXT DEFAULT 'nextjs' CHECK (framework IN ('nextjs', 'expo', 'fastapi')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'deployed')),
    git_repo TEXT,
    preview_url TEXT,
    production_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

-- Indexes for faster queries
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ENVIRONMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS environments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (name IN ('development', 'preview', 'production')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- Index for faster lookups
CREATE INDEX idx_environments_project_id ON environments(project_id);

-- Enable Row Level Security
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ENCRYPTION FUNCTIONS FOR SECRETS
-- ============================================================================

-- Function to encrypt secrets (server-side only)
CREATE OR REPLACE FUNCTION encrypt_secret(secret TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(secret, encryption_key),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt secrets (server-side only)
CREATE OR REPLACE FUNCTION decrypt_secret(encrypted TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted, 'base64'),
        encryption_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENVIRONMENT VARIABLES (with encryption)
-- ============================================================================

CREATE TABLE IF NOT EXISTS env_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    environment_id UUID REFERENCES environments(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL, -- Encrypted if is_secret = true
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(environment_id, key)
);

-- Index for faster queries
CREATE INDEX idx_env_variables_environment_id ON env_variables(environment_id);
CREATE INDEX idx_env_variables_is_secret ON env_variables(is_secret);

-- Enable Row Level Security
ALTER TABLE env_variables ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Organizations: Users can view their orgs
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Organizations: Users can update orgs they own or admin
CREATE POLICY "Owners and admins can update organizations"
    ON organizations FOR UPDATE
    USING (
        id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Organizations: Users can insert (create) organizations
CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (true);

-- Organizations: Only owners can delete
CREATE POLICY "Only owners can delete organizations"
    ON organizations FOR DELETE
    USING (
        id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Org Members: Users can view members of their orgs
CREATE POLICY "Users can view their org members"
    ON org_members FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Org Members: Admins and owners can insert members
CREATE POLICY "Admins and owners can add members"
    ON org_members FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Org Members: Admins and owners can remove members
CREATE POLICY "Admins and owners can remove members"
    ON org_members FOR DELETE
    USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Projects: Users can view their org's projects
CREATE POLICY "Users can view their org's projects"
    ON projects FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Projects: Members+ can create projects
CREATE POLICY "Members can create projects"
    ON projects FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'member')
        )
    );

-- Projects: Members+ can update projects
CREATE POLICY "Members can update projects"
    ON projects FOR UPDATE
    USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'member')
        )
    );

-- Projects: Admins+ can delete projects
CREATE POLICY "Admins can delete projects"
    ON projects FOR DELETE
    USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Environments: Users can view environments for their projects
CREATE POLICY "Users can view environments"
    ON environments FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN org_members om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Environments: Members+ can manage environments
CREATE POLICY "Members can manage environments"
    ON environments FOR ALL
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN org_members om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- Environment Variables: Users can view env vars (secrets masked in application layer)
CREATE POLICY "Users can view environment variables"
    ON env_variables FOR SELECT
    USING (
        environment_id IN (
            SELECT e.id FROM environments e
            JOIN projects p ON e.project_id = p.id
            JOIN org_members om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Environment Variables: Members+ can manage env vars
CREATE POLICY "Members can manage environment variables"
    ON env_variables FOR ALL
    USING (
        environment_id IN (
            SELECT e.id FROM environments e
            JOIN projects p ON e.project_id = p.id
            JOIN org_members om ON p.org_id = om.org_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('owner', 'admin', 'member')
        )
    );

-- Audit Logs: Users can view audit logs for their orgs
CREATE POLICY "Users can view their org's audit logs"
    ON audit_logs FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Audit Logs: Only system can insert (via server-side functions)
-- No direct INSERT policy for users

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically create owner membership when org is created
CREATE OR REPLACE FUNCTION create_org_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create owner membership
CREATE TRIGGER create_org_owner_membership_trigger
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION create_org_owner_membership();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_env_variables_updated_at
    BEFORE UPDATE ON env_variables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Create default environments for each project
CREATE OR REPLACE FUNCTION create_default_environments()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO environments (project_id, name) VALUES
        (NEW.id, 'development'),
        (NEW.id, 'preview'),
        (NEW.id, 'production');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_default_environments_trigger
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_environments();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE organizations IS 'Organizations (tenants) in the system';
COMMENT ON TABLE org_members IS 'Organization membership with RBAC roles';
COMMENT ON TABLE projects IS 'Projects within organizations';
COMMENT ON TABLE environments IS 'Deployment environments (dev, preview, prod)';
COMMENT ON TABLE env_variables IS 'Environment variables with optional encryption';
COMMENT ON TABLE audit_logs IS 'Audit trail for security-sensitive actions';

COMMENT ON COLUMN env_variables.value IS 'Encrypted if is_secret=true, plain if false';
COMMENT ON COLUMN env_variables.is_secret IS 'Whether this variable contains sensitive data';

-- ============================================================================
-- GRANTS (Ensure Supabase can access)
-- ============================================================================

-- Grant appropriate permissions (Supabase handles most of this automatically)
-- These are here for completeness

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Epic 1 Foundations migration completed successfully';
    RAISE NOTICE 'Tables created: organizations, org_members, projects, environments, env_variables, audit_logs';
    RAISE NOTICE 'RLS policies enabled on all tables';
    RAISE NOTICE 'Encryption functions created for secrets management';
END $$;
