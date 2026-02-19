-- Add metadata column to experiments table to store variant assets and config
alter table public.experiments 
add column if not exists metadata jsonb default '{}'::jsonb;
