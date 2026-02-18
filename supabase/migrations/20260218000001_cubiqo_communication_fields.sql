-- Add Cubiqo Email and Phone Number Generation
-- Created: 2026-02-18
-- Purpose: Auto-generate email and phone number for users when they sign up

-- ============================================================================
-- ADD NEW COLUMNS TO PROFILES
-- ============================================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cubiqo_email TEXT,
ADD COLUMN IF NOT EXISTS cubiqo_phone TEXT;

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cubiqo_email ON profiles(cubiqo_email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cubiqo_phone ON profiles(cubiqo_phone);

-- ============================================================================
-- FUNCTION: GENERATE CUBIQO EMAIL
-- Generates email in format: name@yourcubiqo.com
-- Uses display_name if available, otherwise handle without CQ# prefix
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_cubiqo_email(
  p_display_name TEXT,
  p_handle TEXT,
  p_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
  base_name TEXT;
  email_prefix TEXT;
  email_suffix TEXT := '@yourcubiqo.com';
  candidate_email TEXT;
  counter INT := 0;
BEGIN
  -- Determine base name from display_name or handle
  IF p_display_name IS NOT NULL AND p_display_name != '' THEN
    base_name := LOWER(TRIM(p_display_name));
  ELSIF p_handle IS NOT NULL THEN
    -- Extract number from CQ#12345 format
    base_name := LOWER(REGEXP_REPLACE(p_handle, '^CQ#', '', 'i'));
  ELSE
    -- Fallback to user ID
    base_name := SUBSTRING(p_user_id::TEXT FROM 1 FOR 8);
  END IF;
  
  -- Clean up base_name: replace spaces and special chars with nothing
  base_name := REGEXP_REPLACE(base_name, '[^a-z0-9]', '', 'g');
  
  -- If base_name is empty after cleaning, use 'user' prefix
  IF base_name = '' THEN
    base_name := 'user' || FLOOR(RANDOM() * 10000)::TEXT;
  END IF;
  
  -- Try to find unique email
  email_prefix := base_name;
  candidate_email := email_prefix || email_suffix;
  
  -- Check if email exists, if so append counter
  WHILE EXISTS (SELECT 1 FROM profiles WHERE cubiqo_email = candidate_email) LOOP
    counter := counter + 1;
    candidate_email := email_prefix || counter || email_suffix;
  END LOOP;
  
  RETURN candidate_email;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: GENERATE CUBIQO PHONE
-- Generates phone in format: +1-CUBIQO-{5-digit-number}
-- Uses the handle number (e.g., CQ#12345 -> +1-CUBIQO-12345)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_cubiqo_phone(
  p_handle TEXT,
  p_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
  handle_number TEXT;
  phone_number TEXT;
  counter INT := 0;
BEGIN
  -- Extract number from handle (CQ#12345)
  IF p_handle IS NOT NULL AND p_handle ~ '^CQ#[0-9]+$' THEN
    handle_number := REGEXP_REPLACE(p_handle, '^CQ#', '', 'i');
    -- Pad to 5 digits
    handle_number := LPAD(handle_number, 5, '0');
  ELSE
    -- Fallback: generate random 5-digit number
    handle_number := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END IF;
  
  phone_number := '+1-CUBIQO-' || handle_number;
  
  -- Ensure uniqueness (should be unique if handle is unique, but double-check)
  WHILE EXISTS (SELECT 1 FROM profiles WHERE cubiqo_phone = phone_number) LOOP
    counter := counter + 1;
    handle_number := LPAD((handle_number::INT + counter)::TEXT, 5, '0');
    phone_number := '+1-CUBIQO-' || handle_number;
  END LOOP;
  
  RETURN phone_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE TRIGGER: AUTO-GENERATE CUBIQO EMAIL AND PHONE
-- Extends existing auto_generate_handle trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_generate_communication_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate handle first if not present (from existing trigger)
  IF NEW.handle IS NULL THEN
    NEW.handle := generate_unique_handle();
  END IF;
  
  -- Generate cubiqo_email if not present
  IF NEW.cubiqo_email IS NULL THEN
    NEW.cubiqo_email := generate_cubiqo_email(
      NEW.display_name,
      NEW.handle,
      NEW.id
    );
  END IF;
  
  -- Generate cubiqo_phone if not present
  IF NEW.cubiqo_phone IS NULL THEN
    NEW.cubiqo_phone := generate_cubiqo_phone(
      NEW.handle,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and replace with new one
DROP TRIGGER IF EXISTS trg_auto_generate_handle ON profiles;

CREATE TRIGGER trg_auto_generate_communication_fields
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_communication_fields();

-- ============================================================================
-- BACKFILL EXISTING PROFILES
-- Generate cubiqo_email and cubiqo_phone for existing users
-- ============================================================================

DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id, display_name, handle 
    FROM profiles 
    WHERE cubiqo_email IS NULL OR cubiqo_phone IS NULL
  LOOP
    UPDATE profiles
    SET 
      cubiqo_email = COALESCE(cubiqo_email, generate_cubiqo_email(profile_record.display_name, profile_record.handle, profile_record.id)),
      cubiqo_phone = COALESCE(cubiqo_phone, generate_cubiqo_phone(profile_record.handle, profile_record.id))
    WHERE id = profile_record.id;
  END LOOP;
  
  RAISE NOTICE 'Backfilled cubiqo_email and cubiqo_phone for existing profiles';
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN profiles.cubiqo_email IS 'Auto-generated Cubiqo email address for user communication (format: name@yourcubiqo.com)';
COMMENT ON COLUMN profiles.cubiqo_phone IS 'Auto-generated Cubiqo phone number for user communication (format: +1-CUBIQO-{5-digits})';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION generate_cubiqo_email TO authenticated;
GRANT EXECUTE ON FUNCTION generate_cubiqo_phone TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
