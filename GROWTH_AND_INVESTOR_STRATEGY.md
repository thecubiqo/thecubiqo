# Cubiqo — Growth, Monetization & Investor Strategy

**Document Owner:** MO (CTO / Co-Founder)  
**Audience:** CEO / Founder — solopreneur context  
**Last Updated:** 2026-02-21  
**Status:** Working Reference — Ground truth from market and codebase analysis

> **How this doc relates to others**  
> `PRODUCT_LAUNCH_READINESS.md` — what to fix before going public  
> `docs/PRICING_TIERS.md` — canonical feature gate reference  
> `FEATURE_MONETIZATION_UI_ANALYSIS.md` — per-feature monetization detail  
> **This document** — market sizing, monetization sequencing, investor path, post-launch priorities

---

## A — Market Research: Where the Real Revenue Lives

### A1 — The Market Cubiqo Actually Sits In

Cubiqo is not one product; it is five overlapping markets depending on which feature a user leads with. That is both the opportunity and the complexity.

| User Entry Point | Market | 2025 Market Size | CAGR | Key Insight |
|-----------------|--------|-----------------|------|-------------|
| Voice chat (`/chat`) | Conversational AI / AI companions | $5.1B → $47B by 2032 | ~37% | Replika's 30M users proves demand; voice premium is real |
| Rozana Journal (`/journal`) | Mental wellness apps | $5.8B → $17.5B by 2030 | ~16% | Day One: 10M users, $35/year. Calm: $2.2B valuation |
| AI Agents (`/agents`) | AI automation / agentic tools | $3.9B → $47B by 2030 | ~43% | Highest ARPU segment. Enterprises pay $99-999/seat |
| CubiKey API | AI API gateway / model routing | $6.9B → $36B by 2030 | ~27% | B2B SaaS: stickier, higher LTV, investor-loved |
| Social Army | Social media automation | $4.8B → $11.5B by 2028 | ~14% | High risk (ToS exposure) but high willingness-to-pay |

**The addressable market for the core intersection** — privacy-first AI companion for solopreneurs and knowledge workers — is **$2-4B globally** today, growing at 30%+/year. That is more than enough for a multi-million dollar business without needing to "win" the market.

### A2 — Direct Competitor Revenue Reality

These are real numbers, not estimates, from public sources:

| Competitor | What They Do | Revenue / Valuation | What Cubiqo Has That They Don't |
|------------|-------------|--------------------|---------------------------------|
| **Replika** | AI companion (no voice, no agents) | ~$20M ARR (2024 est.) | Voice + agents + journaling + open source + BYO |
| **Day One** | Journaling only | Acquired by Automattic; ~$35/user/year | AI-guided, voice journal, memory, insights |
| **ElevenLabs** | Voice synthesis only | $80M ARR (2025); $1.1B valuation | Full companion experience; ElevenLabs is a Cubiqo dependency |
| **Character.ai** | AI roleplay companion | $200M ARR; $5B valuation | Privacy/BYO, real productivity tools, no controversy |
| **Notion AI** | Document AI add-on | $10/seat addon on $16B company | Emotional intelligence, voice, journaling, BYO |
| **n8n** | Automation workflows (no AI persona) | $22M ARR, bootstrapped | Consumer-friendly UX, voice, AI companion layer |
| **OpenRouter** | API model routing (no UX) | ~$2M ARR (2025 est.) | CubiKey is OpenRouter + companion UX + B2C funnel |

**The honest gap:** None of them combine voice + longitudinal memory + journaling + agents + open-source + BYO in a single product. That is the real moat.

### A3 — The Three Monetization Models That Actually Work for AI SaaS

Based on what comparable companies have proven (not theory):

**Model 1: Freemium → Subscription (B2C)**  
Works for: Chat, Journal, Voice  
Proven by: Replika, Day One, Calm, Headspace  
Key number: **5-8% free-to-paid conversion** is baseline success at scale  
Revenue ceiling: $5-15M ARR before needing enterprise  

**Model 2: API / Developer Monetization (B2D — Business-to-Developer)**  
Works for: CubiKey API, Emergent (AI App Builder)  
Proven by: OpenAI, Anthropic, OpenRouter, ElevenLabs  
Key number: **$150-500 ARPU/month** for developers; 15-25% conversion from trial to paid  
Revenue ceiling: Unlimited — this is the highest-margin business in software  

