# CUBIQO — Go-To-Market Readiness Guide
### For a Solopreneur Founder: What You Must Do Before This Product Is Ready for Public Users

**Date:** 2026-02-21  
**Context:** Built from the Master Techno-Functional Analysis of cubiqo.ai  
**Format:** Actionable — prioritized, no fluff

---

## SECTION 1 — PRODUCT UTILITY & THE ARGUMENT: WHAT PROBLEM DOES CUBIQO SOLVE?

### The Core Proposition (You Need to Be Able to Say This in One Sentence)

> **"CubiQo is the first AI platform that doesn't just answer questions — it takes action on your behalf across your entire digital life, remembers who you are, and gets smarter every time you use it."**

### The Problems It Solves (The Argument)

| Pain Point | Who Feels It | How CubiQo Solves It |
|---|---|---|
| **Context loss** — every AI chat starts from zero | Everyone who uses ChatGPT | Journey Memory system remembers across all sessions |
| **AI tab fatigue** — users have 5+ AI tools open | Professionals, creators | Single platform routes to best AI per mood/task (RGY system) |
| **Social media is a job** — posting on 9 platforms takes hours | Creators, small business | Social Army automates distribution from one queue |
| **Job searching is demoralizing** — manual tracking, no support | Job seekers | Job Hunt Mode tracks applications + AI guidance throughout |
| **Journalling feels like homework** — blank page anxiety | Mindfulness/self-improvement users | AI-prompted daily journal (Rozana) with 8 guided questions |
| **"I need to order an Uber but I'm mid-task"** | Everyone | Verbal commands: say it, done (when BrowserPool is wired) |
| **API costs are out of control** — developers paying per token | AI power users, developers | BYO Mode: use your own API key, Cubiqo handles the routing |
| **Building an app requires a team** — expensive + slow | Solo founders, creators | Emergent Studio: describe → AI designs, codes, deploys (when TODOs resolved) |

### What Makes the Argument Defensible

1. **Persistence is the moat** — Most AI tools are stateless. CubiQo's `conscious_memories` table means intent and context compound over time. The longer someone uses it, the more irreplaceable it becomes.
2. **The RGY colour routing is counterintuitive and delightful** — No other AI product changes "personality" in real time based on mood. This is a genuine UX differentiator.
3. **BYO Mode is trust-building** — Telling users "bring your own API key and we'll use that" signals you are NOT trying to lock them in for cost extraction. That earns trust with power users.
4. **The cube visual identity** — There is no major AI product with a memorable, interactive 3D character. This is CubiQo's brand moat. It makes the product feel alive.

### The Honest Limitations Right Now (What You Cannot Claim Yet)

| Feature Marketed | Reality | Risk if You Claim It |
|---|---|---|
| "Automate Uber / WhatsApp with voice" | BrowserPool is a stub — it doesn't actually launch | False advertising / user complaint |
| "Build and deploy apps with AI" | Emergent Studio deploy/terminal/files are TODOs | Broken product experience |
| "Music generation" | Suno/Udio API not connected | Dead feature |
| "Connect your GitHub in onboarding" | alert() popup only | User trust loss |

**Rule: Do NOT put these in marketing materials until the TODOs are resolved.**

---

## SECTION 2 — WHAT NEEDS TO BE DONE: PRIORITIZED BUILD LIST BEFORE PUBLIC LAUNCH

### PHASE 1 — MUST DO BEFORE FIRST USER (Critical Path)
*Estimated time: 3–5 days of focused work*

