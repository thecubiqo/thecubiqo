# Staging0217 Deployment Checklist

## Pre-Deployment Preparation

### 1. Code Review
- [x] Review all changed files
- [x] Verify no breaking changes
- [x] Check TypeScript compilation
- [x] Review security implications
- [x] Validate API endpoint patterns

### 2. Documentation Review
- [x] WHERE_ARE_THE_CHANGES.md created
- [x] STAGING0217_IMPACT_ANALYSIS.md created
- [x] VISUAL_COMPARISON_BEFORE_AFTER.md created
- [ ] Team review and approval

### 3. Environment Preparation
- [ ] Backup staging database
- [ ] Set up monitoring alerts
- [ ] Prepare rollback plan
- [ ] Notify team of deployment window

---

## Deployment Steps

### Phase 1: Database Migration (15 minutes)

#### Step 1.1: Backup Database
```bash
# Create backup before migration
supabase db dump -f staging0217_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh *.sql
```
**Expected:** Backup file created successfully  
**Verification:** ✅ File exists and has reasonable size

#### Step 1.2: Test Migration (Dry Run)
```bash
# Test migration without applying
supabase db push --dry-run

# Expected output:
# - Shows SQL statements to be executed
# - No error messages
# - All CREATE TABLE IF NOT EXISTS statements
```
**Expected:** Clean dry-run with no errors  
**Verification:** ✅ No syntax errors, safe SQL statements

#### Step 1.3: Apply Migration
```bash
# Apply the migration
supabase db push

# Monitor output for errors
# Expected: "Migration applied successfully"
```
**Expected:** Migration succeeds  
**Verification:** ✅ All 10 tables created

#### Step 1.4: Verify Migration
```sql
-- Check new tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'security_alerts',
    'user_activity_log', 
    'transactions',
    'ai_model_performance',
    'integration_health',
    'fraud_detection_rules',
    'system_health_metrics',
    'compliance_reports',
    'incident_response_log',
    'platform_settings'
  )
ORDER BY tablename;

-- Expected: 10 rows returned
```
**Expected:** All 10 tables present  
**Verification:** ✅ COUNT(*) = 10

#### Step 1.5: Verify RLS Policies
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%alert%' 
  OR tablename LIKE '%transaction%'
  OR tablename LIKE '%fraud%';

-- Expected: rowsecurity = true for all
```
**Expected:** RLS enabled on all new tables  
**Verification:** ✅ All rows show rowsecurity = t

#### Step 1.6: Verify Seed Data
```sql
-- Check fraud detection rules
SELECT COUNT(*) FROM fraud_detection_rules;
-- Expected: 5 rules

-- Check platform settings
SELECT COUNT(*) FROM platform_settings;
-- Expected: 8 settings
```
**Expected:** Seed data inserted  
**Verification:** ✅ 5 fraud rules, 8 platform settings

**Phase 1 Completion Criteria:**
- ✅ Database backup created
- ✅ Migration applied without errors
- ✅ All 10 tables created
- ✅ RLS policies enabled
- ✅ Seed data inserted
- ✅ No existing tables affected

---

### Phase 2: Application Deployment (10 minutes)

#### Step 2.1: Deploy Application Code
```bash
# Push code to staging branch (if using Git-based deployment)
git push origin copilot/build-admin-level-dashboard

# Or trigger deployment via Vercel/deployment platform
vercel deploy --prod --scope=staging0217
```
**Expected:** Deployment succeeds  
**Verification:** ✅ Build completes, no errors

#### Step 2.2: Wait for Deployment
```bash
# Wait for deployment to complete
# Monitor deployment logs
# Check for any build errors
```
**Expected:** Clean build, no TypeScript errors  
**Verification:** ✅ Deployment status: SUCCESS

#### Step 2.3: Verify Deployment URL
```bash
# Check the deployment URL is accessible
curl -I https://staging0217.cubiqo.ai/admin

