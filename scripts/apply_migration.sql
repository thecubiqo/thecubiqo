
-- Create connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service)
);

-- Create deployments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
    vercel_deployment_id TEXT NOT NULL,
    vercel_project_id TEXT NOT NULL,
    project_name TEXT NOT NULL,
    url TEXT NOT NULL,
    state TEXT NOT NULL,
    commit_sha TEXT,
    commit_message TEXT,
    branch TEXT,
    build_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ready_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_connections_user_service ON public.connections(user_id, service);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON public.deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_connection_id ON public.deployments(connection_id);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own connections" 
    ON public.connections FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections" 
    ON public.connections FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" 
    ON public.connections FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" 
    ON public.connections FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own deployments" 
    ON public.deployments FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deployments" 
    ON public.deployments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments" 
    ON public.deployments FOR UPDATE 
    USING (auth.uid() = user_id);
