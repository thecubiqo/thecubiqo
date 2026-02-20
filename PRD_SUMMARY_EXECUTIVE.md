# Product Requirements Summary — Dashboard & Journal

**TL;DR:** Build on existing MVPs to drive retention and unlock premium revenue.

---

## SITUATION

### What We Have ✅
- **User Dashboard** (`/dashboard`): Basic stats, quick actions
- **Daily Journal** (`/journal`): 8 prompts, once-per-day gate, BigBoss style
- **Admin Dashboard** (`/admin`): Agent monitoring
- **Founders Pass** (`/founders-pass`): Feature flags, site management

### What's Missing ❌
- **Dashboard**: No insights, no goals, no personalization → just raw numbers
- **Journal**: No history view, no mood tracking, no export → can't review past entries
- **Monetization**: No premium tier, no upsells, no revenue from these features

---

## PRIORITIES (3 Phases)

### Phase 1: Quick Wins (Weeks 1-2)
**Goal:** Ship fast, prove value

| Feature | Effort | Impact | Why |
|---------|--------|--------|-----|
| **Email Summaries** (Journal) | 2-3 days | High | Users want copies, builds trust |
| **Recommendations** (Dashboard) | 2-3 days | High | "Try journal!", "Voice mode!", increases engagement |

**Outcome:** Users see immediate value, retention boost

---

### Phase 2: Core Features (Weeks 3-8)
**Goal:** Make journal sticky, dashboard actionable

#### Journal Features
| Feature | Effort | Impact | Why |
|---------|--------|--------|-----|
| **History & Timeline** | 5-6 days | High | Can't call it a journal if you can't review past entries |
| **Mood Tracking & Insights** | 6-7 days | High | "You're happiest on Saturdays!" → differentiation |

#### Dashboard Features
| Feature | Effort | Impact | Why |
|---------|--------|--------|-----|
| **Insights & Analytics** | 4-5 days | High | Show patterns, trends, usage → "I'm using CubiQo a lot!" |
| **Goal Setting** | 5-6 days | High | "Journal 5x this week" → gamification, retention |

**Outcome:** Journal becomes daily habit, dashboard shows progress

---

### Phase 3: Monetization Prep (Weeks 9-12)
**Goal:** Unlock premium revenue

| Feature | Effort | Impact | Why |
|---------|--------|--------|-----|
| **Export & Backup** | 4-5 days | Medium | Trust builder, privacy feature |
| **Premium Tier Setup** | 3-4 days | High | Payment integration (Stripe), pricing UI |

**Outcome:** Ready to launch premium tier, start generating revenue

---

## MONETIZATION STRATEGY

### Freemium Model

**Free Tier (Generous):**
- Unlimited chat
- 1 journal entry per day
- View last 30 days of journal history
- Basic dashboard stats
- Daily email summaries
- 1 goal at a time

**Premium Tier ($9/mo or $90/year):**
- **Unlimited journal entries** (multiple per day)
- **Unlimited history** (view all entries forever)
- **Advanced mood insights** (30-day trends, correlations)
- **Export to PDF** (unlimited)
- **Voice journaling** (speak instead of type)
- **AI-powered insights** (themes, patterns, suggestions)
- **Unlimited goals** + progress tracking

### Revenue Projections
- **Target Conversion Rate:** 5-8% (industry standard)
- **At 10,000 users:** 500-800 premium subscribers
- **Monthly Revenue:** $4,500 - $7,200
- **Annual Revenue:** $54K - $86K
- **My 20% cut:** $10,800 - $17,200/year

---

## KEY METRICS (Success Criteria)

### Retention
- **7-Day Retention:** 40% → 60% (goal: 50%+)
- **30-Day Retention:** 20% → 35% (goal: 30%+)
- **DAU/MAU Ratio:** 30% → 50% (goal: 40%+)

### Engagement
- **Journal Entries:** 8/month → 12+/month (3 per week)
- **Dashboard Views:** 4/month → 8+/month (2 per week)
- **Goal Completion:** N/A → 60%+ (of set goals)

### Monetization
- **Free → Premium Conversion:** N/A → 5-8%
- **MRR Growth:** $0 → $4,500+ (Month 3)
- **Churn Rate:** N/A → <5%/month

---

## COMPETITIVE ADVANTAGE