| # | Task | Why It Blocks Launch | Where |
|---|---|---|---|
| 1 | **Delete `/rescue` and `/founderspass` PIN pages** | Hardcoded PIN `2026` is a public security vulnerability | `src/app/rescue/`, `src/app/founderspass/page.tsx` |
| 2 | **Merge PR #183 (CSP/Camera Fix)** | Voice calls and camera are completely broken without it | PR #183 → main |
| 3 | **Merge PR #184 (RGY Step 3)** | RGY SIGNAL flow silently breaks at Step 3 | PR #184 → main |
| 4 | **Wire onboarding → DB persist** | Users completing onboarding lose all preferences on new device | `profiles.onboarding_data` column + API call |
| 5 | **Add new-user → /onboarding redirect** | No user ever sees the onboarding — auth callback goes straight to `/chat` | `src/app/auth/callback/route.ts` line 14 |
| 6 | **Write real Terms of Service + Privacy Policy** | Legally required before collecting user data in any jurisdiction | New pages + footer links |
| 7 | **Write Data Processing Agreement disclosure** | You store emails, conversations, memories — GDPR/CCPA applies to you | `/privacy` page |
| 8 | **Fix duplicate import in `middleware.ts`** | Two `import { NextResponse }` can cause silent build errors | `src/middleware.ts` line 11 |
| 9 | **Persist Adaptive User Model to Supabase** | Model is in-memory — every server restart loses all learned user data | `chat/route.ts` TODO line 55 |
| 10 | **Fix Dashboard Journal Count** | Dashboard shows `0` for journalEntriesCount — looks broken | `dashboard/page.tsx` line 54 |

### PHASE 2 — SHOULD DO BEFORE PAID TIER (Monetization Path)
*Estimated time: 1–2 weeks*

| # | Task | Why It Matters |
|---|---|---|
| 11 | **Wire BrowserPool with Railway worker** | Verbal commands (Uber, WhatsApp etc.) are the biggest wow-factor; currently dead |
| 12 | **Complete Job Hunt email reports** | Resend call is `TODO` — breaks the daily report promise |
| 13 | **Wire Emergent Studio Deploy to Vercel API** | This is the entire value of the Studio — without it, it's a text editor |
| 14 | **Wire Emergent Terminal + File I/O** | Companion to deploy — users need to see code running |
| 15 | **Wire Image Agent (DALL-E or SD)** | Studio creates apps — visual output is expected |
| 16 | **Add Stripe payment flow UI** | Webhooks exist; no UI to upgrade subscription tier |
| 17 | **Build Cubiqo Wallet page** | Backend complete, zero UI — unreachable feature |
| 18 | **Add BYO key actual validation call** | Test button does nothing — user has no confirmation keys work |
| 19 | **Wire audio music gen (Suno/Udio)** | Studio mood feature — currently silent |
| 20 | **Consolidate all Founders-Pass duplicates** | 4 routes, 2 component dirs — technical debt that causes confusion |

### PHASE 3 — NICE TO HAVE (Retention & Growth)
*After first paying users*

| # | Task | Why |
|---|---|---|
| 21 | Complete RGY Opportunity Feed AI | Gives users a reason to open the RGY tab daily |
| 22 | Add Telegram agent routing | Notification centre hook |
| 23 | Wire audio score background music | Premium ambient experience |
| 24 | Move 250+ root .md files to /docs | Developer experience + repo hygiene |
| 25 | Delete all 13 demo/preview routes | Clean URL tree for production |

---

## SECTION 3 — LEGAL, PROTECTION & DISCLOSURE

### 3.1 Documents You Must Have Live Before Any User Signs Up

> In most jurisdictions, if you collect email + store personal conversations + have any paid tier, you are LEGALLY REQUIRED to have these. GDPR (EU), CCPA (California), PIPEDA (Canada) all apply to anyone whose data you store, regardless of where *you* are physically based.

| Document | What It Must Cover | Where to Put It |
|---|---|---|
| **Terms of Service (ToS)** | Who can use the service, prohibited uses, liability limits, termination, governing law, dispute resolution clause | `/terms` page + footer link |
| **Privacy Policy** | What data you collect (emails, conversations, memories, browser actions), how it's stored, how long you keep it, third parties you share with (Supabase, ElevenLabs, Anthropic, Groq, MiniMax, Resend, OpenRouter, Railway), user rights (access, delete, export) | `/privacy` page + footer link |
| **Cookie Policy** | What cookies/localStorage you use, for how long, opt-out mechanism | Banner on first visit + linked from Privacy Policy |
| **Acceptable Use Policy (AUP)** | What users cannot do (spam, scrape, illegal content, abuse of verbal command automation) | Referenced inside ToS |
| **Refund/Cancellation Policy** | What happens when a paid user cancels — pro-rata? No refunds? | `/pricing` page + billing section |

