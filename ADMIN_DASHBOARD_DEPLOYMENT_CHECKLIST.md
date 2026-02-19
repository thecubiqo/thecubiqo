# Admin Dashboard Deployment Checklist (PR #115)

**Status:** 🟡 In Progress
**Target Date:** TBD
**Owner:** MO (CTO)

---

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] Deployment impact analysis completed (`DEPLOYMENT_IMPACT_ANALYSIS.md`)
- [x] Middleware created for admin auth (`src/middleware.ts`)
- [x] Security query library created (`src/lib/queries/security.ts`)
- [x] Analytics metrics library created (`src/lib/analytics/metrics.ts`)
- [x] ESLint rule added for audit logging enforcement
- [ ] Refactor 6 routes to use `logAdminAction()` utility
- [ ] Update admin routes to use middleware headers instead of duplicate DB calls
- [ ] Run linter: `npm run lint`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Run tests: `npm run test:run`

### 🗄️ Database Migration
- [ ] **CRITICAL:** Verify these tables exist in staging DB:
  - [ ] `security_alerts`
  - [ ] `user_activity_log`
  - [ ] `integration_configs`
  - [ ] `fraud_reports`
  - [ ] `admin_reports`
  - [ ] `audit_logs` (should already exist)
- [ ] Verify RPC function `log_admin_action` exists
- [ ] Test database migration in staging environment
- [ ] Backup production database before deployment

### 🔒 Security Review
- [ ] Review all 13 new admin routes for SQL injection vulnerabilities
- [ ] Verify admin auth middleware works correctly
- [ ] Test unauthorized access attempts return 403
- [ ] Verify audit logging is working for all admin actions
- [ ] Check that sensitive data is not exposed in API responses
- [ ] Review CORS configuration for admin endpoints

### 🧪 Testing
- [ ] Unit tests pass for new query libraries
- [ ] Integration tests for admin auth middleware
- [ ] Manual testing of all 13 admin routes
- [ ] Test admin dashboard UI (if applicable)
- [ ] Verify analytics endpoints return correct data
- [ ] Test security alerts queries
- [ ] Test audit log retrieval

---

## Staging Deployment

### 📦 Deploy to Staging
- [ ] Merge PR #115 to `staging0217` branch
- [ ] Trigger staging deployment
- [ ] Wait for Vercel deployment to complete
- [ ] Verify deployment URL is accessible

### ✅ Staging Verification
- [ ] Health check endpoint returns 200: `/api/health`
- [ ] Admin routes return 401 for unauthenticated users
- [ ] Admin routes return 403 for non-admin users
- [ ] Admin routes return 200 for admin users
- [ ] Test all 13 admin API endpoints manually:
  - [ ] `/api/admin/analytics/*`
  - [ ] `/api/admin/security/*`
  - [ ] `/api/admin/users/*`
  - [ ] `/api/admin/integrations/*`
  - [ ] `/api/admin/fraud/*`
  - [ ] `/api/admin/reports/*`
- [ ] Verify analytics data is accurate
- [ ] Verify security alerts are displayed correctly
- [ ] Check Vercel logs for any errors
- [ ] Monitor performance metrics (response times < 500ms)

### 🕐 Soak Time
- [ ] **Wait 24 hours** after staging deployment
- [ ] Monitor error rates in staging
- [ ] Check for memory leaks or performance degradation
- [ ] Verify no unexpected database load

---

## Production Deployment

### 📦 Deploy to Production
- [ ] Merge `staging0217` to `main` branch
- [ ] Trigger production deployment
- [ ] Wait for Vercel deployment to complete
- [ ] Verify production deployment URL

### ✅ Production Verification
- [ ] Health check endpoint returns 200: `/api/health`
- [ ] Admin auth middleware is working
- [ ] Sample admin API call succeeds
- [ ] Check Vercel logs for errors
- [ ] Monitor performance metrics
- [ ] Verify audit logging is working

### 📊 Post-Deployment Monitoring
- [ ] Monitor error rates for first 2 hours
- [ ] Check database query performance
- [ ] Verify no spike in API response times
- [ ] Review audit logs for unexpected activity
- [ ] Check Vercel analytics dashboard

---

## Rollback Plan

If critical issues are detected:

1. **Immediate Rollback:**
   ```bash
   # Revert middleware commit
   git revert <middleware-commit-sha>
   git push origin main
   ```

2. **Database Rollback:**
   - If new tables cause issues, mark feature as disabled via feature flag
   - Do NOT drop tables (data loss risk)

3. **Communication:**
   - Notify team in #engineering channel
   - Update status page if user-facing issues
   - Document incident in postmortem

---

## Post-Deployment Tasks

### 📋 Documentation
- [ ] Update `ARCHITECTURE.md` with middleware pattern
- [ ] Document admin dashboard API in `API_DOCUMENTATION.md`
- [ ] Update feature flag inconsistency notes
- [ ] Create JIRA ticket for future feature flag consolidation

### 📈 Metrics & Monitoring
- [ ] Set up Vercel alerts for admin route errors
- [ ] Add admin dashboard usage metrics
- [ ] Monitor admin auth success/failure rates
- [ ] Track database query performance

### 🎓 Team Knowledge Transfer
- [ ] Share deployment impact analysis with team
- [ ] Document lessons learned
- [ ] Update onboarding docs with admin patterns

---

## Sign-Off

- [ ] **MO (CTO):** Code review approved
- [ ] **Buttercup (QA):** All tests passing
- [ ] **Guy (DBA):** Database migration verified
- [ ] **Blossom (Backend):** API endpoints tested
- [ ] **JO (Product):** Feature meets requirements

---

**Final Approval:** ⏳ Pending completion of checklist

*Last updated: 2026-02-19*
