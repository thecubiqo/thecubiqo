create table if not exists public.social_content_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  gfx_tools_job_id uuid references public.gfxtools_jobs(id) on delete set null,
  asset_url text,
  asset_type text not null default 'image',
  asset_source text not null default 'url',
  platforms text[] not null default '{}',
  variants jsonb not null default '{}'::jsonb,
  content_context jsonb not null default '{}'::jsonb,
  preview_card jsonb not null default '{}'::jsonb,
  status text not null default 'prepared',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_content_drafts_asset_type_valid check (asset_type in ('image', 'video', 'gfx_tools_job')),
  constraint social_content_drafts_asset_source_valid check (asset_source in ('url', 'gfx_tools_job')),
  constraint social_content_drafts_status_valid check (status in ('prepared', 'scheduled', 'archived'))
);

create table if not exists public.social_distribution_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  social_content_draft_id uuid not null references public.social_content_drafts(id) on delete cascade,
  name text not null,
  interval_minutes integer not null,
  platforms text[] not null default '{}',
  variant_rotation_count integer not null default 1,
  timezone text not null default 'UTC',
  start_at timestamptz not null default now(),
  end_at timestamptz,
  status text not null default 'active',
  rule_payload jsonb not null default '{}'::jsonb,
  preview_card jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_distribution_rules_name_not_blank check (length(trim(name)) > 0),
  constraint social_distribution_rules_interval_positive check (interval_minutes > 0),
  constraint social_distribution_rules_variant_positive check (variant_rotation_count > 0),
  constraint social_distribution_rules_status_valid check (status in ('active', 'paused_missing_credentials', 'paused', 'cancelled'))
);

create table if not exists public.social_scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  distribution_rule_id uuid not null references public.social_distribution_rules(id) on delete cascade,
  social_content_draft_id uuid not null references public.social_content_drafts(id) on delete cascade,
  platform text not null,
  variant_index integer not null default 0,
  scheduled_for timestamptz not null,
  status text not null default 'pending',
  connector_state text not null default 'disconnected',
  asset_url text,
  content_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_scheduled_posts_status_valid check (status in ('pending', 'blocked_missing_credentials', 'fired', 'failed', 'cancelled')),
  constraint social_scheduled_posts_connector_state_valid check (connector_state in ('disconnected', 'configured_unverified', 'connected'))
);

create table if not exists public.social_post_fire_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  scheduled_post_id uuid references public.social_scheduled_posts(id) on delete set null,
  platform text not null,
  asset_url text,
  status text not null,
  message text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint social_post_fire_logs_status_valid check (status in ('blocked', 'fired', 'failed'))
);

create index if not exists idx_social_content_drafts_user_created
  on public.social_content_drafts(user_id, created_at desc);

create index if not exists idx_social_distribution_rules_user_created
  on public.social_distribution_rules(user_id, created_at desc);

create index if not exists idx_social_scheduled_posts_user_scheduled
  on public.social_scheduled_posts(user_id, scheduled_for asc);

create index if not exists idx_social_post_fire_logs_user_created
  on public.social_post_fire_logs(user_id, created_at desc);

drop trigger if exists set_social_content_drafts_updated_at on public.social_content_drafts;
create trigger set_social_content_drafts_updated_at
before update on public.social_content_drafts
for each row execute function public.set_updated_at();

drop trigger if exists set_social_distribution_rules_updated_at on public.social_distribution_rules;
create trigger set_social_distribution_rules_updated_at
before update on public.social_distribution_rules
for each row execute function public.set_updated_at();

drop trigger if exists set_social_scheduled_posts_updated_at on public.social_scheduled_posts;
create trigger set_social_scheduled_posts_updated_at
before update on public.social_scheduled_posts
for each row execute function public.set_updated_at();

alter table public.social_content_drafts enable row level security;
alter table public.social_distribution_rules enable row level security;
alter table public.social_scheduled_posts enable row level security;
alter table public.social_post_fire_logs enable row level security;

drop policy if exists "social_content_drafts_select_own" on public.social_content_drafts;
create policy "social_content_drafts_select_own"
on public.social_content_drafts for select
using (auth.uid() = user_id);

drop policy if exists "social_distribution_rules_select_own" on public.social_distribution_rules;
create policy "social_distribution_rules_select_own"
on public.social_distribution_rules for select
using (auth.uid() = user_id);

drop policy if exists "social_scheduled_posts_select_own" on public.social_scheduled_posts;
create policy "social_scheduled_posts_select_own"
on public.social_scheduled_posts for select
using (auth.uid() = user_id);

drop policy if exists "social_post_fire_logs_select_own" on public.social_post_fire_logs;
create policy "social_post_fire_logs_select_own"
on public.social_post_fire_logs for select
using (auth.uid() = user_id);

drop policy if exists "social_content_drafts_insert_own" on public.social_content_drafts;
drop policy if exists "social_content_drafts_update_own" on public.social_content_drafts;
drop policy if exists "social_distribution_rules_insert_own" on public.social_distribution_rules;
drop policy if exists "social_distribution_rules_update_own" on public.social_distribution_rules;
drop policy if exists "social_scheduled_posts_insert_own" on public.social_scheduled_posts;
drop policy if exists "social_scheduled_posts_update_own" on public.social_scheduled_posts;
drop policy if exists "social_post_fire_logs_insert_own" on public.social_post_fire_logs;
drop policy if exists "social_post_fire_logs_update_own" on public.social_post_fire_logs;

-- No browser/client write policies are defined. Social preparation, scheduling,
-- and fire logs must pass through /api/actions/execute so approval/audit cannot
-- be bypassed.
