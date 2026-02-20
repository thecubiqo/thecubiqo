# Dashboard & Journal — Quick Reference Card

**For:** Development Team  
**From:** JO (Product Owner)  
**Purpose:** Quick lookup for feature priorities and acceptance criteria

---

## SPRINT PLAN (12 Weeks)

### Sprint 1-2: Quick Wins
- **Email Summaries** (Journal) — Blossom + Guy
- **Recommendations Widget** (Dashboard) — Bubbles

### Sprint 3-5: Journal Core
- **History & Timeline View** — Bubbles + Blossom
- **Mood Tracking & Insights** — Bubbles + Blossom + Guy

### Sprint 6-8: Dashboard Core
- **Insights & Analytics** — Bubbles + Blossom
- **Goal Setting & Progress** — Bubbles + Blossom + Guy

### Sprint 9-10: Export Features
- **Export & Backup** (PDF, JSON, TXT) — Blossom + Guy

### Sprint 11-12: Premium Launch
- **Payment Integration** (Stripe) — Blossom + MO
- **Pricing UI** — Bubbles + Pushpa

---

## FEATURE CARDS

### 📧 Feature: Email Summaries
**Priority:** HIGH | **Effort:** SMALL (2-3 days) | **Sprint:** 1

**User Story:**
> As a user who journals regularly, I want to receive my journal entry via email, so that I have a backup.

**Acceptance Criteria:**
- [ ] Send email after journal completion
- [ ] Subject: "Your CubiQo Journal - [Date]"
- [ ] Body: Full text + mood + word count + duration
- [ ] Link to view online
- [ ] User can opt-out (settings page)

**Owner:** Blossom (backend)  
**Reviewer:** MO  
**QA:** Buttercup

---

### 💡 Feature: Personalized Recommendations
**Priority:** HIGH | **Effort:** SMALL (2-3 days) | **Sprint:** 2

**User Story:**
> As a user, I want CubiQo to recommend what to do next, so that I stay engaged.

**Acceptance Criteria:**
- [ ] "Recommended for You" card on dashboard
- [ ] Logic-based recommendations:
  - If no journal in 2 days: "Time for a reflection?"
  - If uses chat but not voice: "Try voice mode!"
  - If 5-day journal streak: "Keep going!"
- [ ] Clickable CTAs to recommended action
- [ ] Dismiss button (hide for 3 days)

**Owner:** Bubbles (frontend)  
**Reviewer:** JO  
**QA:** Buttercup

---

### 📖 Feature: Journal History & Timeline
**Priority:** HIGH | **Effort:** MEDIUM (5-6 days) | **Sprint:** 3-5

**User Story:**
> As a regular journaler, I want to see all my past journal entries, so that I can reflect on my journey.

**Acceptance Criteria:**
- [ ] New page: `/journal/history`
- [ ] Timeline view (reverse chronological)
- [ ] Each entry: date, mood, word count, preview (100 chars)
- [ ] Click to view full entry (modal)
- [ ] Calendar view (month grid with dots)
- [ ] Filter by mood
- [ ] Search functionality (text search)
- [ ] **Free tier:** Last 30 days only
- [ ] **Premium tier:** Unlimited history

**Owner:** Bubbles (frontend) + Blossom (API)  
**Reviewer:** JO + MO  
**QA:** Buttercup

---

### 😊 Feature: Mood Tracking & Insights
**Priority:** HIGH | **Effort:** MEDIUM (6-7 days) | **Sprint:** 3-5

**User Story:**
> As a self-aware user, I want to track my mood over time and see patterns.

**Acceptance Criteria:**
- [ ] Add mood selector to journal flow (5 emojis or 1-5 scale)
- [ ] Store mood in `journal_entries.mood`
- [ ] New page: `/journal/insights`
- [ ] Line chart: Mood over time (last 30 days)
- [ ] Bar chart: Mood distribution (%)
- [ ] Insights:
  - "You're happiest on [day]"
  - "Your mood improved X% this month"
- [ ] **Free tier:** 7-day trends
- [ ] **Premium tier:** Unlimited history, correlations

**Owner:** Bubbles (charts) + Blossom (API) + Guy (DB)  
**Reviewer:** JO + MO  
**QA:** Buttercup

---

### 📊 Feature: Dashboard Insights & Analytics
**Priority:** HIGH | **Effort:** MEDIUM (4-5 days) | **Sprint:** 6-8

**User Story:**
> As a returning user, I want to see my usage patterns, so that I understand how I'm using CubiQo.

