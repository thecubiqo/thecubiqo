-- Safe legacy feature ports for the current cq.ai stack.
-- Legacy branches are treated as a parts warehouse; these tables are clean current-stack contracts.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.user_keywords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  color_zone text not null default 'yellow' check (color_zone in ('red', 'green', 'teal', 'blue', 'yellow')),
  intent text,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, keyword, color_zone)
);

create index if not exists user_keywords_user_created_idx on public.user_keywords(user_id, created_at desc);
alter table public.user_keywords enable row level security;

drop policy if exists "user_keywords_select_own" on public.user_keywords;
create policy "user_keywords_select_own" on public.user_keywords
  for select using (auth.uid() = user_id);

drop policy if exists "user_keywords_insert_own" on public.user_keywords;
create policy "user_keywords_insert_own" on public.user_keywords
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_keywords_update_own" on public.user_keywords;
create policy "user_keywords_update_own" on public.user_keywords
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_keywords_delete_own" on public.user_keywords;
create policy "user_keywords_delete_own" on public.user_keywords
  for delete using (auth.uid() = user_id);

create table if not exists public.job_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Primary job profile',
  target_roles text[] not null default array[]::text[],
  target_locations text[] not null default array[]::text[],
  remote_preference text not null default 'flexible',
  resume_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.job_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  location text,
  source text not null default 'manual',
  status text not null default 'saved' check (status in ('saved', 'running', 'paused', 'complete')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  content text,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  job_url text,
  source text not null default 'manual',
  status text not null default 'saved' check (status in ('saved', 'ready', 'applied', 'interviewing', 'offer', 'rejected', 'archived')),
  fit_score integer check (fit_score is null or (fit_score >= 0 and fit_score <= 100)),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists job_profiles_user_idx on public.job_profiles(user_id, updated_at desc);
create index if not exists job_searches_user_idx on public.job_searches(user_id, updated_at desc);
create index if not exists resume_versions_user_idx on public.resume_versions(user_id, updated_at desc);
create index if not exists job_applications_user_idx on public.job_applications(user_id, updated_at desc);

alter table public.job_profiles enable row level security;
alter table public.job_searches enable row level security;
alter table public.resume_versions enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "job_profiles_own" on public.job_profiles;
create policy "job_profiles_own" on public.job_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "job_searches_own" on public.job_searches;
create policy "job_searches_own" on public.job_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "resume_versions_own" on public.resume_versions;
create policy "resume_versions_own" on public.resume_versions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "job_applications_own" on public.job_applications;
create policy "job_applications_own" on public.job_applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists job_profiles_set_updated_at on public.job_profiles;
create trigger job_profiles_set_updated_at before update on public.job_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists job_searches_set_updated_at on public.job_searches;
create trigger job_searches_set_updated_at before update on public.job_searches
  for each row execute function public.set_updated_at();

drop trigger if exists resume_versions_set_updated_at on public.resume_versions;
create trigger resume_versions_set_updated_at before update on public.resume_versions
  for each row execute function public.set_updated_at();

drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at before update on public.job_applications
  for each row execute function public.set_updated_at();

create table if not exists public.site_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'general',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.site_templates(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

insert into public.site_templates(slug, name, category, config)
values
  ('single-page-service', 'Single Page Service', 'website', '{"sections":["hero","services","contact"]}'::jsonb),
  ('creator-shop', 'Creator Shop', 'commerce', '{"sections":["hero","products","checkout-intent"]}'::jsonb)
on conflict (slug) do nothing;

alter table public.site_templates enable row level security;
alter table public.sites enable row level security;

drop policy if exists "site_templates_read_all" on public.site_templates;
create policy "site_templates_read_all" on public.site_templates for select using (true);

drop policy if exists "sites_select_own_or_published" on public.sites;
create policy "sites_select_own_or_published" on public.sites
  for select using (auth.uid() = user_id or status = 'published');

drop policy if exists "sites_insert_own" on public.sites;
create policy "sites_insert_own" on public.sites
  for insert with check (auth.uid() = user_id);

drop policy if exists "sites_update_own" on public.sites;
create policy "sites_update_own" on public.sites
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sites_delete_own" on public.sites;
create policy "sites_delete_own" on public.sites
  for delete using (auth.uid() = user_id);

drop trigger if exists sites_set_updated_at on public.sites;
create trigger sites_set_updated_at before update on public.sites
  for each row execute function public.set_updated_at();

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null default 'not_connected' check (status in ('not_connected', 'connected', 'needs_action', 'disabled')),
  token_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, provider)
);

alter table public.integration_connections enable row level security;