### 3.2 Data & AI-Specific Disclosures (Non-Negotiable)

These are often missed by solo founders but create the highest legal risk:

| Disclosure | What to Say | Why |
|---|---|---|
| **AI conversation storage** | "Your conversations are stored and used to improve your personalized experience. You can delete all data at any time from Settings > Privacy." | GDPR Art. 13 — purpose of processing |
| **Memory system consent** | `conscious_memory_consent` column already exists — make sure the privacy settings UI is actually wired to it | GDPR Art. 7 — consent must be granular |
| **Third-party AI providers** | Name every AI vendor: Anthropic (Claude), MiniMax, Groq (Whisper), ElevenLabs, OpenRouter, MistralAI, Together AI. | GDPR Art. 13(1)(e) — recipients of data |
| **Browser automation disclosure** | "When you use Verbal Commands, CubiQo will operate a browser session on your behalf. You will be asked to consent to each service before any action is taken." | Consumer protection + informed consent |
| **BYO key security disclosure** | "Your API keys are encrypted with AES-256-GCM. CubiQo staff cannot read them." | Trust + data security transparency |
| **Puppeteer / Social Army** | "CubiQo uses browser automation to post content on your behalf. This may violate the ToS of some platforms (Twitter, Instagram, etc.). You use this feature at your own risk." | Indemnification from platform bans |
| **Minors** | Include "This service is not intended for users under 13 (or 16 in the EU)." | COPPA (US) / GDPR Art. 8 |

### 3.3 Intellectual Property Protection

| Area | What to Do | Priority |
|---|---|---|
| **Trademark "CubiQo"** | File a trademark application for the name + the cube logo in the classes: (1) Software as a Service, (2) AI Assistants. Cost: ~$250–$500 USD via USPTO (US) or CIPO (Canada). Don't wait — register early. | 🔴 HIGH |
| **Domain portfolio** | You have `cubiqo.ai` and `cubiqo.com`. Consider also getting `cubiqo.io`, `cubiqo.co`, `getcubiqo.com` — prevent brand squatters. Cost: <$100/year | 🟡 MEDIUM |
| **Source code protection** | The code is already in a private GitHub repo — that's your copyright. Do NOT open source until you have revenue and legal protection in place. | ✅ Already protected |
| **The RGY system** | Consider filing a provisional patent for the colour-keyed mood-routing AI system. Cost: ~$1,500–$3,000 with a patent attorney. 12 months to decide on full patent. | 🟡 MEDIUM — only if you have budget |
| **Confidentiality** | Any contractors, agents, or collaborators must sign an NDA + IP assignment agreement before seeing the code. Use PandaDoc or Docusign for free NDA templates. | 🔴 HIGH if you have any contractors |

### 3.4 Corporate Structure (Critical for Solopreneurs)

> **This is the #1 mistake solopreneurs make: operating as an individual, personally liable for everything.**

| Structure | What It Does | Cost |
|---|---|---|
| **LLC (US) or Ltd (Canada/UK)** | Separates your personal assets from business liability. If a user claims the automation caused harm (wrong Uber booking, wrong email sent), they sue the company, not you personally. | $100–$500 to register + $0–$800/year in state fees |
| **Business bank account** | Separates personal and business finances. Required for payment processing (Stripe needs this). | Free at most banks |
| **EIN (US) / BN (Canada)** | Tax ID for the business — needed for Stripe, paying contractors, filing taxes. | Free (IRS or CRA) |

**Recommended action:** Register a single-member LLC in your state (or province). Takes 1–2 weeks online. Do this before you accept any payment.

---

## SECTION 4 — ADAPTATION STRATEGY

### 4.1 What to Soft-Launch vs Hard-Launch

**Do NOT try to launch everything at once.** The product has 21 working features and 12 half-built ones. Launching everything creates a confusing product that does nothing well.

