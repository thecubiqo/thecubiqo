# CUBIQO Flagship Features - Executive Summary

**Author:** MO (CTO)  
**Date:** 2025-02-15  
**Status:** Strategic Planning Complete - Awaiting Jo's Approval

---

## 📋 Quick Status

**✅ APPROVED FOR DEVELOPMENT:**
- Sprint 1: BYO Mode, Voice State UI, Browser Relay (6 days)
- Sprint 2: Uber/Taxi Automation, Calendar Integration (7 days)

**⚠️ NEEDS DISCUSSION:**
- Sprint 3: Food Ordering (HIGH RISK - brittle browser automation)
- Sprint 3: Match Algorithm (NEEDS CLARITY - what are we matching?)

**❌ DEFER:**
- Sprint 4+: Wallet/Crypto, Smart Home (too early, focus on Sprint 1-3 first)

---

## 🏗️ Architecture Decisions

### 1. Branching Strategy
**DECISION:** Feature Branch → PR → Main → Staging (Preview) → Production (Tags)

- No separate `staging` branch (use Vercel preview deployments)
- Feature flags for gradual rollout
- Main branch always deployable
- MO reviews and merges all PRs

### 2. System Architecture
**DECISION:** Worlds Pattern (Monolithic Next.js with Modular "Worlds")

- Each integration (taxi, calendar, food) is a "World" module
- WorldOrchestrator coordinates all worlds
- Easy to add new worlds without refactoring
- Testable in isolation

**See:** `/docs/adr/001-worlds-architecture.md` for full details

### 3. Browser Automation
**DECISION:** In-Process Puppeteer with Queue System

- No separate service (simpler debugging)
- Queue system (max 5 concurrent sessions)
- User consent required for all actions
- Audit logging of all browser actions

### 4. Feature Flags
**DECISION:** Use existing feature flag system for gradual rollout

- All new features behind flags (disabled by default)
- Gradual rollout: 5% → 25% → 50% → 100%
- Can disable instantly if issues arise

---

## 👥 Team Assignments

### Sprint 1 (This Week - 6 days)

| Team Member | Focus Areas | Days |
|-------------|-------------|------|
| **Blossom** (Backend) | BYO AI router integration, Browser queue/pool, API endpoints, Consent manager | 6 |
| **Bubbles** (Frontend) | Voice state UI, Browser consent dialog, BYO settings improvements | 3 |
| **Guy** (DBA) | Browser session schema, Audit log schema, Consent records schema | 2 |
| **Buttercup** (QA) | E2E tests, Integration tests, Test plan | 6 |
| **Pushpa** (UI/UX) | Voice state animations, Consent dialog design, BYO polish | 2 |
| **MO** (CTO) | Code reviews, Architecture decisions, Unblock team | Daily |

---

## 🎯 Sprint 1 Goals

**BYO Mode:**
- ✅ User can add their own Claude/OpenAI API keys
- ✅ Keys are encrypted at rest (Web Crypto API)
- ✅ AI router uses BYO keys when enabled
- ✅ "Test Connection" button validates keys

**Voice State Machine UI:**
- ✅ Visual feedback for voice states (idle/listening/thinking/speaking)
- ✅ Color-coded states (orange/red/yellow/green)
- ✅ Pulsing animations for active states
- ✅ State label shown to user

**Browser Relay Setup:**
- ✅ Browser automation requires explicit user consent
- ✅ Queue system (max 5 concurrent sessions)
- ✅ Session timeout (5 min max)
- ✅ Audit logging of all browser actions
- ✅ Rate limiting (10 sessions/hour per user)

---

## 🔒 Security Priorities

### Sprint 1 Security Fixes (CRITICAL)

1. **BYO Keys Encryption** - Encrypt API keys in localStorage
2. **Browser Audit Log** - Log all browser actions for compliance
3. **Puppeteer XSS** - Sanitize inputs to browser automation
4. **Rate Limiting** - Prevent browser automation abuse
5. **CSRF Protection** - Protect consent endpoints

### Sprint 2 Security Fixes (HIGH)

6. **OAuth Token Encryption** - Encrypt refresh tokens in database

### Ongoing (MEDIUM)

7. **TypeScript Errors** - Fix and remove `ignoreBuildErrors: true`
8. **ESLint Errors** - Fix and remove `ignoreDuringBuilds: true`

---

## ⚠️ Technical Risks & Concerns

### 🔴 CRITICAL: Food Ordering Browser Automation (Sprint 3)

**Problem:** DoorDash/UberEats have no public APIs. Must use browser automation.

**Risk:** DOM changes break automation weekly. High maintenance burden.

**MO's Recommendation:**
1. **Option A (Preferred):** Defer to P2 or find API partner (Uber Eats Partner API)
2. **Option B:** Proceed but budget 20% ongoing maintenance time
3. **Option C:** Abandon food ordering, focus on taxi/calendar

**Decision Needed from Jo:** Is food ordering truly P1? Are we willing to accept maintenance burden?

---

### ⚠️ HIGH: Match Algorithm Unclear (Sprint 3)

