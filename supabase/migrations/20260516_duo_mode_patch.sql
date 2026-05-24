-- CubiQo DuoMode B4 patch: status compatibility, realtime publication, analytics events.

alter table public.duo_tasks
  drop constraint if exists duo_tasks_status_check;

alter table public.duo_tasks
  add constraint duo_tasks_status_check
  check (status in ('pending','ready','working','done','failed','blocked','waiting_approval','awaiting_user','cancelled','queued','running','succeeded','retry_scheduled','dead_lettered'));

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anon_session_id text,
  event_type text not null,
  properties jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.analytics_events enable row level security;

drop policy if exists "Users read own analytics events" on public.analytics_events;
create policy "Users read own analytics events"
  on public.analytics_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own analytics events" on public.analytics_events;
create policy "Users insert own analytics events"
  on public.analytics_events for insert
  with check (auth.uid() = user_id or user_id is null);

create index if not exists analytics_events_type_created_idx
  on public.analytics_events(event_type, created_at desc);
create index if not exists analytics_events_user_created_idx
  on public.analytics_events(user_id, created_at desc);

do $$
begin
  begin
    alter publication supabase_realtime add table public.duo_projects;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.duo_tasks;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.stream_events;
  exception when duplicate_object then
    null;
  end;
end $$;
