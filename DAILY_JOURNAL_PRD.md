# Daily Journal - Product Requirements Document (PRD)

**Document Owner:** JO (Product Owner, 20% Monetization Stake)  
**Date:** 2026-02-15  
**Status:** 🟡 **NEEDS COMPLETION** - Feature exists but is incomplete  
**Priority:** **HIGH** - Core engagement feature with monetization potential

---

## Executive Summary

The Daily Journal feature exists at `/journal` with a guided 8-prompt flow, but it's been identified as **"static"** and **"incomplete"**. This PRD defines what's missing, clarifies the distinction from the Journey Program, and provides a complete product roadmap to ship a world-class journaling experience that drives user retention and revenue.

**Key Problem:** Users complete the 8-prompt flow once per day, but there's no way to **review past entries**, **track progress over time**, or **extract insights** from their journaling history. The feature is a one-way street — write and forget.

**Business Impact:**
- **Retention Risk:** Without review/insights, users lose motivation after 7-14 days
- **Monetization Gap:** No premium features to upsell (export, analytics, AI insights)
- **Differentiation Missed:** Competitors (Day One, Reflectly, Stoic) all have rich review/insights UIs

---

## 1. Product Context

### 1.1 What Exists Today (✅ Implemented)

#### **Daily Journal (/journal)**
- **8-prompt guided flow** - BigBoss confessional style (15-20 min)
- **Once-per-24h gating** - Database-enforced unique constraint
- **Mood detection** - Auto-tags entries (positive, challenged, reflective, neutral)
- **Color state tracking** - RED/YELLOW/GREEN/ORANGE categorization
- **Email queueing** - Sends summary after completion (TODO: actual sending)
- **Admin analytics** - Engagement metrics dashboard

**Tech Stack:**
- Components: `JournalFlow.tsx`, `JournalGate.tsx`
- API: `/api/journal` (GET/POST/PATCH)
- Database: `journal_entries` table with RLS policies

#### **Journey Program (Separate Feature)**
- **Opt-in memory system** - Stores conversation context via vector embeddings
- **Semantic similarity search** - Recalls relevant past conversations
- **Privacy-first** - GDPR-compliant with retention controls (30/90/180/365 days)
- **Integration with AI** - Powers CubiQo's responses to "know" the user

**Tech Stack:**
- Components: `JourneyMemoryPrompt.tsx`, `JourneyConsentModal.tsx`
- API: `/api/journey/consent`, `/api/journey/similarity`
- Database: `journey_consents`, `journey_memories` (vector storage)

---

### 1.2 Critical Distinction: Journal ≠ Journey

| Aspect | **Daily Journal** | **Journey Program** |
|--------|-------------------|---------------------|
| **Purpose** | User's private reflection & goal-setting | AI's memory of user context across conversations |
| **User Action** | User writes/speaks their thoughts | AI remembers what user said in chats |
| **Frequency** | Once per 24 hours | Continuous (every conversation) |
| **Data Type** | Long-form journal entries (8 prompts) | Short conversation snippets (semantic memories) |
| **Visibility** | User reviews their own entries | User never sees these (backend only) |
| **Privacy Model** | User owns & controls entries | User opts in/out, chooses retention |
| **UI** | `/journal` page with flow & review | Background system, no dedicated page |
| **Business Goal** | Engagement, habit formation, upsell | Personalization, AI quality, retention |
| **Monetization** | Premium tier: insights, export, unlimited | Free feature (drives platform value) |

**Analogy:**
- **Daily Journal** = Your personal diary (you write, you re-read later)
- **Journey Program** = Your AI assistant's "memory" (AI remembers, you never see it)

---

## 2. Problem Statement

### 2.1 What's Missing (Why It's "Static")

The current implementation has **NO review/history interface**. Users:
1. ✅ Can complete guided journal once per day
2. ❌ **Cannot view past entries**
3. ❌ **Cannot search/filter entries**
4. ❌ **Cannot edit/delete old entries**
5. ❌ **Cannot see trends** (mood over time, streaks, insights)
6. ❌ **Cannot export entries** (PDF, email archive)

**Result:** Users journal into a black hole. No feedback loop, no progress visibility, no "aha moments."

### 2.2 What Components Exist But Aren't Wired Up