# Expected: HTTP 200 or 302 (redirect to login)
```
**Expected:** Site is accessible  
**Verification:** ✅ HTTP status 2xx or 3xx

**Phase 2 Completion Criteria:**
- ✅ Code deployed successfully
- ✅ Build completed without errors
- ✅ Site is accessible
- ✅ No deployment errors in logs

---

### Phase 3: Validation Testing (20 minutes)

#### Test 3.1: Existing Admin Page
```bash
# Test the main admin page loads
URL: https://staging0217.cubiqo.ai/admin

Manual Check:
1. Navigate to /admin
2. Verify page loads
3. Check stats display (agents, sessions, messages)
4. Verify system health shows
5. Check agent table renders
6. Verify recent activity displays
7. Check events table shows data
8. Confirm auto-refresh works (3 second interval)
```
**Expected:** Admin dashboard works exactly as before  
**Verification:** ✅ All elements render correctly

#### Test 3.2: Existing Admin API
```bash
# Test existing stats endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://staging0217.cubiqo.ai/api/admin/stats

# Expected: JSON with stats, agents, recentActivity, systemHealth
```
**Expected:** API returns data successfully  
**Verification:** ✅ Valid JSON response with all fields

#### Test 3.3: Existing Feature Pages
```bash
# Test each existing admin page
Pages to test:
1. /admin/feature-flags     → Loads correctly
2. /admin/email-preview     → Loads correctly
3. /admin/journey           → Loads correctly
4. /admin/experiments       → Loads correctly
5. /admin/gate              → Loads correctly
6. /admin/self-heal         → Loads correctly
```
**Expected:** All existing pages work  
**Verification:** ✅ All 6 pages load without errors

#### Test 3.4: New API - Unauthenticated
```bash
# Test new endpoints require authentication
curl https://staging0217.cubiqo.ai/api/admin/users

# Expected: 401 Unauthorized or 403 Forbidden
```
**Expected:** Auth required  
**Verification:** ✅ Returns 401 or 403

#### Test 3.5: New API - Non-Admin User
```bash
# Test new endpoints require admin role
# Login as regular user (non-admin)
# Try to access:
curl -H "Authorization: Bearer $USER_TOKEN" \
  https://staging0217.cubiqo.ai/api/admin/users

# Expected: 403 Forbidden
```
**Expected:** Admin role required  
**Verification:** ✅ Returns 403

#### Test 3.6: New API - Admin User
```bash
# Test new endpoints work for admin
# Login as admin user (aditya@cubiqo.ai)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://staging0217.cubiqo.ai/api/admin/users

# Expected: 200 OK with user list
```
**Expected:** API returns data  
**Verification:** ✅ Returns 200 with JSON array

#### Test 3.7: New API Endpoints (Admin User)
```bash
# Test each new endpoint
1. GET /api/admin/users
   Expected: List of users
   
2. GET /api/admin/security/alerts
   Expected: Empty array or alert list
   
3. GET /api/admin/analytics/overview
   Expected: Analytics data
   
4. GET /api/admin/fraud/transactions
   Expected: Empty array or transaction list
   
5. GET /api/admin/integrations/health
   Expected: Integration health data
   
6. GET /api/admin/reports/list
   Expected: Empty array or report list
```
**Expected:** All endpoints return valid responses  
**Verification:** ✅ All return 200 with valid JSON

#### Test 3.8: Database Queries
```sql
-- Test data can be written to new tables
INSERT INTO user_activity_log (
  user_id,
  activity_type,
  activity_data
) VALUES (
  (SELECT id FROM profiles LIMIT 1),
  'test_activity',
  '{"test": true}'::jsonb
);

-- Expected: 1 row inserted

-- Test admin can read
SELECT * FROM user_activity_log WHERE activity_type = 'test_activity';

-- Expected: 1 row returned

