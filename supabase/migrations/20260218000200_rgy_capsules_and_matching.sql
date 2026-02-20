-- RGY Capsule and Matching System
-- Implements color:intent:keywords format with staged matching algorithm

-- ============================================================================
-- RGY CAPSULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rgy_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN ('green', 'yellow', 'red')),
  intent TEXT CHECK (intent IN ('collaborate', 'trade', 'company') OR intent IS NULL),
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  geofence_enabled BOOLEAN DEFAULT false,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_km INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_intent_for_color CHECK (
    (color = 'yellow' AND intent IS NULL) OR
    (color IN ('green', 'red') AND intent IS NOT NULL)
  ),
  CONSTRAINT valid_keywords CHECK (jsonb_array_length(keywords) <= 50)
);

-- Indexes for performance
CREATE INDEX idx_rgy_capsules_user ON rgy_capsules(user_id);
CREATE INDEX idx_rgy_capsules_color ON rgy_capsules(color);
CREATE INDEX idx_rgy_capsules_intent ON rgy_capsules(intent);
CREATE INDEX idx_rgy_capsules_active ON rgy_capsules(is_active) WHERE is_active = true;
CREATE INDEX idx_rgy_capsules_keywords ON rgy_capsules USING gin(keywords);

-- Geospatial index
CREATE INDEX idx_rgy_capsules_location ON rgy_capsules(latitude, longitude) WHERE geofence_enabled = true;

-- ============================================================================
-- RGY CHAT ROOMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rgy_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('green', 'yellow', 'red')),
  intent TEXT CHECK (intent IN ('collaborate', 'trade', 'company')),
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_geofenced BOOLEAN DEFAULT false,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_km INTEGER,
  max_participants INTEGER DEFAULT 50,
  participant_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_intent_for_room CHECK (
    (color = 'yellow' AND intent IS NULL) OR
    (color IN ('green', 'red') AND intent IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_rgy_rooms_color ON rgy_chat_rooms(color);
CREATE INDEX idx_rgy_rooms_intent ON rgy_chat_rooms(intent);
CREATE INDEX idx_rgy_rooms_active ON rgy_chat_rooms(is_active) WHERE is_active = true;
CREATE INDEX idx_rgy_rooms_keywords ON rgy_chat_rooms USING gin(keywords);
CREATE INDEX idx_rgy_rooms_location ON rgy_chat_rooms(latitude, longitude) WHERE is_geofenced = true;
CREATE INDEX idx_rgy_rooms_expires ON rgy_chat_rooms(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- ROOM PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rgy_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rgy_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(room_id, user_id)
);

-- Indexes
CREATE INDEX idx_room_participants_room ON rgy_room_participants(room_id);
CREATE INDEX idx_room_participants_user ON rgy_room_participants(user_id);
CREATE INDEX idx_room_participants_active ON rgy_room_participants(is_active) WHERE is_active = true;

-- ============================================================================
-- ROOM MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rgy_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rgy_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_room_messages_room ON rgy_room_messages(room_id, created_at DESC);
CREATE INDEX idx_room_messages_user ON rgy_room_messages(user_id);

-- ============================================================================
-- MATCH SUGGESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rgy_match_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_room_id UUID REFERENCES rgy_chat_rooms(id) ON DELETE CASCADE,
  suggested_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  capsule_id UUID REFERENCES rgy_capsules(id) ON DELETE CASCADE,
  match_score DECIMAL(5, 2) NOT NULL,
  color_match BOOLEAN DEFAULT false,
  intent_match BOOLEAN DEFAULT false,
  keyword_match_count INTEGER DEFAULT 0,
  is_proactive BOOLEAN DEFAULT false,
  is_viewed BOOLEAN DEFAULT false,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  CONSTRAINT valid_suggestion CHECK (
    (suggested_room_id IS NOT NULL AND suggested_user_id IS NULL) OR
    (suggested_room_id IS NULL AND suggested_user_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_match_suggestions_user ON rgy_match_suggestions(user_id);
CREATE INDEX idx_match_suggestions_score ON rgy_match_suggestions(match_score DESC);
CREATE INDEX idx_match_suggestions_active ON rgy_match_suggestions(is_viewed, is_accepted) WHERE expires_at > NOW();

-- ============================================================================
-- MATCH HISTORY TABLE (for learning)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rgy_match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rgy_chat_rooms(id) ON DELETE CASCADE,
  capsule_id UUID REFERENCES rgy_capsules(id) ON DELETE CASCADE,
  match_score DECIMAL(5, 2),
  interaction_duration INTEGER, -- seconds
  was_successful BOOLEAN,
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_match_history_user ON rgy_match_history(user_id);
CREATE INDEX idx_match_history_success ON rgy_match_history(was_successful) WHERE was_successful = true;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  r DECIMAL := 6371; -- Earth radius in km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate keyword match score
CREATE OR REPLACE FUNCTION calculate_keyword_match(keywords1 JSONB, keywords2 JSONB)
RETURNS INTEGER AS $$
DECLARE
  k1 TEXT[];
  k2 TEXT[];
  match_count INTEGER := 0;
  keyword TEXT;
BEGIN
  -- Convert JSONB arrays to TEXT arrays
  SELECT ARRAY(SELECT jsonb_array_elements_text(keywords1)) INTO k1;
  SELECT ARRAY(SELECT jsonb_array_elements_text(keywords2)) INTO k2;
  
  -- Count matches
  FOREACH keyword IN ARRAY k1 LOOP
    IF keyword = ANY(k2) THEN
      match_count := match_count + 1;
    END IF;
  END LOOP;
  
  RETURN match_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get matching capsules (staged matching algorithm)
CREATE OR REPLACE FUNCTION get_matching_capsules(
  p_user_id UUID,
  p_capsule_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  capsule_id UUID,
  user_id UUID,
  color TEXT,
  intent TEXT,
  keywords JSONB,
  match_score DECIMAL,
  color_match BOOLEAN,
  intent_match BOOLEAN,
  keyword_matches INTEGER,
  distance_km DECIMAL
) AS $$
DECLARE
  v_color TEXT;
  v_intent TEXT;
  v_keywords JSONB;
  v_lat DECIMAL;
  v_lon DECIMAL;
  v_geofence BOOLEAN;
  v_radius INTEGER;
BEGIN
  -- Get source capsule details
  SELECT c.color, c.intent, c.keywords, c.latitude, c.longitude, c.geofence_enabled, c.radius_km
  INTO v_color, v_intent, v_keywords, v_lat, v_lon, v_geofence, v_radius
  FROM rgy_capsules c
  WHERE c.id = p_capsule_id AND c.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Find matching capsules with staged algorithm
  RETURN QUERY
  SELECT 
    c.id as capsule_id,
    c.user_id,
    c.color,
    c.intent,
    c.keywords,
    -- Calculate match score (color=40, intent=30, keywords=30)
    (CASE WHEN c.color = v_color THEN 40 ELSE 0 END +
     CASE WHEN c.intent = v_intent OR (c.intent IS NULL AND v_intent IS NULL) THEN 30 ELSE 0 END +
     LEAST(calculate_keyword_match(c.keywords, v_keywords) * 3, 30))::DECIMAL as match_score,
    c.color = v_color as color_match,
    (c.intent = v_intent OR (c.intent IS NULL AND v_intent IS NULL)) as intent_match,
    calculate_keyword_match(c.keywords, v_keywords) as keyword_matches,
    CASE 
      WHEN v_geofence AND c.geofence_enabled THEN 
        calculate_distance(v_lat, v_lon, c.latitude, c.longitude)
      ELSE NULL 
    END as distance_km
  FROM rgy_capsules c
  WHERE c.user_id != p_user_id
    AND c.is_active = true
    AND c.color = v_color -- Stage 1: Color match (required)
    AND (
      v_geofence = false OR 
      c.geofence_enabled = false OR
      calculate_distance(v_lat, v_lon, c.latitude, c.longitude) <= GREATEST(v_radius, c.radius_km)
    )
  ORDER BY match_score DESC, keyword_matches DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE rgy_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rgy_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rgy_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rgy_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rgy_match_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rgy_match_history ENABLE ROW LEVEL SECURITY;

-- RGY Capsules policies
CREATE POLICY "Users can view their own capsules"
  ON rgy_capsules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own capsules"
  ON rgy_capsules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capsules"
  ON rgy_capsules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own capsules"
  ON rgy_capsules FOR DELETE
  USING (auth.uid() = user_id);

-- Chat Rooms policies
CREATE POLICY "Users can view active rooms"
  ON rgy_chat_rooms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create rooms"
  ON rgy_chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms"
  ON rgy_chat_rooms FOR UPDATE
  USING (auth.uid() = created_by);

-- Room Participants policies
CREATE POLICY "Users can view room participants"
  ON rgy_room_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join rooms"
  ON rgy_room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON rgy_room_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Room Messages policies
CREATE POLICY "Room participants can view messages"
  ON rgy_room_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rgy_room_participants rp
      WHERE rp.room_id = rgy_room_messages.room_id
        AND rp.user_id = auth.uid()
        AND rp.is_active = true
    )
  );

CREATE POLICY "Room participants can send messages"
  ON rgy_room_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM rgy_room_participants rp
      WHERE rp.room_id = rgy_room_messages.room_id
        AND rp.user_id = auth.uid()
        AND rp.is_active = true
    )
  );

