# Staging0217 Testing & Bug Reporting Guide

**Branch:** `staging0217`  
**Last Updated:** 2026-02-19  
**Assigned Tester:** @pushpa (UI/UX & 3D Animation Specialist)  
**Report To:** @bubbles (Frontend), @blossom (Backend), @buttercup (QA), @mo (Architect/CTO), @jo (Product Owner)

---

## 📋 Overview

This guide establishes a continuous testing process for the `staging0217` branch as features are merged. The goal is to catch bugs early and ensure quality before merging to main.

## 🎯 What is Staging0217?

According to [BRANCH_MERGE_ANALYSIS.md](./BRANCH_MERGE_ANALYSIS.md):

- **485 unique commits** ahead of `main`
- **13 files changed** (6 added, 7 modified, 0 deleted)
- **Clean fast-forward merge** candidate (low conflict risk)
- Contains critical bug fixes, infrastructure improvements, and test alignments

### Key Features in Staging0217

#### 🔧 Critical Bug Fixes
- ✅ Conflict marker fix in `.env.example`
- ✅ Supabase client singleton fix
- ✅ useSession duplicate useEffect removal
- ✅ React/Three/Recharts version stabilization
- ✅ Error boundary implementation
- ✅ Home page feature flags error handling

#### 🏗️ Infrastructure Improvements
- ✅ Enhanced health check with database validation
- ✅ Session API expansion (guest session support)
- ✅ useSession refactor with API routing
- ✅ Database setup scripts (production-ready)
- ✅ Staging reset script

#### 🧪 Test Updates
- ✅ AI provider tests aligned with refactored abstractions
- ✅ Feature flag test documentation updates
- ✅ Provider tests simplified (class-based → function-based)

---

## 🧪 Testing Checklist

### Pre-Testing Setup

- [ ] Ensure access to staging0217 deployment URL
- [ ] Set up test accounts with different permission levels
- [ ] Prepare test data (dummy journals, profiles, etc.)
- [ ] Review the [BRANCH_MERGE_ANALYSIS.md](./BRANCH_MERGE_ANALYSIS.md) for context

### Testing Categories

#### 1. Visual/UI Testing (Pushpa's Primary Focus)

##### Core Pages
- [ ] Landing page (`/`)
  - [ ] Hero section renders correctly
  - [ ] 3D animations load and perform smoothly
  - [ ] Wave-to-cube transformation works
  - [ ] Responsive design on mobile/tablet/desktop
  - [ ] All CTAs are clickable and properly styled

- [ ] Authentication Flow
  - [ ] Magic link email branding
  - [ ] Login page UI
  - [ ] Signup flow
  - [ ] Password reset flow

- [ ] Dashboard/Home
  - [ ] Feature flags don't crash the page
  - [ ] All panels load correctly
  - [ ] Journal entries display properly
  - [ ] RGY color coding is correct

##### Visual Components
- [ ] 3D elements (Three.js/React Three Fiber)
  - [ ] Cube animations
  - [ ] Performance (FPS, memory usage)
  - [ ] Mobile performance
  
- [ ] Voice Modulation UI
  - [ ] Speaker button functionality
  - [ ] Visual feedback during recording
  - [ ] Waveform visualization

- [ ] Founders Pass UI (`/founders-pass`)
  - [ ] Feature flags panel
  - [ ] Sites management
  - [ ] OAuth integrations display
  - [ ] Action templates builder

#### 2. Functional Testing

##### Core Features
- [ ] **Health Check** (`/api/health`)
  - [ ] Returns 200 OK
  - [ ] Database connection status
  - [ ] Environment variables validation
  - [ ] Required tables check

- [ ] **Session API** (`/api/session`)
  - [ ] Guest session creation
  - [ ] Session retrieval
  - [ ] Error handling (503 on connection failure)

- [ ] **Authentication**
  - [ ] Magic link login works
  - [ ] Session persistence
  - [ ] Logout functionality
  - [ ] Protected routes redirect correctly

- [ ] **Journaling (Rozana)**
  - [ ] Create new journal entry
  - [ ] Edit existing entry
  - [ ] Delete entry
  - [ ] RGY categorization
  - [ ] AI-guided conversation

#### 3. Integration Testing

- [ ] **Database Connectivity**
  - [ ] Supabase connection stable
  - [ ] RLS policies working correctly
  - [ ] Data persistence

- [ ] **API Integrations**
  - [ ] AI provider connections (OpenRouter, Anthropic, OpenAI)
  - [ ] Voice synthesis (ElevenLabs)
  - [ ] OAuth providers (Gmail, Shopify, etc.)

#### 4. Performance Testing

- [ ] Page load times (<3s on 3G)
- [ ] 3D animation frame rate (>30 FPS)
- [ ] Memory usage during extended sessions
- [ ] Bundle size optimization

#### 5. Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

---

## 🐛 Bug Report Template

When a bug is found, create a report using this template:

