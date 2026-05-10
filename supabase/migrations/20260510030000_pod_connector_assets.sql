alter table public.pod_design_briefs
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists format text not null default 'image',
  add column if not exists platforms text[] not null default '{}'::text[],
  add column if not exists brand_guidelines text,
  add column if not exists dimensions_requested text,
  add column if not exists status text not null default 'draft',
  add column if not exists asset_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pod_design_briefs_format_valid'
      and conrelid = 'public.pod_design_briefs'::regclass
  ) then
    alter table public.pod_design_briefs
      add constraint pod_design_briefs_format_valid check (format in ('image', 'video'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pod_design_briefs_status_valid'
      and conrelid = 'public.pod_design_briefs'::regclass
  ) then
    alter table public.pod_design_briefs
      add constraint pod_design_briefs_status_valid check (status in ('draft', 'submitted', 'complete'));
  end if;
end $$;

alter table public.gfxtools_jobs
  drop constraint if exists gfxtools_jobs_status_valid;

alter table public.gfxtools_jobs
  add constraint gfxtools_jobs_status_valid
  check (status in ('prepared', 'blocked_missing_credentials', 'submitted', 'pending', 'ready', 'failed'));

create table if not exists public.gfx_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  pod_design_brief_id uuid references public.pod_design_briefs(id) on delete set null,
  gfxtools_job_id uuid references public.gfxtools_jobs(id) on delete set null,
  external_job_id text,
  asset_url text,
  asset_type text not null default 'image',
  dimensions jsonb not null default '{}'::jsonb,
  platform_variants jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  connector_state text not null default 'disconnected',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gfx_assets_asset_type_valid check (asset_type in ('image', 'video')),
  constraint gfx_assets_status_valid check (status in ('pending', 'ready', 'failed')),
  constraint gfx_assets_connector_state_valid check (connector_state in ('disconnected', 'configured_unverified', 'connected'))
);

create table if not exists public.asset_ready_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  asset_id uuid not null references public.gfx_assets(id) on delete cascade,
  event_type text not null default 'asset_ready',
  payload jsonb not null default '{}'::jsonb,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint asset_ready_events_type_valid check (event_type in ('asset_ready'))
);

create table if not exists public.shopify_product_preparations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  asset_id uuid not null references public.gfx_assets(id) on delete restrict,
  connector_state text not null default 'disconnected',
  product_payload jsonb not null default '{}'::jsonb,
  preview_card jsonb not null default '{}'::jsonb,
  status text not null default 'prepared',
  external_call_performed boolean not null default false,
  external_product_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopify_product_preparations_connector_state_valid check (connector_state in ('disconnected', 'configured_unverified', 'connected')),
  constraint shopify_product_preparations_status_valid check (status in ('prepared', 'blocked_missing_credentials', 'submitted', 'failed'))
);

create table if not exists public.printify_design_preparations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  asset_id uuid not null references public.gfx_assets(id) on delete restrict,
  connector_state text not null default 'disconnected',
  design_payload jsonb not null default '{}'::jsonb,
  preview_card jsonb not null default '{}'::jsonb,
  status text not null default 'prepared',
  external_call_performed boolean not null default false,
  external_design_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint printify_design_preparations_connector_state_valid check (connector_state in ('disconnected', 'configured_unverified', 'connected')),
  constraint printify_design_preparations_status_valid check (status in ('prepared', 'blocked_missing_credentials', 'submitted', 'failed'))
);

alter table public.social_content_drafts
  add column if not exists gfx_asset_id uuid references public.gfx_assets(id) on delete set null,
  add column if not exists asset_ready_event_id uuid references public.asset_ready_events(id) on delete set null;

alter table public.social_content_drafts
  drop constraint if exists social_content_drafts_asset_source_valid;

alter table public.social_content_drafts
  add constraint social_content_drafts_asset_source_valid
  check (asset_source in ('url', 'gfx_tools_job', 'gfx_asset'));

create index if not exists idx_gfx_assets_user_created
  on public.gfx_assets(user_id, created_at desc);

create index if not exists idx_gfx_assets_status
  on public.gfx_assets(user_id, status, created_at desc);

create index if not exists idx_asset_ready_events_user_created
  on public.asset_ready_events(user_id, created_at desc);

create index if not exists idx_asset_ready_events_asset
  on public.asset_ready_events(asset_id, created_at desc);

create index if not exists idx_shopify_product_preparations_user_created
  on public.shopify_product_preparations(user_id, created_at desc);

create index if not exists idx_printify_design_preparations_user_created
  on public.printify_design_preparations(user_id, created_at desc);

drop trigger if exists set_gfx_assets_updated_at on public.gfx_assets;
create trigger set_gfx_assets_updated_at
before update on public.gfx_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_shopify_product_preparations_updated_at on public.shopify_product_preparations;
create trigger set_shopify_product_preparations_updated_at
before update on public.shopify_product_preparations
for each row execute function public.set_updated_at();

drop trigger if exists set_printify_design_preparations_updated_at on public.printify_design_preparations;
create trigger set_printify_design_preparations_updated_at
before update on public.printify_design_preparations
for each row execute function public.set_updated_at();

alter table public.gfx_assets enable row level security;
alter table public.asset_ready_events enable row level security;
alter table public.shopify_product_preparations enable row level security;
alter table public.printify_design_preparations enable row level security;

drop policy if exists "gfx_assets_select_own" on public.gfx_assets;
create policy "gfx_assets_select_own"
on public.gfx_assets for select
using (auth.uid() = user_id);

drop policy if exists "asset_ready_events_select_own" on public.asset_ready_events;
create policy "asset_ready_events_select_own"
on public.asset_ready_events for select
using (auth.uid() = user_id);

drop policy if exists "shopify_product_preparations_select_own" on public.shopify_product_preparations;
create policy "shopify_product_preparations_select_own"
on public.shopify_product_preparations for select
using (auth.uid() = user_id);

drop policy if exists "printify_design_preparations_select_own" on public.printify_design_preparations;
create policy "printify_design_preparations_select_own"
on public.printify_design_preparations for select
using (auth.uid() = user_id);

drop policy if exists "gfx_assets_insert_own" on public.gfx_assets;
drop policy if exists "gfx_assets_update_own" on public.gfx_assets;
drop policy if exists "asset_ready_events_insert_own" on public.asset_ready_events;
drop policy if exists "asset_ready_events_update_own" on public.asset_ready_events;
drop policy if exists "shopify_product_preparations_insert_own" on public.shopify_product_preparations;
drop policy if exists "shopify_product_preparations_update_own" on public.shopify_product_preparations;
drop policy if exists "printify_design_preparations_insert_own" on public.printify_design_preparations;
drop policy if exists "printify_design_preparations_update_own" on public.printify_design_preparations;

-- No browser/client write policies are defined. Asset creation, resizing,
-- Shopify preparation, Printify preparation, and asset-ready handoff events
-- must pass through /api/actions/execute with approval/audit.
