-- Create experiments table
create table if not exists public.experiments (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  variants jsonb not null, -- e.g. ["A", "B", "Control"]
  status text not null default 'active', -- 'active', 'paused', 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create assignments table to track which user saw which variant
create table if not exists public.experiment_assignments (
  id uuid default gen_random_uuid() primary key,
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade, -- Nullable for anonymous/guest tracking if needed, or link to profiles
  session_id text, -- To track anonymous users by session
  variant text not null,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(experiment_id, user_id),
  unique(experiment_id, session_id)
);

-- Create events table for analytics
create table if not exists public.experiment_events (
  id uuid default gen_random_uuid() primary key,
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  variant text not null,
  event_name text not null,
  value numeric default 1, -- For things like "revenue" or just "1" for a count
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.experiments enable row level security;
alter table public.experiment_assignments enable row level security;
alter table public.experiment_events enable row level security;

-- Everyone can read active experiments
create policy "Allow public read access to active experiments"
  on public.experiments for select
  using (status = 'active');

-- Admins/Service role can do everything (simplified for now, relying on service role for admin tasks)
-- In a real scenario, you'd check for admin claims

-- Assignments: Users can read their own, insert their own
create policy "Users can read own assignments"
  on public.experiment_assignments for select
  using (auth.uid() = user_id);

create policy "Users can insert own assignments"
  on public.experiment_assignments for insert
  with check (auth.uid() = user_id OR user_id is null);

-- Events: Public/Anon can insert events (analytics)
create policy "Anyone can insert events"
  on public.experiment_events for insert
  with check (true);

-- Indexes for performance
create index idx_assignments_experiment_user on public.experiment_assignments(experiment_id, user_id);
create index idx_assignments_experiment_session on public.experiment_assignments(experiment_id, session_id);
create index idx_events_experiment_variant on public.experiment_events(experiment_id, variant);
