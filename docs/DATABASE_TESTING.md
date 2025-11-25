# Database Testing Guide

**Date:** 2025-11-24
**Status:** ✅ Migration Applied

---

## Quick Status Check

Run this in **Supabase SQL Editor** to verify everything is set up:

```sql
-- Check all tables exist
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected output:** 6 tables (conversations, events, memory, messages, profiles, sessions)

---

## Detailed Verification

### 1. Check Tables & Columns

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### 2. Check RLS Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected:** Multiple policies for each table (SELECT, INSERT, UPDATE, DELETE)

### 3. Check Triggers

```sql
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Expected triggers:**
- `trg_auto_generate_handle` on profiles
- `trg_profiles_updated_at` on profiles
- `trg_set_guest_session_expiry` on sessions
- `trg_increment_message_count` on messages
- `trg_set_guest_memory_expiry` on memory
- `trg_conversations_updated_at` on conversations

### 4. Check Functions

```sql
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected functions:**
- `auto_generate_handle()`
- `cleanup_expired_data()`
- `generate_unique_handle()`
- `increment_message_count()`
- `set_guest_memory_expiry()`
- `set_guest_session_expiry()`
- `update_updated_at()`

---

## Functional Testing

### Test 1: Create Guest Session

```sql
-- Insert a guest session
INSERT INTO sessions (is_guest, geo_location, device_info)
VALUES (
  true,
  'US',
  '{"userAgent": "Test Browser", "platform": "Test"}'::jsonb
)
RETURNING *;
```

**Verify:**
- ✅ `id` auto-generated
- ✅ `expires_at` set to NOW() + 30 days
- ✅ `created_at` populated

### Test 2: Create Profile with Auto-Handle

```sql
-- First, create auth user (simulate)
-- In real app, Supabase Auth creates this

-- Insert profile (handle should auto-generate)
INSERT INTO profiles (id, email)
VALUES (
  gen_random_uuid(),
  'test@example.com'
)
RETURNING handle;
```

**Verify:**
- ✅ `handle` format matches `CQ#[0-9]{1,5}`
- ✅ `handle` is unique

### Test 3: Create Conversation

```sql
-- Using session_id from Test 1
INSERT INTO conversations (session_id, title, color_state)
VALUES (
  '<session_id_from_test_1>',
  'Test Conversation',
  'green'
)
RETURNING *;
```

**Verify:**
- ✅ `id` auto-generated
- ✅ `ai_model` defaults to 'claude'
- ✅ `message_count` defaults to 0

### Test 4: Add Message (Test Trigger)

```sql
-- Using conversation_id from Test 3
INSERT INTO messages (conversation_id, role, content, color)
VALUES (
  '<conversation_id_from_test_3>',
  'user',
  'Hello, CubiQo!',
  'green'
)
RETURNING *;

-- Check if message_count incremented
SELECT message_count FROM conversations
WHERE id = '<conversation_id_from_test_3>';
```

**Verify:**
- ✅ Message created
- ✅ `message_count` in conversations incremented to 1

### Test 5: Memory with Auto-Expiry

```sql
-- Using session_id from guest session (Test 1)
INSERT INTO memory (session_id, key, value, zone)
VALUES (
  '<session_id_from_test_1>',
  'name',
  'Alex',
  'green'
)
RETURNING expires_at;
```

**Verify:**
- ✅ `expires_at` set to NOW() + 30 days (for guest)

### Test 6: Event Tracking

```sql
INSERT INTO events (session_id, type, properties)
VALUES (
  '<session_id_from_test_1>',
  'app_opened',
  '{"source": "test", "timestamp": "2025-11-24T10:00:00Z"}'::jsonb
)
RETURNING *;
```

**Verify:**
- ✅ Event created
- ✅ `created_at` populated

---

## RLS Testing

### Test 7: RLS Isolation

```sql
-- This should only work if you're authenticated as the user
-- In SQL Editor, RLS might be bypassed (service_role)

-- To properly test RLS, use the Supabase client from app:
```

```typescript
// In your Next.js app
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// This should only return current user's sessions
const { data, error } = await supabase
  .from('sessions')
  .select('*')

console.log('Sessions:', data)
```

---

## Cleanup Test Data

```sql
-- Delete test data (reverse order due to foreign keys)
DELETE FROM events WHERE type = 'app_opened';
DELETE FROM memory WHERE key = 'name';
DELETE FROM messages WHERE content = 'Hello, CubiQo!';
DELETE FROM conversations WHERE title = 'Test Conversation';
DELETE FROM sessions WHERE geo_location = 'US' AND is_guest = true;
DELETE FROM profiles WHERE email = 'test@example.com';
```

---

## Performance Testing

### Test 8: Query Performance

```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT m.*
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
JOIN sessions s ON c.session_id = s.id
WHERE s.user_id = '<some_user_id>'
ORDER BY m.created_at DESC
LIMIT 50;
```

**Verify:**
- Uses indexes on `messages.conversation_id`
- Uses indexes on `conversations.session_id`
- Uses indexes on `sessions.user_id`

---

## Expected Table Counts (After Tests)

```sql
SELECT
  'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'memory', COUNT(*) FROM memory
UNION ALL
SELECT 'events', COUNT(*) FROM events;
```

**Fresh database:** All should be 0
**After tests:** Should show test data

---

## TypeScript Type Safety Test

Create a test file in your app:

```typescript
// src/test/db-types.test.ts
import type { Profile, Session, Conversation, Message } from '@/types'
import { createClient } from '@/lib/supabase/client'

async function testTypes() {
  const supabase = createClient()

  // TypeScript should enforce correct types
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')

  // This should have correct type inference
  if (profiles) {
    const firstProfile = profiles[0]
    console.log(firstProfile.handle) // Type: string | null
    console.log(firstProfile.email)  // Type: string | null
  }

  // Insert should validate types
  const { data: session } = await supabase
    .from('sessions')
    .insert({
      is_guest: true,
      geo_location: 'US',
      // TypeScript will error if you add invalid fields
    })
    .select()
    .single()

  return session
}
```

---

## Common Issues & Solutions

### Issue 1: RLS Blocking Queries

**Symptom:** Queries return empty even though data exists

**Solution:** Check if user is authenticated:
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
```

### Issue 2: Foreign Key Violations

**Symptom:** `violates foreign key constraint`

**Solution:** Ensure parent records exist before creating children:
```typescript
// Create session first
const { data: session } = await supabase
  .from('sessions')
  .insert({ is_guest: true })
  .select()
  .single()

// Then create conversation
const { data: conversation } = await supabase
  .from('conversations')
  .insert({ session_id: session.id })
  .select()
  .single()
```

### Issue 3: Handle Not Generated

**Symptom:** `handle` is NULL

**Solution:** Trigger should auto-generate. If not, check:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_auto_generate_handle';
```

---

## Automated Test Script

```bash
#!/bin/bash
# test-database.sh

echo "Testing CubiQo Database..."

# Test 1: Check tables
echo "✓ Checking tables..."
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Test 2: Check RLS
echo "✓ Checking RLS policies..."
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';"

# Test 3: Check triggers
echo "✓ Checking triggers..."
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';"

echo "✅ Database verification complete!"
```

---

## Next Steps

After verifying database:

1. ✅ Test auth flow (magic link)
2. ✅ Test guest session creation
3. ✅ Test conversation flow
4. ✅ Test memory extraction
5. ✅ Test event tracking

---

**Last Updated:** 2025-11-24
**Migration File:** `supabase/migrations/20251124000001_initial_schema.sql`
