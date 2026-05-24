create extension if not exists pgcrypto;

create table if not exists public.media_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid,
  task_id uuid,
  media_type text not null check (media_type in ('image','video','audio','video_clip')),
  prompt text not null,
  negative_prompt text,
  model_used text not null,
  provider text not null,
  status text not null default 'pending'
    check (status in ('pending','queued','processing','complete','completed','failed','expired','cancelled')),
  storage_url text,
  storage_path text,
  width int,
  height int,
  duration_seconds numeric,
  cost_usd numeric(8,4),
  error_message text,
  metadata jsonb default '{}',
  is_uncensored boolean default false,
  created_at timestamptz default now(),
  completed_at timestamptz,
  expires_at timestamptz default (now() + interval '30 days')
);

alter table public.media_generations enable row level security;

drop policy if exists "Users manage own media generations" on public.media_generations;
create policy "Users manage own media generations"
  on public.media_generations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists media_gen_user_idx
  on public.media_generations(user_id, created_at desc);

create index if not exists media_gen_status_idx
  on public.media_generations(status, created_at)
  where status in ('pending','queued','processing');

create index if not exists media_gen_expiry_idx
  on public.media_generations(expires_at)
  where expires_at is not null;

create table if not exists public.media_generation_queue (
  job_id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  generation_id uuid references public.media_generations(id) on delete cascade,
  prompt text not null,
  media_type text not null check (media_type in ('image','video','audio','video_clip')),
  model_used text not null,
  provider text not null,
  priority int default 5 check (priority between 1 and 10),
  state text not null default 'queued'
    check (state in ('queued','processing','complete','completed','failed','cancelled')),
  external_job_id text,
  webhook_url text,
  retry_count int default 0,
  max_retries int default 2,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text
);

alter table public.media_generation_queue enable row level security;

drop policy if exists "Users read own queue items" on public.media_generation_queue;
create policy "Users read own queue items"
  on public.media_generation_queue for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages queue" on public.media_generation_queue;
create policy "Service role manages queue"
  on public.media_generation_queue for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists media_queue_state_priority_idx
  on public.media_generation_queue(state, priority desc, created_at)
  where state = 'queued';

create index if not exists media_queue_user_idx
  on public.media_generation_queue(user_id, created_at desc);
