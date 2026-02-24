# Cubiqo — Product Launch Readiness for Solopreneur

**Document Owner:** MO (CTO / Co-Founder)  
**Audience:** CEO / Founder (solopreneur context)  
**Last Updated:** 2026-02-21  
**Status:** Working Reference — Update as items are completed

---

## How to Use This Document

This is the single source of truth for what needs to happen before Cubiqo is safely open to the public. Work through each section in order. Every checkbox represents a real action or decision, not a wish. Where code changes are involved, link to the PR when merged.

---

## A — Value Proposition: What Problem Cubiqo Solves

### The Core Problem

People have more information, tools, and choices than ever — and feel more overwhelmed, aimless, and unheard than ever. Productivity apps make demands; calendars nag; email is a firehose. None of it listens, reflects, or adapts to the person using it.

### What Cubiqo Solves

| User Pain | Cubiqo Solution | Feature |
|-----------|----------------|---------|
| "I need to think out loud but no one is available" | Voice-first AI companion with emotional awareness | `/chat` + ElevenLabs TTS + Whisper STT |
| "I forget what I was working on / feeling yesterday" | Daily Rozana Journal that builds a retrievable history | `/journal` + journey memory system |
| "My life is fragmented — red stuff crowds out green stuff" | RGY (Red/Yellow/Green) life-context categorisation | RGY tagging across journal, chat, agent tasks |
| "Job hunting is a full-time job in itself" | Automated application tracking and reporting | `/job-hunt` |
| "I can't afford a developer but need automations" | Self-coding agents that can modify the platform | Emergent agent system |
| "I don't want to hand my data to a big AI company" | BYO mode — user's own API keys, zero server-side storage | BYO settings + encrypted local storage |
| "I want to build a social media presence but it takes hours" | Social Army — automated content and posting fleet | `social-army/` |

### The Single-Sentence Pitch

> Cubiqo is a privacy-first AI companion that listens, remembers, and acts — so you can stop managing your tools and start living your life.

### Why This is Defensible

1. **Open source + BYO** — eliminates the "I don't trust you with my data" objection that kills AI adoption.
2. **Voice-first** — most AI products are text interfaces. Voice changes the emotional register entirely.
3. **Longitudinal memory (Journey)** — competitors reset context every session. Cubiqo remembers.
4. **Vertical depth** — not just chat; journaling + agents + job-hunt + social army = a full life OS.

---

## B — Legal Protection, Disclosures, and Compliance

### B1 — Documents Needed (Status)

| Document | Status | Priority | Owner |
|----------|--------|----------|-------|
| **Privacy Policy** | ✅ Exists (`PRIVACY_POLICY.md`) — needs a live page at `/privacy` | Ship Page | MO / Bubbles |
| **Terms of Service** | ❌ **Missing** — this is a critical gap | URGENT | MO (draft) → legal review |
| **Cookie Policy** | ❌ Missing — required for GDPR (EU users) | High | MO |
| **AI Disclaimer** | ❌ Missing from UI — must appear at first use | High | Bubbles |
| **Data Processing Agreement (DPA)** | ❌ Missing — required for any B2B / Enterprise customer in EU | Medium | MO |
| **Refund Policy** | ❌ Missing — required by Stripe and consumer protection law | High | MO |

### B2 — Terms of Service: Must-Have Clauses

The ToS must contain at minimum:

1. **AI Output Disclaimer** — "AI responses are generated and may be incorrect, biased, or inappropriate. Cubiqo is not a licensed therapist, financial advisor, medical provider, or legal advisor. Do not rely on AI output for professional decisions."

2. **Journal / Mental-Health Data Warning** — "The Rozana Journal stores sensitive personal reflections. Cubiqo is not a mental-health service. If you are in crisis, contact a qualified professional or emergency services."

3. **Voice Recording Disclosure** — "Voice input is processed by third-party speech-to-text providers (ElevenLabs, OpenAI Whisper). By enabling voice, you consent to temporary transmission of your audio to these providers. Audio is not stored by Cubiqo."