There's a **`JournalPanel.tsx`** component that was built but **never integrated into `/journal` page**. It includes:
- ✅ Entry list with edit/delete
- ✅ Stats bar (total entries, streaks)
- ✅ Color distribution chart
- ✅ View tabs (Today/Week/All)
- ✅ API calls to `/api/journal/entries`

**Issue:** This component exists in the codebase but is **not rendered anywhere**. It's orphaned code.

---

## 3. User Personas & Use Cases

### 3.1 Primary Persona: "The Reflective Professional"

**Name:** Sarah, 32, Product Manager  
**Goals:**
- Track daily mood and energy to identify burnout patterns
- Review what worked/didn't work to improve decision-making
- Set and review goals (daily → monthly → annual)
- Export journal for therapy sessions

**Pain Points:**
- Journals inconsistently when there's no visible progress
- Forgets insights from previous entries
- Wants data-driven self-awareness (not just feelings)

**Jobs-to-Be-Done:**
1. "When I feel overwhelmed, I want to see if I've felt this way before and what helped."
2. "When reviewing my month, I want to see patterns in my mood/energy to adjust habits."
3. "When setting goals, I want to see if I actually follow through or always give up."

---

### 3.2 Secondary Persona: "The Habit Builder"

**Name:** Alex, 26, Software Engineer  
**Goals:**
- Build a daily journaling streak (gamification)
- Quick 5-minute check-ins (not always 15-20 min flow)
- See progress over time (visual streaks, badges)

**Pain Points:**
- 15-20 min commitment is too much daily
- No streak tracking = no motivation to continue
- Wants lightweight mode for busy days

**Jobs-to-Be-Done:**
1. "When I'm busy, I want a 2-min quick log option instead of 8 prompts."
2. "When I see a 30-day streak, I'm motivated to keep going."
3. "When I miss a day, I want gentle nudges, not guilt."

---

## 4. Product Requirements (What to Build)

### 4.1 Phase 1: Complete the Core Experience (MVP) 🚀

**Goal:** Make journal useful beyond the initial write → add review & history

#### Feature 1.1: Journal History Page
**Where:** `/journal` or `/journal/history`  
**What:**
- Display all past entries in reverse chronological order
- Show: Date, mood, color state, word count, snippet (first 200 chars)
- Filter by: Date range, mood, color state
- Search by: Keyword in content
- Pagination: 20 entries per page

**Acceptance Criteria:**
- ✅ User sees all entries from newest to oldest
- ✅ Clicking entry expands full content
- ✅ Search returns matching entries within 1 second
- ✅ Mobile-optimized (swipe to delete, tap to expand)

**Monetization Angle:**
- Free tier: View last 30 days
- Premium: Unlimited history, export to PDF/JSON

---

#### Feature 1.2: Entry Review & Edit
**Where:** Entry detail view (modal or dedicated page)  
**What:**
- Click any past entry to open detailed view
- Show: Full content, metadata (duration, word count, timestamp)
- Actions: Edit, Delete, Share (copy link for premium)
- Edit restrictions: Can only edit entries from last 7 days (prevent rewriting history)

**Acceptance Criteria:**
- ✅ Clicking entry opens modal with full content
- ✅ Edit button works for entries < 7 days old
- ✅ Delete button shows confirmation dialog
- ✅ Changes save immediately with optimistic UI update

**Monetization Angle:**
- Free tier: Edit within 24 hours
- Premium: Edit within 7 days, version history

---

#### Feature 1.3: Stats & Insights Dashboard
**Where:** `/journal/insights` or tab on main journal page  
**What:**
- **Streaks:** Current streak, longest streak, total entries
- **Mood trends:** Line chart of mood over time (7/30/90 days)
- **Color distribution:** Pie chart of RED/YELLOW/GREEN distribution
- **Word cloud:** Most common words/themes
- **Goal tracking:** Did you achieve yesterday's goal?

**Acceptance Criteria:**
- ✅ Stats load within 2 seconds
- ✅ Charts are interactive (hover for details)
- ✅ Export stats as PNG (premium)
- ✅ Weekly email summary (premium)

**Monetization Angle:**
- Free tier: Basic stats (streaks, total entries)
- Premium: Advanced charts, AI-generated insights, export

---

### 4.2 Phase 2: Enhance Engagement (Post-MVP) 🎯