**Problem:** "Match Algorithm" is vague. What are we matching?

**Possible Interpretations:**
- Founder matching (entrepreneurs + co-founders)
- Skill matching (users + experts)
- Problem matching (problems + solutions)
- Feature matching (users + relevant features)

**MO's Recommendation:**
Write an Architecture Decision Record (ADR) defining the Match Algorithm before Sprint 3.

**Decision Needed from Jo:** What is the Match Algorithm? What are the success criteria?

---

## 📊 Testing Strategy

### Test Pyramid
- **70% Unit Tests** - Logic in `lib/`, `utils/`, `hooks/`
- **80% Integration Tests** - API routes, database operations
- **Critical E2E Tests** - Key user flows (voice → automation → result)

### Sprint 1 Test Coverage
- BYO mode: Unit + Integration + E2E
- Voice states: Unit + Integration + E2E
- Browser automation: Unit + Integration + E2E
- Existing features: Integration tests (catch regressions)

### QA Ownership
- **Buttercup:** Owns E2E tests, test plans
- **Blossom/Bubbles:** Write unit/integration tests for their code
- **MO:** Reviews test coverage in PRs

---

## 📈 Definition of Done

### Code Merged When:
- [ ] All tests passing (unit + integration + E2E)
- [ ] Code reviewed and approved by MO
- [ ] No TypeScript errors, no `any` types
- [ ] Security reviewed (no vulnerabilities)
- [ ] Documentation updated
- [ ] Feature flag created (disabled by default)
- [ ] QA signed off on preview deployment
- [ ] Accessible (WCAG AA)
- [ ] Mobile responsive
- [ ] Performance acceptable (< 3s load time)

---

## 🚀 Sprint Timeline

### Sprint 1: BYO Mode, Voice State UI, Browser Relay
- **Start:** Monday, Week 1
- **End:** Friday, Week 1
- **Review:** Friday, 4:00 PM
- **Status:** Ready to start (awaiting Jo's approval)

### Sprint 2: Uber/Taxi, Calendar
- **Start:** Monday, Week 2
- **End:** Friday, Week 3 (1.5 weeks)
- **Status:** Planned

### Sprint 3: Food Ordering, Match Algorithm
- **Start:** TBD (pending decisions on food ordering and match algorithm)
- **Status:** Needs clarification from Jo

### Sprint 4+: Wallet/Crypto, Smart Home
- **Status:** Deferred (reassess after Sprint 3)

---

## 📚 Documentation Created

1. **TECHNICAL_ARCHITECTURE_REVIEW.md** (30+ pages)
   - Complete technical assessment
   - Architecture decisions
   - Security review
   - Team assignments
   - Risk mitigation

2. **SPRINT_1_IMPLEMENTATION_PLAN.md** (15+ pages)
   - Detailed Sprint 1 breakdown
   - Day-by-day assignments
   - Code examples
   - API specifications
   - Daily standup format

3. **/docs/adr/001-worlds-architecture.md** (ADR)
   - Worlds Architecture Pattern
   - Interface definitions
   - Example implementations
   - Alternatives considered

---

## 🎯 Next Actions

### MO's Immediate Tasks
1. ✅ Complete technical architecture review
2. [ ] Review with Jo - align on priorities
3. [ ] Get approval on Sprint 1-2 (defer 3+)
4. [ ] Clarify Match Algorithm (ADR required)
5. [ ] Decide on Food Ordering (defer or proceed with risk?)
6. [ ] Create Sprint 1 GitHub Project board
7. [ ] Set up PR templates with review checklist
8. [ ] Kick off Sprint 1 development

### Jo's Decision Points
1. **Food Ordering:** Defer to P2 or proceed with maintenance risk?
2. **Match Algorithm:** What are we matching? What's the success metric?
3. **Sprint 3+ Timing:** When should we start Sprint 3? (After Sprint 2 completion)
4. **Sprint 4+ Priority:** Still interested in Wallet/Crypto and Smart Home? Or pivot based on user feedback?

---

## 💬 MO's Final Thoughts

**Technical Feasibility:** ✅ HIGH for Sprint 1-2. Sprint 3 is MEDIUM (food ordering risk).

**Team Capacity:** ✅ ADEQUATE. Team is well-specialized and can deliver Sprint 1 in 1 week.

**Architecture:** ✅ SOLID. Worlds pattern will scale well. Feature flags enable safe rollout.

**Security:** ⚠️ NEEDS ATTENTION. Sprint 1 fixes critical issues (BYO encryption, audit logging).

**Risk:** 🔴 Food ordering is HIGH RISK. Recommend defer or API partnership.

**Recommendation:** **GO on Sprint 1 and Sprint 2. PAUSE before Sprint 3 to reassess.**

---

## 📞 Contact

**Questions about technical decisions?** → MO (CTO)  
**Questions about product priorities?** → Jo (Product Owner)  
**Questions about timelines?** → MO + Jo alignment

---

**MO's Signature:**  
*"Good architecture is about the future, not just today."*

**Status:** ✅ Strategic Planning Complete  
**Awaiting:** Jo's approval to proceed with Sprint 1
