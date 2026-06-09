-- RGY classifier contract: safety -> taxonomy -> LLM, with matching gated
-- behind explicit user-confirmed intents.

create extension if not exists pgcrypto;

alter table public.signals
  add column if not exists signal_id uuid,
  add column if not exists matching_enabled boolean not null default false,
  add column if not exists confidence double precision,
  add column if not exists shown_in_panel boolean not null default true,
  add column if not exists editable_by_user boolean not null default true,
  add column if not exists corrected_at timestamptz,
  add column if not exists raw_input text;

update public.signals
set signal_id = id
where signal_id is null;

alter table public.signals
  alter column signal_id set default gen_random_uuid(),
  alter column signal_id set not null;

create unique index if not exists idx_signals_signal_id
  on public.signals(signal_id);

create index if not exists idx_signals_user_shown_created
  on public.signals(user_id, shown_in_panel, created_at desc);

alter table public.signals
  drop constraint if exists signals_matching_gate;

alter table public.signals
  add constraint signals_matching_gate
  check (matching_enabled = (cardinality(confirmed_intents) > 0));

create or replace function public.enforce_signal_matching_gate()
returns trigger
language plpgsql
as $$
begin
  if cardinality(coalesce(new.confirmed_intents, '{}'::text[])) > 0 then
    new.matching_enabled = true;
    new.intent_status = 'confirmed';
  else
    new.matching_enabled = false;
    if new.intent_status = 'confirmed' then
      new.intent_status = case
        when cardinality(coalesce(new.suggested_intents, '{}'::text[])) > 0 then 'suggested'
        else 'pending'
      end;
    end if;
  end if;

  if new.source = 'user_correction' and new.corrected_at is null then
    new.corrected_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_signal_matching_gate on public.signals;
create trigger enforce_signal_matching_gate
before insert or update on public.signals
for each row execute function public.enforce_signal_matching_gate();

drop policy if exists "signals_insert_own" on public.signals;
drop policy if exists "signals_server_insert_only" on public.signals;

-- No authenticated browser/client inserts. Server routes use the service role
-- after validating the signed-in user, and service role bypasses RLS.
create policy "signals_server_insert_only"
on public.signals for insert
with check (false);
