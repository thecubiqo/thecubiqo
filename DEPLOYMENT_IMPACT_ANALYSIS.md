# Deployment Impact Analysis: `copilot/build-admin-level-dashboard` (PR #115)

**Date:** 2026-02-19  
**Analyzed by:** Deployment Monitor  
**Branch:** `copilot/build-admin-level-dashboard` → targeting `staging0217`

---

## 1. Deployment Status

### Branch Alignment
| Branch | SHA | Status |
|--------|-----|--------|
| `main` | `8e798cb` | ⚠️ CI Failing (pre-existing test failures) |
| `staging0217` | `8e798cb` | ⚠️ CI Failing (same SHA as main) |
| `copilot/build-admin-level-dashboard` | `49b9641` | 🟡 CI awaiting approval |

### Pre-existing CI Failures on main/staging (NOT caused by admin dashboard)
- **8 test failures** in `EnergyCubeScene.test.tsx`, `PlasmaWaveField.test.tsx`, `critical-selectors.test.ts`
- Root causes: ResizeObserver polyfill missing, CSS spacing regex mismatch
- These failures exist before and independently of the admin dashboard changes

### Admin Dashboard PR #115 CI
- CodeQL: ✅ Passed
- CI: 🟡 Awaiting approval (no test failures specific to this PR)

---

## 2. Merge Impact Summary

### Files Changed
- **13 new API routes** added under `src/app/api/admin/`
- **1 modified file**: `src/lib/audit.ts` (5 new AuditActionType values added)
- **Multiple documentation files** added

### New API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/analytics/overview` | GET | Comprehensive analytics dashboard |
| `/api/admin/analytics/user-engagement` | GET | User engagement metrics |
| `/api/admin/fraud/rules` | GET/POST/PATCH | Fraud detection rule management |
| `/api/admin/fraud/transactions` | GET/POST | Transaction monitoring |
| `/api/admin/integrations/health` | GET/POST | Integration health monitoring |
| `/api/admin/integrations/list` | GET | List configured integrations |
| `/api/admin/reports/generate` | POST | Compliance report generation |
| `/api/admin/reports/list` | GET | View generated reports |
| `/api/admin/security/alerts` | GET/POST | Security alert management |
| `/api/admin/security/failed-logins` | GET/POST | Failed login tracking |
| `/api/admin/users` | GET | User listing |
| `/api/admin/users/[id]` | GET/PATCH/DELETE | Individual user management |
| `/api/admin/users/[id]/sessions` | GET/DELETE | User session management |

### New Database Tables Referenced
These tables must exist in the database before merge:
- `security_alerts`
- `fraud_detection_rules`
- `transactions`
- `integration_health`
- `compliance_reports`
- `user_activity_log`

### Existing Tables Accessed (additional queries)
- `profiles` (admin auth + user data)
- `sessions` (analytics + session mgmt)
- `audit_logs` (reports + user detail)
- `events` (report generation)

---

## 3. 🔴 DUPLICATE DB API CALLS FOUND

### Duplicate #1: `security_alerts` table — 3 routes query the same table

| Route | Operation | Filter |
|-------|-----------|--------|
| `admin/security/alerts` | SELECT *, INSERT | All alert types |
| `admin/security/failed-logins` | SELECT *, INSERT | `alert_type = 'failed_login'` |
| `admin/users/[id]` | SELECT * | `user_id = :id` |

**Issue:** `failed-logins` is essentially a filtered subset of `security/alerts`. Both routes query `security_alerts` and both can create new alerts via RPC.

**Options:**
- **Option A:** Keep both routes (current) — separate concerns, slightly redundant
- **Option B:** Remove `failed-logins` route and add a `?type=failed_login` filter to `security/alerts`
- **Option C:** Make `failed-logins` delegate to `security/alerts` internally to avoid duplicate query logic

---

### Duplicate #2: `profiles` admin check — 13 identical auth queries

