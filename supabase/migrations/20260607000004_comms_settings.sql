-- ─────────────────────────────────────────────────────────────────────────────
-- CubiQo outbound comms settings — morning briefing, channel prefs
-- ─────────────────────────────────────────────────────────────────────────────

-- User comms preferences (wake time, channel, what to include)
CREATE TABLE IF NOT EXISTS user_comms_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  active           BOOLEAN NOT NULL DEFAULT true,

  -- Wake-up time in the user's local timezone
  wake_hour        SMALLINT NOT NULL DEFAULT 7 CHECK (wake_hour BETWEEN 0 AND 23),
  timezone         TEXT NOT NULL DEFAULT 'UTC',

  -- Delivery channel: 'sms' | 'email' | 'both'
  channel          TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('sms', 'email', 'both')),

  -- What to include in the briefing
  briefing_config  JSONB NOT NULL DEFAULT '{
    "tasks": true,
    "calendar": true,
    "goals": true,
    "blockers": true,
    "weather": false,
    "custom_note": ""
  }'::jsonb,

  -- Anti-duplicate: date of last sent briefing (ISO date YYYY-MM-DD, UTC)
  last_briefing_date DATE,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id)
);

-- RLS
ALTER TABLE user_comms_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users own comms settings" ON user_comms_settings;
CREATE POLICY "users own comms settings"
  ON user_comms_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for cron: find all active users to brief
CREATE INDEX IF NOT EXISTS user_comms_settings_active_idx
  ON user_comms_settings (active, wake_hour, timezone)
  WHERE active = true;

-- Trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION update_comms_settings_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comms_settings_updated_at ON user_comms_settings;
CREATE TRIGGER comms_settings_updated_at
  BEFORE UPDATE ON user_comms_settings
  FOR EACH ROW EXECUTE FUNCTION update_comms_settings_updated_at();
