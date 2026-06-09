-- CubiQo Phase A/B feature-level DB hardening.
-- Additive/idempotent: explicit service-only RLS posture, legal consent events,
-- prompt/capability seeds, and compatibility aliases used by the app/runtime.

create extension if not exists pgcrypto;

-- Legal/trust: optional audit trail for first-party tracking consent.
create table if not exists public.tracking_consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anon_session_id text,
  consent_scope text not null default 'affiliate_tracking',
  consent_state text not null check (consent_state in ('granted', 'denied', 'revoked')),
  source text default 'app',
  ip_hash text,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.tracking_consent_events enable row level security;

drop policy if exists "Users read own tracking consent events" on public.tracking_consent_events;
create policy "Users read own tracking consent events"
  on public.tracking_consent_events for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages tracking consent events" on public.tracking_consent_events;
create policy "Service role manages tracking consent events"
  on public.tracking_consent_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists tracking_consent_events_user_idx
  on public.tracking_consent_events(user_id, created_at desc);

create index if not exists tracking_consent_events_anon_idx
  on public.tracking_consent_events(anon_session_id, created_at desc)
  where anon_session_id is not null;

-- Phase A safety/rate/cost tables: RLS must be explicit in prod.
alter table public.output_safety_log enable row level security;
drop policy if exists "Users read own output safety log" on public.output_safety_log;
create policy "Users read own output safety log"
  on public.output_safety_log for select
  using (auth.uid() = user_id);

alter table public.user_api_usage enable row level security;
drop policy if exists "Users read own API usage" on public.user_api_usage;
create policy "Users read own API usage"
  on public.user_api_usage for select
  using (auth.uid() = user_id);

alter table public.api_usage_events enable row level security;
drop policy if exists "Users read own API usage events" on public.api_usage_events;
create policy "Users read own API usage events"
  on public.api_usage_events for select
  using (auth.uid() = user_id);

alter table public.billing_events enable row level security;
drop policy if exists "No direct user access to billing events" on public.billing_events;
create policy "No direct user access to billing events"
  on public.billing_events for all
  using (false)
  with check (false);

alter table public.amazon_product_cache enable row level security;
drop policy if exists "No direct user access to amazon product cache" on public.amazon_product_cache;
create policy "No direct user access to amazon product cache"
  on public.amazon_product_cache for all
  using (false)
  with check (false);

alter table public.background_trigger_failures enable row level security;
drop policy if exists "No direct user access to background trigger failures" on public.background_trigger_failures;
create policy "No direct user access to background trigger failures"
  on public.background_trigger_failures for all
  using (false)
  with check (false);

-- Public configuration catalog. RLS remains explicit with read-only client access.
alter table public.connector_registry enable row level security;
drop policy if exists "Public read connector registry" on public.connector_registry;
create policy "Public read connector registry"
  on public.connector_registry for select
  using (true);

-- Briefings are user-readable, but writes stay server-side.
alter table public.capsule_briefings enable row level security;
drop policy if exists "Users read own capsule briefings" on public.capsule_briefings;
create policy "Users read own capsule briefings"
  on public.capsule_briefings for select
  using (auth.uid() = user_id);

-- Commercial/ledger/admin tables: explicit service-only posture.
alter table public.affiliate_clicks enable row level security;
drop policy if exists "No direct user access to affiliate clicks" on public.affiliate_clicks;
create policy "No direct user access to affiliate clicks"
  on public.affiliate_clicks for all using (false) with check (false);

alter table public.affiliate_conversions enable row level security;
drop policy if exists "No direct user access to affiliate conversions" on public.affiliate_conversions;
create policy "No direct user access to affiliate conversions"
  on public.affiliate_conversions for all using (false) with check (false);

alter table public.affiliate_payout_batches enable row level security;
drop policy if exists "No direct user access to affiliate payout batches" on public.affiliate_payout_batches;
create policy "No direct user access to affiliate payout batches"
  on public.affiliate_payout_batches for all using (false) with check (false);

alter table public.affiliate_payout_items enable row level security;
drop policy if exists "No direct user access to affiliate payout items" on public.affiliate_payout_items;
create policy "No direct user access to affiliate payout items"
  on public.affiliate_payout_items for all using (false) with check (false);

alter table public.commercial_accounts enable row level security;
drop policy if exists "No direct user access to commercial accounts" on public.commercial_accounts;
create policy "No direct user access to commercial accounts"
  on public.commercial_accounts for all using (false) with check (false);

alter table public.affiliate_partner_programs enable row level security;
drop policy if exists "No direct user access to affiliate partner programs" on public.affiliate_partner_programs;
create policy "No direct user access to affiliate partner programs"
  on public.affiliate_partner_programs for all using (false) with check (false);