Every new route independently runs:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single();
```

**Issue:** 13 routes × same query = 13 redundant DB calls per request cycle. The existing `admin/audit` route does the same thing.

**Options:**
- **Option A:** Keep as-is (current) — each route is self-contained, works independently
- **Option B:** Extract admin auth check to shared middleware (`src/lib/admin-auth.ts`) — reduces code duplication and ensures consistent auth pattern
- **Option C:** Use Next.js middleware to gate all `/api/admin/*` routes with a single auth check

---

### Duplicate #3: `sessions` table — 4 routes with overlapping queries

| Route | Query Purpose |
|-------|--------------|
| `admin/analytics/overview` | Count total/active/expired sessions |
| `admin/analytics/user-engagement` | List user sessions for engagement metrics |
| `admin/users/[id]` | Get specific user's sessions |
| `admin/users/[id]/sessions` | Full session management for a user |

**Issue:** `analytics/overview` and `analytics/user-engagement` both query sessions for analytics. The user-specific routes are different use cases but add to DB load.

**Options:**
- **Option A:** Keep separate (current) — each endpoint serves a different UI view
- **Option B:** Consolidate `analytics/overview` and `analytics/user-engagement` into a single analytics endpoint with query params
- **Option C:** Add caching layer for analytics queries (Redis/in-memory cache with TTL)

---

### Duplicate #4: `user_activity_log` table — 3 routes with overlapping queries

| Route | Query Purpose |
|-------|--------------|
| `admin/analytics/overview` | Active user counts (7d, 30d), activity type breakdown |
| `admin/analytics/user-engagement` | Activity types, channel breakdown, top users |
| `admin/users/[id]` | Individual user's activity log |

**Issue:** `analytics/overview` and `analytics/user-engagement` both query activity data for overlapping metrics.

**Options:**
- **Option A:** Keep separate (current) — different granularity needed
- **Option B:** Merge into single `/api/admin/analytics` endpoint with `?view=overview` and `?view=engagement` params
- **Option C:** Create a shared analytics service (`src/lib/admin/analytics-service.ts`) that caches computed metrics

---

### Duplicate #5: `integration_health` table — 2 routes query the same data

| Route | Query Purpose |
|-------|--------------|
| `admin/integrations/health` | CRUD for health records |
| `admin/integrations/list` | Lists integrations with merged health data |

**Issue:** Both fetch from `integration_health`. The `list` route re-fetches health data that `health` already provides.

**Options:**
- **Option A:** Keep separate (current) — `health` is write-focused, `list` is read-focused
- **Option B:** Have `list` endpoint call `health` internally or share a service
- **Option C:** Merge into single `/api/admin/integrations` with sub-resource pattern

---

### Duplicate #6: `audit_logs` — Inconsistent logging pattern

| Route | Method |
|-------|--------|
| Existing `admin/audit` | Uses shared `logAdminAction()` from `src/lib/audit.ts` |
| New routes (some) | Call `supabase.rpc('log_admin_action', {...})` directly inline |
| New routes (others) | Use `logAdminAction()` utility |

**Issue:** Inconsistent — some routes use the shared utility, others bypass it with direct RPC calls.

**Options:**
- **Option A:** Keep as-is (both approaches work)
- **Option B:** Standardize all routes to use `logAdminAction()` from `src/lib/audit.ts`
- **Option C:** Add a middleware that auto-logs all admin API requests

---

### Duplicate #7: `feature_flags` table — 4 EXISTING routes all query the same table

| Route | Operation | Auth Pattern |
|-------|-----------|-------------|
| `admin/feature-flags` | SELECT, UPDATE | Email-based check |
| `admin/features` | SELECT, UPDATE | Email-based check |
| `admin/toggle` | UPDATE, SELECT | Header secret |
| `admin/journey/feature-flag` | UPDATE, SELECT | `getCurrentUser()` |

**Issue:** Pre-existing problem. 4 different routes manage feature flags with 4 different auth patterns. The admin dashboard doesn't add more, but this is a risk.

**Options:**
- **Option A:** Leave as-is (no action needed for this merge)
- **Option B:** Consolidate into a single `/api/admin/feature-flags` endpoint (future cleanup)
- **Option C:** Deprecate `toggle` and `journey/feature-flag` routes after dashboard merge

---

## 4. Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| New tables don't exist in DB | 🔴 HIGH | Run migrations BEFORE deploying code |
| Duplicate queries increase DB load | 🟡 MEDIUM | Choose consolidation options above |
| Inconsistent auth patterns | 🟡 MEDIUM | Standardize with shared middleware |
| Breaking existing functionality | 🟢 LOW | No existing routes modified (except audit.ts types) |
| Rollback difficulty | 🟢 LOW | Can simply revert the merge |

---

## 5. Recommended Actions Before Merge

1. **Database migrations** — Ensure all 6 new tables exist in staging DB
2. **Choose duplicate resolution strategy** — See options above for each duplicate
3. **Pre-existing CI failures** — Fix ResizeObserver and CSS spacing test issues on main (unrelated to this PR)
4. **Auth pattern decision** — Decide whether to use shared middleware or per-route auth

---

## 6. Deployment Checklist

- [ ] New database tables created in staging
- [ ] Database RPC functions exist (`log_admin_action`, `create_security_alert`)
- [ ] Duplicate DB call strategy decided (see Section 3)
- [ ] CI approval granted for PR #115
- [ ] Merge to staging0217
- [ ] Post-merge validation (5 min smoke test)
- [ ] Monitor error rates for 48 hours
- [ ] If stable, merge staging0217 → main
