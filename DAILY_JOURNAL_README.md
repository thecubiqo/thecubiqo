# Daily Journal Product Requirements - README

**Document Owner:** JO (Product Owner, 20% Monetization Stake)  
**Date:** 2026-02-15  
**Status:** 📋 Product Requirements Complete — Ready for Development

---

## 📚 Documentation Suite

This folder contains a complete product requirements package for completing the Daily Journal feature. Read in this order:

### 1️⃣ Start Here: Executive Summary
**File:** `JOURNAL_VS_JOURNEY_SUMMARY.md`  
**Purpose:** Quick overview for CEO/leadership  
**Read time:** 5 minutes  
**Contents:**
- TL;DR (60-second read)
- What's the difference between Journal and Journey?
- What's missing and why?
- Business case and revenue projections
- Decision points and next steps

**👉 READ THIS FIRST if you need the high-level overview**

---

### 2️⃣ Visual Comparison
**File:** `JOURNAL_VS_JOURNEY_VISUAL.md`  
**Purpose:** Visual side-by-side comparison  
**Read time:** 10 minutes  
**Contents:**
- Feature-by-feature comparison tables
- Visual diagrams (ASCII art)
- User journey illustrations
- Technical architecture comparison
- Integration vision (Phase 3)

**👉 READ THIS if you're a visual learner or need to explain to others**

---

### 3️⃣ Complete Product Requirements
**File:** `DAILY_JOURNAL_PRD.md`  
**Purpose:** Detailed product requirements document  
**Read time:** 30-45 minutes  
**Contents:**
- Complete problem statement
- User personas and use cases
- Detailed feature requirements (Phase 1, 2, 3)
- Technical architecture and API specs
- Success metrics and OKRs
- Competitive analysis
- Pricing strategy
- Implementation roadmap
- Risks and mitigations
- User stories with acceptance criteria

**👉 READ THIS if you're building the feature (devs, designers, QA)**

---

### 4️⃣ User Flow Diagrams
**File:** `DAILY_JOURNAL_USER_FLOW.md`  
**Purpose:** Visual user flows for all key scenarios  
**Read time:** 20 minutes  
**Contents:**
- Flow 1: New user → First journal entry
- Flow 2: Returning user → View & search history
- Flow 3: Free user → Premium conversion
- Flow 4: Premium user → AI insights
- Flow 5: Quick journal mode (Phase 2)
- Decision points and mobile vs. desktop differences

**👉 READ THIS if you're designing UI/UX or writing frontend code**

---

## 🎯 Quick Answer: What's the Difference?