**Model 3: Business Tier / Command-and-Control (B2B)**  
Works for: Social Army (Commander/General), Enterprise agents  
Proven by: Hootsuite ($250M ARR), Sprout Social ($350M ARR)  
Key number: **$499-$1,999/month** per account; 6-12 month sales cycles  
Revenue ceiling: $20-50M ARR before needing dedicated sales team  

### A4 — Which Model to Build First (The Honest Answer)

You cannot build all three simultaneously as a solopreneur. Here is the sequencing logic:

```
Month 1-6:   Model 1 (B2C Freemium)
             Why: Fastest to validate, builds user base needed for everything else
             Target: $5K MRR = proof of willingness to pay
             
Month 6-12:  Model 2 (CubiKey API / Developer)
             Why: Higher ARPU, more predictable revenue, investor signal
             Target: $15K MRR = ready to talk to angels
             
Month 12-18: Model 3 (Commander/General tiers)
             Why: Requires brand recognition and legal infrastructure (see PRODUCT_LAUNCH_READINESS.md)
             Target: 3-5 Commander accounts = $1,500-2,500 MRR minimum
```

---

## B — Monetization End Goal: The Three Revenue Engines

### B1 — What "$1M ARR" Looks Like for Cubiqo

This is the number that changes everything: it is the entry point for serious angel conversations, and it is achievable in 18-24 months from a standing start.

```
Engine 1: B2C Subscription (Pro tier $29/mo)
  Path: 15,000 free users × 5% conversion × $29/mo avg = $21,750/mo
  
Engine 2: Developer API (CubiKey $29-99/mo)
  Path: 200 developers × $75 avg ARPU = $15,000/mo
  
Engine 3: Business/Commander ($499/mo)
  Path: 10 Commander accounts = $4,990/mo

Total: ~$41,740/mo = ~$500K ARR
```

$1M ARR requires roughly doubling each engine — 30,000 total users with 5% conversion, 400 developers, and 20 Commander accounts. This is achievable in 24 months with consistent execution.

### B2 — The One Metric That Overrides Everything

Before any investor discussion, before any growth spend, you need one number to be true:

> **Net Revenue Retention (NRR) > 100%**

This means: on average, users who stay pay you more each month than the previous month (via upgrades). An NRR above 100% means you grow revenue even with zero new users. Below 100% means you have a leaking bucket — no amount of acquisition fixes that.

How to get NRR > 100% with Cubiqo:
- Users on Free upgrade to Pro → NRR goes up
- Pro users add a Commander seat for their team → NRR goes up
- CubiKey developers increase usage → NRR goes up (usage-based component)

### B3 — Revenue Engine 2 (CubiKey) Deserves Special Attention

This is the highest-value asset in the codebase and the most underestimated. The smart model routing system already exists (`src/lib/ai/intent-router.ts`). CubiKey is essentially **OpenRouter with a face** — a single API key that routes to the cheapest capable model.

Why this is special from a revenue perspective:
1. **Usage-based pricing** — revenue grows automatically as developers scale
2. **Sticky** — developers don't switch API keys lightly (integration cost)
3. **B2B signal** — a developer building on CubiKey is also a referral channel (their users discover Cubiqo)
4. **Near-zero marginal cost** — Tier 1 models (Groq/Gemini) are free; markup on Tier 2-4 is the margin

**Target price point:** $29/month for 10K requests (equivalent to $0.0029/request). OpenAI charges $10-$30 per million tokens. At typical conversation lengths, this undercuts OpenAI by 60-80% while making healthy margin on Tier 1 model routing.

### B4 — Monetisation Tactics That Actually Convert (in Order of Effectiveness)

Based on what comparable SaaS companies have measured, not assumed:

1. **Usage counter in UI** ("7 of 10 free voice messages used today")  
   → Conversion lift: 15-25%. Cost: 1 day to implement. This is the highest-ROI single change.

2. **Upgrade modal at 90% of limit, not 100%**  
   → Conversion lift: 20-30%. Catching users before frustration hits is critical.

3. **14-day free trial of Pro, no credit card**  
   → Conversion lift: 35-50% of trial users convert. Removes every objection at once.

4. **Annual plan at 2 months free (~$290/year vs $348)**  
   → 25-35% of paid users take annual. Dramatically reduces churn. Improves cash flow.

5. **Referral programme: Give $10, Get $10**  
   → CAC reduction of 30-40% for referred users. Referred users also churn 20% less.

