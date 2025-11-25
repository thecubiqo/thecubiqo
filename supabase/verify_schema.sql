-- ============================================================================
-- CubiQo Database Verification Script
-- Run this in Supabase SQL Editor to verify schema
-- ============================================================================

-- 1. Check all tables exist
SELECT '=== TABLES ===' as check_type;
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected: 6 tables (conversations, events, memory, messages, profiles, sessions)

-- 2. Check RLS is enabled
SELECT '=== RLS STATUS ===' as check_type;
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All should have rls_enabled = true

-- 3. Check RLS Policies count
SELECT '=== RLS POLICIES ===' as check_type;
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected: Multiple policies per table

-- 4. Check Triggers
SELECT '=== TRIGGERS ===' as check_type;
SELECT
  event_object_table as table_name,
  trigger_name,
  action_timing || ' ' || event_manipulation as timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected: 7 triggers total

-- 5. Check Functions
SELECT '=== FUNCTIONS ===' as check_type;
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected: 7 functions

-- 6. Check Constraints
SELECT '=== CHECK CONSTRAINTS ===' as check_type;
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- Expected: Constraints for handle format, color states, roles, etc.

-- 7. Check Foreign Keys
SELECT '=== FOREIGN KEYS ===' as check_type;
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected: FK relationships between all tables

-- 8. Test: Generate Unique Handle
SELECT '=== TEST: Generate Handle ===' as check_type;
SELECT generate_unique_handle() as generated_handle;

-- Expected: Format CQ#12345 (random number)

-- 9. Quick Data Count
SELECT '=== DATA COUNT ===' as check_type;
SELECT 'profiles' as table_name, COUNT(*) FROM profiles
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

-- Expected: All 0 (fresh database) or actual counts

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '=== VERIFICATION SUMMARY ===' as summary;

SELECT
  'Tables' as component,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as count,
  6 as expected,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.tables
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE') = 6
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status

UNION ALL

SELECT
  'RLS Policies',
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
  18, -- 3 per table * 6 tables = 18
  CASE
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 18
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END

UNION ALL

SELECT
  'Triggers',
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public'),
  7,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') = 7
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END

UNION ALL

SELECT
  'Functions',
  (SELECT COUNT(*) FROM information_schema.routines
   WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'),
  7,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.routines
          WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') = 7
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END;

-- ============================================================================
-- If all checks show ✅ PASS, schema is correctly deployed!
-- ============================================================================