-- Cleanup
DELETE FROM user_activity_log WHERE activity_type = 'test_activity';
```
**Expected:** Database writes and reads work  
**Verification:** ✅ Insert and select succeed

**Phase 3 Completion Criteria:**
- ✅ Existing admin page works
- ✅ Existing APIs return data
- ✅ All existing pages load
- ✅ New APIs require authentication
- ✅ New APIs require admin role
- ✅ New APIs return valid data for admins
- ✅ Database queries work correctly

---

### Phase 4: Performance Testing (15 minutes)

#### Test 4.1: Page Load Time
```bash
# Measure admin page load time
time curl -s https://staging0217.cubiqo.ai/admin > /dev/null

# Or use browser DevTools:
# 1. Open /admin
# 2. Open DevTools → Network tab
# 3. Reload page (Cmd+R)
# 4. Check "Load" time in bottom right
```
**Baseline:** < 1 second  
**Threshold:** < 2 seconds  
**Verification:** ✅ Load time acceptable

#### Test 4.2: API Response Time
```bash
# Measure API response times
for i in {1..10}; do
  time curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    -s https://staging0217.cubiqo.ai/api/admin/users > /dev/null
done

# Calculate average
```
**Baseline:** ~150ms  
**Threshold:** < 500ms  
**Verification:** ✅ Response time acceptable

#### Test 4.3: Database Query Performance
```sql
-- Test query performance
EXPLAIN ANALYZE 
SELECT * FROM security_alerts 
WHERE status = 'open' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check execution time
```
**Baseline:** < 50ms  
**Threshold:** < 200ms  
**Verification:** ✅ Query time acceptable

#### Test 4.4: Concurrent Request Load
```bash
# Test multiple concurrent requests
seq 1 20 | xargs -P 10 -I {} curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  -s https://staging0217.cubiqo.ai/api/admin/stats > /dev/null

# Monitor response times
# Check for errors
```
**Expected:** All requests succeed  
**Threshold:** < 5% error rate  
**Verification:** ✅ All requests complete successfully

**Phase 4 Completion Criteria:**
- ✅ Page load time within threshold
- ✅ API response times acceptable
- ✅ Database queries performant
- ✅ System handles concurrent load
- ✅ No performance degradation detected

---

### Phase 5: Security Testing (10 minutes)

#### Test 5.1: RLS Policy Enforcement
```sql
-- Switch to regular user context
SET ROLE regular_user;

-- Try to query admin tables (should fail)
SELECT * FROM security_alerts;
-- Expected: No rows or permission denied

SELECT * FROM transactions;
-- Expected: No rows or permission denied

-- Switch back to admin
RESET ROLE;
```
**Expected:** Non-admins cannot access admin tables  
**Verification:** ✅ RLS policies enforced

#### Test 5.2: Audit Logging
```bash
# Perform admin action via API
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  https://staging0217.cubiqo.ai/api/admin/users

# Check audit log
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://staging0217.cubiqo.ai/api/admin/audit | jq '.[] | select(.action_type == "user_created")'
```
**Expected:** Actions are logged  
**Verification:** ✅ Audit entry created

#### Test 5.3: Authentication Flow
```bash
# Test auth flow
1. Access /admin without login → Redirects to login
2. Login as regular user → 403 Forbidden
3. Login as admin → Access granted
```
**Expected:** Proper auth flow maintained  
**Verification:** ✅ Auth works correctly

**Phase 5 Completion Criteria:**
- ✅ RLS policies prevent unauthorized access
- ✅ Admin actions are logged
- ✅ Authentication flow works correctly
- ✅ No security vulnerabilities detected

---

## Post-Deployment Monitoring

### Immediate (First Hour)

#### Monitor Error Rates
```bash
# Check error logs
# Look for:
# - 500 errors
# - Database connection errors
# - TypeScript runtime errors
# - Unhandled promise rejections
```
**Threshold:** < 0.5% error rate  
**Action:** Investigate if > 0.5%

#### Monitor Performance
```bash
# Check metrics:
# - Response times
# - Database query times
# - Memory usage
# - CPU usage
```
**Threshold:** < 10% degradation from baseline  
**Action:** Investigate if degradation > 10%

#### Monitor User Activity
```bash
# Check:
# - Active admin users
# - API request volume
# - New endpoint usage
# - Error patterns
```
**Expected:** Normal activity patterns  
**Action:** Investigate anomalies

### Short-term (24 Hours)

- [ ] Review error logs every 4 hours
- [ ] Check performance metrics every 6 hours
- [ ] Monitor database size growth
- [ ] Verify no memory leaks
- [ ] Check for slow queries
- [ ] Review user feedback

### Medium-term (48 Hours)

- [ ] Comprehensive performance review
- [ ] Database optimization review
- [ ] Security audit review
- [ ] User experience feedback
- [ ] Decide on production rollout

---

## Rollback Procedure

### Trigger Rollback If:
- Error rate > 2%
- Performance degradation > 20%
- Critical functionality broken
- Security issue discovered
- Database corruption detected

### Rollback Steps

#### Option 1: Quick Rollback (Code Only)
```bash
# Revert to previous deployment
git revert <commit-hash>
git push origin staging