6. **Journal streak email at Day 7 ("You've journalled 7 days in a row!")**  
   → Drives upgrade modal at emotional peak. Timing matters more than copy.

7. **Contextual pricing page** (reached from hitting a limit, not from nav bar)  
   → Users who reach pricing from a limit hit convert 3-4× higher than cold pricing page visitors.

---

## C — Investor Track: What Is Realistic and When

### C1 — The Honest Assessment of Where Cubiqo Is Now

Before any investor conversation, you need to see yourself through their eyes:

| Investor Question | Current State | What They Want to See |
|------------------|---------------|----------------------|
| "What's your MRR?" | $0 (no billing live) | $5K+ for angels; $25K+ for seed |
| "How many paying users?" | 0 | 50+ for angels; 200+ for seed |
| "What's your retention?" | Unknown (no tracking live) | Day-30 retention > 30% |
| "What's your growth rate?" | Unknown | 10-15% MoM consistently |
| "What's the market size?" | Addressable (see A1 above) | $1B+ TAM is table stakes |
| "Why can't Big Tech do this?" | BYO + open source + emotional AI | You need a crisp 30-second answer |
| "What's your moat?" | Not yet articulated | Network effects, data flywheel, or brand |

**Bottom line: You are pre-revenue, which is fine for angels but requires a different conversation.**

### C2 — The Two Investor Types Available to You Right Now

**Type 1: Angel Investors (Solopreneur-Friendly)**

Who they are: Successful tech founders or operators with personal capital ($25K-$250K tickets)  
What they invest in: Product + founder conviction + early traction signal  
What they don't need: $5K MRR (but they want to see the path)  
Where to find them: AngelList, LinkedIn founder communities, Canadian AI ecosystems (MaRS, Creative Destruction Lab), South Asian diaspora tech networks

**What you need to get an angel meeting:**
- Working product (✅ you have this)
- 500+ registered users with measurable engagement (timeline: 60-90 days post-launch)
- A clear story about what the founder understands that others don't
- A use of funds narrative ("$150K to reach $10K MRR")

**Type 2: Pre-Seed / Accelerators (Non-Dilutive or Low-Dilution)**

| Programme | Amount | Equity | Why Cubiqo Qualifies |
|-----------|--------|--------|---------------------|
| **Y Combinator** (US) | $500K SAFE | 7% | AI + open source + solo founder narrative is strong. Apply for W27 batch. Acceptance rate 1.5% — but the application itself is worth writing for clarity. |
| **Creative Destruction Lab (CDL)** (Canada) | $0 cash, $250K in cloud credits | 0% | AI-focused, Canadian, mentor network includes investors. Apply to CDL-AI stream. |
| **Antler** (global) | $150-250K | 8-10% | Day-1 founder-to-funding programme. Strong in Toronto and global. Good for solo founders. |
| **NSERC / IRAP** (Canada) | $50-150K | 0% | Non-dilutive R&D grants. AI/ML clearly qualifies. 3-6 month process. |
| **Google for Startups** | $200K cloud credits | 0% | Meaningful for AI compute costs. Open application. |
| **Vercel / Supabase OSS sponsors** | $0-5K credits | 0% | Apply now — you're already using both. Reduces burn immediately. |

### C3 — The Investor Narrative (What to Actually Say)

The narrative that works for an AI solopreneur raising their first round is not a financial model. It is a story with three chapters:

