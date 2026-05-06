-- Daily Journal storage for cq.ai QA.

create extension if not exists pgcrypto;

alter table public.conversation_events
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  responses jsonb not null default '[]'::jsonb,
  rgy_color text not null default 'yellow' check (rgy_color in ('green', 'yellow', 'red')),
  mood text,
  word_count integer not null default 0 check (word_count >= 0),
  source text not null default 'daily_journal',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journal_entries_user_created
  on public.journal_entries(user_id, created_at desc);

create index if not exists idx_journal_entries_user_color
  on public.journal_entries(user_id, rgy_color, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

alter table public.journal_entries enable row level security;

drop policy if exists "journal_entries_select_own" on public.journal_entries;
create policy "journal_entries_select_own"
on public.journal_entries for select
using (auth.uid() = user_id);

drop policy if exists "journal_entries_insert_own" on public.journal_entries;
create policy "journal_entries_insert_own"
on public.journal_entries for insert
with check (auth.uid() = user_id);

drop policy if exists "journal_entries_update_own" on public.journal_entries;
create policy "journal_entries_update_own"
on public.journal_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "journal_entries_delete_own" on public.journal_entries;
create policy "journal_entries_delete_own"
on public.journal_entries for delete
using (auth.uid() = user_id);