4. **Browser Automation Disclaimer** — "The browser automation feature (Job Hunt, Social Army, OAuth integrations) acts on your behalf on third-party websites. You are responsible for compliance with those websites' own Terms of Service. Cubiqo is not liable for account suspensions or actions taken by third-party platforms."

5. **Social Army ToS Exposure** — LinkedIn, Twitter/X, and Instagram explicitly prohibit automated bulk posting in their ToS. Inform users in writing that:
   - They use Social Army at their own risk.
   - Account bans are their responsibility.
   - Cubiqo does not guarantee any outcome.

6. **BYO API Key Liability** — "When using BYO mode, you are solely responsible for costs charged by your AI provider. Cubiqo cannot cap or monitor your third-party API usage."

7. **Age Gate** — Minimum age 16 (EU GDPR Article 8) or 13 (COPPA US minimum). Define clearly. Enforce at signup.

8. **Governing Law & Dispute Resolution** — Choose one jurisdiction (e.g., Ontario, Canada / Delaware, USA). Add mandatory arbitration clause to limit litigation exposure.

9. **Limitation of Liability** — Cap liability at the greater of amounts paid to Cubiqo in the last 12 months or $100 CAD. This clause is the most important single sentence in your ToS.

10. **Right to Modify / Terminate** — Right to terminate accounts for ToS violations (bot abuse, Social Army misuse).

### B3 — Compliance Checklist

#### GDPR (EU users)
- [x] Privacy Policy covers GDPR (exists)
- [ ] Cookie consent banner on first visit — **NOT IMPLEMENTED**
- [ ] `/privacy` live page (linked from footer + login)
- [ ] User data export endpoint (`/api/user/export`) — check if exists
- [ ] User data deletion endpoint (`/api/user/delete`) — check if exists
- [ ] Data Processing Agreement template for Enterprise customers
- [ ] Confirm Supabase data residency (is prod EU-based or US-based?)

#### CCPA (California users)
- [x] "Do Not Sell" disclosure in Privacy Policy (exists)
- [ ] Opt-out mechanism in UI settings
- [ ] Annual requests count tracking (mentioned as `[X]` in Privacy Policy — fill in real numbers)

#### COPPA (US users under 13)
- [ ] Age verification at signup (even a checkbox "I am 13 or older" satisfies COPPA for platforms not directed at children)

#### Open Source (MIT License)
- [x] LICENSE file exists
- [ ] Verify all third-party dependencies are MIT/Apache/BSD compatible (run `npx license-checker --summary`)
- [ ] Social Army: any scraping libraries used? Check their licenses.

### B4 — Disclosure Requirements

Add these to the UI before launch:

1. **AI Badge** — A persistent small label on every AI-generated response: `AI-generated · May be inaccurate`
2. **Voice Active Indicator** — Visual + text "🎙 Voice On — audio is being processed" (required by GDPR Article 13 for audio processing disclosure)
3. **Social Army Consent Screen** — One-time "I understand I am using automated posting, I accept risk of platform ToS violation" checkbox before first Social Army activation.
4. **Journal Sensitivity Notice** — On first journal entry: "Your entries are stored securely. This is not a crisis service." with link to crisis resources.

---

## C — Adaptation Strategy

### C1 — What "Ready for Users" Actually Means (Tiers)

Define three readiness gates before full public launch:

| Gate | What it Means | Criteria |
|------|--------------|---------|
| **Alpha** | Founders + invited testers only | Core auth works, BYO mode works, no billing |
| **Beta** | Waitlist users — public sign-up, no payment required | Onboarding complete, Privacy Policy + ToS live, no data loss bugs |
| **GA (General Availability)** | Open to anyone, billing live | All B-section items ✅, Stripe connected, refund policy live, support channel exists |

**Current state: Alpha.** Target Beta within 30 days.

### C2 — Product Adaptation by User Segment

| Segment | Adaptation Needed | Priority |
|---------|------------------|----------|
| **Individual / Privacy-Conscious** | BYO mode prominent in onboarding; data residency FAQ | ✅ Already built — add UI prominence |
| **Solopreneur / Freelancer** | Job Hunt + Social Army highlighted; one-click templates | In progress |
| **Student / Journaler** | Rozana Journal as entry point; free tier generous | Deepen journal history UI (PRD exists) |
| **Developer** | Code execution + agent system + CubiKey API | Docs and playground needed |
| **Enterprise / Team** | Commander/General tiers; DPA; SSO (future) | Post-Beta |