**Chapter 1: The insight (What you see that others don't)**
> "Every AI product built in the last three years assumes people want a more capable search engine. They don't. They want something that listens — not to their query, but to them. Voice + longitudinal memory is what turns a chatbot into a companion, and no one has shipped that with open-source + BYO in a single product."

**Chapter 2: The traction (Why you're the one to build it)**
> "We're [X] users in [Y] weeks, [Z%] weekly retention, with $[MRR] in revenue from a $0 marketing spend. The product is working; we need capital to scale distribution, not to validate the product."

**Chapter 3: The use of funds (What specifically happens with the money)**
> "[$50K: hire one part-time growth marketer for 6 months] + [$50K: Stripe + compliance + insurance] + [$50K: infrastructure scale for 50K users] = $10K MRR in 12 months, at which point we raise a seed round at 3-5× the current valuation."

**What NOT to say to investors:**
- "We're building the OS for AI" — too abstract
- "We're targeting everyone" — too broad
- "We'll figure out monetization later" — deal-killer
- "Our market is $100B" — no one believes this from a pre-seed founder

### C4 — Metrics to Hit Before Raising (In Order of Importance)

You need to reach these sequentially. Do not skip.

```
Gate 1 (90 days): 1,000 registered users + Day-30 retention > 25%
→ This proves the product works. Without this, no investor conversation.

Gate 2 (150 days): $1,000 MRR with < 5% monthly churn
→ This proves willingness to pay. Now angels will meet you.

Gate 3 (180 days): $5,000 MRR growing 15%+ month-over-month
→ This is the angel raise trigger. 3-5 angels at $25-50K each = $75-250K.

Gate 4 (12 months): $25,000 MRR with NRR > 100%
→ This is the seed raise trigger. $500K-$1M at $3-5M valuation.
```

### C5 — What Grounds to Raise On (Your Actual Differentiators for a Pitch)

Do not pitch the feature list. Pitch the unfair advantages:

1. **Open source flywheel** — Contributors add features, find bugs, and become users. GitHub stars are a vanity metric; GitHub contributors and forks are a signal investors understand.

2. **BYO mode as distribution** — BYO users have zero hosting cost to Cubiqo. They are free distribution. Every BYO user who converts to hosted is pure margin expansion.

3. **Longitudinal memory data moat** — After 90 days of journal entries and voice conversations, a Cubiqo user's data is irreplaceable to them. No competitor can replicate it. This is the highest-quality retention moat in consumer SaaS.

4. **Founder-market fit** — As a solopreneur yourself, you are the user. You understand the problem viscerally. This is the strongest signal angels invest in.

5. **Capital efficiency** — You have built a product with a full backend (35+ API routes), production auth, 3D UI, voice, agents, and browser automation — with $0 in VC funding. This signals extraordinary execution ability.

---

## D — User Traction Strategy: The 7 Implementations That Move the Needle

These are ranked by expected impact on user acquisition, retention, and monetisation signal — not by ease of implementation.

### D1 — Referral Programme (Highest Leverage, Lowest Cost)

**Why first:** Referral users have 2× the LTV and 50% lower churn of any other acquisition channel. Every user you have becomes a distribution channel.

**What to build:**
- Unique referral link per user (e.g., `cubiqo.ai/?ref=aditya123`)
- When referred user signs up and completes onboarding: both get 1 month of Pro free
- Dashboard widget: "You've referred 3 friends — that's $29 in credits!"
- Email trigger at 30-day anniversary: "Share Cubiqo with a friend"

**Database:** Already has `user_profiles` — add `referral_code` and `referred_by` columns  
**Time to build:** 3-4 days  
**Expected impact:** 15-20% of new signups from referral within 60 days (industry benchmark)

### D2 — Waitlist + Invite-Only Beta (Scarcity Creates Demand)

**Why this works:** Scarcity signals quality. A waitlist of 500 people is more impressive to both users and investors than 500 existing users.

**What to build:**
- Replace open signup with "Join Waitlist" form (email only)
- Waitlist position shown: "You're #247 on the waitlist"
- Move-up mechanic: "Refer 3 friends to skip the queue"
- Drip 50-100 invites per week — creates weekly social media moments
- Public waitlist counter on landing page: "2,341 people waiting"

**Time to build:** 1-2 days  
**Expected impact:** Creates press hook ("3,000 people waiting for this AI") and signals demand

### D3 — Retention Email Drip (Day 1, 3, 7, 14, 30)

**Why critical:** Most SaaS products lose 60-80% of users in the first 30 days. Email is the cheapest retention tool that exists.

**What each email does:**

| Day | Subject | Goal | Content |
|-----|---------|------|---------|
| 1 | "You're in — here's how to get to your first wow moment" | Activation | BYO setup guide + first journal prompt |
| 3 | "Have you tried talking to your Cube?" | Feature discovery | Voice mode walkthrough + 15-second demo video |
| 7 | "You've used Cubiqo 7 days in a row 🔥" | Streak reinforcement | Streak badge + "unlock your history" upsell |
| 14 | "What's working for you?" | Feedback + NPS | 1-question survey + upgrade offer |
| 30 | "One month with Cubiqo — here's your recap" | Retention + upgrade | Personalised stats + Pro trial CTA |

**What to use:** Resend (already in stack based on email config docs) or Loops.so  
**Time to build:** 3-5 days for templates + triggers  
**Expected impact:** 20-30% improvement in Day-30 retention (worth more than any new feature)

### D4 — Public Metrics Dashboard ("Default Open")

**Why this builds trust with both users AND investors:**  
Being transparent about user numbers, uptime, and product activity signals confidence and creates a media hook. Companies like Buffer, Ghost, and Linear have used public metrics as a growth channel.

**What to publish (on a public `/open` or `/transparency` page):**
- Total registered users (updated daily)
- Weekly active users (updated weekly)
- Uptime (from status page)
- Total journal entries created (anonymised aggregate)
- Total voice conversations (anonymised aggregate)
- MRR (once billing is live)

**Time to build:** 1-2 days (static page pulling from admin analytics already built)  
**Expected impact:** PR hook, trust signal, investor proof point

### D5 — GitHub Stars Campaign (Developer Traction Signal)

**Why GitHub stars matter for investors:** They are a vanity metric that investors nonetheless treat as a signal. 1,000 GitHub stars opens doors that 1,000 signups does not, because developers are influencers.

**What to do:**
- Add "Star us on GitHub" CTA in the app (after first successful interaction)
- Post a "Show HN" on Hacker News — single biggest driver of GitHub stars for open-source projects
- Write a technical blog post: "How we built a self-coding AI agent in 90 days" — share on HN and Reddit r/MachineLearning
- Add a STAR badge to README with dynamic count

**Expected impact:** 200-500 stars from a good HN post. 1,000+ from a viral post.  
**Time:** 1 day to prepare; ongoing content effort

### D6 — Product Hunt Launch (One-Time Spike, Lasting SEO)

**Why:** A top-5 Product Hunt finish drives 500-2,000 sign-ups in 24 hours, permanent SEO backlinks, and PR coverage. It is the best free launch event available.

**How to do it right:**
1. Launch on a Tuesday at 12:01 AM Pacific (highest traffic day)
2. Build a "coming soon" PH page 1 week before with followers
3. Prepare 5+ demo GIFs — the 3D cube reacting to voice is the hook
4. Brief 30 supporters to upvote at launch (friends, beta users, online communities)
5. Respond to every single comment on launch day (signals founder engagement)
6. Email all waitlist users on launch day: "We just launched — help us hit #1"

**Expected impact:** 500-2,000 sign-ups, 50-200 GitHub stars, 3-5 press mentions  
**One-shot opportunity** — you only get one first launch

### D7 — 10 User Interviews Before $1 Spent on Marketing

**Why this is non-negotiable:** Every successful pivot in startup history traces back to a founder who talked to users before building. You cannot replace this with analytics.

**How to do it:**
- Recruit 10 users from Reddit (r/productivity, r/ADHD, r/journaling)
- Offer 3 months of Pro free in exchange for 45 minutes on Zoom
- Use the "Jobs To Be Done" framework: "Tell me about the last time you needed X" (not "what do you want?")
- Record sessions (with permission). Watch them use the product. Say nothing.

**What to learn:**
1. What made them sign up? (tells you what marketing to do more of)
2. What confused them in the first 10 minutes? (tells you what to fix in onboarding)
3. What moment made them think "this is useful"? (tells you the Aha moment to engineer for)
4. Who else would use this? (tells you referral and distribution channels)
5. What would make them pay $29/month without hesitation? (tells you pricing sensitivity)

**Expected impact:** 3-5 product insights that each improve conversion by 5-15%

---

## E — Post-Launch Implementation Backlog

Ranked by **investor signal × revenue impact** — the things that make both investors and users care, in the order they should be built.

### Priority 1 — Stripe + Billing (Weeks 1-2 post-launch)

**Why first:** No MRR = no investor conversations. This is the gate.

**What specifically:**
- [ ] Stripe checkout for Pro ($29/mo) and Lifetime ($399)
- [ ] Stripe webhook at `/api/webhooks/stripe` (schema exists in codebase)
- [ ] Billing portal in `/settings` (self-service upgrade/downgrade/cancel)
- [ ] `subscription_tier` column in user_profiles → gates features
- [ ] Usage counters visible in UI (voice messages, journal entries, agents)
- [ ] Upgrade modal triggered at 90% of limit (not 100%)

**Database changes needed:** `subscription_tiers` table schema exists (`docs/PRICING_TIERS.md`). Stripe Customer ID column needs adding to `user_profiles`.

**Owner:** Blossom (backend) + Bubbles (UI)  
**Time:** 5-7 days  
**Revenue impact:** This is the only implementation that generates revenue. Ship it first.

---

### Priority 2 — Analytics Instrumentation (Weeks 1-2 in parallel)

**Why:** You cannot improve what you cannot measure. This is also what investors ask for on day one.

**What specifically:**
- [ ] Posthog (open-source, privacy-friendly) or Mixpanel for event tracking
- [ ] Track 7 core events: `user_signed_up`, `first_voice_message`, `first_journal_entry`, `first_agent_spawned`, `upgrade_modal_shown`, `upgrade_clicked`, `subscription_created`
- [ ] Retention cohort dashboard (Day 1 / 7 / 30)
- [ ] Funnel: signup → activation → upgrade
- [ ] Feature adoption heatmap (which features get used vs ignored)

**Why Posthog specifically:** Self-hostable on your own Supabase + Vercel setup, meaning user data never leaves your infrastructure. This is consistent with the BYO privacy ethos.

**Owner:** Blossom (event API) + MO (dashboard setup)  
**Time:** 2-3 days  
**Investor impact:** Showing a Day-30 retention chart in a pitch deck is more convincing than any revenue projection.

---

### Priority 3 — Email Drip Infrastructure (Week 2)

**What specifically:**
- [ ] Integrate Resend (already referenced in EMAIL_CONFIGURATION.md) with a transactional email queue
- [ ] 5-email drip sequence (see D3 above)
- [ ] Trigger: `user_signed_up` event → Day 1 email queued
- [ ] Unsubscribe link in every email (legally required in Canada and US)
- [ ] Weekly product digest: aggregate journal stats, new features

**Owner:** Blossom  
**Time:** 3-4 days  
**Retention impact:** Expected 20-30% improvement in Day-30 retention. Equivalent to a major product feature.

---

### Priority 4 — Referral Programme (Week 3)

**What specifically:**
- [ ] `referral_code` VARCHAR and `referred_by` UUID in `user_profiles`
- [ ] Unique link generation: `cubiqo.ai/?ref={code}`
- [ ] Credit granting: both parties get 30 days of Pro on referred user's first paid month
- [ ] Dashboard widget: "Your referrals (3) / Your credits ($87 earned)"
- [ ] Email trigger: "Congrats — your friend just joined Cubiqo!"

**Owner:** Blossom + Bubbles  
**Time:** 3-4 days  
**Acquisition impact:** Industry benchmark for well-implemented referral: 20-30% of new signups

---

### Priority 5 — Journal History + Insights (Weeks 3-4)

This is the retention engine. The full PRD exists in `DAILY_JOURNAL_PRD.md`. The minimum slice that unlocks the Pro upsell:

**What specifically (minimum viable):**
- [ ] `/journal/history` page: list of past entries, sorted newest-first, paginated
- [ ] Entry card: date, mood badge, first 200 characters, RGY color
- [ ] Search by keyword (debounced, case-insensitive)
- [ ] Streak counter in journal header (consecutive days)
- [ ] Blurred analytics preview for Free users ("Unlock with Pro")
- [ ] Export button (visible but locked for Free)

**Owner:** Bubbles (UI) + Blossom (API — `/api/journal/history` route)  
**Time:** 4-5 days  
**Revenue impact:** The upsell trigger is "You've journalled 7 days. View your full history for free." → upgrade at Day 7 is the highest-converting moment in journaling apps.

---

### Priority 6 — CubiKey API Developer Portal (Weeks 4-6)

This unlocks Revenue Engine 2 (B2D). The smart model routing already exists in `src/lib/ai/intent-router.ts`.

**What specifically:**
- [ ] `/cubikey` page: API key generation, usage dashboard, pricing table
- [ ] Interactive playground: send a test request, see the model used and cost
- [ ] API documentation at `/docs` (OpenAPI spec)
- [ ] Code snippets: Python, JavaScript, curl
- [ ] Usage meter: "8,234 / 10,000 requests this month"
- [ ] Overage handling: block at limit (free) or charge (paid)
- [ ] Billing for CubiKey Starter ($29/mo) separate from main Pro tier

**Owner:** MO (architecture) + Blossom (API) + Bubbles (portal UI)  
**Time:** 7-10 days  
**Investor impact:** "We have a developer API product with 20 paying customers at $29/month" is a completely different conversation than "we have 20 Pro subscribers."

---

### Priority 7 — Public Metrics + Status Page (Week 5)

**What specifically:**
- [ ] `/open` page: user count, journal entries, voice conversations, uptime, MRR (when ready)
- [ ] Status page: Betteruptime (free tier) or statuspage.io
- [ ] Status page link in footer and error pages
- [ ] Incident notifications via email (opt-in)

**Owner:** MO  
**Time:** 1-2 days  
**Trust impact:** Transparency is the cheapest trust signal. Essential before any press coverage.

---

### Priority 8 — Voice Onboarding Prompt (Week 6)

**What specifically:**
- [ ] On first login: "Want to try talking to your Cube? Click here" — with a 15-second guided demo
- [ ] Voice permission prompt handled gracefully (explain why it's needed before browser asks)
- [ ] After first voice message: "That was your first voice message! You have 9 free per day. Upgrade to Pro for unlimited."
- [ ] Fix the camera/microphone security header bug (already done in PR #185)

**Owner:** Bubbles  
**Time:** 2 days  
**Activation impact:** Voice is the Aha moment. Getting users to it faster = higher activation rate.

---

### Priority 9 — Social Army ToS-Safe Wrapper (Weeks 6-8)

**Why after everything else:** Social Army is high-risk (see `PRODUCT_LAUNCH_READINESS.md § F1`). But it is also the product's highest-value feature for $499/month Commander users. The goal is to make it defensible before monetising it.

**What specifically:**
- [ ] Mandatory consent screen before first Social Army activation: checkbox with plain-English ToS risk disclosure
- [ ] Rate limiter: maximum 5 posts/day/platform per user (reduces detection risk)
- [ ] Human review gate: all generated content in draft state until user approves (already in architecture spec — verify it is enforced in code)
- [ ] "Not affiliated with [Platform]" disclaimer in generated content settings
- [ ] Commander tier restricted to verified business email (reduces abuse risk)

**Owner:** Blossom (API enforcement) + Bubbles (consent UI)  
**Time:** 3-4 days  
**Legal impact:** Without this, the first Commander account that gets banned is a PR and legal liability.

---

### Priority 10 — Investor Data Room (Weeks 8-10, when metrics exist)

**What this is:** A shareable folder (Notion or Docsend) that contains everything an angel asks for in a first meeting. Do not send it before metrics exist — but build it in parallel so you are ready when asked.

**Contents:**
- [ ] 10-slide pitch deck (see narrative in C3 above)
- [ ] 12-month financial model (revenue, costs, cash position) — spreadsheet
- [ ] Cap table (even if it is just you: 100% founder)
- [ ] Metrics dashboard screenshot (Day-30 retention, MRR, churn)
- [ ] Product demo video (3 minutes max, screen + voice over)
- [ ] Founder bio (1 page)
- [ ] Use of funds breakdown ($X for Y, $X for Z)
- [ ] Legal: incorporate as a corporation before the data room (not sole proprietor)

**Tool to use:** Docsend (tracks who reads what, for how long — valuable intelligence)

---

## Summary: The 6-Month Clock

This is what the next 6 months look like if execution is tight:

| Week | Milestone | Why It Matters |
|------|-----------|----------------|
| 1-2 | Stripe live, analytics instrumented | First dollar of revenue; first retention data |
| 2-3 | Email drip running, waitlist open | Retention improving; demand signal building |
| 3-4 | Referral programme, journal history | Acquisition engine on; biggest Pro upsell live |
| 4-6 | CubiKey portal, public metrics | Revenue engine 2 open; press hook ready |
| 6-8 | Product Hunt launch | Spike of 500-2,000 users; press coverage |
| 8-10 | $5K MRR | Angel conversation trigger reached |
| 10-12 | 10 user interviews, pitch deck built | Ready to raise; founder-market fit demonstrated |
| 12+ | $15K MRR, angel round | Scale begins |

**The single most important thing to believe:** The product works. The question is now purely execution speed. Nothing in this document requires a breakthrough — it requires shipping what is already designed, one week at a time.

---

**Related Documents**  
- `PRODUCT_LAUNCH_READINESS.md` — legal, compliance, and insurance checklist  
- `FEATURE_MONETIZATION_UI_ANALYSIS.md` — per-feature monetisation detail  
- `docs/PRICING_TIERS.md` — canonical feature gate reference  
- `DAILY_JOURNAL_PRD.md` — complete journal product requirements  
- `CUBIKEY_SPEC.md` — smart model routing architecture  
- `docs/MONETIZATION_STRATEGY.md` — Credit + Army pricing model