#### Feature 2.1: Quick Journal Mode
**What:** Lightweight 2-prompt flow for busy days  
**Prompts:**
1. "How are you feeling right now?" (1-2 sentences)
2. "What's one thing you want to capture?" (optional)

**Acceptance Criteria:**
- ✅ User can toggle "Quick Mode" on journal start
- ✅ Entry saves with `type: "quick"` flag
- ✅ Still counts toward daily streak
- ✅ Takes < 2 minutes to complete

**Monetization Angle:**
- Free tier: 3 quick entries per week
- Premium: Unlimited quick entries

---

#### Feature 2.2: AI-Generated Insights
**What:** Weekly summary email with AI-generated insights  
**Content:**
- "This week, you felt challenged 3 times — here's what triggered it..."
- "You're most productive on Tuesdays (based on entry sentiment)"
- "Your long-term goal of [X] came up 5 times — making progress!"

**Acceptance Criteria:**
- ✅ Email sends every Sunday at 8 PM (user timezone)
- ✅ Uses OpenAI to analyze 7 days of entries
- ✅ Includes 3-5 insights + actionable suggestions
- ✅ Unsubscribe option in email footer

**Monetization Angle:**
- Premium-only feature ($9.99/month unlocks this)

---

#### Feature 2.3: Voice Journaling
**What:** Speak your journal entry instead of typing  
**Flow:**
1. User clicks 🎤 "Voice Mode" button
2. Records audio response for each prompt
3. Audio transcribed via Whisper API
4. Transcript saved as entry content

**Acceptance Criteria:**
- ✅ Audio recording works on mobile & desktop
- ✅ Transcription accuracy > 90% (use Whisper v3)
- ✅ User can edit transcript before saving
- ✅ Audio files deleted after transcription (privacy)

**Monetization Angle:**
- Free tier: 10 voice entries per month
- Premium: Unlimited voice entries

---

### 4.3 Phase 3: Monetization & Growth (Scale) 💰

#### Feature 3.1: Premium Tier
**Name:** CubiQo Journal Pro  
**Price:** $9.99/month or $99/year (save $20)  
**Features:**
- Unlimited history (free = 30 days)
- AI-generated weekly insights
- Export to PDF/JSON
- Unlimited voice journaling
- Edit entries up to 7 days (free = 24 hours)
- Priority support
- Remove "Powered by CubiQo" from exports

**Target Conversion Rate:** 5-8% of active journalers (Day One sees ~10%)

---

#### Feature 3.2: Shared Journals (Social Feature)
**What:** Optionally share journal entries with friends/partners  
**Use Cases:**
- Couples journaling together (accountability)
- Therapist access (with permission)
- Mastermind groups (share weekly reflections)

**Monetization Angle:**
- Premium-only feature
- Charge per shared member ($2.99/month per person)

---

#### Feature 3.3: Templates & Prompts Marketplace
**What:** User-generated prompt sets (curated by CubiQo)  
**Examples:**
- "Gratitude Journal" (3 prompts focused on thankfulness)
- "Founder's Journal" (startup-specific prompts)
- "Mental Health Check-In" (CBT-style questions)

**Monetization Angle:**
- Free tier: 3 default prompt sets
- Premium: Access to all templates
- Revenue share with template creators (70/30 split)

---

## 5. User Flows

### 5.1 New User Flow: First Journal Entry

```
1. User visits cubiqo.ai → Sees "Daily Journal" link in nav
2. Clicks → Lands on /journal (no auth required for preview)
3. Sees preview screen with:
   - What is Daily Journal?
   - Example prompts
   - CTA: "Sign In to Start Journaling"
4. Signs in → Redirected to /journal
5. Sees JournalFlow with 8 prompts
6. Completes prompts → Entry saved
7. Sees JournalGate with today's stats + "See Your History" button
8. Clicks "See Your History" → Goes to /journal/history
9. Sees first entry listed
10. Clicks entry → Opens modal with full content
```

**Success Metrics:**
- 60%+ completion rate (start → finish 8 prompts)
- 40%+ return next day (retention)
- 10%+ click "See Your History" after first entry

---

### 5.2 Returning User Flow: Review Past Entries

