-- CubiQo Sprint 3 - Notification API compatibility extension.
-- Core notifications/preferences already exist in 20260516005000_notifications.sql.

alter table public.notifications
  add column if not exists dismissed_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists notifications_user_visible_idx
  on public.notifications(user_id, created_at desc)
  where dismissed_at is null;

alter table public.push_notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.push_subscriptions
  add column if not exists max_per_day int default 5,
  add column if not exists quiet_hours_start int default 22,
  add column if not exists quiet_hours_end int default 8,
  add column if not exists timezone text default 'UTC';
