-- Add Admin Identity and Audit Logging
-- Created: 2026-02-15
-- Purpose: Add durable admin flag for privileged users and audit logging system

-- ============================================================================
-- ADD ADMIN FLAG TO PROFILES
-- ============================================================================

-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Add comment
COMMENT ON COLUMN profiles.is_admin IS 'Durable admin flag for privileged users with elevated UI controls';

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Audit trail for privileged admin actions';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of privileged action: debug_view, bypass_confirmation, impersonation, etc.';
COMMENT ON COLUMN audit_logs.action_details IS 'Additional context about the action (JSON)';

-- ============================================================================
-- RLS POLICIES FOR AUDIT LOGS
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Service role can insert audit logs (bypasses RLS)
-- This allows server-side logging without checking RLS
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- SET ADMIN FLAG FOR ADITYA@CUBIQO.AI
-- ============================================================================

-- Set admin flag for aditya@cubiqo.ai if the profile exists
-- This is idempotent and safe to run multiple times
UPDATE profiles
SET is_admin = true
WHERE email = 'aditya@cubiqo.ai'
AND is_admin = false;

-- If the email doesn't exist in profiles yet, this will have no effect
-- The admin flag will need to be set when the user signs up

-- ============================================================================
-- HELPER FUNCTION TO LOG ADMIN ACTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_user_id UUID,
  p_user_email TEXT,
  p_action_type TEXT,
  p_action_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action_type,
    action_details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_user_email,
    p_action_type,
    p_action_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION log_admin_action IS 'Helper function to log privileged admin actions to audit_logs table';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON audit_logs TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
