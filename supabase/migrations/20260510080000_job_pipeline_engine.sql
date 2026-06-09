-- Job Application Pipeline Engine
-- Adds: application_answers, job_applications columns, job_listings columns

-- ── Application Q&A bank (filled once, reused per application) ────────────

create table if not exists application_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  platform_hint text, -- 'all' | 'linkedin' | 'indeed' | 'workday' etc
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table application_answers enable row level security;

create policy "Users own their application answers"
  on application_answers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists application_answers_user_idx
  on application_answers (user_id, display_order);

-- ── Job applications enhancements ──────────────────────────────────────────

create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references job_listings(id) on delete set null,
  platform text not null,
  apply_url text,
  status text not null default 'pending'
    check (status in ('pending','ready_to_submit','applying','submitted','failed','withdrawn','interview','offer')),
  screenshot_url text,
  error text,
  submitted_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table job_applications enable row level security;

create policy "Users own their job applications"
  on job_applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists job_applications_user_status_idx
  on job_applications (user_id, status, created_at desc);

create index if not exists job_applications_listing_idx
  on job_applications (listing_id);

-- ── Job listings enhancements ──────────────────────────────────────────────

alter table if exists job_listings
  add column if not exists status text not null default 'discovered',
  add column if not exists source_url text,
  add column if not exists company text,
  add column if not exists location text,
  add column if not exists description text,
  add column if not exists updated_at timestamptz not null default now();

-- ── Job profile enhancements ───────────────────────────────────────────────

alter table if exists job_profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists city text,
  add column if not exists linkedin_url text,
  add column if not exists desired_salary text,
  add column if not exists availability text default '2 weeks notice',
  add column if not exists usc boolean not null default false,
  add column if not exists autonomous_apply boolean not null default false,
  add column if not exists apply_threshold integer not null default 80;

-- ── Resume versions enhancements ──────────────────────────────────────────

alter table if exists resume_versions
  add column if not exists resume_content text,
  add column if not exists ats_score integer,
  add column if not exists cover_letter text,
  add column if not exists target_role text;

-- ── Seed default application Q&A for new users (via function) ─────────────

create or replace function insert_default_application_answers(p_user_id uuid)
returns void language plpgsql as $$
begin
  insert into application_answers (user_id, question, answer, platform_hint, display_order)
  values
    (p_user_id, 'Are you authorized to work in the United States?', 'Yes', 'all', 1),
    (p_user_id, 'Will you now or in the future require sponsorship?', 'No', 'all', 2),
    (p_user_id, 'Are you a U.S. Citizen?', 'Yes', 'all', 3),
    (p_user_id, 'Are you open to remote work?', 'Yes — remote only', 'all', 4),
    (p_user_id, 'Are you willing to relocate?', 'No', 'all', 5),
    (p_user_id, 'What is your desired salary?', 'Competitive / negotiable', 'all', 6),
    (p_user_id, 'When can you start?', '2 weeks notice from offer acceptance', 'all', 7),
    (p_user_id, 'Are you a veteran?', 'No', 'all', 8),
    (p_user_id, 'Do you have a disability?', 'Prefer not to say', 'all', 9)
  on conflict do nothing;
end;
$$;