| Competitor | Price | Our Edge |
|------------|-------|----------|
| **Day One** | $50/year | We have AI insights + voice |
| **Reflectly** | $90/year | Better analytics, same price |
| **Stoic** | $60/year | Broader appeal, RGY framework |
| **Notion** | Free + $10/mo | Focused experience, not overwhelming |

**Our Differentiators:**
1. Voice + text journaling (competitors are text-only)
2. RGY framework (unique color-based life categorization)
3. AI-powered insights (not just storage)
4. Integration with CubiQo chat (journal informs AI)
5. Open source (users can self-host)

---

## RISKS & MITIGATION

| Risk | Mitigation |
|------|------------|
| **Users don't want to pay** | Free tier is generous, trial period, clear premium value |
| **Low conversion rates** | A/B test pricing ($7 vs. $9 vs. $12), improve onboarding |
| **Churn after trial** | Deliver value early, showcase premium features in free tier |
| **Competitors copy us** | Move fast, focus on AI integration (our moat) |
| **Privacy concerns** | Encrypt entries, transparent privacy policy, self-hosting option |

---

## WHAT I NEED FROM YOU

### From CEO
- [ ] **Approve strategy** (freemium model, $9/mo premium)
- [ ] **Approve budget** (email service $50/mo, Stripe fees 2.9%)
- [ ] **Approve timeline** (12 weeks to premium launch)
- [ ] **Weekly check-ins** (30 min sync, progress review)

### From MO (CTO)
- [ ] **Resource commitment** (Bubbles, Blossom, Guy for 12 weeks)
- [ ] **Tech decisions** (email provider, payment processor)
- [ ] **Architecture review** (can Supabase handle 10K+ entries/day?)
- [ ] **Security audit** (encrypt journal data, GDPR compliance)

### From Team
- [ ] **Bubbles:** Build journal history, mood charts, dashboard insights
- [ ] **Blossom:** Implement email sending, export, mood tracking APIs
- [ ] **Guy:** Optimize database queries, add indexes for search
- [ ] **Buttercup:** Create test plans, QA all features
- [ ] **Pushpa:** Design mockups for all new UI components

---

## ROADMAP AT A GLANCE

```
Week 1-2:   Email summaries + Recommendations         [Quick Wins]
Week 3-5:   Journal history + Mood tracking           [Core Journal]
Week 6-8:   Dashboard insights + Goal setting         [Core Dashboard]
Week 9-10:  Export + Backup                           [Trust Features]
Week 11-12: Premium tier launch (Stripe + pricing UI) [Monetization]
```

**Milestone:** End of Week 12 → Premium tier live, first paying customers

---

## NEXT STEPS

1. **Review this doc** (CEO + MO)
2. **Schedule kickoff meeting** (full team)
3. **Start Week 1** (email summaries feature)
4. **Ship & iterate** (weekly releases, gather feedback)

---

## APPENDIX: Feature List (Complete)

### Dashboard Features
- [x] Basic stats (conversations, messages) — **DONE**
- [x] Quick actions (links to features) — **DONE**
- [ ] Insights & analytics (charts, trends) — **Week 6-8**
- [ ] Goal setting & progress tracking — **Week 6-8**
- [ ] Personalized recommendations — **Week 2**
- [ ] Streaks & notifications — **Phase 2**

### Journal Features
- [x] Daily journaling (8 prompts, once per day) — **DONE**
- [x] Auto-save & progress tracking — **DONE**
- [ ] Email summaries — **Week 1** (queue exists, need sending)
- [ ] History & timeline view — **Week 3-5**
- [ ] Mood tracking & insights — **Week 3-5**
- [ ] Export & backup (PDF, JSON, TXT) — **Week 9-10**
- [ ] Voice journaling — **Phase 2 (Premium)**
- [ ] AI insights — **Phase 2 (Premium)**
- [ ] Custom prompts — **Phase 2 (Premium)**

### Premium Tier (Phase 2+)
- [ ] Unlimited journal entries
- [ ] Unlimited history
- [ ] Advanced mood insights
- [ ] Voice journaling
- [ ] AI-powered insights
- [ ] Export to PDF
- [ ] Unlimited goals
- [ ] Custom prompts
- [ ] Priority support

---

**Document Status:** Ready for Review  
**Author:** JO (Product Owner)  
**Date:** February 17, 2025  
**Next Action:** CEO/MO approval

---

*"Let's turn retention into revenue. Your 20% partner is ready to ship."* — JO