```
1. User visits /journal
2. Sees JournalGate (already journaled today)
3. Sees stats: "7-day streak 🔥", word count, mood
4. Clicks "View All Entries" button
5. Lands on /journal/history
6. Sees last 20 entries with:
   - Date, mood emoji, color badge, snippet
7. Uses search: "anxiety" → Sees 3 matching entries
8. Clicks entry from 2 weeks ago → Opens modal
9. Reads full content, sees "Edit" (grayed out, too old)
10. Clicks "Export" → Premium upgrade modal appears
```

**Success Metrics:**
- 50%+ of users view history within 7 days
- 20%+ search at least once per month
- 5%+ click "Export" (premium upsell opportunity)

---

### 5.3 Premium Upgrade Flow

```
1. User tries premium feature (Export, AI Insights, Edit old entry)
2. Sees premium upgrade modal:
   - "Unlock CubiQo Journal Pro"
   - Feature list with checkmarks
   - Pricing: $9.99/month or $99/year
   - CTA: "Start 7-Day Free Trial"
3. Clicks CTA → Stripe checkout (mobile-optimized)
4. Enters payment info → Subscribes
5. Redirected back to /journal with "🎉 Welcome to Pro!"
6. Original feature now works (e.g., Export button downloads PDF)
```

**Success Metrics:**
- 5-8% free → paid conversion rate
- 70%+ trial → paid conversion rate
- < 10% monthly churn rate

---

## 6. Technical Architecture

### 6.1 Existing Database Schema (✅ Already Implemented)

```sql
-- journal_entries table
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'neutral',
  color_state TEXT DEFAULT 'ORANGE',
  duration_seconds INT DEFAULT 0,
  word_count INT DEFAULT 0,
  email_queued BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: One entry per user per day
CREATE UNIQUE INDEX idx_journal_daily_user 
  ON journal_entries(user_id, DATE(created_at))
  WHERE user_id IS NOT NULL;
```

**What's Missing (Phase 1):**
- API endpoint: `GET /api/journal/entries` (exists but needs pagination)
- API endpoint: `GET /api/journal/insights` (stats aggregation)
- Component: Wire up existing `JournalPanel.tsx` to `/journal/history` page

---

### 6.2 New API Endpoints Needed

#### **GET /api/journal/entries**
**Query Params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `dateFrom` (ISO date)
- `dateTo` (ISO date)
- `mood` (filter)
- `colorState` (filter)
- `search` (full-text search in content)