-- Match Suggestions policies
CREATE POLICY "Users can view their own suggestions"
  ON rgy_match_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create suggestions"
  ON rgy_match_suggestions FOR INSERT
  WITH CHECK (true); -- System-level, but restricted by app logic

CREATE POLICY "Users can update their suggestions"
  ON rgy_match_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

-- Match History policies
CREATE POLICY "Users can view their own history"
  ON rgy_match_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create history"
  ON rgy_match_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update capsule updated_at
CREATE OR REPLACE FUNCTION update_capsule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_capsule_timestamp
  BEFORE UPDATE ON rgy_capsules
  FOR EACH ROW
  EXECUTE FUNCTION update_capsule_timestamp();

-- Update room participant count
CREATE OR REPLACE FUNCTION update_room_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE rgy_chat_rooms 
    SET participant_count = participant_count + 1 
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE rgy_chat_rooms 
    SET participant_count = GREATEST(participant_count - 1, 0)
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true THEN
    UPDATE rgy_chat_rooms 
    SET participant_count = participant_count + 1 
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE rgy_chat_rooms 
    SET participant_count = GREATEST(participant_count - 1, 0)
    WHERE id = OLD.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_count
  AFTER INSERT OR UPDATE OR DELETE ON rgy_room_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_room_participant_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE rgy_capsules IS 'User capsules in format: color:intent:keywords';
COMMENT ON TABLE rgy_chat_rooms IS 'RGY chat rooms created from matching capsules';
COMMENT ON TABLE rgy_match_suggestions IS 'Proactive match suggestions for users';
COMMENT ON FUNCTION get_matching_capsules IS 'Staged matching algorithm: color→intent→keywords';
