-- RGY signal capsule storage for cq.ai.
-- Matching capsule: color + keyword + confirmed_intents.
-- Suggested or ambiguous intent can be shown, but matching remains disabled
-- until at least one intent is confirmed by the user.

create extension if not exists pgcrypto;

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  color text not null check (color in ('green', 'yellow', 'red')),
  keyword text not null,
  normalized_keyword text not null,
  intent_status text not null default 'pending'
    check (intent_status in ('pending', 'suggested', 'ambiguous', 'confirmed')),
  suggested_intents text[] not null default '{}'::text[],
  confirmed_intents text[] not null default '{}'::text[],
  source text not null default 'conversation',
  display_state text not null default 'visible'
    check (display_state in ('visible', 'hidden', 'deleted')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signals_keyword_not_blank check (length(trim(keyword)) > 0),
  constraint signals_normalized_keyword_not_blank check (length(trim(normalized_keyword)) > 0),
  constraint signals_suggested_intents_allowed check (
    suggested_intents <@ array['socialize','collaborate','trade']::text[]
  ),
  constraint signals_confirmed_intents_allowed check (
    confirmed_intents <@ array['socialize','collaborate','trade']::text[]
  ),
  constraint signals_confirmed_requires_intent check (
    intent_status <> 'confirmed' or cardinality(confirmed_intents) > 0
  )
);

alter table public.signals
  add column if not exists normalized_keyword text not null default 'signal',
  add column if not exists intent_status text not null default 'pending',
  add column if not exists suggested_intents text[] not null default '{}'::text[],
  add column if not exists confirmed_intents text[] not null default '{}'::text[],
  add column if not exists display_state text not null default 'visible',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_signals_user_created
  on public.signals(user_id, created_at desc);

create index if not exists idx_signals_user_color_keyword
  on public.signals(user_id, color, normalized_keyword);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_signals_updated_at on public.signals;
create trigger set_signals_updated_at
before update on public.signals
for each row execute function public.set_updated_at();

alter table public.signals enable row level security;

drop policy if exists "signals_select_own" on public.signals;
create policy "signals_select_own"
on public.signals for select
using (auth.uid() = user_id);

drop policy if exists "signals_insert_own" on public.signals;
create policy "signals_insert_own"
on public.signals for insert
with check (auth.uid() = user_id);

drop policy if exists "signals_update_own" on public.signals;
create policy "signals_update_own"
on public.signals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "signals_delete_own" on public.signals;
create policy "signals_delete_own"
on public.signals for delete
using (auth.uid() = user_id);
