-- Fix color_state constraint to match new color system
-- Old: 'trcl', 'green', 'yellow', 'red'
-- New: 'ORANGE', 'RED', 'YELLOW', 'GREEN_BLUE'

-- Drop old constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS color_state_valid;

-- Add new constraint with correct colors
ALTER TABLE conversations ADD CONSTRAINT color_state_valid
  CHECK (color_state IN ('ORANGE', 'RED', 'YELLOW', 'GREEN_BLUE'));

-- Also fix messages table if it has the same constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS color_valid;
ALTER TABLE messages ADD CONSTRAINT color_valid
  CHECK (color IS NULL OR color IN ('ORANGE', 'RED', 'YELLOW', 'GREEN_BLUE'));
