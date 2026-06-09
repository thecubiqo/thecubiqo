-- Pre-Phase B gates from plan sections 1-3:
-- operational readiness, commercial account registry, affiliate ledger, and
-- extended usage/cost logging. Later remains: Stripe checkout, Tier 4 networks,
-- browser-extension attribution, and Amazon PA API.

alter table if exists public.api_usage_events
  add column if not exists units_used numeric,
  add column if not exists unit_type text,
  add column if not exists currency text default 'USD';

alter table if exists public.api_usage_events
  alter column provider set default 'unknown';

update public.api_usage_events
set provider = 'unknown'
where provider is null;

create index if not exists api_usage_events_provider_created_idx
  on public.api_usage_events(provider, created_at desc);

create index if not exists api_usage_events_user_created_idx
  on public.api_usage_events(user_id, created_at desc);

create table if not exists public.commercial_accounts (
  id uuid primary key default gen_random_uuid(),
  account_type text not null
    check (account_type in ('api_provider','affiliate_network','direct_partner','payment_provider')),
  provider text not null,
  account_owner text,
  billing_owner text,
  business_name text,
  business_email text,
  country text,
  tax_status text,
  approval_status text not null default 'not_started'
    check (approval_status in ('not_started','applied','approved','live','suspended')),
  payout_ready boolean default false,
  dashboard_url text,
  terms_accepted_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.commercial_accounts enable row level security;

create table if not exists public.affiliate_partner_programs (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique,
  network text not null,
  display_name text not null,
  approval_status text not null default 'not_started'
    check (approval_status in ('not_started','applied','approved','live','suspended','rejected')),
  affiliate_id text,
  publisher_id text,
  affiliate_url text,
  deep_link_template text,
  promo_code text,
  commission_type text
    check (commission_type in ('cpa','revenue_share','flat','hybrid')),
  commission_rate numeric,
  commission_currency text default 'GBP',
  cookie_window_days int,
  validation_window_days int,
  payout_threshold numeric,
  payout_schedule text,
  payout_method text,
  postback_supported boolean default false,
  postback_url_registered boolean default false,
  postback_token text,
  dashboard_url text,
  terms_url text,
  logo_url text,
  recommendation_blurb text,
  trigger_keywords text[],
  trigger_domains text[],
  active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.affiliate_partner_programs enable row level security;

create table if not exists public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  recommendation_event_id uuid references public.recommendation_events(id) on delete set null,
  affiliate_click_id uuid references public.affiliate_clicks(id) on delete set null,
  network text not null,
  platform text,
  external_conversion_id text,
  conversion_type text,
  order_reference text,
  sale_amount numeric,
  sale_currency text default 'GBP',
  expected_commission numeric,
  approved_commission numeric,
  commission_currency text default 'GBP',
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','reversed','locked','paid','reconciled')),
  converted_at timestamptz,
  approved_at timestamptz,
  locked_at timestamptz,
  paid_at timestamptz,
  reconciled_at timestamptz,
  raw_payload jsonb default '{}',
  created_at timestamptz default now()
);

create unique index if not exists affiliate_conversions_external_idx
  on public.affiliate_conversions(network, external_conversion_id)
  where external_conversion_id is not null;

create index if not exists affiliate_conversions_status_idx
  on public.affiliate_conversions(status);

create index if not exists affiliate_conversions_network_idx
  on public.affiliate_conversions(network, converted_at desc);

alter table public.affiliate_conversions enable row level security;

create table if not exists public.affiliate_payout_batches (
  id uuid primary key default gen_random_uuid(),
  network text not null,
  payout_reference text,
  payout_amount numeric not null,
  payout_currency text default 'GBP',
  payout_status text not null default 'pending'
    check (payout_status in ('pending','in_transit','received','reconciled','disputed')),
  payout_method text,
  paid_at timestamptz,
  statement_url text,
  raw_statement jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.affiliate_payout_batches enable row level security;

create table if not exists public.affiliate_payout_items (
  id uuid primary key default gen_random_uuid(),
  payout_batch_id uuid references public.affiliate_payout_batches(id) on delete cascade not null,
  affiliate_conversion_id uuid references public.affiliate_conversions(id) on delete restrict,
  amount numeric not null,
  currency text default 'GBP',
  raw_item jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.affiliate_payout_items enable row level security;

insert into public.affiliate_partner_programs
  (platform, network, display_name, approval_status, affiliate_url, promo_code,
   commission_type, commission_rate, commission_currency, postback_supported,
   logo_url, recommendation_blurb, trigger_keywords, trigger_domains, active)
select
  platform,
  case when tier = 2 then 'skimlinks' else 'direct' end,
  display_name,
  case when active then 'live' else 'not_started' end,
  affiliate_url,
  promo_code,
  commission_type,
  commission_rate,
  commission_currency,
  postback_supported,
  logo_url,
  coalesce(recommendation_blurb, tagline),
  trigger_keywords,
  trigger_domains,
  active
from public.affiliate_links
on conflict (platform) do nothing;
