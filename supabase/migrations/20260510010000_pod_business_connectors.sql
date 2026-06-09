create table if not exists public.pod_design_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  brand_name text,
  product_type text not null,
  target_audience text,
  style_keywords text[] not null default '{}',
  color_palette text[] not null default '{}',
  placement text,
  prompt text not null,
  negative_prompt text,
  fulfillment_targets text[] not null default '{}',
  marketing_angles text[] not null default '{}',
  creative_brief jsonb not null default '{}'::jsonb,
  preview_card jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pod_design_briefs_product_type_not_blank check (length(trim(product_type)) > 0),
  constraint pod_design_briefs_prompt_not_blank check (length(trim(prompt)) > 0)
);

create table if not exists public.gfxtools_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  pod_design_brief_id uuid references public.pod_design_briefs(id) on delete set null,
  status text not null default 'prepared',
  connector_state text not null default 'disconnected',
  job_payload jsonb not null default '{}'::jsonb,
  preview_card jsonb not null default '{}'::jsonb,
  external_job_id text,
  external_call_performed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gfxtools_jobs_status_valid check (status in ('prepared', 'blocked_missing_credentials', 'submitted', 'failed')),
  constraint gfxtools_jobs_connector_state_valid check (connector_state in ('disconnected', 'configured_unverified', 'connected'))
);

create index if not exists idx_pod_design_briefs_user_created
  on public.pod_design_briefs(user_id, created_at desc);

create index if not exists idx_gfxtools_jobs_user_created
  on public.gfxtools_jobs(user_id, created_at desc);

create index if not exists idx_gfxtools_jobs_brief_created
  on public.gfxtools_jobs(pod_design_brief_id, created_at desc);

drop trigger if exists set_pod_design_briefs_updated_at on public.pod_design_briefs;
create trigger set_pod_design_briefs_updated_at
before update on public.pod_design_briefs
for each row execute function public.set_updated_at();

drop trigger if exists set_gfxtools_jobs_updated_at on public.gfxtools_jobs;
create trigger set_gfxtools_jobs_updated_at
before update on public.gfxtools_jobs
for each row execute function public.set_updated_at();

alter table public.pod_design_briefs enable row level security;
alter table public.gfxtools_jobs enable row level security;

drop policy if exists "pod_design_briefs_select_own" on public.pod_design_briefs;
create policy "pod_design_briefs_select_own"
on public.pod_design_briefs for select
using (auth.uid() = user_id);

drop policy if exists "gfxtools_jobs_select_own" on public.gfxtools_jobs;
create policy "gfxtools_jobs_select_own"
on public.gfxtools_jobs for select
using (auth.uid() = user_id);

drop policy if exists "pod_design_briefs_insert_own" on public.pod_design_briefs;
drop policy if exists "pod_design_briefs_update_own" on public.pod_design_briefs;
drop policy if exists "gfxtools_jobs_insert_own" on public.gfxtools_jobs;
drop policy if exists "gfxtools_jobs_update_own" on public.gfxtools_jobs;

-- No browser/client insert/update policy is defined. POD business writes must
-- pass through /api/actions/execute so approval/audit cannot be bypassed.
