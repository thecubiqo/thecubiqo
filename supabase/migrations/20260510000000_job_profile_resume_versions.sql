create table if not exists public.job_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  target_roles text[] not null default '{}',
  skills text[] not null default '{}',
  experience_summary text,
  years_experience numeric(4,1),
  preferred_locations text[] not null default '{}',
  work_modes text[] not null default '{}',
  salary_expectation text,
  profile_payload jsonb not null default '{}'::jsonb,
  preview_card jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_profiles_user_unique unique (user_id)
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  job_profile_id uuid references public.job_profiles(id) on delete set null,
  name text not null,
  resume_content text not null,
  resume_format text not null default 'plain_text',
  target_role text,
  change_summary text,
  diff_preview jsonb not null default '{}'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint resume_versions_name_not_blank check (length(trim(name)) > 0),
  constraint resume_versions_content_not_blank check (length(trim(resume_content)) > 0)
);

create index if not exists idx_job_profiles_user_updated
  on public.job_profiles(user_id, updated_at desc);

create index if not exists idx_resume_versions_user_created
  on public.resume_versions(user_id, created_at desc);

create index if not exists idx_resume_versions_profile_created
  on public.resume_versions(job_profile_id, created_at desc);

drop trigger if exists set_job_profiles_updated_at on public.job_profiles;
create trigger set_job_profiles_updated_at
before update on public.job_profiles
for each row execute function public.set_updated_at();

alter table public.job_profiles enable row level security;
alter table public.resume_versions enable row level security;

drop policy if exists "job_profiles_select_own" on public.job_profiles;
create policy "job_profiles_select_own"
on public.job_profiles for select
using (auth.uid() = user_id);

drop policy if exists "resume_versions_select_own" on public.resume_versions;
create policy "resume_versions_select_own"
on public.resume_versions for select
using (auth.uid() = user_id);

drop policy if exists "job_profiles_insert_own" on public.job_profiles;
drop policy if exists "job_profiles_update_own" on public.job_profiles;
drop policy if exists "resume_versions_insert_own" on public.resume_versions;
drop policy if exists "resume_versions_update_own" on public.resume_versions;

-- No browser/client insert/update policy is defined. Profile and resume writes
-- must pass through /api/actions/execute so approval/audit cannot be bypassed.