### C3 — Onboarding Flow (Current State → Required State)

**Current:** `/onboarding` page exists with feature toggles and OAuth stubs (`OnboardingFlow.tsx`).

**Gaps that must close before Beta:**

- [ ] **Welcome email** sent immediately after signup (magic-link already exists — add welcome email)
- [ ] **3-step onboarding wizard** should end at a meaningful first action (not a blank screen)
- [ ] **First value moment < 10 minutes** — user must experience something useful before hitting a paywall
- [ ] **BYO setup guide** — inline tooltip or modal explaining how to get an OpenAI/Anthropic key
- [ ] **Feature flag: `onboarding.v2`** — gate new wizard behind flag, ship without risk
- [ ] **Progress indicator** — show "Step 2 of 3" so user knows they're not lost
- [ ] **Skip option** — not every user wants guided setup; let them jump to the cube

### C4 — Feature Gate Strategy (What's Free vs Paid)

Follow the canonical tier doc (`docs/PRICING_TIERS.md`). Key adaptation decisions:

1. **Voice is the killer feature** — restrict to Pro ($29/mo) after a 5-message free trial per day. Free users must want it badly enough to upgrade.
2. **Journal is the retention mechanism** — keep 1 entry/day free. History review (premium) is the upsell hook.
3. **Social Army is high-risk / high-value** — Commander ($499/mo) only, with explicit ToS acceptance.
4. **BYO mode stays free forever** — this is the open-source ethos and the trust signal.
5. **Agents** — 1 free agent, limited tasks. This creates natural upgrade pressure without frustrating core users.

---

## D — Outreach Strategy

### D1 — Launch Sequence

Do NOT launch to everyone on day one. Use this sequence:

```
Week 1-2:  Internal Alpha (founders + 5-10 trusted users)
           → Fix bugs, validate onboarding, collect voice of customer
Week 3-4:  Private Beta (50-100 waitlist signups from LinkedIn/Reddit post)
           → Validate pricing, collect NPS, refine first value moment
Week 5-6:  Public Beta (Product Hunt launch + Hacker News Show HN post)
           → First organic traffic, press mentions
Week 8+:   GA — billing live, support SLA defined
```

### D2 — Channels

| Channel | What to Post | Cadence | Expected Outcome |
|---------|-------------|---------|-----------------|
| **Product Hunt** | Full launch post with demo video (3D cube is the hook) | One-time on GA day | 500-2000 upvotes if timed right (Tuesday 12:01 AM PST) |
| **Hacker News (Show HN)** | "Show HN: Cubiqo — Open-source AI companion with voice, journaling, and self-coding agents" | One-time | Dev audience, BYO mode resonates strongly |
| **Reddit r/artificial, r/ChatGPT, r/selfhosted** | Demo video + BYO angle ("Use your own OpenAI key, we never see it") | Weeks 3-4 | Privacy-conscious users |
| **LinkedIn (personal founder account)** | "I built this as a solopreneur" story posts — journey, not product | Weekly | B2B leads, Enterprise tier interest |
| **Twitter/X** | Short video demos of cube interactions, voice conversations | 3x/week | Top-of-funnel awareness |
| **YouTube (tutorial)** | "Set up your own AI companion in 10 minutes" BYO setup video | Pre-launch | Evergreen SEO, developer trust |
| **Dev.to / Hashnode** | Technical article: "How I built a self-coding AI agent in Next.js" | Pre-launch | Developer credibility |

### D3 — The One Hook That Works

The 3D cube reacting to voice is visually unlike anything in the market. **Lead with a 15-second video** of the cube animating during a voice conversation. No explanation needed — the hook is visual. Put this video:
- Above the fold on cubiqo.ai
- First frame of every social post
- Product Hunt gallery (video thumbnail)
- LinkedIn cover image

### D4 — Positioning Statement (1 sentence per audience)