drop policy if exists "integration_connections_own" on public.integration_connections;
create policy "integration_connections_own" on public.integration_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists integration_connections_set_updated_at on public.integration_connections;
create trigger integration_connections_set_updated_at before update on public.integration_connections
  for each row execute function public.set_updated_at();

create table if not exists public.cq_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  cq_number text not null unique,
  display_name text,
  status text not null default 'active' check (status in ('active', 'paused', 'blocked')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.cq_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_user_id uuid references auth.users(id) on delete cascade,
  contact_cq_number text not null,
  display_name text,
  status text not null default 'pending' check (status in ('pending', 'connected', 'blocked')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, contact_cq_number)
);

create table if not exists public.cq_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.cq_profiles enable row level security;
alter table public.cq_contacts enable row level security;
alter table public.cq_messages enable row level security;

drop policy if exists "cq_profiles_own" on public.cq_profiles;
create policy "cq_profiles_own" on public.cq_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cq_contacts_own" on public.cq_contacts;
create policy "cq_contacts_own" on public.cq_contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cq_messages_sender_or_recipient_select" on public.cq_messages;
create policy "cq_messages_sender_or_recipient_select" on public.cq_messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "cq_messages_sender_insert" on public.cq_messages;
create policy "cq_messages_sender_insert" on public.cq_messages
  for insert with check (auth.uid() = sender_id);

drop trigger if exists cq_profiles_set_updated_at on public.cq_profiles;
create trigger cq_profiles_set_updated_at before update on public.cq_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists cq_contacts_set_updated_at on public.cq_contacts;
create trigger cq_contacts_set_updated_at before update on public.cq_contacts
  for each row execute function public.set_updated_at();

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'viewer')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  revoked_at timestamptz,
  unique(user_id, role)
);

alter table public.admin_roles enable row level security;

drop policy if exists "admin_roles_select_own" on public.admin_roles;
create policy "admin_roles_select_own" on public.admin_roles
  for select using (auth.uid() = user_id);

create or replace function public.is_cubiqo_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.admin_roles
    where user_id = auth.uid()
      and revoked_at is null
      and role in ('owner', 'admin')
  );
$$;

create table if not exists public.social_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'paused', 'ready', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text not null,
  status text not null default 'not_connected' check (status in ('not_connected', 'connected', 'needs_action', 'disabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.social_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.social_campaigns(id) on delete cascade,
  platform text not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'paused', 'complete', 'failed')),
  scheduled_for timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.social_reports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.social_campaigns(id) on delete cascade,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.social_campaigns enable row level security;
alter table public.social_accounts enable row level security;
alter table public.social_tasks enable row level security;
alter table public.social_reports enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "social_campaigns_admin_read" on public.social_campaigns;
create policy "social_campaigns_admin_read" on public.social_campaigns for select using (public.is_cubiqo_admin());

drop policy if exists "social_accounts_admin_read" on public.social_accounts;
create policy "social_accounts_admin_read" on public.social_accounts for select using (public.is_cubiqo_admin());

drop policy if exists "social_tasks_admin_read" on public.social_tasks;
create policy "social_tasks_admin_read" on public.social_tasks for select using (public.is_cubiqo_admin());

drop policy if exists "social_reports_admin_read" on public.social_reports;
create policy "social_reports_admin_read" on public.social_reports for select using (public.is_cubiqo_admin());

drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read" on public.audit_logs for select using (public.is_cubiqo_admin());

create table if not exists public.byo_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  masked_label text not null,
  key_hint text,
  encrypted_value text not null,
  status text not null default 'stored' check (status in ('stored', 'disabled', 'revoked')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, provider)
);

alter table public.byo_api_keys enable row level security;

drop policy if exists "byo_api_keys_own" on public.byo_api_keys;
create policy "byo_api_keys_own" on public.byo_api_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists byo_api_keys_set_updated_at on public.byo_api_keys;
create trigger byo_api_keys_set_updated_at before update on public.byo_api_keys
  for each row execute function public.set_updated_at();

create table if not exists public.diagnostic_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null default 'self_report',
  status text not null default 'observed' check (status in ('observed', 'warning', 'failed', 'ok')),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.diagnostic_reports enable row level security;

drop policy if exists "diagnostic_reports_select_own_or_admin" on public.diagnostic_reports;
create policy "diagnostic_reports_select_own_or_admin" on public.diagnostic_reports
  for select using (auth.uid() = user_id or public.is_cubiqo_admin());

drop policy if exists "diagnostic_reports_insert_own" on public.diagnostic_reports;
create policy "diagnostic_reports_insert_own" on public.diagnostic_reports
  for insert with check (auth.uid() = user_id);
