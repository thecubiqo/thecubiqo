# Product Requirements: Dashboard & Journal Features

**Author:** JO (Product Owner)  
**For:** CEO, MO (CTO), Team  
**Date:** February 17, 2025  
**My 20% Stake:** Revenue-driven, user-focused requirements

---

## Executive Summary

Based on competitor analysis, user research, and our current product state, I'm proposing clear requirements for **Dashboard** and **Journal** features that drive **user retention, engagement, and monetization**.

**Key Findings:**
1. **Dashboard already exists** — User dashboard (`/dashboard`) is live with basic stats and quick actions
2. **Journal already exists** — Daily journal (`/journal`) is live with 8 prompts, once-per-day gate, and BigBoss style
3. **Admin dashboard exists** — Agent management dashboard at `/admin`
4. **Founders Pass dashboard exists** — Feature flags, sites, integrations at `/founders-pass`

**The real question is:** What's NEXT? What features do we BUILD ON TOP of these foundations to drive retention and revenue?

---

## Situation Analysis

### What We Have (Current State)

**✅ User Dashboard (`/dashboard`)**
- Profile display (name, handle, email)
- Basic stats (conversations, messages)
- Quick actions (links to chat, journal, voice, settings)
- Session info display

**✅ Daily Journal (`/journal`)**
- 8 guided prompts (BigBoss confessional style)
- Once-per-24-hour gating
- Progress tracking
- Auto-save functionality
- Email queueing (not yet sending)
- Admin analytics endpoint

**✅ Admin Dashboard (`/admin`)**
- Agent stats (total, active)
- Session monitoring
- System health metrics
- Real-time updates (3s polling)

**✅ Founders Pass Dashboard (`/founders-pass`)**
- Feature flag management
- Site generation
- OAuth integrations
- Audit logging

### What's Missing (Gaps = Opportunities)

**User Dashboard:**
- ❌ No actionable insights (just raw numbers)
- ❌ No goal tracking or progress visualization
- ❌ No personalization (everyone sees the same dashboard)
- ❌ No recommendations ("Try this next...")
- ❌ No premium features to upsell
- ❌ No engagement hooks (streaks, achievements, notifications)