-- Repo awareness is operator/service-side data, not direct client data.
alter table public.repo_index_runs enable row level security;
drop policy if exists "No direct user access to repo index runs" on public.repo_index_runs;
create policy "No direct user access to repo index runs"
  on public.repo_index_runs for all using (false) with check (false);

alter table public.repo_index_files enable row level security;
drop policy if exists "No direct user access to repo index files" on public.repo_index_files;
create policy "No direct user access to repo index files"
  on public.repo_index_files for all using (false) with check (false);

-- Compatibility aliases for older code/docs while canonical columns remain intact.
alter table public.self_heal_proposals
  add column if not exists status text;

update public.self_heal_proposals
  set status = state
  where status is null and state is not null;

alter table public.budget_policies
  add column if not exists daily_budget_gbp numeric default 5;

update public.budget_policies
  set daily_budget_gbp = daily_limit_gbp
  where daily_budget_gbp is null and daily_limit_gbp is not null;

alter table public.budget_events
  add column if not exists api_cost_gbp numeric default 0;

update public.budget_events
  set api_cost_gbp = coalesce(cost_gbp, amount_gbp, 0)
  where api_cost_gbp is null;

alter table public.dead_letter_jobs
  add column if not exists job_id uuid;

update public.dead_letter_jobs
  set job_id = original_job_id
  where job_id is null and original_job_id is not null;

alter table public.platform_automation_policy
  add column if not exists requires_approval boolean default false;

update public.platform_automation_policy
  set requires_approval = can_write_with_approval
  where requires_approval is false and can_write_with_approval is true;

-- Seed real system prompts if the table exists but still has placeholders/empty rows.
insert into public.system_prompts (name, version, content, active)
values
  (
    'base',
    1,
    'You are CubiQo: a proactive AI system that helps users achieve concrete goals through research, planning, and safe execution. Be direct, specific, context-aware, and action-oriented. Use tools when they materially help. Do not perform final submit, publish, payment, or irreversible external actions without explicit user approval.',
    true
  ),
  (
    'career_addendum',
    1,
    'CAREER MODE: Adapt to the user''s specific role, industry, seniority, location, and constraints. Focus on targeted positioning, ATS clarity, evidence-backed applications, interview preparation, and negotiation strategy.',
    true
  )
on conflict (name, version) do update
set content = excluded.content,
    active = excluded.active;

-- Seed baseline tool capabilities used by the route planner / connector readiness UI.
insert into public.tool_capabilities
  (platform, action, route_type, risk_level, dry_run_supported, requires_approval, rate_limit_per_sec, description)
values
  ('general', 'research_web', 'api', 'low', true, false, 1.0, 'Search and summarize public web information.'),
  ('general', 'draft_plan', 'llm', 'low', true, false, 1.0, 'Draft plans, checklists, and next-step proposals.'),
  ('gmail', 'read_email', 'oauth2', 'medium', true, false, 0.5, 'Read mailbox context after user connection.'),
  ('gmail', 'draft_email', 'oauth2', 'medium', true, true, 0.5, 'Create email drafts. Final send requires approval.'),
  ('google_drive', 'read_file', 'oauth2', 'medium', true, false, 0.5, 'Read user-selected Drive files.'),
  ('google_drive', 'draft_doc', 'oauth2', 'medium', true, true, 0.5, 'Draft or update documents. Destructive writes require approval.'),
  ('shopify', 'read_store', 'oauth2', 'medium', true, false, 0.5, 'Read store/catalog state through the Shopify connector.'),
  ('shopify', 'draft_product', 'oauth2', 'high', true, true, 0.25, 'Prepare product changes. Publish and payment actions require approval.'),
  ('stripe', 'read_billing', 'api_key', 'high', true, false, 0.25, 'Read subscription and billing state.'),
  ('stripe', 'create_checkout', 'api_key', 'high', true, true, 0.25, 'Create billing checkout links through approved backend routes.'),
  ('plaid', 'read_accounts', 'open_banking', 'high', true, false, 0.25, 'Read consented financial account metadata.'),
  ('extension', 'read_page', 'extension', 'medium', true, false, 0.5, 'Read the active page through the CubiQo extension.'),
  ('extension', 'click_or_type', 'extension', 'high', true, true, 0.25, 'Perform browser actions through extension after approval.'),
  ('social', 'draft_post', 'oauth2', 'medium', true, true, 0.5, 'Draft social posts. Final publish requires approval.'),
  ('browserbase', 'screenshot', 'browser', 'medium', true, false, 0.25, 'Capture a remote browser screenshot.'),
  ('stagehand', 'navigate', 'browser', 'high', true, true, 0.25, 'Navigate browser sessions with approval gates.')
on conflict do nothing;