```markdown
### Bug Report #[NUMBER]

**Reported By:** @pushpa  
**Date:** YYYY-MM-DD  
**Severity:** [Critical/High/Medium/Low]  
**Priority:** [P0/P1/P2/P3]  
**Assignee:** [@bubbles/@blossom/@buttercup]  
**Status:** [Open/In Progress/Resolved/Closed]

#### Environment
- Branch: staging0217
- Commit: [commit hash]
- Browser: [name and version]
- Device: [desktop/mobile/tablet]
- OS: [operating system]

#### Summary
[One-line description of the bug]

#### Steps to Reproduce
1. Go to [URL]
2. Click on [element]
3. Observe [behavior]

#### Expected Behavior
[What should happen]

#### Actual Behavior
[What actually happens]

#### Screenshots/Videos
[Attach visual evidence]

#### Console Errors
```
[Paste any console errors here]
```

#### Impact
[Description of how this affects users]

#### Suggested Fix (if known)
[Optional: Suggest a solution]

#### Related Files
- [List of files that might be involved]

#### Assign To
- **Frontend (@bubbles):** [if UI/React related]
- **Backend (@blossom):** [if API/database related]
- **QA (@buttercup):** [if test coverage needed]
- **Architect (@mo):** [if architectural decision needed]
- **Product (@jo):** [if requirement clarification needed]
```

---

## 📊 Test Execution Log

Track your testing sessions here:

### Test Session #1
**Date:** YYYY-MM-DD  
**Tester:** @pushpa  
**Duration:** [time]  
**Focus Area:** [e.g., "Visual UI Testing"]  

**Results:**
- Tests Passed: X
- Tests Failed: Y
- Bugs Found: Z
- Severity Breakdown: X Critical, Y High, Z Medium, W Low

**Notes:**
[Any observations or comments]

---

### Test Session #2
**Date:** YYYY-MM-DD  
**Tester:** @pushpa  
**Duration:** [time]  
**Focus Area:** [e.g., "3D Animation Performance"]  

**Results:**
- Tests Passed: X
- Tests Failed: Y
- Bugs Found: Z
- Severity Breakdown: X Critical, Y High, Z Medium, W Low

**Notes:**
[Any observations or comments]

---

## 🔄 Continuous Testing Workflow

### Daily Testing Routine
1. **Morning (30 min):** Quick smoke test of critical paths
2. **Afternoon (1-2 hours):** Focused testing on new merges
3. **End of Day (15 min):** Update bug reports and notify team

### When New Code is Merged
1. Review the PR description and changed files
2. Identify areas requiring visual/UI testing
3. Run relevant test cases from the checklist
4. Document findings in bug reports
5. Notify relevant team members immediately for critical bugs

### Weekly Summary
Every Friday, create a summary report:
- Total tests executed
- Pass/fail rate
- Bugs found and resolved
- Risk assessment for merging to main
- Recommendations for next week

---

## 📢 Communication Protocol

### For Critical Bugs (P0)
- **Action:** Immediately notify @mo and relevant developer
- **Channel:** Direct message + GitHub issue
- **Response Time:** Same day fix required

### For High Priority Bugs (P1)
- **Action:** Create GitHub issue and tag relevant developer
- **Channel:** GitHub issue + daily standup mention
- **Response Time:** Within 2 business days

### For Medium/Low Priority Bugs (P2/P3)
- **Action:** Document in weekly summary
- **Channel:** GitHub issue
- **Response Time:** Backlog, addressed in next sprint

### Team Assignment Guidelines
- **@bubbles (Frontend):** UI components, React issues, styling problems, client-side logic
- **@blossom (Backend):** API routes, database queries, server-side logic, authentication
- **@buttercup (QA):** Test automation, test coverage, quality gates, CI/CD issues
- **@mo (Architect/CTO):** Architecture decisions, technical debt, merge approval
- **@jo (Product Owner):** Feature requirements, user stories, priority decisions

---

## 🎯 Acceptance Criteria for Main Merge

Before staging0217 can be merged to main, ensure:

- [ ] All Critical (P0) bugs are resolved
- [ ] All High (P1) bugs are resolved or have approved exceptions
- [ ] Visual regression tests pass in Chromatic
- [ ] Performance benchmarks are met
- [ ] Cross-browser testing complete with no blockers
- [ ] Documentation updated for new features
- [ ] Team sign-off from @mo and @jo

---

## 📚 Reference Documents

- [BRANCH_MERGE_ANALYSIS.md](./BRANCH_MERGE_ANALYSIS.md) - Detailed analysis of staging0217 vs main
- [BRANCHES.md](./BRANCHES.md) - Branch structure and deployment guide
- [README.md](./README.md) - Project overview and setup
- [VERCEL_DEPLOYMENT_MAP.md](./VERCEL_DEPLOYMENT_MAP.md) - Deployment mapping

---

## ✅ Next Steps

1. **@pushpa:** Review this guide and begin daily testing routine
2. **Team:** Acknowledge and confirm communication protocol
3. **@mo:** Set merge timeline based on test results
4. **@jo:** Prioritize any blockers found during testing

---

**Remember:** Quality over speed. It's better to catch bugs in staging0217 than in production.