| Audience | Positioning |
|----------|------------|
| **General** | "Cubiqo is the AI that listens — with voice, memory, and a private journal built in." |
| **Privacy-conscious** | "Bring your own API key. Cubiqo never sees your data." |
| **Developer** | "Open-source AI companion with code execution, self-spawning agents, and a CubiKey API." |
| **Journaler** | "Your daily Rozana — a 10-minute AI-guided reflection that actually remembers." |
| **Solopreneur** | "One AI for job hunting, social media, journaling, and code — not four subscriptions." |

### D5 — Partnership / Affiliate Quick Wins (No Cost)

Based on the affiliate analysis in the codebase:

1. **ElevenLabs** — You're already using their API. Apply for their affiliate/partner program. Your users who upgrade to BYO will buy ElevenLabs subscriptions — that's your referral commission.
2. **Anthropic / OpenAI** — Both have referral programs. A "Get $5 credit" link in BYO setup benefits both sides.
3. **Supabase** — They sponsor open-source projects. Apply for OSS program — could mean free or discounted hosting.
4. **Vercel** — Same: open-source sponsorship available.

---

## E — Minimum Insurance for a Solopreneur Running an AI SaaS

> **Disclaimer:** This section contains general information, not legal or insurance advice. Consult a licensed insurance broker in your jurisdiction before purchasing any policy.

### E1 — The Four Policies You Actually Need

#### 1. Cyber Liability Insurance — **Most Critical**
**Why:** A single data breach affecting user journal entries or voice recordings would be catastrophic. Journal data is sensitive personal information; voice data is biometric in several jurisdictions.

**What it covers:**
- Cost of notifying affected users (legally required in Canada, US, EU)
- Forensic investigation fees
- Regulatory fines (GDPR fines can be 4% of global revenue)
- PR crisis management
- Legal defense if users sue

**Recommended coverage:** $1M minimum  
**Estimated annual cost:** $500–$1,500 CAD/year for a startup with <$500K revenue  
**Providers to quote:** Intact, Aviva, Chubb (Canada); Coalition, At-Bay (US); Hiscox (UK/CA)

#### 2. Professional Liability (Errors & Omissions / Tech E&O) — **Critical for AI**
**Why:** Your AI could give a user advice that causes them harm (financial, emotional, job-related). Even if you include disclaimers, a user could still claim negligence.

**Specific Cubiqo risks:**
- Job Hunt AI suggests wrong application strategy → user loses job opportunities
- Journal AI gives mental-health-adjacent advice → user in crisis
- Social Army auto-posts something defamatory → third party sues user, user sues you

**What it covers:**
- Legal defense costs (even frivolous lawsuits cost $50K+ to defend)
- Settlements and judgments
- Regulatory investigations

**Recommended coverage:** $1M per occurrence, $2M aggregate  
**Estimated annual cost:** $1,000–$3,000 CAD/year  
**Providers to quote:** Hiscox, BFL Canada, Intact, Aviva

#### 3. General Liability — **Standard Baseline**
**Why:** Required by most commercial contracts (co-working space leases, partnership agreements, enterprise sales).

**What it covers:**
- Bodily injury / property damage (if you meet a client and something happens)
- Basic advertising injury (copyright infringement claims in Social Army content)

**Recommended coverage:** $2M aggregate  
**Estimated annual cost:** $500–$1,000 CAD/year

#### 4. Media / Content Liability — **If Social Army Scales**
**Why:** Social Army auto-generates and posts content. If that content defames someone, violates copyright, or constitutes false advertising, you (as the platform) could be named alongside the user.

**What it covers:**
- Defamation and libel claims arising from AI-generated content
- Copyright infringement from AI-scraped imagery or text
- False advertising claims

**Recommended coverage:** $1M  
**Estimated annual cost:** $800–$2,000 CAD/year  
**Note:** This can sometimes be bundled into a Tech E&O policy — ask your broker.

### E2 — What NOT to Prioritise Yet

- **Product Liability** — for physical goods; not applicable.
- **Workers' Compensation** — only needed when you hire employees.
- **Directors & Officers (D&O)** — relevant once you have investors or a board.
- **Business Interruption** — worth considering once you have paying customers whose downtime causes you measurable revenue loss.

### E3 — Estimated Total Annual Insurance Budget