# Or via deployment platform
vercel rollback
```
**Time:** ~5 minutes  
**Impact:** Reverts code, keeps database changes

#### Option 2: Full Rollback (Code + Database)
```bash
# 1. Revert code
git revert <commit-hash>
git push origin staging

# 2. Restore database
psql $DATABASE_URL < staging0217_backup_YYYYMMDD_HHMMSS.sql

# 3. Or drop new tables
supabase db execute "
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS incident_response_log CASCADE;
DROP TABLE IF EXISTS compliance_reports CASCADE;
DROP TABLE IF EXISTS system_health_metrics CASCADE;
DROP TABLE IF EXISTS fraud_detection_rules CASCADE;
DROP TABLE IF EXISTS integration_health CASCADE;
DROP TABLE IF EXISTS ai_model_performance CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS security_alerts CASCADE;
"
```
**Time:** ~15 minutes  
**Impact:** Complete revert to pre-deployment state

---

## Success Criteria

### Deployment is Successful If:
- ✅ All existing features work correctly
- ✅ New APIs are accessible to admins
- ✅ Database migration completed without errors
- ✅ No performance degradation
- ✅ No security issues
- ✅ Error rate < 0.5%
- ✅ User experience unchanged
- ✅ Monitoring shows healthy metrics

### Proceed to Production If:
- ✅ Staging stable for 48 hours
- ✅ All tests passing
- ✅ Performance acceptable
- ✅ Team approval received
- ✅ No critical issues found

---

## Communication Plan

### Pre-Deployment
```
To: Engineering Team
Subject: Admin Dashboard Deployment - staging0217

Deployment scheduled: [DATE] at [TIME]
Expected duration: 45 minutes
Expected impact: None (backward compatible)
Rollback plan: Available

Please monitor for any issues.
```

### During Deployment
```
Status Updates:
T+0:   Deployment started
T+15:  Database migration complete
T+25:  Application deployed
T+45:  Validation testing complete
T+60:  Monitoring established

Channel: #engineering-deployments
```

### Post-Deployment
```
To: Engineering Team
Subject: Admin Dashboard Deployment - Complete

✅ Deployment successful
✅ All tests passing
✅ Monitoring active

New capabilities:
- 13 new admin API endpoints
- 10 new database tables
- Enhanced admin infrastructure

Next: Monitor for 48 hours before production rollout
```

---

## Final Checklist

- [ ] All pre-deployment tasks complete
- [ ] Database backup created
- [ ] Migration applied successfully
- [ ] Application deployed
- [ ] All validation tests passing
- [ ] Performance metrics acceptable
- [ ] Security tests passing
- [ ] Monitoring established
- [ ] Team notified
- [ ] Documentation updated
- [ ] Rollback plan ready

---

**Deployment Owner:** [Name]
**Deployment Date:** [Date]
**Approved By:** [Name]
**Status:** Ready for Deployment ✅