**Recommended launch tiers:**

#### Tier 1 — Day 1 Public Beta (Launch with these only)

| Feature | Why Lead With This |
|---|---|
| **AI Chat (RGY + Memory)** | The core. Everything else is secondary. |
| **Voice mode (STT/TTS)** | The "wow" moment no competitor has by default |
| **Daily Journal (Rozana)** | Creates daily retention habit |
| **Auth (magic link + passkeys)** | Friction-free signup |
| **BYO Mode** | Earns trust from power users |
| **Journey Memory** | This is what makes the product sticky |

Hide everything else behind feature flags. Turn things on as they're ready.

#### Tier 2 — 30 Days After Beta (Add when stable)

- Job Hunt Mode
- Social Army (if your Railway worker is stable)
- RGY Chat Rooms (after PR #184 + BrowserPool)
- Unified Notifications

#### Tier 3 — 60+ Days (After first revenue)

- Emergent Studio (only when TODOs resolved)
- Verbal Commands (only when BrowserPool wired on Railway)
- Cubiqo Wallet
- CQ-to-CQ Video Calls

### 4.2 Pricing Adaptation (Starting Position)

You already have `Free / Premium ($19/mo) / Enterprise ($99/mo) / Founder` in the schema. 

**Solopreneur Reality Check:**

| Tier | Recommended Starting Price | Why |
|---|---|---|
| **Free** | Generous — unlimited chat, 1 journal/day, memory on (with consent) | You need users before you need revenue |
| **Premium** | $9/mo (not $19/mo) | $19/mo is a high ask for a new product nobody has heard of. Start at $9, expand to $15, then $19 as brand builds. |
| **Pro / Power User** | $29/mo — includes Social Army + Job Hunt | Bundle the automation features for the power user segment |
| **Founder / Teams** | Hold — come back to this in 6 months | Too complex to market solo |

**Do NOT turn on Stripe payments until:** ToS is live, Privacy Policy is live, your LLC is registered, and at least 100 free users have used the product and given you feedback.

### 4.3 "Adapt or Die" Scenarios (Things That Could Break Your Product)

| Risk | Probability | Mitigation |
|---|---|---|
| Anthropic/MiniMax raises API prices steeply | High | BYO Mode + OpenRouter fallback already built — you're partially protected |
| A competitors platform (Perplexity, Claude, Gemini) launches a memory feature | Medium | Your moat is the **combination** — voice + memory + mood routing + automation. No one has all four. |
| Twitter/Instagram bans Social Army accounts | High | Already flagged in AUP — your ToS says users accept that risk. But offer official API paths as premium alternative. |
| Vercel bill spikes on scale | Medium | Implement aggressive serverless caching; add spending alerts at $200/month threshold |
| User data breach | Low but catastrophic | AES-256 for keys/tokens already in place. Add Supabase column-level encryption for `messages` content. Get cyber insurance (see Section 6). |

---

## SECTION 5 — REACH-OUT STRATEGY

### 5.1 Who Is Your First User? (Be Specific)

Before any marketing, you need to pick ONE persona for launch. The worst thing you can do as a solo founder is market to everyone.

**Recommended first target: "The Ambitious Operator"**
- Age 25–40
- Running a side hustle, creator business, or early-stage startup solo or with 1 partner
- Pays for at least 3 other SaaS tools ($50–$150/month)
- Already uses ChatGPT but frustrated it forgets them
- Active on Reddit (r/entrepreneur, r/SideProject), Twitter/X, LinkedIn

**Why this person?**
- They will pay $9/month without needing a demo — they know the value of productivity tools
- They will tell their network if they love something
- They are the exact user for: Journal, Job Hunt, Social Army, BYO Mode

### 5.2 Outreach Channels (Ranked by Effort vs Return for Solopreneur)

#### Channel 1 — Product Hunt Launch (Medium effort, high visibility)
- Launch on a Tuesday or Wednesday at 12:01 AM PST (when PH resets)
- Prepare: animated GIF of the cube changing colour + voice demo + memory demo
- Write a genuine "Why I built this" founder story — NO corporate speak
- Get 10–15 people ready to upvote on launch day (friends, communities you're in)
- Expected outcome: 200–500 upvotes if the launch is good; 500–2,000 new visitors

#### Channel 2 — Reddit (Low effort, high credibility)
- Post in: `r/SideProject`, `r/entrepreneur`, `r/Productivity`, `r/ChatGPT`, `r/artificial`
- Format that works: "I spent 3 months building an AI that remembers everything about you and acts on your behalf — here's what I learned"
- DO NOT post links first visit — engage genuinely for 2 weeks, then share when relevant
- Expected outcome: 50–200 genuine signups per well-received post

#### Channel 3 — Twitter/X Threads (High effort, compounds over time)
- Post a "building in public" thread every week: what you shipped, what broke, what you learned
- Demo videos of the cube changing colour, voice responding, journal AI analysis
- Tag: AI, productivity, solopreneur, indiedev spaces
- Expected outcome: 30–100 new followers per good thread; converts to users at ~5–10%

#### Channel 4 — LinkedIn Articles (Low to medium effort, professional audience)
- Target: "The problem with every AI assistant is they forget you the moment you close the tab"
- Professional tone, solution-oriented
- Great for Job Hunt Mode angle: "I built an AI job hunting companion — here's the data after 30 days"
- Expected outcome: 500–2,000 article views; 1–3% convert to signups

#### Channel 5 — Cold DM / Warm email to beta testers (High ROI, low volume)
- Reach out to 30–50 people in your network who fit the "Ambitious Operator" persona
- Be personal: "I built something that solves exactly [specific pain you know they have]"
- Ask for 20 minutes of their time and honest feedback, not a sale
- Expected outcome: 5–10 active testers who give you gold-level feedback

#### Channel 6 — Discord / Slack Communities (Medium effort)
- Target communities: Product Hunt makers, Indie Hackers, BetaList, Buildspace alumni
- Offer free Premium tier for the first 50 community members who sign up and leave feedback
- Expected outcome: 20–50 high-quality early adopters

### 5.3 Content Strategy (Single Creator Playbook)

Pick ONE format you can sustain. Consistency beats quality in the beginning.

**Recommended for you: short-form video (Twitter/X + LinkedIn)**
- 60–90 second demos of specific features
- Show the cube animating + voice responding + memory recall
- Caption: "No other AI does this" + feature name + link

**Content calendar (minimum viable — 3x/week):**
- **Monday:** Feature demo video
- **Wednesday:** "Building in public" — what shipped this week
- **Friday:** User story or data point ("User used the Daily Journal 30 days straight — here's what their memory looks like")

---

## SECTION 6 — INSURANCE & FINANCIAL PROTECTION (SOLOPRENEUR MINIMUM)

> Standard disclaimer: I am not a lawyer or licensed insurance agent. Verify all of this with a licensed professional in your jurisdiction. This is a guide, not legal advice.

### 6.1 Insurance You Should Have

| Insurance Type | What It Covers | For CubiQo Specifically | Estimated Annual Cost |
|---|---|---|---|
| **Errors & Omissions (E&O) / Professional Liability** | If your product fails to do what you promised — e.g., an automation sends a wrong email, deletes wrong content, fails to apply for a job on time. User sues you for consequential loss. | The most critical one. Your BrowserPool does actions on behalf of users. If it sends the wrong thing or does something harmful, they can claim damages. | $500–$2,000/year USD |
| **Cyber Liability Insurance** | Data breach — if your Supabase DB is compromised and user conversation data / emails leak. Covers: legal defense, notification costs, credit monitoring for affected users, regulatory fines. | CRITICAL — you store: emails, full conversation histories, memory profiles, BYO API keys (encrypted but still a target). One breach without insurance can be financially fatal for a solo founder. | $500–$1,500/year USD |
| **General Liability** | Bodily injury, property damage, advertising injury. | Less critical for a fully-digital product, but required if you ever attend trade shows, meetups, sign office leases, or have contractors on-site. | $300–$700/year USD |
| **Directors & Officers (D&O)** | Personal liability for decisions made as an officer of the company. | Low priority until you have investors or a board. Skip for now. | N/A for now |
| **Product Liability** | If a physical product causes harm. | Not applicable — you're digital only. Skip. | N/A |

**Practical first step:** Visit **CoverWallet**, **Next Insurance**, or **Hiscox** online — all offer solopreneur tech/SaaS packages combining E&O + Cyber + GL for ~$1,000–$2,500/year. You can get a quote in 10 minutes.

### 6.2 Financial Guardrails You Must Set

These are not "nice to have" — they are operational necessities:

| Guardrail | Why | How |
|---|---|---|
| **Vercel spending limit** | Your platform auto-scales. One viral moment or a DDoS attack can create a $5,000+ Vercel bill overnight. | Set a hard spend cap at $200/month in Vercel Project Settings → Billing → Spend Management |
| **Supabase plan cap** | Supabase's free tier has DB size limits; if you blow past them, your app dies silently. | Set up Supabase usage alerts at 80% of your plan tier |
| **Anthropic $200/month cap** | Already coded in `checkSpendingCap('anthropic')` — VERIFY this is actually working in production. | Test it. Check the spending cap unit tests pass. |
| **Stripe payout reserve** | Don't count revenue until the 7-day dispute window closes. | Keep 30% of monthly revenue in a reserve buffer for chargebacks |
| **Separate business account** | Mix personal + business finances and you lose LLC protection (piercing the corporate veil). | Open a free Mercury, Relay, or Wise business account before accepting any payment |
| **Quarterly estimated taxes** | As a solopreneur, no one withholds taxes for you. Save 25–30% of every dollar of profit for taxes. | Auto-transfer to a tax savings account on the 1st of every month |

---

## SECTION 7 — OTHER CRITICAL CONSIDERATIONS

### 7.1 Accessibility (ADA / WCAG Compliance)

Your vibrant UI (dark mode, animated cube, colour-coded RGY system) is visually striking but raises accessibility concerns:

| Issue | Risk | Fix |
|---|---|---|
| Reliance on colour for meaning (RGY) | Users with colour blindness cannot understand the mood system | Add shape/text labels alongside colour |
| animated cube as primary UI element | Screen readers cannot parse Three.js canvas | Add `aria-label` to the canvas + fallback text content |
| Magic link only auth | Users without email access have no alternative | Passkeys already added — good. Add phone SMS as third option later. |
| Low contrast in some text | WCAG 2.1 AA requires 4.5:1 contrast ratio | Run a contrast audit tool (e.g., Lighthouse, axe) |

ADA compliance is not just the right thing to do — plaintiff's attorneys in the US actively search for non-compliant websites and send demand letters. Fix the obvious issues first.

### 7.2 GDPR Compliance Checklist (EU Users)

| Requirement | Status | Action |
|---|---|---|
| **Data minimization** — collect only what you need | ⚠️ Partial — you collect full conversation histories | Offer users options to NOT store conversations |
| **Right to erasure** ("be forgotten") | ⚠️ — `DELETE /api/journey/memories` exists but no UI to delete *all* data | Build a "Delete My Account + All Data" button in Settings |
| **Data portability** — user can export their data | 🔴 Missing | Build a "Download My Data" (JSON export of profile + memories + journals) |
| **Consent records** | ✅ Partial — `conscious_memory_consent` column exists | Extend consent tracking to cover: analytics, browser automation, email marketing |
| **Data processor agreements** | 🔴 Missing | Sign DPAs with: Supabase, Anthropic, ElevenLabs, Groq, Resend, Railway |
| **Privacy by design** | ✅ Strong — AES-256 encryption, RLS on all tables | Good baseline — maintain this standard for new features |
| **Cookie consent** | 🔴 Missing | Add a cookie banner on first visit |

**If you intend to have any EU users:** A GDPR violation fine can be up to 4% of annual global turnover or €20 million, whichever is higher. Even for a tiny company, regulators are increasingly targeting SaaS products. A proper privacy policy + consent mechanism costs $0–$500 to implement; ignoring it can cost everything.

### 7.3 Third-Party Platform ToS Risk

You are building automation on top of platforms that have explicitly banned it:

| Platform | Their ToS Position | Your Risk | Mitigation |
|---|---|---|---|
| **Twitter/X** | API-only automation allowed; Puppeteer is banned | Account bans, IP bans | Disclose in AUP. Consider Twitter API tier for Social Army. |
| **Instagram** | Automation strictly banned | Same as above | Strong AUP language placing risk on user |
| **LinkedIn** | Automation banned | Professional account bans | Same |
| **Uber** | Automation of booking is a ToS violation | Account termination | Disclose; offer official OAuth when available |
| **Gmail** | Automation via Puppeteer violates ToS; use Gmail API for legitimate access | Account lockout, Google flag | Migrate Gmail service to official Google OAuth + Gmail API |
| **WhatsApp** | Meta banned unofficial automation; WhatsApp Business API is the only legal route | Account bans, legal action from Meta | Strong AUP; only offer Business API path at launch |

**Strategy:** For launch, only enable automation where you have either (a) official API access or (b) explicit user consent + AUP language placing the risk on them. The Social Army is the current highest-risk feature.

### 7.4 Competitive Moat — What to Build Next That No One Else Is Building

Now that you see the full picture of what's done and what isn't, here is the one feature that would create the most defensible moat going forward:

> **"The Living Profile"** — A single page that shows each user a visual map of everything CubiQo knows about them: their memories, their journal themes, their mood history, their goals. Updated in real time. Exportable. Controllable.

No other AI product gives users this level of transparency and control. It turns the memory system from a privacy concern into a product feature. It creates viral moments ("look how much my AI knows about me"). And it makes churning feel like a loss — because all that data leaves with you.

This is a 2–3 day implementation on top of the existing `conscious_memories` table.

### 7.5 What a "Minimum Viable Launch" Looks Like

You do NOT need all 21 E2E features live. You need:

```
✅ Auth (magic link)
✅ AI Chat with memory
✅ RGY colour system  
✅ Voice (STT + TTS) — after PR #183
✅ Daily Journal
✅ Terms of Service page
✅ Privacy Policy page
✅ Cookie consent banner
✅ Settings > Delete My Data
✅ LLC registered
✅ E&O + Cyber insurance policy
✅ Stripe payment flow (even if only 1 tier)
⬜ Onboarding flow wired to DB
⬜ New user → /onboarding redirect
```

That's it. Launch with that. The rest follows.

---

## PRIORITY ACTION LIST (This Week)

| Day | Action | Time |
|---|---|---|
| **Day 1** | Delete `/rescue` and `/founderspass` PIN pages. Merge PR #183 + #184. | 2 hours |
| **Day 1** | Register LLC / Ltd for your business | 1 hour online |
| **Day 2** | Write Terms of Service (use a template from Termly.io or GetTerms.io — $10–$30) | 3 hours |
| **Day 2** | Write Privacy Policy covering all 8 third-party AI vendors | 2 hours |
| **Day 3** | Wire `/auth/callback` to redirect new users to `/onboarding` | 1 hour |
| **Day 3** | Wire onboarding config save to `profiles` DB | 2 hours |
| **Day 4** | Get an E&O + Cyber insurance quote (CoverWallet or Next Insurance) | 30 minutes |
| **Day 4** | Set up Vercel spend cap at $200/month | 15 minutes |
| **Day 5** | Add "Delete My Account + All Data" button in Settings | 3 hours |
| **Day 5** | Add cookie consent banner | 1 hour |
| **Day 5** | Post first "building in public" Twitter/LinkedIn thread | 1 hour |
| **Day 6–7** | Fix Dashboard journal count, persist adaptive user model to Supabase | 4 hours |

---

*Document saved: `GTM_READINESS_SOLOPRENEUR_GUIDE.md`*  
*Companion document: `MASTER_TECHNO_FUNCTIONAL_ANALYSIS.md`*