**Acceptance Criteria:**
- [ ] "This Week" summary:
  - Conversations (this week vs. last week, % change)
  - Journal entries (with streak counter)
  - Voice minutes used
- [ ] Activity chart (last 7 days):
  - Bar chart: Conversations per day
  - Line chart: Time spent per day
- [ ] "Top Topics" (if tagging exists)
- [ ] "Mood Trends" (if journal has mood tracking)
- [ ] **Free tier:** 7-day view
- [ ] **Premium tier:** 30-day, yearly views

**Owner:** Bubbles (frontend) + Blossom (API)  
**Reviewer:** JO  
**QA:** Buttercup

---

### 🎯 Feature: Goal Setting & Progress
**Priority:** HIGH | **Effort:** MEDIUM (5-6 days) | **Sprint:** 6-8

**User Story:**
> As a motivated user, I want to set goals and track my progress, so that I stay accountable.

**Acceptance Criteria:**
- [ ] "Your Goals" section on dashboard
- [ ] User can create goals:
  - "Journal X times per week"
  - "Chat for Y minutes per day"
  - "Complete Z voice sessions"
- [ ] Visual progress bars (e.g., "3/5 entries")
- [ ] Celebrate when goal completed (animation + badge)
- [ ] Weekly goal reset (Monday 00:00 UTC)
- [ ] **Free tier:** 1 goal at a time
- [ ] **Premium tier:** Unlimited goals, custom goals

**Owner:** Bubbles (frontend) + Blossom (API) + Guy (DB)  
**Reviewer:** JO + MO  
**QA:** Buttercup

---

### 💾 Feature: Export & Backup
**Priority:** MEDIUM | **Effort:** MEDIUM (4-5 days) | **Sprint:** 9-10

**User Story:**
> As a privacy-conscious user, I want to export all my journal entries.

**Acceptance Criteria:**
- [ ] Settings page: "Export Journal"
- [ ] Export formats: PDF, JSON, TXT
- [ ] Export options:
  - All entries
  - Date range
  - Specific moods
- [ ] Download button → generates file → auto-downloads
- [ ] Email option: "Email me the export"
- [ ] **Free tier:** Last 30 days, TXT only
- [ ] **Premium tier:** Unlimited, all formats

**Owner:** Blossom (backend) + Guy (DB)  
**Reviewer:** MO  
**QA:** Buttercup

---

### 💳 Feature: Premium Tier & Payments
**Priority:** HIGH | **Effort:** MEDIUM (3-4 days) | **Sprint:** 11-12

**User Story:**
> As a power user, I want to upgrade to premium, so that I can unlock advanced features.

**Acceptance Criteria:**
- [ ] Pricing page: `/pricing`
- [ ] Show free vs. premium comparison
- [ ] Stripe integration (checkout, subscriptions)
- [ ] Payment success/failure handling
- [ ] User profile shows subscription status
- [ ] Gate premium features (check subscription in middleware)
- [ ] Cancellation flow (user can cancel anytime)

**Pricing:**
- $9/month or $90/year (17% discount)

**Owner:** Blossom (Stripe API) + Bubbles (UI) + MO (architecture)  
**Reviewer:** CEO + JO  
**QA:** Buttercup

---

## FREE vs. PREMIUM FEATURE MATRIX

| Feature | Free | Premium |
|---------|------|---------|
| Chat conversations | ✅ Unlimited | ✅ Unlimited |
| Journal entries | ✅ 1 per day | ✅ Unlimited |
| Journal history | ✅ Last 30 days | ✅ Unlimited |
| Mood tracking | ✅ 7-day trends | ✅ 30-day trends + correlations |
| Email summaries | ✅ Daily | ✅ Daily + weekly + monthly |
| Export | ✅ 30 days, TXT | ✅ Unlimited, PDF/JSON/TXT |
| Dashboard analytics | ✅ 7-day view | ✅ 30-day + yearly |
| Goals | ✅ 1 goal | ✅ Unlimited goals |
| Voice journaling | ❌ | ✅ Transcription |
| AI insights | ❌ | ✅ Themes, patterns, suggestions |
| Custom prompts | ❌ | ✅ Save templates |
| Priority support | ❌ | ✅ Fast response |

---

## API ENDPOINTS (New)

### Journal
- `GET /api/journal/history` — Get all entries (with pagination)
- `GET /api/journal/insights` — Mood trends and analytics
- `POST /api/journal/email` — Send email summary
- `GET /api/journal/export` — Export entries (PDF/JSON/TXT)

