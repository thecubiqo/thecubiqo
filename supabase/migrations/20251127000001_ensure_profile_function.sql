-- Function to ensure profile exists for authenticated user
-- Uses SECURITY DEFINER to bypass RLS
-- Called from client after authentication

CREATE OR REPLACE FUNCTION ensure_profile_and_session(
  p_user_id UUID,
  p_email TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}'::jsonb,
  p_geo_location TEXT DEFAULT 'US'
)
RETURNS TABLE (
  session_id UUID,
  is_new_session BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_is_new BOOLEAN := false;
BEGIN
  -- 1. Ensure profile exists (upsert)
  INSERT INTO profiles (id, email)
  VALUES (p_user_id, p_email)
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();

  -- 2. Try to find existing session for this user
  SELECT id INTO v_session_id
  FROM sessions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- 3. If no session, create new one
  IF v_session_id IS NULL THEN
    INSERT INTO sessions (user_id, is_guest, device_info, geo_location, expires_at)
    VALUES (p_user_id, false, p_device_info, p_geo_location, NULL)
    RETURNING id INTO v_session_id;
    v_is_new := true;
  END IF;

  RETURN QUERY SELECT v_session_id, v_is_new;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION ensure_profile_and_session TO authenticated;

-- Also create a function to convert guest session
CREATE OR REPLACE FUNCTION convert_guest_session(
  p_session_id UUID,
  p_user_id UUID,
  p_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- 1. Ensure profile exists
  INSERT INTO profiles (id, email)
  VALUES (p_user_id, p_email)
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();

  -- 2. Convert the session
  UPDATE sessions
  SET user_id = p_user_id,
      is_guest = false,
      expires_at = NULL
  WHERE id = p_session_id
    AND is_guest = true
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION convert_guest_session TO authenticated;
