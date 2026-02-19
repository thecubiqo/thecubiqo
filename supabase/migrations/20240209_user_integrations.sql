-- Create user_integrations table to store OAuth tokens and connection data
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'github', 'vercel', etc.
  access_token TEXT NOT NULL, -- Encrypted OAuth access token
  refresh_token TEXT, -- Optional refresh token
  token_expires_at TIMESTAMPTZ, -- When the token expires
  provider_user_id TEXT, -- User ID from the provider (e.g., GitHub user ID)
  provider_username TEXT, -- Username from the provider
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional provider-specific data
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create index for faster lookups
CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_provider ON user_integrations(provider);

-- Add RLS policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only read their own integrations
CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own integrations
CREATE POLICY "Users can insert own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own integrations
CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_integrations_updated_at();