**Journal:**
- ❌ No historical view (can't review past entries)
- ❌ No search functionality
- ❌ No mood tracking over time
- ❌ No insights/analytics for users ("You're happier on Tuesdays!")
- ❌ No export options (PDF, email summaries)
- ❌ No premium tier (unlimited entries? advanced insights?)
- ❌ Email sending not implemented (queue exists but not sending)

**Competitive Context:**
- **Day One**: $50/year for premium (sync, unlimited entries, export)
- **Reflectly**: $90/year (AI insights, mood tracking, weekly summaries)
- **Stoic**: $60/year (morning + evening check-ins, growth tracking)
- **Notion**: Free tier + $10/mo for advanced features

---

## PART 1: DASHBOARD REQUIREMENTS

### Problem Statement

**User Need:** "I want to see my progress, understand patterns, and know what to do next."

**Business Goal:** Increase retention and engagement by providing actionable insights and clear CTAs.

---

### Feature 1.1: Insights & Analytics (High Priority)

**User Story:**
> As a returning user,  
> I want to see my usage patterns and insights,  
> So that I understand how I'm using CubiQo and can improve my habits.

**Acceptance Criteria:**
- [ ] Show "This Week" summary:
  - Conversations this week vs. last week (% change)
  - Journal entries this week (streak counter if applicable)
  - Voice minutes used (if applicable)
- [ ] Show "Activity Chart" (last 7 days):
  - Bar chart: Conversations per day
  - Line chart: Time spent per day
- [ ] Show "Top Topics" (if we have tagging):
  - 3-5 most discussed topics this month
- [ ] Show "Mood Trends" (if journal has mood tracking):
  - Emoji-based mood distribution
  - "You were happiest on [day]"

**Monetization Angle:**
- **Free Tier**: Show basic stats (current behavior)
- **Premium Tier**: Unlock advanced insights (mood trends, topic analysis, monthly/yearly views)

**Success Metrics:**
- 60%+ of returning users view dashboard at least once per week
- 20%+ click on insights to explore deeper
- 10%+ conversion from free to premium (if gated)

**Priority:** High  
**Effort:** Medium (4-5 days)  
**Impact:** High (drives retention by showing value)

---

### Feature 1.2: Goal Setting & Progress Tracking (Medium Priority)

**User Story:**
> As a motivated user,  
> I want to set goals (e.g., "Journal 5 times this week"),  
> So that I stay accountable and see my progress.

**Acceptance Criteria:**
- [ ] "Your Goals" section on dashboard
- [ ] User can create goals:
  - "Journal X times per week"
  - "Chat for Y minutes per day"
  - "Complete Z voice sessions"
- [ ] Visual progress bars (e.g., "3/5 journal entries this week")
- [ ] Celebrate when goal completed (confetti animation + badge)
- [ ] Weekly goal reset (Monday 00:00 UTC)

**Monetization Angle:**
- **Free Tier**: Set 1 goal at a time
- **Premium Tier**: Unlimited goals, custom goals, goal history

**Success Metrics:**
- 30%+ of users set at least one goal
- 50%+ of goal-setters complete their first goal
- Goal-setters have 2x retention vs. non-goal-setters

**Priority:** Medium  
**Effort:** Medium (5-6 days)  
**Impact:** High (gamification drives retention)

---

### Feature 1.3: Personalized Recommendations (Medium Priority)

**User Story:**
> As a user looking for inspiration,  
> I want CubiQo to recommend what to do next,  
> So that I stay engaged and discover new features.

**Acceptance Criteria:**
- [ ] "Recommended for You" card on dashboard
- [ ] Logic-based recommendations:
  - If user hasn't journaled in 2 days: "Time for a reflection?"
  - If user uses chat but not voice: "Try voice mode!"
  - If user has journaled 5 days in a row: "You're on a streak! Keep going!"
- [ ] Clickable CTAs that take user to recommended action
- [ ] Dismiss button (don't show this again for 3 days)

**Monetization Angle:**
- **Free Tier**: Basic recommendations (3 types)
- **Premium Tier**: AI-powered recommendations based on usage patterns

**Success Metrics:**
- 40%+ of users click on at least one recommendation per week
- 15%+ conversion from recommendation to action

**Priority:** Medium  
**Effort:** Small (2-3 days)  
**Impact:** Medium (increases feature discovery)

---

### Feature 1.4: Notifications & Streaks (Low Priority - Phase 2)

**User Story:**
> As a user building a habit,  
> I want reminders and streak counters,  
> So that I stay consistent with journaling and chatting.

**Acceptance Criteria:**
- [ ] Show "Streak Counter" on dashboard
  - "7-day journal streak 🔥"
  - "14-day chat streak 🌟"
- [ ] Push notifications (web push):
  - "Time to journal! Keep your streak alive"
  - "You're 1 day away from a 30-day milestone!"
- [ ] User can customize notification times
- [ ] User can disable notifications

**Monetization Angle:**
- **Free Tier**: 1 notification per day
- **Premium Tier**: Unlimited notifications, custom reminders

**Success Metrics:**
- 50%+ of users enable notifications
- Users with notifications have 1.5x longer streaks

**Priority:** Low (Phase 2)  
**Effort:** Medium (requires push notification setup)  
**Impact:** Medium (retention booster)

---

## PART 2: JOURNAL REQUIREMENTS

### Problem Statement

**User Need:** "I want to reflect regularly, see patterns over time, and get insights from my journal."

**Business Goal:** Increase daily active users (DAU) and create a premium tier with advanced journal features.

---

### Feature 2.1: Journal History & Timeline View (High Priority)

**User Story:**
> As a regular journaler,  
> I want to see all my past journal entries,  
> So that I can reflect on my journey and track my growth.

**Acceptance Criteria:**
- [ ] New page: `/journal/history`
- [ ] Timeline view:
  - Reverse chronological list (newest first)
  - Each entry shows: date, mood (if tracked), word count, preview (first 100 chars)
- [ ] Click entry to view full text (modal or new page)
- [ ] Calendar view option:
  - Month grid with dots on days with entries
  - Click date to see that day's entry
- [ ] Filter by mood (if tracked):
  - "Show only positive entries"
  - "Show only challenged entries"
- [ ] Search functionality (text search across all entries)

**Monetization Angle:**
- **Free Tier**: View last 30 days of entries
- **Premium Tier**: Unlimited history, export to PDF, advanced search

**Success Metrics:**
- 70%+ of users with 3+ journal entries visit history page
- 30%+ of history viewers click to read a past entry
- 5%+ convert to premium for unlimited history

**Priority:** High  
**Effort:** Medium (5-6 days)  
**Impact:** High (users want to review their past)

---

### Feature 2.2: Mood Tracking & Insights (High Priority)

**User Story:**
> As a self-aware user,  
> I want to track my mood over time and see patterns,  
> So that I understand what affects my emotional state.

**Acceptance Criteria:**
- [ ] Add "How are you feeling?" to journal flow (already exists as prompt 1)
- [ ] Capture mood as structured data (not just text):
  - 5 emoji options: 😊 Happy, 😐 Neutral, 😔 Sad, 😰 Anxious, 😌 Calm
  - Or: Numeric scale (1-5)
- [ ] Store mood in `journal_entries.mood` column (already exists)
- [ ] Mood trends page: `/journal/insights`
  - Line chart: Mood over time (last 30 days)
  - Bar chart: Mood distribution (% of each mood)
  - Insights:
    - "You're happiest on Saturdays"
    - "You feel anxious most often on Monday mornings"
    - "Your mood has improved 20% this month"
- [ ] Correlation insights (Phase 2):
  - "You're happier when you journal in the morning"
  - "Your mood improves after voice sessions"

**Monetization Angle:**
- **Free Tier**: Basic mood tracking, 7-day trends
- **Premium Tier**: Unlimited history, correlation insights, export reports

**Success Metrics:**
- 80%+ of journal entries include mood data
- 50%+ of users visit insights page at least once per month
- 8%+ convert to premium for advanced insights

**Priority:** High  
**Effort:** Medium (6-7 days)  
**Impact:** High (differentiation from competitors)

---

### Feature 2.3: Email Summaries (High Priority - Quick Win)

**User Story:**
> As a user who journals regularly,  
> I want to receive my journal entry via email,  
> So that I have a backup and can reflect on it later.

**Acceptance Criteria:**
- [ ] Implement email sending (queue already exists)
- [ ] Send email after journal completion:
  - Subject: "Your CubiQo Journal - [Date]"
  - Body: Full journal text + mood + word count + duration
  - Footer: Link to view online, privacy notice
- [ ] User can opt-out of emails (settings page)
- [ ] Weekly summary email (optional):
  - "This Week's Reflections - [7 days]"
  - Summary of all entries this week
  - Mood trend chart
  - "Keep your streak going!"

**Monetization Angle:**
- **Free Tier**: Daily email after each entry
- **Premium Tier**: Weekly summaries, monthly reports, custom scheduling

**Success Metrics:**
- 70%+ email open rate
- 30%+ click-through rate (view online)
- 5%+ convert to premium for weekly summaries

**Priority:** High  
**Effort:** Small (2-3 days - infrastructure exists, just need email sending)  
**Impact:** High (user delight + retention)

---

### Feature 2.4: Export & Backup Options (Medium Priority)

**User Story:**
> As a privacy-conscious user,  
> I want to export all my journal entries,  
> So that I own my data and can back it up externally.

**Acceptance Criteria:**
- [ ] Settings page: "Export Journal"
- [ ] Export formats:
  - **PDF**: Nicely formatted with dates, moods, entries
  - **JSON**: Machine-readable (for developers/data nerds)
  - **TXT**: Plain text (simple backup)
- [ ] Export options:
  - All entries
  - Date range (e.g., "January 2025")
  - Specific moods (e.g., "All happy entries")
- [ ] Download button → generates file → auto-downloads
- [ ] Email option: "Email me the export"

**Monetization Angle:**
- **Free Tier**: Export last 30 days (TXT format only)
- **Premium Tier**: Unlimited exports, all formats (PDF, JSON, TXT)

**Success Metrics:**
- 15%+ of users export at least once
- 10%+ convert to premium for PDF exports

**Priority:** Medium  
**Effort:** Medium (4-5 days)  
**Impact:** Medium (trust builder, privacy feature)

---

### Feature 2.5: Advanced Journal Features - Premium Tier (Low Priority - Phase 2)

**User Story:**
> As a power user who journals daily,  
> I want advanced features like voice journaling, AI insights, and unlimited entries,  
> So that I get the most value from my journal.

**Acceptance Criteria:**
- [ ] **Voice Journaling**:
  - Option to speak responses instead of typing
  - Transcription via Whisper API
  - Fallback to text if voice fails
- [ ] **AI Insights** (ChatGPT-powered):
  - "Key Themes This Month" (topic extraction)
  - "Suggested Actions" based on journal content
  - "Patterns Detected" (e.g., "You mention 'stress' every Monday")
- [ ] **Unlimited Entries**:
  - Free tier: 1 entry per day
  - Premium tier: Unlimited entries (journal anytime)
- [ ] **Custom Prompts**:
  - User can add their own prompts
  - Save custom prompt templates

**Monetization Angle:**
- **Premium Tier Only** ($9/mo or $90/year)
- Target: Power users, daily journalers

**Success Metrics:**
- 5%+ of free users upgrade to premium
- Premium users have 3x higher retention

**Priority:** Low (Phase 2)  
**Effort:** Large (8-10 days)  
**Impact:** High (revenue driver)

---

## PART 3: PRIORITY MATRIX

### High-Impact, Low-Effort (DO FIRST - Quick Wins)

1. **Email Summaries** (Journal) — 2-3 days — High impact on retention
2. **Personalized Recommendations** (Dashboard) — 2-3 days — Increases engagement

### High-Impact, Medium-Effort (DO NEXT - Core Features)

3. **Journal History & Timeline** (Journal) — 5-6 days — Core feature, high user demand
4. **Mood Tracking & Insights** (Journal) — 6-7 days — Differentiation from competitors
5. **Insights & Analytics** (Dashboard) — 4-5 days — Drives retention, shows value
6. **Goal Setting** (Dashboard) — 5-6 days — Gamification, retention booster

### Medium-Impact, Medium-Effort (DO LATER - Nice-to-Haves)

7. **Export & Backup** (Journal) — 4-5 days — Trust builder, privacy feature

### Low Priority (Phase 2 - Revenue Drivers)

8. **Notifications & Streaks** (Dashboard) — Medium effort — Requires push setup
9. **Advanced Journal Features** (Journal) — Large effort — Premium tier unlocks

---

## PART 4: MONETIZATION STRATEGY

### Revenue Model: Freemium SaaS

**Free Tier (Generous):**
- Unlimited chat conversations
- Daily journal (1 per day)
- Basic dashboard (stats, quick actions)
- View last 30 days of journal history
- Basic mood tracking (7-day trends)
- Daily email summaries
- 1 goal at a time

**Premium Tier ($9/mo or $90/year — 17% discount):**
- **Journal:**
  - Unlimited journal entries (multiple per day)
  - Unlimited history (view all entries forever)
  - Advanced mood insights (30-day trends, correlations)
  - Weekly + monthly email summaries
  - Export to PDF, JSON, TXT (unlimited)
  - Voice journaling (transcription)
  - AI-powered insights (themes, patterns, suggestions)
  - Custom prompts
- **Dashboard:**
  - Advanced analytics (yearly views, custom date ranges)
  - Unlimited goals
  - Goal history & progress tracking
  - AI recommendations (personalized)
  - Priority support

**Value Proposition:**
> "Upgrade to Premium for unlimited journaling, deep insights, and AI-powered growth tracking — just $0.30/day."

**Conversion Funnel:**
1. **Free signup** → User experiences core features
2. **Hit limit** → User hits journal history limit (30 days) or tries to journal twice in one day
3. **Upgrade prompt** → Modal: "Unlock unlimited history and entries with Premium"
4. **Trial** → 7-day free trial (no credit card required)
5. **Convert** → User subscribes ($9/mo or $90/year)

**Target Conversion Rate:** 5-8% (industry standard for freemium SaaS)

**Revenue Projections (Example):**
- 10,000 users → 500-800 premium subscribers
- Revenue: $4,500 - $7,200/mo ($54K - $86K/year)
- My 20% cut: $10,800 - $17,200/year (at 10K users)

**Growth Levers:**
- Increase user base (marketing, SEO, word-of-mouth)
- Increase conversion rate (better onboarding, value demonstration)
- Reduce churn (deliver continuous value, add features)

---

## PART 5: COMPETITIVE ANALYSIS

### Key Competitors

| App | Pricing | Strengths | Weaknesses | Our Advantage |
|-----|---------|-----------|------------|---------------|
| **Day One** | $50/year | Beautiful UI, sync, photo support | Not AI-powered, no insights | We have AI insights + voice |
| **Reflectly** | $90/year | AI prompts, mood tracking | Expensive, basic analytics | Better analytics + lower price |
| **Stoic** | $60/year | Morning + evening check-ins | Philosophy-focused, niche | Broader appeal, RGY framework |
| **Notion** | Free + $10/mo | Flexible, customizable | Complex, not journal-focused | Simple, focused experience |
| **Penzu** | $50/year | Privacy-focused, encrypted | No AI, basic features | AI + encryption combo |

**Our Differentiators:**
1. **Voice + Text Journaling** — Competitors are mostly text-only
2. **RGY Framework** — Unique color-based life categorization
3. **AI-Powered Insights** — Not just storage, actual insights
4. **Integration with CubiQo Chat** — Journal informs AI conversations
5. **Lower Price Point** — $90/year (Reflectly) vs. $90/year (us) but we offer more
6. **Open Source** — Users can self-host if they want

---

## PART 6: PHASED ROADMAP (12 Weeks)

### Weeks 1-2: Quick Wins (Email + Recommendations)
- **Week 1:** Implement email sending (journal summaries)
- **Week 2:** Add personalized recommendations (dashboard)
- **Goal:** Ship fast, get user feedback

### Weeks 3-5: Journal Core Features
- **Week 3:** Journal history & timeline view
- **Week 4:** Mood tracking & insights page
- **Week 5:** Testing, polish, bug fixes
- **Goal:** Make journal a daily habit driver

### Weeks 6-8: Dashboard Core Features
- **Week 6:** Insights & analytics (charts, trends)
- **Week 7:** Goal setting & progress tracking
- **Week 8:** Testing, polish, bug fixes
- **Goal:** Turn dashboard into a retention tool

### Weeks 9-10: Export & Backup
- **Week 9:** Export functionality (PDF, JSON, TXT)
- **Week 10:** Testing, polish, security audit
- **Goal:** Build trust with privacy features

### Weeks 11-12: Premium Tier Prep
- **Week 11:** Define premium tiers, pricing UI, payment integration (Stripe)
- **Week 12:** Launch premium tier (soft launch to beta users)
- **Goal:** Start generating revenue

### Phase 2 (Weeks 13-24): Advanced Features
- Voice journaling
- AI insights (ChatGPT integration)
- Notifications & streaks
- Custom prompts
- Mobile app considerations

---

## PART 7: SUCCESS METRICS (North Star KPIs)

### Retention Metrics
- **DAU/MAU Ratio:** Target 40%+ (daily active users / monthly active users)
- **7-Day Retention:** Target 50%+ (% of users who return after 7 days)
- **30-Day Retention:** Target 30%+ (% of users who return after 30 days)

### Engagement Metrics
- **Journal Entries per User:** Target 12+ per month (3 per week)
- **Dashboard Views per User:** Target 8+ per month (2 per week)
- **Goal Completion Rate:** Target 60%+ (% of set goals completed)

### Monetization Metrics
- **Free → Premium Conversion:** Target 5-8%
- **MRR (Monthly Recurring Revenue):** Track monthly
- **Churn Rate:** Target <5% per month (premium users)
- **LTV (Lifetime Value):** Target $200+ (based on $9/mo, 22-month retention)

### User Satisfaction
- **NPS (Net Promoter Score):** Target 40+ (measure quarterly)
- **Feature Satisfaction:** Target 4+ stars (in-app feedback)
- **Support Tickets:** Target <5% of users (low support burden)

---

## PART 8: RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Users don't want to pay** | High | Medium | Free tier is generous, premium adds clear value |
| **Competitors copy our features** | Medium | High | Move fast, focus on AI integration (our moat) |
| **Low conversion rates** | High | Medium | A/B test pricing, improve onboarding, add trial |
| **Technical debt accumulates** | Medium | Medium | Allocate 20% time for refactoring |
| **Churn after free trial** | High | Medium | Deliver value early, showcase premium features |
| **Privacy concerns (journal data)** | High | Low | Encrypt entries, offer self-hosting, transparent privacy policy |

---

## PART 9: QUESTIONS FOR CEO & TEAM

### For CEO (Strategic)
1. **Pricing approval:** Is $9/mo or $90/year the right price point? Should we test $7/mo or $12/mo?
2. **Timeline approval:** Is 12 weeks realistic for Phase 1? Can we descope if needed?
3. **Resource allocation:** Do we have budget for Stripe integration (payment processor)?
4. **Market positioning:** Are we targeting casual journalers or power users first?

### For MO (Technical)
1. **Email sending:** Which provider should we use? (SendGrid, Resend, Postmark)
2. **Payment processor:** Stripe or LemonSqueezy? (Stripe is standard, LemonSqueezy handles taxes)
3. **Database performance:** Can Supabase handle 10K+ journal entries per day with search?
4. **AI insights:** Should we use OpenAI API for insights or build custom models?

### For Team (Execution)
1. **Design:** Can Pushpa create mockups for journal history and insights pages?
2. **Frontend:** Can Bubbles build timeline view and mood charts?
3. **Backend:** Can Blossom implement email sending and export functionality?
4. **QA:** Can Buttercup create test plans for all new features?

---

## PART 10: FINAL RECOMMENDATIONS

### My Top 3 Priorities (As Product Owner)

**1. Ship Email Summaries (Week 1)**
- **Why:** Quick win, high user delight, low effort
- **Impact:** Increases perceived value, builds trust
- **ROI:** High (2 days effort → 10%+ retention boost)

**2. Build Journal History (Weeks 3-5)**
- **Why:** Core feature, users expect this, blocking premium tier
- **Impact:** Enables monetization (free = 30 days, premium = unlimited)
- **ROI:** High (6 days effort → unlocks revenue)

**3. Add Mood Tracking & Insights (Weeks 3-5)**
- **Why:** Differentiation from competitors, high user value
- **Impact:** Makes journal sticky, shows progress over time
- **ROI:** High (7 days effort → 15%+ engagement boost)

### What I'm Saying NO To (For Now)

- ❌ **Mobile App:** Not until we validate product-market fit on web
- ❌ **Social Features:** No sharing journal entries (privacy risk)
- ❌ **Integrations:** No Zapier/IFTTT until we have premium tier working
- ❌ **White-Label:** No B2B offering until we have strong B2C traction

### What I Need From You (CEO/MO)

1. **Approve this plan** — Or give me feedback to revise
2. **Commit resources** — Bubbles (frontend), Blossom (backend), Guy (database)
3. **Set deadlines** — I need clear sprint goals and ship dates
4. **Budget approval** — For email service ($50/mo), Stripe fees (2.9% + $0.30)
5. **Weekly check-ins** — 30-minute sync to review progress and blockers

---

## PART 11: APPROVAL & SIGN-OFF

- [ ] **CEO:** Strategic direction approved
- [ ] **MO:** Technical feasibility confirmed
- [ ] **JO (Me):** Product requirements finalized
- [ ] **Team:** Sprint planning complete

**Signatures:**
- CEO: _________________ Date: _______
- MO: _________________ Date: _______
- JO: _________________ Date: _______

---

## APPENDIX: User Stories Summary

### Dashboard User Stories
1. **Insights & Analytics:** As a returning user, I want to see my usage patterns and insights
2. **Goal Setting:** As a motivated user, I want to set goals and track progress
3. **Recommendations:** As a user looking for inspiration, I want CubiQo to recommend what to do next
4. **Streaks:** As a user building a habit, I want reminders and streak counters

### Journal User Stories
1. **History:** As a regular journaler, I want to see all my past journal entries
2. **Mood Tracking:** As a self-aware user, I want to track my mood over time
3. **Email Summaries:** As a user who journals regularly, I want to receive my entry via email
4. **Export:** As a privacy-conscious user, I want to export all my entries
5. **Voice Journaling:** As a busy user, I want to speak my journal entries instead of typing
6. **AI Insights:** As a power user, I want AI-powered insights from my journal

---

**Document Version:** 1.0  
**Last Updated:** February 17, 2025  
**Next Review:** After CEO/MO approval  
**Status:** Ready for Review

---

## TL;DR (For Busy Executives)

**What:** Build on existing dashboard + journal features to drive retention and revenue

**Why:** Current features are MVPs — missing core features (history, insights, export) that users expect

**How:** 12-week phased rollout → Quick wins (email, recommendations) → Core features (history, mood tracking, analytics) → Premium tier launch

**Business Impact:**
- **Retention:** 7-day retention from 40% → 60% (goal setting, insights, streaks)
- **Engagement:** DAU/MAU from 30% → 50% (journal becomes daily habit)
- **Revenue:** 5-8% conversion to premium → $54K-$86K/year (at 10K users) → $10K-$17K for my 20% stake

**What I Need:**
1. Approval to proceed
2. Resource commitment (Bubbles, Blossom, Guy)
3. Budget for email service + Stripe
4. Weekly check-ins

**Next Steps:**
1. CEO/MO review this doc
2. Schedule kickoff meeting
3. Start Week 1 (email summaries)

---

*"Your 20% co-owner, obsessed with product-market fit and revenue. Let's ship this."* — JO
