# Database Schema Requirements

## Status: ~50% Implemented

## Overview

The Emergent Engine uses Supabase (PostgreSQL) as its primary database with pgvector for semantic memory search. Row Level Security (RLS) policies enforce access control.

## Required Tables

### `agents` — Agent Configuration
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  soul_md TEXT,
  workspace_path TEXT,
  tools TEXT[] DEFAULT '{}',
  max_concurrent INT DEFAULT 2,
  status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```
**Status**: ❌ Not found in migrations

### `sessions` — Agent Sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  session_key TEXT NOT NULL,
  channel TEXT DEFAULT 'webchat',
  status TEXT DEFAULT 'idle',
  message_count INT DEFAULT 0,
  token_usage_input BIGINT DEFAULT 0,
  token_usage_output BIGINT DEFAULT 0,
  estimated_cost DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);
```
**Status**: ⚠️ Partially implemented (existing sessions table may differ from spec)

### `messages` — Conversation Messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,           -- 'user', 'assistant', 'system', 'tool'
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  token_count INT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
**Status**: ⚠️ Partially implemented (existing messages table may differ from spec)

### `memories` — Vector Memory Store
```sql
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  content TEXT NOT NULL,
  embedding vector(1536),      -- pgvector extension
  category TEXT DEFAULT 'general',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);
```
**Status**: ⚠️ Partially implemented

### `tasks` — Subagent Task Tracking
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  parent_session_id UUID REFERENCES sessions(id),
  child_session_id UUID REFERENCES sessions(id),
  description TEXT NOT NULL,
  label TEXT,
  status TEXT DEFAULT 'queued', -- queued, running, done, failed, timeout
  result TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  token_usage JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```
**Status**: ❌ Not found in migrations

### `channels` — Channel Configuration
```sql
CREATE TABLE channels (
  id TEXT PRIMARY KEY,           -- 'telegram', 'discord', etc.
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'disconnected',
  agent_bindings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
**Status**: ❌ Not found in migrations

### `cron_jobs` — Scheduled Tasks
```sql
CREATE TABLE cron_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  schedule TEXT NOT NULL,        -- Cron expression
  task TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
**Status**: ❌ Not found in migrations

### `skills` — Reusable Skill Packages
```sql
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT,
  tools TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  agent_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```
**Status**: ❌ Not found in migrations

### `usage_log` — Token Usage Tracking
```sql
CREATE TABLE usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  session_id UUID REFERENCES sessions(id),
  model TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  cost DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);
```
**Status**: ❌ Not found in migrations

## Required Extensions

```sql
CREATE EXTENSION IF NOT EXISTS vector;  -- pgvector for memory embeddings
```

## Required Functions

### Memory Search Function
```sql
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_count INT DEFAULT 10,
  filter_agent_id TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, content TEXT, similarity FLOAT, category TEXT, metadata JSONB)
AS $$
  SELECT id, content, 1 - (embedding <=> query_embedding) as similarity, category, metadata
  FROM memories
  WHERE (filter_agent_id IS NULL OR agent_id = filter_agent_id)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql;
```

## Row Level Security Policies

```sql
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Admin sees all, users see their own
CREATE POLICY "admin_all" ON agents FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "user_own_sessions" ON sessions FOR ALL
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "user_own_messages" ON messages FOR ALL
  USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );
```

## Existing Migrations

21 migration files exist in `supabase/migrations/`, with the latest being `20260218000001_monetization_schema.sql`. New emergent tables should be added as new migration files following the existing naming convention.

## Implementation Priority

1. **High**: `agents` table — Required for agent persistence
2. **High**: `tasks` table — Required for subagent tracking
3. **Medium**: `channels` table — Required for multi-channel messaging
4. **Medium**: `cron_jobs` table — Required for scheduled tasks
5. **Medium**: `usage_log` table — Required for cost tracking
6. **Low**: `skills` table — Enhancement for reusable patterns

## References
- Source: `CUBIQO_SELF_CODING_ENGINE.md` Part 4
- Source: `supabase/migrations/` directory