| Policy | Low | High |
|--------|-----|------|
| Cyber Liability | $500 | $1,500 |
| Tech E&O | $1,000 | $3,000 |
| General Liability | $500 | $1,000 |
| Media Liability | $800 | $2,000 |
| **Total** | **~$2,800** | **~$7,500** |

> **Practical advice:** Start with a Tech E&O + Cyber bundle (many insurers bundle these). Add General Liability if you sign any commercial contracts. Add Media Liability when Social Army has 50+ active Commander-tier users.

### E4 — Jurisdiction-Specific Notes

**If incorporated in Canada (Ontario/BC/AB):**
- Register with your provincial registry (done via BN/GST registration)
- Consider incorporating as a corporation (not sole proprietor) to separate personal assets from business liability — this is more important than insurance
- PIPEDA (federal privacy law) applies; provincial PIPA may apply too

**If you have EU users:**
- GDPR Article 82 makes you liable for data breaches even as a processor, not just controller
- Cyber liability policy that explicitly covers GDPR fines is essential

**If you have US users:**
- CCPA (California) + emerging state privacy laws
- FTC Section 5 (deceptive practices) — your AI disclaimers directly protect here
- COPPA if any user could be under 13

---

## F — Other Critical Considerations

### F1 — The Social Army ToS Bomb 💣

This is the highest-risk feature in the product from a legal and reputational standpoint.

LinkedIn, Twitter/X, and Instagram all **explicitly prohibit** automated bulk posting in their terms. If Cubiqo enables users to auto-post at scale:

1. **User accounts get banned** — users blame Cubiqo, chargebacks follow.
2. **Platform sends cease-and-desist** — LinkedIn has done this to automation tools before.
3. **Press coverage is negative** — "AI startup helps users violate social media terms" is not the launch headline you want.

