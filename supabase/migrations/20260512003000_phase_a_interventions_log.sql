-- Phase A intervention log. Stores nudges that were considered or delivered.

create table if not exists public.interventions_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  intervention_type text not null,
  signal_id uuid,
  message_sent text,
  delivered_via text default 'inline',
  user_response text,
  snoozed_until timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists interventions_log_user_idx
  on public.interventions_log(user_id, created_at desc);

create index if not exists interventions_log_dedupe_idx
  on public.interventions_log(user_id, intervention_type, created_at desc);

alter table public.interventions_log enable row level security;

drop policy if exists "Users read own interventions" on public.interventions_log;
create policy "Users read own interventions"
  on public.interventions_log
  for select
  using (auth.uid() = user_id);
