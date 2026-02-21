# Failing Tests Checklist

**Date:** February 20, 2026  
**Total Failures:** 89 tests across 17 files  
**Status:** Use this checklist to track fixes

---

## 🔴 Priority 1: BLOCKERS (Fix First)

### Database Schema Issues
- [ ] **tests/database-schema.test.ts**
  - [ ] Migration files should be in chronological order
  - **Action:** Renumber migration files sequentially

- [ ] **src/__tests__/api-database-validation.test.ts**
  - [ ] Should have valid foreign key references
  - [ ] Admin Stats API - should return stats object with required fields
  - [ ] Admin Stats API - should return system health metrics
  - **Action:** Review and fix schema, ensure all foreign keys are valid

---

## 🟡 Priority 2: Medium (Fix Next)

### Admin API Tests (32 failures)
- [ ] **tests/api/admin-integrations-reports.test.ts**
  - Integration Health API:
    - [ ] GET /api/admin/integrations/health - should return 401 if not authenticated
    - [ ] GET /api/admin/integrations/health - should return integration health list for admin
    - [ ] GET /api/admin/integrations/health - should filter by status
    - [ ] GET /api/admin/integrations/health - should paginate results
    - [ ] POST /api/admin/integrations/health - should update integration health
    - [ ] POST /api/admin/integrations/health - should validate required fields
    - [ ] POST /api/admin/integrations/health - should validate status values
  - Integration List API:
    - [ ] GET /api/admin/integrations/list - should return all configured integrations
    - [ ] GET /api/admin/integrations/list - should include health data by default
    - [ ] GET /api/admin/integrations/list - should filter by type
    - [ ] GET /api/admin/integrations/list - should search integrations
  - Report Generation API:
    - [ ] POST /api/admin/reports/generate - should generate user activity report
    - [ ] (Plus ~20 more admin-related tests)
  - **Action:** Verify APIs are implemented; update tests or implement missing features

### Emergent System Tests (35 failures)
- [ ] **src/lib/emergent/__tests__/orchestrator.test.ts** (12 failures)
  - executeTool tests:
    - [ ] should deduct credits after execution
    - [ ] should log audit event after execution
    - [ ] should include execution time in metadata
    - [ ] should route to correct subagent based on tool
    - [ ] (Plus 8 more orchestrator tests)
  - **Action:** Fix test mocks or implementation

- [ ] **src/lib/emergent/__tests__/playbook-executor.test.ts** (2 failures)
  - [ ] should inject secrets into execution context
  - [ ] should pass params to execution context
  - **Error:** EmergentError: Playbook not found
  - **Action:** Add test fixtures/playbooks

- [ ] **src/lib/emergent/__tests__/rbac.test.ts** (2 failures)
  - getUserProjects tests:
    - [ ] should return list of project IDs user has access to
    - [ ] should filter by minimum role
  - **Error:** TypeError: supabase.from(...).select(...).in is not a function
  - **Action:** Fix Supabase mock or use real test database

- [ ] **Additional Emergent tests** (~19 more failures)
  - **Action:** Review all emergent tests; determine if feature is production-ready

---

## 🟢 Priority 3: Low (Fix When Time Allows)

### API Dependency Tests (Outdated Expectations)
- [ ] **tests/api-chat-dependency.test.ts**
  - [ ] Chat API: Memory Integration - should import SYSTEM_PROMPT and buildMessages
  - **Note:** SYSTEM_PROMPT no longer exists (replaced by buildAdaptiveSystemPrompt)
  - **Action:** Update test expectations

- [ ] **tests/api-journal.test.ts**
  - [ ] Journal Entries API: Error Handling - should catch and log errors
  - **Action:** Update error handling expectations

- [ ] **tests/api-memory.test.ts**
  - [ ] Memory API: Error Handling - should catch and log errors
  - **Action:** Update error handling expectations

### UI Component Tests
- [ ] **tests/autopilot.test.ts**
  - [ ] ChatContainer Integration - should import AutopilotStatus component
  - [ ] ChatContainer Integration - should render AutopilotStatus in chat
  - **Action:** Verify component exists; update import paths

### Social Army Integration
- [ ] **src/__tests__/social-army.test.ts** (5 failures)
  - GFXToolz tests:
    - [ ] constructs with an API key
    - [ ] login() sets authenticated flag
    - [ ] login() without key runs in dry-run mode
    - [ ] processVideo() returns a download URL string
    - [ ] createProject() returns an object with id
  - **Action:** Update mocks or implementation

### E2E Test Setup
- [ ] **tests/e2e/landing.spec.ts**
  - [ ] Error: Failed to resolve import "@playwright/test"
  - **Action:** Install Playwright (`npm install -D @playwright/test`) OR remove E2E tests

### Self-Heal Integration
- [ ] **tests/self-heal-integration.test.js**
  - [ ] Error: No test suite found in file
  - **Action:** Fix file structure OR remove if obsolete

---

## 📝 Notes for Developers

### Common Error Patterns

1. **Supabase `.in()` method not working**
   - Affects: RBAC tests
   - Fix: Update mock or use real test database

2. **SYSTEM_PROMPT removed**
   - Affects: Chat API dependency tests
   - Fix: Update to use `buildAdaptiveSystemPrompt()`

3. **EmergentError: Playbook not found**
   - Affects: Playbook executor tests
   - Fix: Add test fixtures/seed data

4. **Import errors**
   - Affects: E2E tests
   - Fix: Install dependencies or remove tests

### Test Execution Commands

```bash
# Run all tests
npm run test:run

# Run specific test file
npm run test:run tests/database-schema.test.ts

# Run tests with coverage
npm run test:run -- --coverage

# Run tests in watch mode (during development)
npm test

# Run tests with UI
npm run test:ui
```

### After Fixing Tests

1. Run tests again: `npm run test:run -- --coverage`
2. Verify coverage report is generated
3. Check coverage meets >80% on critical paths
4. Update this checklist (mark completed items)
5. Report results to team

---

## Progress Tracking

- **Priority 1 (Blockers):** 0 / 3 fixed ❌
- **Priority 2 (Medium):** 0 / 67 fixed ❌
- **Priority 3 (Low):** 0 / 19 fixed ❌

**Total Progress:** 0 / 89 tests fixed (0%)

---

**Report by:** Buttercup - QA & Test Automation Engineer  
**Last Updated:** February 20, 2026  
**Next Review:** After Priority 1 fixes completed