**Minimum mitigations before Social Army goes live:**
- [ ] In-app disclosure on Commander tier signup: "By using Social Army, you acknowledge that automated posting may violate third-party platform Terms of Service. You accept all risk of account suspension."
- [ ] Rate limits so no single user posts more than 5x/day per platform (reduces detectability).
- [ ] No default auto-approve — all generated content requires human review (this is already in the architecture per the spec; ensure it's enforced).
- [ ] Do NOT market Social Army as "bypass the algorithm" or similar — creates FTC exposure.

### F2 — Mental-Health Data Sensitivity 🧠

The Rozana Journal stores personal reflections. Some users will write about depression, trauma, relationship problems, or suicidal ideation. You have two obligations:

1. **Safety obligation:** Add a persistent crisis resource line in the journal UI:
   > "If you're in crisis: Canada 1-833-456-4566 · US 988 · UK 116 123"

2. **Legal obligation:** In the ToS, explicitly state Cubiqo is NOT a mental-health service and does NOT provide counselling. Failure to do so in some jurisdictions creates regulated-practice liability.

3. **Technical obligation:** Do NOT train any models on user journal entries without explicit consent and appropriate research ethics approval. This is currently not done — confirm and keep it that way.

### F3 — AI Provider Pass-Through Costs 💸

In BYO mode, users pay their own API costs. In hosted mode (non-BYO), every chat message burns your API budget. Before going public:

- [ ] Spending caps per user per day are implemented (check `tests/spending-caps.test.ts` — tests exist, verify the enforcement code is live)
- [ ] Alert when a single user's hosted-mode cost exceeds $X/day (prevents a single bad actor from draining your API budget)
- [ ] Pro/Commander/General tiers should use separate API keys or cost centres so you can attribute spend per tier

### F4 — Support Channel (Required Before GA)

You cannot go GA without a defined support process. Minimum viable support:

- [ ] Email: `support@cubiqo.ai` — auto-response within 24 hours
- [ ] Status page: status.cubiqo.ai (use Betteruptime or UptimeRobot free tier)
- [ ] Known issues page or changelog linked from the app
- [ ] One-click "Report a Bug" button in the UI → creates a GitHub Issue (or Notion form)

### F5 — Backup and Data Recovery

Before any paying users:

- [ ] Supabase automated backups confirmed ON (check project settings)
- [ ] Point-in-time recovery tested (can you restore to 1 hour ago?)
- [ ] Define your RTO (Recovery Time Objective) and RPO (Recovery Point Objective) — even rough ones
- [ ] Disaster recovery runbook exists (what do you do if the DB goes down at 3 AM?)

### F6 — Open Source Considerations

Cubiqo is MIT-licensed. Implications:

1. **Anyone can fork and compete** — your moat is the hosted service, community, and brand, not the code.
2. **Anyone can self-host** — this is a feature, not a threat. Lean into it for developer trust.
3. **Contributions welcome** — add a `CONTRIBUTING.md` (exists ✅). Add a CLA (Contributor License Agreement) if you ever want to dual-license or sell commercial rights. Without a CLA, every contributor retains copyright in their contribution.
4. **Dependency audit** — before GA, run `npx license-checker --summary` and resolve any GPL-licensed dependencies (GPL is viral; it would infect Cubiqo's commercial offering).

### F7 — Stripe Setup Before Billing Goes Live

- [ ] Stripe account in business name (not personal)
- [ ] Tax configuration: Canadian GST/HST enabled; US sales tax auto-calculation (Stripe Tax)
- [ ] Stripe Customer Portal enabled (self-service cancellation is legally required in EU and increasingly in US)
- [ ] Webhook endpoint `/api/webhooks/stripe` secured with `STRIPE_WEBHOOK_SECRET`
- [ ] Test all four billing events: new subscription, upgrade, downgrade, cancellation
- [ ] Refund policy documented and reachable from every invoice email

---

## Launch Readiness Scorecard

Track this as you close items. Target all ✅ before GA.

### Legal & Compliance

| Item | Status |
|------|--------|
| Terms of Service (live page) | ❌ |
| Privacy Policy (live page at /privacy) | ❌ |
| Cookie consent banner | ❌ |
| Refund Policy | ❌ |
| AI disclaimer in UI | ❌ |
| Journal crisis resources | ❌ |
| Social Army consent screen | ❌ |
| Age gate at signup | ❌ |
| GDPR data export endpoint | ❌ |
| GDPR data deletion endpoint | ❌ |

### Insurance

| Item | Status |
|------|--------|
| Cyber Liability policy | ❌ |
| Tech E&O policy | ❌ |
| General Liability | ❌ |
| Business incorporated (not sole proprietor) | ❌ |

### Product & Onboarding

| Item | Status |
|------|--------|
| Onboarding wizard (3 steps, <10 min to value) | ⚠️ Partial |
| Welcome email after signup | ❌ |
| BYO mode setup guide inline | ❌ |
| Spending caps enforced for hosted mode | ⚠️ Tests exist, verify runtime |
| Feature flags for all new features | ✅ |
| Pricing page live | ✅ |
| Stripe integrated (Pro/Commander/General) | ❌ |
| Status page | ❌ |
| Support email active | ❌ |

### Infrastructure

| Item | Status |
|------|--------|
| Supabase backups confirmed | ❌ (verify) |
| Disaster recovery runbook | ❌ |
| Security headers fixed (camera/mic/CSP) | ✅ PR #185 |
| Rate limiting on API routes | ✅ |
| Audit logging active | ✅ |

---

## Recommended Action Order (Next 30 Days)

1. **Day 1–3:** Draft Terms of Service using the clauses in B2. Have a lawyer review ($500–$1,500 one-time — worth it). Add live `/terms` and `/privacy` pages.
2. **Day 3–5:** Add AI disclaimer badge to UI, journal crisis resources, Social Army consent screen.
3. **Day 5–7:** Add cookie consent banner. Verify GDPR data export/delete endpoints exist.
4. **Day 7–10:** Get Tech E&O + Cyber bundle quote from Hiscox or Coalition. Bind the policy.
5. **Day 10–14:** Close onboarding gaps (welcome email, first value moment, BYO guide).
6. **Day 14–20:** Stripe setup, test all billing flows, add refund policy.
7. **Day 20–25:** Set up status page and `support@cubiqo.ai`. Write disaster recovery runbook.
8. **Day 25–30:** Alpha test with 10 users. Fix bugs. Ship Beta.
