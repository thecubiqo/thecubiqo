-- Create user_adaptive_models table for persistent personalization
-- This table stores the learned weights and behavior patterns for each user/session
-- Keyed by session_id to allow guest persistence within a browser session, 
-- or user_id for authenticated cross-device persistence.

CREATE TABLE IF NOT EXISTS public.user_adaptive_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE,
    weights JSONB NOT NULL,
    total_interactions INTEGER DEFAULT 0,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    learning_rate NUMERIC DEFAULT 0.3,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_adaptive_models ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_adaptive_models_user_id ON public.user_adaptive_models(user_id);
CREATE INDEX IF NOT EXISTS idx_user_adaptive_models_session_id ON public.user_adaptive_models(session_id);

-- Policies
-- Users can read/write their own models
CREATE POLICY "Users can manage their own adaptive models"
    ON public.user_adaptive_models
    FOR ALL
    USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.user_adaptive_models;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.user_adaptive_models
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comment for table
COMMENT ON TABLE public.user_adaptive_models IS 'Stores persistent AI personalization models for adaptive learning.';
