# Test Reports - CubiQo

This directory contains test execution reports and quality metrics.

## 📁 Available Reports

### Post-Merge Test Run - February 20, 2026

1. **TEST_RUN_REPORT_2026_02_20.md** (Main Report)
   - Comprehensive test execution report
   - Detailed failure analysis
   - Coverage analysis (when available)
   - Recommendations and action items
   - **Start here for full context**

2. **TEST_RUN_SUMMARY.txt** (Quick Summary)
   - One-page executive summary
   - Key metrics and critical issues
   - Quick deployment readiness check
   - **Start here for a quick overview**

3. **FAILING_TESTS_CHECKLIST.md** (Developer Checklist)
   - Complete list of failing tests
   - Prioritized by severity
   - Actionable items for each failure
   - Progress tracking checkboxes
   - **Use this to track fixes**

## 🎯 Quick Stats (Feb 20, 2026)

```
Status:         ⚠️  PASSING WITH FAILURES
Pass Rate:      96.1% (2,189 / 2,278 tests)
Duration:       45.10 seconds
Test Files:     84 passed | 17 failed (101 total)
Critical Issues: 2 (database schema blockers)
```

## 🚨 Critical Issues Summary

**BLOCKERS (Must fix before production):**
1. Database Schema - Invalid foreign key references
2. Database Schema - Migration files out of chronological order

**See TEST_RUN_REPORT_2026_02_20.md for full details**

## 🔧 For Developers

### How to Use These Reports

1. **First time?** Read `TEST_RUN_SUMMARY.txt` for context
2. **Need details?** Open `TEST_RUN_REPORT_2026_02_20.md`
3. **Ready to fix?** Use `FAILING_TESTS_CHECKLIST.md` as your guide

### Running Tests Locally

```bash
# Run all tests
npm run test:run

# Run with coverage
npm run test:run -- --coverage

# Run specific file
npm run test:run tests/database-schema.test.ts

# Watch mode (during development)
npm test

# UI mode
npm run test:ui
```

### After Fixing Tests

1. Mark items complete in `FAILING_TESTS_CHECKLIST.md`
2. Re-run tests: `npm run test:run -- --coverage`
3. Verify coverage report is generated
4. Update progress in checklist
5. Report to team when all Priority 1 items are fixed

## 📊 Test Metrics Tracking

| Date | Pass Rate | Failures | Duration | Coverage | Status |
|------|-----------|----------|----------|----------|--------|
| 2026-02-20 | 96.1% | 89 | 45.10s | N/A | ⚠️ Failures |

## 🔗 Related Documentation

- **Testing Guide:** `/docs/TESTING_GUIDE.md` (if exists)
- **Contributing:** `/CONTRIBUTING.md`
- **CI/CD Setup:** `/.github/workflows/` (if exists)

## 📞 Questions?

Contact the QA team or Buttercup (QA Lead) for questions about:
- Test failures
- Test infrastructure
- Coverage requirements
- CI/CD pipeline issues

---

**Last Updated:** February 20, 2026  
**Report Version:** 1.0  
**Test Framework:** Vitest 4.0.18
