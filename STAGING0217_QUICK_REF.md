# Staging0217 Testing - Quick Reference

**🎯 Purpose:** Continuous testing of staging0217 branch before merging to main

---

## 📋 Quick Links

- **Testing Guide:** [STAGING0217_TESTING_GUIDE.md](./STAGING0217_TESTING_GUIDE.md)
- **Bug Reports:** [STAGING0217_BUG_REPORTS.md](./STAGING0217_BUG_REPORTS.md)
- **Branch Analysis:** [BRANCH_MERGE_ANALYSIS.md](./BRANCH_MERGE_ANALYSIS.md)

---

## 👥 Team Roles

| Role | Name | Responsibilities |
|------|------|------------------|
| **UI/UX Testing** | @pushpa | Visual testing, 3D animations, responsive design |
| **Frontend Fixes** | @bubbles | React components, client-side logic, styling |
| **Backend Fixes** | @blossom | API routes, database, server logic |
| **QA & Testing** | @buttercup | Test automation, CI/CD, quality gates |
| **Architecture** | @mo | Technical decisions, merge approval |
| **Product** | @jo | Requirements, priorities, user stories |

---

## 🐛 How to Report a Bug

1. **Document it** in [STAGING0217_BUG_REPORTS.md](./STAGING0217_BUG_REPORTS.md)
2. **Assign severity:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
3. **Tag the right person:**
   - UI/React issues → @bubbles
   - API/Database → @blossom
   - Tests → @buttercup
   - Architecture → @mo
   - Requirements → @jo
4. **Notify immediately** if P0/P1

---

## 🔍 What's in Staging0217?

### Critical Bug Fixes ✅
- Conflict marker in `.env.example` removed
- Supabase client singleton fixed
- React/Three.js version stabilization
- Error boundary added
- useSession duplicate useEffect removed

### New Features 🚀
- Enhanced health check with database validation
- Session API for guest sessions
- Database setup scripts
- Test alignment with refactored code

### Files Changed 📝
- **6 added:** Documentation + database scripts
- **7 modified:** API routes, hooks, tests
- **0 deleted:** No breaking removals

---

## ✅ Merge Readiness

Before staging0217 → main:

- [ ] All P0 bugs resolved
- [ ] All P1 bugs resolved or approved
- [ ] Visual tests pass
- [ ] Cross-browser tested
- [ ] Performance validated
- [ ] Team sign-off (@mo, @jo)

---

## 📊 Bug Priority Guide

| Priority | Response Time | Description |
|----------|---------------|-------------|
| **P0 - Critical** | Same day | Breaks core functionality |
| **P1 - High** | 2 days | Major feature impacted |
| **P2 - Medium** | 1 week | Minor feature issue |
| **P3 - Low** | Backlog | Nice to have fix |

---

## 🎯 Daily Testing Routine

1. **Morning (30 min):** Smoke test critical paths
2. **Afternoon (1-2 hrs):** Test new merges
3. **EOD (15 min):** Update bug reports

---

## 📞 Escalation

- **Critical bugs:** DM @mo + GitHub issue
- **High priority:** GitHub issue + tag developer
- **Medium/Low:** Document in weekly summary

---

## 🚀 Quick Commands

```bash
# Check staging0217 status
git status
git log --oneline -10

# See what's different from main
git diff main...staging0217 --stat

# Run tests
npm test

# Start dev server
npm run dev
```

---

## 📅 Weekly Summary

Every **Friday**, create summary with:
- Tests executed & pass rate
- Bugs found & resolved
- Risk assessment
- Recommendations

---

*Keep this page bookmarked for quick access during testing!*