### Dashboard
- `GET /api/dashboard/stats` — Usage stats and trends
- `GET /api/dashboard/goals` — Get user goals
- `POST /api/dashboard/goals` — Create goal
- `PUT /api/dashboard/goals/:id` — Update goal progress

### Premium
- `POST /api/premium/checkout` — Create Stripe checkout session
- `GET /api/premium/subscription` — Get subscription status
- `POST /api/premium/cancel` — Cancel subscription
- `POST /api/webhook/stripe` — Handle Stripe webhooks

---

## DATABASE MIGRATIONS

### Sprint 1-2: Email Summaries
```sql
-- Already exists in email_queue table
```

### Sprint 3-5: Mood Tracking
```sql
-- Already exists in journal_entries.mood
-- Add index for performance
CREATE INDEX idx_journal_entries_mood ON journal_entries(mood);
```

### Sprint 6-8: Goals
```sql
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  goal_type TEXT NOT NULL, -- 'journal', 'chat', 'voice'
  target_count INT NOT NULL,
  current_count INT DEFAULT 0,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  reset_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_reset_at ON user_goals(reset_at);
```

### Sprint 11-12: Premium
```sql
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_started_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN subscription_ends_at TIMESTAMPTZ;

CREATE INDEX idx_users_subscription ON users(subscription_status);
```

---

## TESTING CHECKLIST

### Email Summaries
- [ ] Email sent after journal completion
- [ ] Email contains correct content
- [ ] Email links work (view online)
- [ ] Opt-out works (settings page)
- [ ] Handles users without email gracefully

### Journal History
- [ ] Timeline shows all entries (reverse chrono)
- [ ] Calendar view displays correctly
- [ ] Click entry opens full text
- [ ] Search works (finds text in entries)
- [ ] Filter by mood works
- [ ] Free tier: Only 30 days visible
- [ ] Premium tier: All entries visible

### Mood Tracking
- [ ] Mood selector appears in journal flow
- [ ] Mood saved to database
- [ ] Insights page loads
- [ ] Charts render correctly (line, bar)
- [ ] Insights text is accurate
- [ ] Free tier: 7-day limit enforced
- [ ] Premium tier: Unlimited history

### Dashboard Insights
- [ ] Stats update in real-time
- [ ] Charts render correctly
- [ ] % change calculation is correct
- [ ] Free tier: 7-day view
- [ ] Premium tier: 30-day view

### Goals
- [ ] User can create goal
- [ ] Progress bar updates correctly
- [ ] Goal completion triggers celebration
- [ ] Goals reset weekly (Monday 00:00 UTC)
- [ ] Free tier: 1 goal limit enforced
- [ ] Premium tier: Unlimited goals

### Export
- [ ] PDF export generates correctly
- [ ] JSON export is valid JSON
- [ ] TXT export is readable
- [ ] Download works in all browsers
- [ ] Email export works
- [ ] Free tier: 30-day limit enforced
- [ ] Premium tier: Unlimited export

### Premium
- [ ] Pricing page displays correctly
- [ ] Stripe checkout works
- [ ] Payment success updates subscription
- [ ] Premium features unlock immediately
- [ ] Cancellation works (subscription ends gracefully)
- [ ] Webhook handles all Stripe events

---

## DEFINITION OF DONE (DoD)

For a feature to be marked "DONE":
- [ ] Code written and committed
- [ ] Unit tests written (80%+ coverage)
- [ ] Integration tests written (key flows)
- [ ] Code review approved (by MO or peer)
- [ ] QA tested (by Buttercup)
- [ ] Product review approved (by JO)
- [ ] Documentation updated (if API changes)
- [ ] Deployed to staging
- [ ] Smoke tested on staging
- [ ] Merged to main
- [ ] Deployed to production (behind feature flag if applicable)

---

## CONTACT & ESCALATION

**Product Questions:** JO (Product Owner)  
**Technical Questions:** MO (CTO)  
**Design Questions:** Pushpa (UI/UX)  
**QA Questions:** Buttercup (QA)  
**Blocker Escalation:** MO → CEO

**Weekly Sync:** Mondays, 10:00 AM UTC  
**Sprint Demo:** Fridays, 3:00 PM UTC  
**Retrospective:** Every 2 weeks (Fridays, 4:00 PM UTC)

---

**Document Version:** 1.0  
**Last Updated:** February 17, 2025  
**Print this for your desk!**