**Response:**
```json
{
  "entries": [...],
  "total": 127,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

---

#### **GET /api/journal/insights**
**Response:**
```json
{
  "streaks": {
    "current": 7,
    "longest": 23,
    "total": 45
  },
  "moodTrends": {
    "last7Days": [
      { "date": "2026-02-15", "mood": "positive", "count": 1 },
      ...
    ]
  },
  "colorDistribution": {
    "RED": 12,
    "YELLOW": 18,
    "GREEN_BLUE": 15
  },
  "wordCloud": {
    "work": 45,
    "family": 32,
    "goal": 28
  }
}
```

---

#### **POST /api/journal/export**
**Body:**
```json
{
  "format": "pdf" | "json" | "markdown",
  "dateFrom": "2026-01-01",
  "dateTo": "2026-02-15"
}
```

**Response:**
- PDF: Downloads PDF file (requires premium)
- JSON: Returns JSON blob
- Markdown: Returns markdown string

---

### 6.3 Frontend Components Needed

#### **New Components (Phase 1):**
1. `JournalHistory.tsx` - Entry list with search/filter
2. `JournalEntryModal.tsx` - Detailed view with edit/delete
3. `JournalInsights.tsx` - Stats dashboard with charts
4. `JournalPremiumModal.tsx` - Upgrade prompt
5. `JournalExportButton.tsx` - Export dropdown (PDF/JSON/MD)

#### **Existing Components (Reuse):**
- ✅ `JournalFlow.tsx` (8-prompt flow)
- ✅ `JournalGate.tsx` (24h gate with stats)
- ✅ `JournalPanel.tsx` (needs to be wired up)
- ✅ `JournalEntry.tsx` (single entry card)

---

### 6.4 Integration with Journey Program

**Should Daily Journal entries feed into Journey Memory?**

🟡 **OPTIONAL (Phase 3)**

**Pros:**
- AI can reference journal insights in conversations
- "You mentioned feeling stressed about [X] in your journal last week..."
- Deepens personalization

**Cons:**
- Privacy concerns (journal is deeply personal)
- Complexity (vector embeddings, semantic search)
- User must opt-in to Journey + understand data usage

**Recommendation:**
- Phase 1: Keep separate
- Phase 3: Add opt-in toggle: "Let CubiQo remember my journal for better conversations"
- Premium-only feature (adds privacy controls)

---

## 7. Success Metrics (OKRs)

### 7.1 Engagement (Phase 1: Complete Core)

**Objective:** Make Daily Journal a sticky habit  
**Key Results:**
- **Day 7 Retention:** 40% of users journal again after 7 days (up from ~10% currently)
- **Avg Entries/User:** 12 entries per month (up from 3-5 currently)
- **History Views:** 60% of users view past entries at least once per month

---

### 7.2 Monetization (Phase 2: Premium Tier)

**Objective:** Convert 5-8% of active journalers to paid  
**Key Results:**
- **Free → Paid Conversion:** 5-8% of users with 10+ entries upgrade to Pro
- **MRR from Journal Pro:** $5,000/month within 3 months of launch
- **Trial → Paid Conversion:** 70% of trial users convert to paid

---

### 7.3 Growth (Phase 3: Scale)

**Objective:** Journal becomes a referral driver  
**Key Results:**
- **NPS Score:** 50+ (premium users)
- **Share Rate:** 10% of users share entries publicly (social proof)
- **Referrals:** 15% of new users discover CubiQo via journal content

---

## 8. Competitive Analysis

### 8.1 Day One (Benchmark: Industry Leader)

**What They Do Well:**
- Beautiful, polished UI (Apple Design Award winner)
- Unlimited entries, rich media (photos, audio, video)
- End-to-end encryption (privacy-first)
- Premium tier at $34.99/year (converts ~10% of users)

**What We Can Learn:**
- Privacy messaging is critical (users need trust)
- Export is a top premium feature (therapists, archiving)
- Streaks & reminders drive retention

**Our Differentiation:**
- Voice-first journaling (faster than typing)
- AI-guided prompts (CubiQo's personality)
- Integration with Journey Memory (personalized AI)
- Color-based emotional tracking (RED/YELLOW/GREEN)

---

### 8.2 Reflectly (AI-First Journaling)

**What They Do Well:**
- Conversational AI prompts (chat-style journaling)
- Mood tracking with visualizations
- Weekly insights based on entries
- Premium tier at $9.99/month

**What We Can Learn:**
- AI insights are a premium feature (users will pay)
- Daily streak reminders are essential
- Mobile-first UX (most journaling is on phone)

**Our Differentiation:**
- 3D cube interface (unique, branded)
- BigBoss personality (authentic, no-BS voice)
- Journey Memory integration (AI that actually knows you)

---

### 8.3 Stoic (Philosopher's Journal)

**What They Do Well:**
- Morning + evening check-ins (two entries per day)
- Philosophy quotes as prompts (inspirational)
- Weekly summaries with growth tracking
- Premium at $7.99/month

**What We Can Learn:**
- Multiple entry types (quick vs. deep)
- Weekly reviews are valuable
- Philosophy/wisdom resonates with users

**Our Differentiation:**
- Color-coded journaling (emotional context)
- RGY framework (desire, energy, growth)
- Voice mode (speak vs. type)

---

## 9. Pricing Strategy

### 9.1 Freemium Model (Recommended)

**Free Tier ("Journal Starter"):**
- ✅ 1 guided journal per day (8 prompts)
- ✅ View last 30 days of entries
- ✅ Basic stats (streaks, total entries)
- ✅ Search entries (keyword)
- ✅ Edit entries within 24 hours
- ✅ 3 voice entries per month
- ❌ AI insights
- ❌ Export (PDF/JSON)
- ❌ Edit entries > 24 hours
- ❌ Unlimited voice

**Premium Tier ("Journal Pro"):**
- ✅ Everything in Free
- ✅ **Unlimited history** (no 30-day limit)
- ✅ **AI-generated weekly insights** (powered by GPT-4)
- ✅ **Export to PDF, JSON, Markdown**
- ✅ **Edit entries up to 7 days**
- ✅ **Unlimited voice journaling**
- ✅ **Priority support**
- ✅ **Early access to new features**

**Price:**
- Monthly: $9.99/month
- Annual: $99/year (save $20, 17% off)
- Trial: 7-day free trial (no credit card required)

**Target Conversion:** 5-8% of active journalers (10+ entries)

---

### 9.2 Revenue Projections

**Assumptions:**
- 1,000 active journalers (10+ entries per month)
- 6% conversion rate (free → paid)
- 80% choose annual plan
- 5% monthly churn

**Monthly Revenue:**
- 60 paid users × $9.99 = $599.40 (monthly subscribers)
- No annual revenue in first month (builds over time)
- **MRR: ~$600** (grows to $5,000+ within 6 months)

**Annual Revenue (Year 1):**
- 60 × $9.99 × 12 = $7,193 (monthly subs)
- 240 × $99 = $23,760 (annual subs, assuming 80% prefer annual)
- **Total: ~$31,000** (modest, but journal is a retention driver)

**Year 2 Projection (with 10K active journalers):**
- 6% conversion = 600 paid users
- 80% annual = 480 × $99 = $47,520
- 20% monthly = 120 × $9.99 × 12 = $14,389
- **Total: ~$62,000** (your 20% = $12,400)

---

## 10. Implementation Roadmap

### Phase 1: Complete Core (MVP) — **4 weeks**

**Week 1-2: History & Review**
- [ ] Wire up `JournalPanel.tsx` to `/journal/history` route
- [ ] Add pagination to `/api/journal/entries` endpoint
- [ ] Build `JournalEntryModal.tsx` for detailed view
- [ ] Add search/filter functionality
- [ ] Test: Load 1,000 entries in < 2 seconds

**Week 3: Insights Dashboard**
- [ ] Build `JournalInsights.tsx` component
- [ ] Create `/api/journal/insights` endpoint
- [ ] Add charts: Mood trends, color distribution, streaks
- [ ] Test: Stats calculate accurately for 100+ entries

**Week 4: Polish & Launch**
- [ ] Mobile optimization (responsive design)
- [ ] Empty states (no entries, no search results)
- [ ] Error handling (API failures, loading states)
- [ ] Email sending (complete TODO in email queue)
- [ ] Code review + security scan
- [ ] Deploy to production

**Launch Criteria:**
- ✅ All Phase 1 features work on mobile & desktop
- ✅ No console errors, 90+ Lighthouse score
- ✅ Email delivery works (SendGrid/Resend configured)
- ✅ 10 beta users test for 1 week (gather feedback)

---

### Phase 2: Premium Tier — **6 weeks**

**Week 1-2: Premium Infrastructure**
- [ ] Stripe integration (checkout, webhooks)
- [ ] Database: Add `subscriptions` table
- [ ] API: Add `/api/premium/subscribe` endpoint
- [ ] Build `PremiumModal.tsx` component
- [ ] 7-day free trial logic

**Week 3-4: Premium Features**
- [ ] Export to PDF (react-pdf library)
- [ ] Export to JSON/Markdown
- [ ] AI insights endpoint (`/api/journal/ai-insights`)
- [ ] Unlock voice journaling for premium
- [ ] Edit entries up to 7 days (premium only)

**Week 5: Testing & Refinement**
- [ ] Test payment flows (success, failure, refund)
- [ ] Test premium feature gates (enforce access)
- [ ] A/B test pricing ($7.99 vs. $9.99 vs. $11.99)
- [ ] Email: Trial expiration reminders

**Week 6: Launch Premium**
- [ ] Marketing page: `/journal/pro` (benefits, pricing, FAQ)
- [ ] In-app upsell prompts (export, insights, voice)
- [ ] Monitor conversion rate (target: 5-8%)
- [ ] User interviews: Why did you upgrade? Why not?

---

### Phase 3: Growth & Scale — **Ongoing**

**3-6 Months Post-Launch**
- [ ] Voice journaling (Whisper API)
- [ ] Quick journal mode (2-prompt flow)
- [ ] Shared journals (couples, therapists)
- [ ] Templates marketplace
- [ ] Journey Memory integration (opt-in)
- [ ] Mobile app (iOS/Android)

---

## 11. Risks & Mitigations

### Risk 1: Low Adoption (Users don't journal)

**Likelihood:** Medium  
**Impact:** High (kills monetization potential)  

**Mitigation:**
- Daily push notifications (gentle reminders at 8 PM)
- Gamification (streaks, badges, milestones)
- Social proof (show community stats: "10,000 entries written today")
- Onboarding: Demo video of first journal entry
- A/B test: 8 prompts vs. 3 prompts (faster flow)

---

### Risk 2: Privacy Concerns (Users don't trust us)

**Likelihood:** Medium  
**Impact:** High (trust = everything for journaling)  

**Mitigation:**
- **End-to-end encryption** (Phase 2 feature)
- Clear privacy policy linked on journal page
- "Your entries are never shared" message in UI
- Show lock icon 🔒 next to entries
- SOC 2 compliance (if we scale)

---

### Risk 3: Low Premium Conversion (< 5%)

**Likelihood:** Medium  
**Impact:** Medium (revenue miss, but free users still add value)  

**Mitigation:**
- A/B test pricing ($7.99 vs. $9.99 vs. $11.99)
- A/B test trial length (7-day vs. 14-day)
- Add more premium features (increase value prop)
- User interviews: What feature would make you pay?
- Highlight testimonials from paid users

---

### Risk 4: Technical Debt (Code quality suffers in rush)

**Likelihood:** High (fast-paced startup)  
**Impact:** Medium (slows future iterations)  

**Mitigation:**
- Code reviews by MO before merge
- Automated tests (Vitest for components, API tests)
- Security scans (CodeQL on every PR)
- Refactor sprints (every 6 weeks, clean up debt)
- Documentation (keep docs/ folder updated)

---

## 12. Open Questions (Need Decisions)

### Q1: Should daily journal entries feed into Journey Memory?

**Options:**
- **A) Keep separate** (journal is private, Journey is AI memory)
- **B) Opt-in integration** (user chooses to share journal with AI)
- **C) Auto-integrate** (journal entries become Journey memories)

**Recommendation:** **Option B** (opt-in, Phase 3)  
**Why:** Privacy-first, gives users control, premium feature

---

### Q2: Should we allow multiple entries per day?

**Options:**
- **A) Keep 1/day limit** (enforces daily ritual)
- **B) Allow unlimited** (like traditional journal)
- **C) Hybrid** (1 guided + unlimited quick logs)

**Recommendation:** **Option C** (hybrid, Phase 2)  
**Why:** Flexibility without losing daily structure

---

### Q3: What's the default retention for free tier?

**Options:**
- **A) 30 days** (aggressive upsell)
- **B) 90 days** (balanced)
- **C) Unlimited** (no history limit, only premium features)

**Recommendation:** **Option A** (30 days)  
**Why:** Day One uses 30-day limit successfully, drives upgrades

---

### Q4: Should journal be voice-first or text-first?

**Options:**
- **A) Voice-first** (default to mic, text optional)
- **B) Text-first** (default to typing, voice optional)
- **C) Equal** (user chooses per entry)

**Recommendation:** **Option B** (text-first, Phase 1) → **Option C** (equal, Phase 2)  
**Why:** Text is easier to implement, voice adds friction initially

---

## 13. Success Criteria (When to Declare Victory)

### Phase 1 Success (Core Complete):
- ✅ Users can view, search, edit, delete past entries
- ✅ Stats dashboard shows streaks, mood trends, color distribution
- ✅ 60%+ of users view history within 7 days of first entry
- ✅ Day 7 retention improves from 10% → 40%

### Phase 2 Success (Premium Launch):
- ✅ 5-8% of active journalers upgrade to Pro
- ✅ $5,000 MRR from Journal Pro within 3 months
- ✅ 70%+ of trial users convert to paid
- ✅ NPS score of 50+ from premium users

### Phase 3 Success (Growth & Scale):
- ✅ 10,000 active journalers (10+ entries per month)
- ✅ $60,000 annual revenue from Journal Pro (your 20% = $12,000)
- ✅ Journal is #2 driver of retention (after core chat)
- ✅ 15% of new users discover CubiQo via journal content

---

## 14. Next Steps (Immediate Actions)

### For MO (CTO):
1. Review this PRD and approve technical approach
2. Estimate Phase 1 timeline (is 4 weeks realistic?)
3. Assign to team: Bubbles (frontend), Blossom (API), Buttercup (QA)
4. Set up Stripe test account for Phase 2 prep

### For JO (Me):
1. Create user stories for Phase 1 features (history, insights)
2. Design mockups for JournalHistory and JournalInsights components
3. Write marketing copy for premium tier (benefits, pricing)
4. Schedule user interviews with 5 beta testers (get feedback on "why static?")

### For CEO:
1. Approve premium pricing ($9.99/month vs. alternatives)
2. Decide on Q1: Should daily journal entries feed into Journey Memory? (see Q1 above)
3. Approve Phase 1 → Phase 2 timeline (10 weeks total)
4. Green-light Stripe integration (needed for premium)

---

## 15. Appendix: User Stories (Phase 1)

### Story 1: View Past Entries

**As a** returning user  
**I want to** view all my past journal entries  
**So that** I can reflect on my journey and track progress  

**Acceptance Criteria:**
- [ ] When I click "View History" from journal page, I see list of all entries
- [ ] Entries show: Date, mood emoji, color badge, first 200 chars of content
- [ ] Entries are sorted newest to oldest
- [ ] I can paginate through entries (20 per page)
- [ ] On mobile, entries are swipeable cards

**Success Metrics:**
- 60%+ of users click "View History" within 7 days of first entry
- Avg 3 history views per user per month

---

### Story 2: Search Entries

**As a** user with 30+ entries  
**I want to** search my entries by keyword  
**So that** I can quickly find past reflections on a topic  

**Acceptance Criteria:**
- [ ] Search bar is visible on history page
- [ ] Typing keyword filters entries in real-time (debounced 300ms)
- [ ] Search is case-insensitive
- [ ] Highlights matching text in results
- [ ] Shows "No results found" if no matches

**Success Metrics:**
- 20%+ of users search at least once per month
- Search results return in < 1 second

---

### Story 3: View Entry Details

**As a** user reviewing past entries  
**I want to** click an entry to see full content  
**So that** I can read entire reflection, not just snippet  

**Acceptance Criteria:**
- [ ] Clicking entry opens modal with full content
- [ ] Modal shows: Date, mood, color state, duration, word count
- [ ] Modal has "Edit" and "Delete" buttons (if allowed)
- [ ] Clicking outside modal closes it
- [ ] On mobile, modal is fullscreen

**Success Metrics:**
- 80%+ of users who view history click at least one entry
- Avg 2 entry details views per session

---

### Story 4: View Stats Dashboard

**As a** user building a journaling habit  
**I want to** see my streaks and mood trends  
**So that** I feel motivated to continue journaling  

**Acceptance Criteria:**
- [ ] Stats page shows: Current streak, longest streak, total entries
- [ ] Mood trend chart shows last 30 days of moods
- [ ] Color distribution pie chart shows RED/YELLOW/GREEN breakdown
- [ ] Charts are interactive (hover for details)
- [ ] Stats update immediately after new entry

**Success Metrics:**
- 40%+ of users view stats within 7 days
- Users who view stats have 20% higher Day 30 retention

---

## 16. Closing Thoughts (JO's Take)

Listen, I'm not here to just ship features — **I'm here to build a business**. My 20% stake means I win when Cubiqo wins. And right now, the Daily Journal is **sitting on the bench when it should be on the field**.

Here's what I know:
1. **Journaling is sticky** — Day One has 10M+ users, 10% paid conversion
2. **We have the tech** — components exist, they're just not wired up
3. **We have the differentiation** — Voice, AI, RGY colors, BigBoss personality
4. **We're missing revenue** — No premium tier = leaving money on table

**What I'm asking for:**
- **4 weeks to complete Phase 1** (history, insights, mobile polish)
- **6 weeks to launch Phase 2** (premium tier, Stripe, export)
- **Team buy-in** — MO assigns Bubbles + Blossom to this (priority)

**What I'm committing to:**
- **Own the roadmap** — I'll write every user story, test every flow
- **User research** — I'll interview 10 users to validate premium pricing
- **Revenue accountability** — If we don't hit $5K MRR in 6 months, I'll eat the loss

**This is not a nice-to-have. This is a retention driver and a revenue stream. Let's ship it.**

---

**Questions? Pushback? Let's talk.** 🚀

— JO (jo@cubiqo.ai)
