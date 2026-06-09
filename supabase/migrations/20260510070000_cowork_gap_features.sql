-- CubiQo Cowork Gap Features
-- Adds: file_uploads, conversation_sessions, session_messages,
--       push_subscriptions, push_notifications, google_oauth_tokens

-- ── File uploads ───────────────────────────────────────────────────────────

create table if not exists file_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  public_url text,
  filename text not null,
  content_type text not null,
  size_bytes integer not null default 0,
  category text not null default 'general',
  created_at timestamptz not null default now()
);

alter table file_uploads enable row level security;

create policy "Users own their file uploads"
  on file_uploads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists file_uploads_user_category_idx
  on file_uploads (user_id, category, created_at desc);

-- ── Cloud conversation sessions ────────────────────────────────────────────

create table if not exists conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Conversation',
  message_count integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table conversation_sessions enable row level security;

create policy "Users own their sessions"
  on conversation_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists conversation_sessions_user_updated_idx
  on conversation_sessions (user_id, updated_at desc);

create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references conversation_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table session_messages enable row level security;

create policy "Users own their session messages"
  on session_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists session_messages_session_idx
  on session_messages (session_id, created_at asc);

-- ── Web Push subscriptions ─────────────────────────────────────────────────

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users own their push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can read all for send
create policy "Service role can read all push subscriptions"
  on push_subscriptions for select
  using (true);

create index if not exists push_subscriptions_user_active_idx
  on push_subscriptions (user_id, active);

-- ── In-app / push notification log ────────────────────────────────────────

create table if not exists push_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  action_url text,
  delivered boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table push_notifications enable row level security;

create policy "Users own their notifications"
  on push_notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role can insert notifications"
  on push_notifications for insert
  with check (true);

create index if not exists push_notifications_user_unread_idx
  on push_notifications (user_id, delivered, created_at desc);

-- ── Google OAuth tokens ────────────────────────────────────────────────────

create table if not exists google_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  google_email text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  scopes text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table google_oauth_tokens enable row level security;

create policy "Users own their Google tokens"
  on google_oauth_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can read for server-side ops
create policy "Service role can read Google tokens"
  on google_oauth_tokens for select
  using (true);
