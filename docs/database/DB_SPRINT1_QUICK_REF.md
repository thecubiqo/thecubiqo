# Sprint 1 Database Quick Reference Card

## 🚀 Quick Start

### Migration Files
```bash
/supabase/migrations/
├── 20260217000001_browser_sessions_and_actions.sql  # Day 1: Sessions & Actions
└── 20260217000002_browser_consent_records.sql       # Day 2: Consent Records
```

### Apply Migrations
```bash
# Using Supabase CLI
supabase migration up

# Or direct SQL
psql -h [host] -U [user] -d [db] -f supabase/migrations/20260217000001_browser_sessions_and_actions.sql
psql -h [host] -U [user] -d [db] -f supabase/migrations/20260217000002_browser_consent_records.sql
```

---

## 📊 Tables at a Glance

### browser_sessions
**Purpose:** Track browser automation sessions  
**Key Columns:** id, user_id, url, status, consent_given, created_at  
**Status Values:** pending, active, completed, failed, denied

### browser_actions
**Purpose:** Audit log of browser actions  
**Key Columns:** id, session_id, action_type, success, error, created_at  
**Action Types:** navigate, click, type, screenshot, etc.

### browser_consent_records
**Purpose:** Track user consent by domain  
**Key Columns:** id, user_id, domain, approved, remember_choice, created_at

---

## ⚡ Common Queries (for Blossom)

### Create Session
```javascript
const { data } = await supabase
  .from('browser_sessions')
  .insert({
    url: 'https://example.com',
    purpose: 'Data extraction',
    status: 'pending'
  })
  .select()
  .single();
```

### Log Action
```javascript
await supabase
  .from('browser_actions')
  .insert({
    session_id: sessionId,
    action_type: 'navigate',
    target: 'https://example.com',
    success: true
  });
```

### Check Consent
```javascript
const { data } = await supabase
  .rpc('get_user_domain_consent', {
    p_user_id: userId,
    p_domain: 'example.com'
  });
```

### Get Session with Actions (avoid N+1)
```javascript
const { data } = await supabase
  .from('browser_sessions')
  .select('*, browser_actions(*)')
  .eq('id', sessionId)
  .single();
```

---

## 🔍 Performance Indexes

| Table | Index | Used For |
|-------|-------|----------|
| browser_sessions | idx_browser_sessions_user | WHERE user_id = ? |
| browser_sessions | idx_browser_sessions_status | WHERE status = ? |
| browser_actions | idx_browser_actions_session | WHERE session_id = ? |
| browser_actions | idx_browser_actions_success | WHERE success = ? |
| browser_consent_records | idx_consent_user_domain | WHERE user_id = ? AND domain = ? |

---

## 🔒 RLS Policies

**All tables enforce:**
- Users can only SELECT their own records (user_id = auth.uid())
- Users can only INSERT their own records (user_id = auth.uid())

**browser_sessions also allows:**
- Users can UPDATE their own records

---

## 🧪 Testing Checklist (for Buttercup)

- [ ] Users can only see their own sessions
- [ ] Users can only see their own actions
- [ ] Users can only see their own consent records
- [ ] Delete session → cascades to actions and consent
- [ ] Invalid status (e.g., "invalid") → rejected by CHECK constraint
- [ ] Query performance < 10ms for indexed queries
- [ ] Load test: 1000+ sessions per user

---

## 🐛 Debugging Tips

### Check if RLS is working
```sql
-- Switch to different user, try to see other user's data
SELECT * FROM browser_sessions WHERE user_id != auth.uid();
-- Should return 0 rows
```

### Check index usage
```sql
EXPLAIN ANALYZE
SELECT * FROM browser_sessions WHERE user_id = 'some-uuid';
-- Should show "Index Scan using idx_browser_sessions_user"
```

### Find slow queries
```sql
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%browser_%'
ORDER BY mean_exec_time DESC
LIMIT 5;
```

---

## 🔄 Rollback (Emergency Only)

```sql
-- Drop Day 2 first
DROP FUNCTION IF EXISTS get_user_domain_consent(UUID, TEXT) CASCADE;
DROP TABLE IF EXISTS browser_consent_records CASCADE;

-- Then drop Day 1
DROP TABLE IF EXISTS browser_actions CASCADE;
DROP TABLE IF EXISTS browser_sessions CASCADE;
```

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| DB_SPRINT1_IMPLEMENTATION.md | Full implementation details |
| DB_SPRINT1_CHECKLIST.md | Testing & deployment guide |
| DB_SPRINT1_ERD.md | Visual diagrams & flows |

---

## 📞 Get Help

**Database questions?** → Ask **GUY** (Database Administrator)  
**Schema approval?** → Tag **MO** (CTO)  
**Slow queries (>50ms)?** → Report to **GUY**

---

## ✅ Implementation Status

- [x] Day 1: browser_sessions and browser_actions tables
- [x] Day 2: browser_consent_records table
- [x] All indexes created
- [x] All RLS policies enabled
- [x] Helper function implemented
- [x] Documentation complete
- [ ] MO review pending
- [ ] Blossom integration pending
- [ ] Buttercup testing pending

---

**Last Updated:** 2026-02-17  
**DBA:** GUY  
**Status:** ✅ Ready for Review