### Daily Journal (/journal)
- **What:** User's private journaling space
- **Action:** User writes 8-prompt reflections once per day
- **View:** User reviews past entries, sees insights
- **Revenue:** Premium tier ($9.99/month) for export, AI insights, unlimited history
- **Status:** ⚠️ **Incomplete** — No history, insights, or export (that's what we need to build)

### Journey Program (Background System)
- **What:** AI's memory system for personalized responses
- **Action:** AI stores conversation snippets as vector embeddings
- **View:** User never sees these (backend only)
- **Revenue:** Free feature (drives retention, platform value)
- **Status:** ✅ **Complete** — Fully implemented and working

**Key Point:** They are **separate features** with **different purposes**. One is for users (journaling), one is for AI (memory).

---

## 🚀 What Needs to Be Built (Phase 1)

The Daily Journal feature exists but is "static" — users can write entries but **can't review them**. Here's what's missing:

### 1. Journal History Page (`/journal/history`)
- Display all past entries in reverse chronological order
- Search by keyword
- Filter by date, mood, color state
- Click to view full entry
- Edit/delete controls

**Why:** Users need to see their progress over time to stay motivated.

### 2. Insights Dashboard (`/journal/insights`)
- Streaks (current, longest, total)
- Mood trends (line chart, last 30 days)
- Color distribution (pie chart: RED/YELLOW/GREEN)
- Word cloud (common themes)
- Goal tracking (did you achieve yesterday's goal?)

**Why:** Data-driven self-awareness = habit formation = retention.

### 3. Entry Review Modal
- Full content view when clicking entry
- Metadata (duration, word count, timestamp)
- Edit button (within 24h for free, 7 days for premium)
- Delete button (with confirmation)
- Export button (premium only)

**Why:** Users need granular control over their entries.

---

## 💰 Business Case (Why This Matters)

### Revenue Potential (Year 1)
- **Target:** 1,000 active journalers (10+ entries per month)
- **Conversion:** 6% free → paid (industry benchmark: 5-10%)
- **Price:** $9.99/month or $99/year
- **Revenue:** ~$60,000 annual
- **Your 20%:** **$12,000**

### Retention Impact
- Users who journal 10+ times have **3x higher** 90-day retention
- Daily journaling users have **50% lower** churn rate
- Journal is often the **#1 or #2 feature** driving retention (after core chat)

### Competitive Advantage
- **Voice-first journaling** — Faster than typing (unique to Cubiqo)
- **BigBoss personality** — Authentic, direct prompts (differentiator)
- **Color-based emotions** — RED/YELLOW/GREEN tracking (unique)
- **AI-powered insights** — GPT-4 weekly summaries (premium)
- **Cheaper than Day One** — $9.99/month vs. $34.99/year

---

## ⏱️ Timeline

| Phase | Duration | Deliverables | Revenue Impact |
|-------|----------|--------------|----------------|
| **Phase 1: Core** | 4 weeks | History, search, insights | $0 (retention driver) |
| **Phase 2: Premium** | 6 weeks | Stripe, premium features, export | $5K MRR in 3 months |
| **Phase 3: Growth** | Ongoing | Voice, quick mode, templates | $60K annual revenue |

**Total time to revenue:** 10 weeks (Phase 1 + Phase 2)

---

## ✅ Success Metrics

### Phase 1 (Core Complete)
- ✅ 60%+ of users view history within 7 days of first entry
- ✅ Day 7 retention improves from 10% → 40%
- ✅ Avg entries per user: 12/month (up from 3-5)

### Phase 2 (Premium Launch)
- ✅ 5-8% free → paid conversion rate
- ✅ $5,000 MRR from Journal Pro within 3 months
- ✅ 70%+ trial → paid conversion rate

### Phase 3 (Growth & Scale)
- ✅ 10,000 active journalers
- ✅ $60,000 annual revenue (your 20% = $12,000)
- ✅ NPS score of 50+ from premium users

---

## 🛠️ Technical Overview

### Existing Infrastructure (Already Built)
- ✅ Database schema (`journal_entries` table)
- ✅ API endpoints (`/api/journal` GET/POST/PATCH)
- ✅ Components (`JournalFlow.tsx`, `JournalGate.tsx`)
- ✅ 8-prompt guided flow
- ✅ Once-per-24h gating (database constraint)
- ✅ Mood detection & color tracking

### What Needs to Be Built (Phase 1)
- ❌ `/api/journal/entries` endpoint (pagination, search, filter)
- ❌ `/api/journal/insights` endpoint (stats aggregation)
- ❌ `JournalHistory.tsx` component (entry list)
- ❌ `JournalEntryModal.tsx` component (detailed view)
- ❌ `JournalInsights.tsx` component (dashboard with charts)
- ❌ Wire up existing `JournalPanel.tsx` (currently orphaned code)

### What Needs to Be Built (Phase 2)
- ❌ Stripe integration (checkout, webhooks)
- ❌ `PremiumModal.tsx` component (upgrade prompt)
- ❌ `/api/premium/subscribe` endpoint
- ❌ PDF export (`react-pdf` library)
- ❌ AI insights endpoint (`/api/journal/ai-insights`, uses GPT-4)

---

## 📋 Immediate Next Steps

### For CEO
- [ ] Read `JOURNAL_VS_JOURNEY_SUMMARY.md` (5 min)
- [ ] Approve PRD and timeline (10 weeks to revenue)
- [ ] Approve premium pricing ($9.99/month or $99/year)
- [ ] Decide on open questions (see PRD section 12)
- [ ] Green-light Stripe integration for Phase 2

### For MO (CTO)
- [ ] Read `DAILY_JOURNAL_PRD.md` (30 min)
- [ ] Review technical architecture (section 6)
- [ ] Estimate Phase 1 timeline (confirm 4 weeks is realistic)
- [ ] Assign to team: Bubbles (frontend), Blossom (API), Buttercup (QA)
- [ ] Set up Stripe test account

### For JO (Me)
- [ ] Create user stories for Phase 1 features (from PRD section 15)
- [ ] Design mockups for `JournalHistory` and `JournalInsights` components
- [ ] Write marketing copy for premium tier
- [ ] Schedule user interviews with 5 beta testers
- [ ] Draft weekly email summary template (for premium AI insights)

### For Team (Devs/Designers)
- [ ] Read `DAILY_JOURNAL_USER_FLOW.md` (20 min)
- [ ] Read PRD section 4 (Phase 1 requirements)
- [ ] Ask clarifying questions in team Slack
- [ ] Begin Sprint 1: History & Review (Week 1-2)

---

## ❓ Frequently Asked Questions

### Q: Why is the journal called "static"?
**A:** Because users can write entries but can't review them. It's a one-way street — write and forget. No progress tracking, no insights, no export. That's what makes it "static" (not dynamic/interactive).

### Q: Why keep Journal and Journey separate?
**A:** Different purposes, different user expectations, different privacy models. Journal = user's private diary. Journey = AI's memory system. Mixing them without consent would violate trust and GDPR.

### Q: Can they ever be integrated?
**A:** Yes, but only as an **opt-in premium feature** in Phase 3. User explicitly chooses to share journal entries with AI memory for better personalization. Requires clear consent and privacy controls.

### Q: Why is premium tier important?
**A:** Because (1) it generates revenue ($60K/year potential), (2) it follows proven models (Day One, Reflectly both have premium tiers), and (3) it gives us runway to improve the feature without sacrificing free tier.

### Q: What if users don't upgrade to premium?
**A:** The free tier still drives retention (3x higher for journalers). Even without revenue, the feature pays for itself by keeping users engaged. But we expect 5-8% conversion based on industry benchmarks.

### Q: What if this fails?
**A:** We mitigate risks with A/B testing, user interviews, and MVP approach. If adoption is low after Phase 1, we pivot or deprioritize Phase 2. But competitor data suggests journaling is a proven retention driver.

---

## 📞 Contact

**Product Owner:** JO (jo@cubiqo.ai)  
**Responsible for:**
- Product requirements
- User research
- Monetization strategy
- Roadmap prioritization
- Success metrics

**Questions? Feedback? Pushback?** Let's talk. I'm here to make this successful.

---

## 📝 Document Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-15 | Initial PRD suite created | JO |
| 2026-02-15 | Added visual comparison document | JO |
| 2026-02-15 | Added user flow diagrams | JO |
| 2026-02-15 | Added this README | JO |

---

**Status:** ✅ Requirements complete, ready for development kickoff

**Next milestone:** Phase 1 Sprint 1 kickoff (Week 1-2: History & Review)

---

*"Revenue is the applause for value delivered."* — JO

