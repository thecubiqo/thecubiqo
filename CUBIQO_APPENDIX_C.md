# Cubiqo Appendix C — Extended Strategy Deep-Dives
**Branch:** `copilot/investigate-features-and-ui-components`  
**Date:** 2026-02-22  
**Author:** MO (CTO / AI Co-Founder)

> **Document Links (GitHub)**
>
> | Document | Link |
> |---|---|
> | Master Report (Markdown) | https://github.com/thecubiqo/thecubiqo/blob/copilot/investigate-features-and-ui-components/CUBIQO_MASTER_REPORT.md |
> | Master Report (PDF) | https://github.com/thecubiqo/thecubiqo/raw/copilot/investigate-features-and-ui-components/CUBIQO_MASTER_REPORT.pdf |
> | Appendix B (15 deep-dives) | https://github.com/thecubiqo/thecubiqo/blob/copilot/investigate-features-and-ui-components/CUBIQO_APPENDIX_B.md |
> | Architecture — Current | https://github.com/thecubiqo/thecubiqo/blob/copilot/investigate-features-and-ui-components/CUBIQO_ARCHITECTURE_CURRENT.md |
> | Architecture — Roadmap | https://github.com/thecubiqo/thecubiqo/blob/copilot/investigate-features-and-ui-components/CUBIQO_ARCHITECTURE_ROADMAP.md |
> | Patent Opportunities | https://github.com/thecubiqo/thecubiqo/blob/copilot/investigate-features-and-ui-components/PATENT_OPPORTUNITIES.md |
> | Patent Flow Diagrams | https://github.com/thecubiqo/thecubiqo/blob/copilot/investigate-features-and-ui-components/PATENT_FLOW_DIAGRAMS.md |
> | MO Final Verdict | https://github.com/thecubiqo/thecubiqo/blob/copilot/investigate-features-and-ui-components/MO_FINAL_VERDICT.md |
>
> **To download the PDF directly:** click the "Master Report (PDF)" link above → click the "Download raw file" button on GitHub.

---

## Topic 1 — Tools for Success + 3rd-Party Agencies

### 1.1 Core Digital Tools Stack

| Category | Tool | Purpose | Monthly Cost | Priority |
|---|---|---|---|---|
| **SEO & Keyword Research** | SEMrush | Keyword tracking, backlink audit, competitor research, content gap | ~$120/mo (Pro) | P0 |
| **Web Analytics** | Google Analytics 4 | Page views, user journeys, conversion funnels, audience segments | Free | P0 |
| **Session Recording** | Microsoft Clarity | Heatmaps, session replays, rage-click detection | Free | P0 |
| **Product Analytics** | PostHog (self-hosted) | Feature flags, funnel analytics, cohort analysis, A/B testing | Free (OSS) | P0 |
| **Event Pipeline** | Segment.io | Route analytics events to GA4 + PostHog + email tools from one SDK | Free up to 1K MAU | P1 |
| **Email Marketing** | Resend + React Email | Transactional + drip sequences (already partially wired in codebase) | ~$20/mo | P0 |
| **CRM & Lifecycle** | HubSpot Starter | Lead capture from landing page, lifecycle stages, deal pipeline | ~$20/mo | P1 |
| **Social Scheduling** | Buffer or Publer | Schedule posts from Social Army output across 10 platforms | ~$15/mo | P1 |
| **Video Creation** | CapCut + ElevenLabs | Short-form video content; AI voiceover matching Cubiqo's voice engine | ~$22/mo | P1 |
| **Heatmaps (paid)** | Hotjar | More powerful session analytics once user base grows | ~$32/mo | P2 |
| **A/B Testing** | Vercel Edge Config + PostHog flags | Landing page variant tests (plasma vs silver vs tech wireframe) | Included | P1 |
| **Uptime Monitoring** | BetterStack (Uptime) | Alert on downtime, track 99.9% SLA | Free tier sufficient | P0 |
| **Error Tracking** | Sentry | Catch runtime errors before users report them | Free up to 5K events | P0 |
| **AI SEO Content** | Surfer SEO | Optimize blog posts and landing copy for search intent clusters | ~$89/mo | P2 |
| **Link-in-bio** | Linktree Pro | Central hub for all social profiles pointing to cubiqo.com/join | ~$9/mo | P1 |

**Minimum viable stack cost (P0 tools only): ~$140/month.**

---

### 1.2 3rd-Party Agencies & Partners

#### A. Affiliate Platform (Enable Revenue-Sharing)

| Platform | Why | Revenue Model | Setup Time |
|---|---|---|---|
| **Impact.com** | Industry gold standard; 75K+ brands; supports SaaS payouts | % of MRR attributed to referral | 2–4 weeks |
| **ShareASale** | Cheaper, simpler; good for digital products | Flat CPA or % commission | 1 week |
| **PartnerStack** | Purpose-built for SaaS; native Stripe integration | Tiered commission based on MRR | 1–2 weeks |

**Recommendation:** Start with **PartnerStack** (SaaS-native, Stripe-native, lowest friction). Graduate to Impact once you have 50+ active affiliates.

**What this unlocks:** Users who refer others get CubiKey credits or cash. Creators who embed your widget get 20–30% recurring commission. This is the WeChat mini-program parallel.

#### B. Performance Marketing Agency

You don't need a full agency yet. Use these instead:

| Resource | What For | Cost |
|---|---|---|
| **Mayple.com** | AI-matched freelance media buyers; pay per performance | Project-based |
| **Fiverr Pro (verified)** | Meta Ads / TikTok Ads setup for a specific campaign | $200–500 per campaign |
| **GrowthMentor.com** | 1:1 session with growth marketer who's scaled a similar product | $50–100/hr |

#### C. Investor Access

| Service | What It Does | Cost |
|---|---|---|
| **AngelList Syndicates** | List your raise; angels invest in syndicates of $1K–10K each | 5% carry |
| **Wefunder** | Regulation CF crowdfunding; get 500+ micro-investors from your own community | 3–5% fee |
| **Gust.com** | Submit to accelerators and angel networks en masse | Free |
| **Republic.co** | Consumer-facing investment raises; good for brands with a community story | 6% fee |
| **DocSend** | Share pitch deck + track who read it, how long per slide | ~$45/mo |

**Solopreneur reality:** Your first $150K–250K will come from your personal network + one or two angels who believe in you, not agencies. Use Wefunder to run a community round once you hit 500 active users — this turns users into stakeholders and creates viral word-of-mouth.

#### D. Legal & Compliance

| Service | What For | Cost |
|---|---|---|
| **Clerky.com** | Delaware C-Corp formation, cap table, SAFEs | ~$800 one-time |
| **Stripe Atlas** | Quick incorporation + Stripe account in one flow | $500 one-time |
| **Termly.io** | GDPR/CCPA compliant ToS and Privacy Policy generator | ~$30/mo |
| **WithKawazu.com** | AI-assisted software IP attorney (startup rates) | ~$200/hr |

---

## Topic 2 — Domain Strategy: cubiqo / coqo / ciqo + 30+ Country TLDs

### 2.1 What You Have (Assumed Asset Inventory)

Based on the brand:

| Domain Set | Examples | Strategic Value |
|---|---|---|
| **Core Brand** | cubiqo.com, cubiqo.ai, cubiqo.io | Primary; highest authority |
| **Phonetic alternates** | coqo.com, ciqo.com, cubiqu.com | Brand protection; prevent typosquatting |
| **Country ccTLDs** | cubiqo.ca, cubiqo.co.uk, cubiqo.de, cubiqo.in, cubiqo.au, cubiqo.fr, etc. | Geo-targeting, local SEO, legal jurisdiction |
| **New gTLDs** | cubiqo.app, cubiqo.chat, cubiqo.tech | Product-specific sub-brands |

### 2.2 Recommended Strategy (Priority Order)

```
TIER 1 — PROTECT (register immediately if not done)
┌─────────────────────────────────────────────────────────┐
│  cubiqo.com    ← PRIMARY (all traffic lands here)       │
│  cubiqo.ai     ← AI product credibility signal          │
│  cubiqo.io     ← Developer/tech audience fallback       │
│  coqo.com      ← Typo protection                        │
│  ciqo.com      ← Typo protection                        │
└─────────────────────────────────────────────────────────┘

TIER 2 — REDIRECT (buy, 301-redirect to cubiqo.com)
┌─────────────────────────────────────────────────────────┐
│  cubiqo.ca   → cubiqo.com  (Canadian market, your home) │
│  cubiqo.co.uk → cubiqo.com (UK — biggest English market)│
│  cubiqo.in   → cubiqo.com  (India — massive AI market)  │
│  cubiqo.au   → cubiqo.com  (Australia — Anglophone)     │
│  cubiqo.de   → cubiqo.com  (Germany — GDPR-forward)     │
│  cubiqo.fr   → cubiqo.com  (France — EU anchor)         │
│  cubiqo.app  → cubiqo.com  (Mobile installs)            │
└─────────────────────────────────────────────────────────┘

TIER 3 — FUTURE (hold, activate only at scale)
┌─────────────────────────────────────────────────────────┐
│  cubiqo.ae   — UAE launch (high AI adoption)            │
│  cubiqo.sa   — Saudi Arabia                             │
│  cubiqo.sg   — Singapore (APAC hub)                     │
│  cubiqo.br   — Brazil (fastest-growing AI market 2025)  │
│  cubiqo.mx   — Mexico (Latin America gateway)           │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Technical Implementation

| Action | How | Impact |
|---|---|---|
| **301 redirects** | Vercel → Project Settings → Redirects, or Cloudflare Page Rules | Preserves link equity; all ccTLD authority flows to cubiqo.com |
| **Hreflang tags** | Add `<link rel="alternate" hreflang="en-ca" href="...">` in `src/app/layout.tsx` | Signals Google to show correct URL to each country |
| **Geo-targeting in GSC** | Set cubiqo.com as international target in Google Search Console | Tells Google your site serves all markets |
| **CDN edge locations** | Vercel Edge Network handles this automatically | Serves from nearest edge to each user |

### 2.4 The CQ/Coqo Brand Option

If you want a shorter consumer brand (like how Instagram → Meta), consider:
- **coqo.ai** as the consumer-facing social/RGY app brand
- **cubiqo.com** as the platform/enterprise brand
- This mirrors Google/YouTube, Facebook/Instagram, Salesforce/Slack

**Cost to hold 30 domains: ~$900/year.** Worth every dollar for brand protection at this stage.

---

## Topic 3 — Landing Page: Conversion Standards + Silver Wireframe Feedback

### 3.1 Industry Conversion Benchmarks

| Landing Page Type | Median CVR | Top Quartile CVR | What "Convert" Means |
|---|---|---|---|
| SaaS free trial | 2–5% | 8–12% | Email sign-up |
| AI tool waitlist | 8–20% | 25–40% | Join waitlist |
| Consumer app (curiosity hook) | 12–35% | 40–60% | Tap to enter + complete onboarding |
| Product Hunt launch day | 2–6% | 10–15% | Upvote + sign-up |

**Your current landing does NOT have a clear CTA above the fold.** "Tap to begin" only shows up after 3 seconds of animation. This is the single biggest conversion leak.

### 3.2 What the Industry Standard Landing Page Has

```
ABOVE THE FOLD (visible without scrolling, no animation required):
┌──────────────────────────────────────────────────────────────┐
│  LOGO + wordmark (top left)                                  │
│                                                               │
│  HERO HEADLINE  — "What it does in 8 words"                  │
│  SUB-HEADLINE   — "Who it's for and what changes for them"   │
│                                                               │
│  [PRIMARY CTA BUTTON]  "Start Free" / "Join Waitlist"        │
│  Social proof: "12,000 people already using this"            │
│                                                               │
│  VISUAL HOOK (cube / animation / screenshot)                  │
└──────────────────────────────────────────────────────────────┘
BELOW THE FOLD:
│  Pain → Solution narrative                                   │
│  3 feature cards with icons                                  │
│  Testimonials / logos                                        │
│  FAQ                                                         │
│  Second CTA                                                  │
```

### 3.3 Silver Wireframe — MO's Design Feedback

The silver wire aesthetic is **the right direction**. Here is why and what to tweak:

| Element | Current (Plasma Wave) | Silver Wire (New) | Verdict |
|---|---|---|---|
| Emotional tone | Mystical, spiritual | Precise, intelligent, premium | ✅ Better for B2B + sophisticated users |
| Color temperature | Warm purple/cyan | Cool silver-chrome | ✅ Signals "intelligence" |
| Animation speed | Fast plasma pulse | Slow elegant morph | ✅ More premium feel |
| Background | Near-black + purple glow | Near-black + blue-silver glow | ✅ Cleaner |
| Text legibility | White on dark — good | White-silver on dark — good | ✅ |
| CTA visibility | Hidden below fold | Still hidden — needs fix | ❌ Fix this |

**Recommended tweaks to the silver cube landing:**

1. **Add a CTA button overlay** — don't rely on "tap anywhere". Add:
   ```
   [ Start Free — No Card Required ]
   ```
   as a pill button below the tagline. Keep "tap to begin" as secondary text.

2. **Add a single social proof line** between the wordmark and the tagline:
   ```
   Trusted by 1,200+ solopreneurs  ← update this as your numbers grow
   ```

3. **Morph timing** — the current 4-second cube→sphere cycle is excellent. Keep it.

4. **Add a subtle scanline/grid overlay** at 3–5% opacity to reinforce the "intelligence dashboard" aesthetic.

5. **The corner decorative marks** (already in the code) are perfect — don't remove them. They signal precision.

**A/B Test Plan:**

```
Variant A: plasma-wave (current default)
Variant B: silver-wireframe (new)
Variant C: silver-wireframe + CTA button overlay

Metric: email capture rate on the landing → app entry
Tool: PostHog feature flags + Vercel URL params (?landing=silver-wireframe)
Duration: 14 days minimum, 500+ sessions per variant
```

---

## Topic 4 — RGY Score / CQ Intelligence (CQ Score Design)

### 4.1 What Exists Today (Code Reality)

From `supabase/migrations/` and `src/lib/`:
- RGY zones are assigned per journal entry / chat intent
- Keywords are tracked with zone colour + intent type (collaborate/trade/connect)
- There is no "CQ Score" numeric value — only zone labels

### 4.2 The CQ Score Vision (Design Proposal)

**CQ = Cubiqo Intelligence Quotient** — a living, composite score that represents a user's **growth trajectory across all life dimensions**, not a judgment on where they are.

```
CQ SCORE ARCHITECTURE
═══════════════════════════════════════════════════════

CQ SCORE (100–999)
│
├── DIMENSION 1: Clarity (RED zone activity)
│   "How much is actively changing in your life?"
│   Score inputs: journal frequency, topics flagged as
│   high-change, emotional variance across entries
│   Range: 0–333
│
├── DIMENSION 2: Growth (YELLOW zone activity)
│   "How actively are you learning & connecting?"
│   Score inputs: new keywords, new intent types explored,
│   RGY matches made, job hunt activity, courses taken
│   Range: 0–333
│
└── DIMENSION 3: Alignment (GREEN zone activity)
    "How aligned are you with your intentions?"
    Score inputs: journal consistency, completed goals,
    RGY connections that led to outcomes, positive sentiment
    Range: 0–333

BONUS (+1 to +99):
    Connection bonus: friends added, messages exchanged
    App engagement: streak days, features used
```

**Key principle (from your brief):**
> "Red should not be derogatory — it is change, it is dynamism, it is life in motion."

The scoring system should **reward change**, not penalise it:
- A user deeply in RED (lots of change) should have a high CQ if they're journaling about it
- A user stuck in YELLOW forever with no growth should score lower than a dynamic RED user

### 4.3 ConstantQuestioner.com Integration

**Domain tie-in:** `constantquestioner.com` → the "CQ number" concept.

| Concept | How It Works |
|---|---|
| **CQ Score** | Numerical 100–999, visible on profile |
| **CQ Number** | Already implemented (`CQ-XXXX-XXXX` format in `src/lib/cq-to-cq/cq-number-generator.ts`) |
| **Tie the two** | CQ Score is displayed alongside CQ Number on the user profile card |
| **ConstantQuestioner** | A content brand / quiz platform that feeds CQ Score inputs: complete a questionnaire, your answers adjust your CQ Score dimensions |

**Database changes needed:**

```sql
-- Add CQ Score to user profiles
ALTER TABLE profiles ADD COLUMN cq_score INTEGER DEFAULT 100;
ALTER TABLE profiles ADD COLUMN cq_clarity INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN cq_growth INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN cq_alignment INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN cq_last_calculated TIMESTAMPTZ;

-- CQ Score history for charting
CREATE TABLE cq_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cq_score INTEGER NOT NULL,
  cq_clarity INTEGER,
  cq_growth INTEGER,
  cq_alignment INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API endpoint needed:** `POST /api/cq/recalculate` — triggered after each journal entry or RGY match event.

### 4.4 Why This Is Powerful

1. **Gamification without toxicity** — the score grows with engagement, never punishes users
2. **Social identity** — "I'm a CQ-847" becomes a badge, like credit scores but positive
3. **Investor metric** — average CQ score growth over time = proof of product value
4. **Monetization hook** — "CubiKey Pro users score 34% higher CQ on average" — upgrade incentive

---

## Topic 5 — CQ Number as Universal Identity: Permanent vs Rotating + Adoption Strategy

### 5.1 What Already Exists

In `src/lib/cq-to-cq/cq-number-generator.ts`:
```
Format: CQ-XXXX-XXXX (e.g., CQ-8F3A-2K9B)
Rotation: every 30 days (privacy feature)
Entropy: 32^8 = ~1 trillion combinations
QR code: generateCQNumberQRData() already implemented
Shareable link: https://cubiqo.com/add/CQ-XXXX-XXXX already implemented
```

### 5.2 The Problem: Rotating ≠ Identity

A rotating number is **great for privacy** but **terrible for identity**. Phone numbers don't change. Instagram handles don't change. For CQ Number to work as a persistent identity anchor, you need a two-layer system:

```
LAYER 1 — Permanent CQ Handle (like @username)
  CQ-8F3A-2K9B  ← permanent, assigned at account creation, never changes
  Used for: profile sharing, QR codes, "find me" links
  Stored as: immutable in profiles.cq_handle column

LAYER 2 — Rotating Privacy Token (already exists, keep it)
  CQ-2K9B-TEMP  ← rotates every 30 days
  Used for: anonymous RGY matching, temporary connections
  Stored as: cq_numbers table (already implemented)
```

**Code change needed:** Add `cq_handle` column to profiles as immutable; generator runs once at registration.

### 5.3 Why Would People Want a CQ Number? (Adoption Psychology)

The same reason people want a LinkedIn URL, an Instagram handle, a Linktree. The answer is always: **social proof + access**.

| Incentive | Mechanic | Analogy |
|---|---|---|
| **Exclusivity** | First 10,000 users get "Founder CQ" prefix: `CQ-F-XXXX` | Discord Nitro early badge |
| **Network effect** | "Add me on Cubiqo: CQ-8F3A-2K9B" becomes a social phrase | Cash App $cashtag |
| **Verification** | CQ-Verified badge for users with 90-day+ accounts + CQ Score > 500 | Twitter/X blue tick |
| **Commerce** | "Share your CQ Number, your friend gets 10% off their first CubiKey" | Referral codes |
| **Professional** | Add CQ Number to LinkedIn bio, email signature | Personal website URL |
| **Business card** | QR code of CQ Number on physical card → your Cubiqo profile | WeChat QR code |
| **Emergency protocol** | "In crisis? Share your CQ Number with someone you trust — they can see your zone" | ICE contact |

**The WeChat parallel:** In China, you don't exchange phone numbers, you exchange WeChat QR codes. CQ Number is the same play — but AI-native.

### 5.4 Implementation Checklist

```
☐ Add cq_handle (permanent) to profiles table — migration needed
☐ Generate cq_handle at account creation, never change it
☐ Show CQ Number prominently on profile page (above the fold)
☐ Add "Copy CQ Number" button with one-tap clipboard copy
☐ Add QR code display on profile (qrcode.react library, already in many OSS stacks)
☐ Add "Find by CQ Number" search on friends/connection page
☐ Add CQ Number to the onboarding flow as a celebratory moment:
   "You are CQ-8F3A-2K9B — share this with anyone to connect"
☐ Add CQ Number to email signature template sent after registration
☐ Create /add/[cq-number] public landing page (already referenced in generator)
```

---

## Topic 6 — Cubiqo as Commerce Layer / WeChat Super-App

### 6.1 What Already Exists (Confirmed in Code)

**`src/lib/deals/deals-service.ts`** — A full Groupon-style deals engine already exists:

```typescript
// Already implemented:
detectInterestCategories(text)  // NLP keyword → deal category
hasDealIntent(text)             // "discount", "deal", "save" → trigger
fetchDeals({ category, maxResults })  // returns curated deal catalog
getContextualDeals(userMessage) // full pipeline: detect → fetch → return

// 10 deal categories already catalogued:
// food, travel, shopping, entertainment, beauty, fitness,
// electronics, education, services + more
```

**The gap:** All deals are hardcoded mock data with `url: '#'`. No real affiliate connection yet.

### 6.2 WeChat Super-App Layer (What to Build)

```
CUBIQO SUPER-APP LAYERS
═══════════════════════════════════════════════════════

LAYER 1 (EXISTS): AI Conversation + Memory
  User talks to Cubiqo → gets smart responses → memory stored

LAYER 2 (EXISTS): RGY Journaling + Peer Matching
  User journals → RGY zone classified → capsule created → matched

LAYER 3 (EXISTS - MOCK): Deals & Commerce
  User mentions "cheap flights" → deals engine returns offers
  NEXT: Connect to real affiliate feeds (Commission Junction, CJ Affiliate)

LAYER 4 (PARTIAL): CQ-to-CQ Messaging & Calls
  Friends system, direct messages, WebRTC calls all coded
  NEXT: Make this the primary social layer

LAYER 5 (NOT BUILT): Mini-Programs / CubiKey Ecosystem
  Third parties build modules that live inside Cubiqo
  User pays once, gets curated apps from trusted ecosystem
  This IS the WeChat mini-program play

LAYER 6 (NOT BUILT): Payments & Wallet
  CubiKey credits as in-app currency
  Stripe → CubiKey top-up → spend on deals, mini-programs, upgrades

LAYER 7 (NOT BUILT): Local Services
  Geo-aware deals + CQ-matched service providers in your city
  "You mentioned you need a therapist → here are 3 CQ-verified therapists near you"
```

### 6.3 Affiliate Commerce: How to Actually Monetize the Deals Engine

**Phase 1 — Week 1–2:** Wire real affiliate feeds

| Affiliate Network | Best For | Integration |
|---|---|---|
| **Commission Junction (CJ)** | Travel, electronics, retail | REST API + XML feed |
| **Rakuten Advertising** | Fashion, beauty, lifestyle | API |
| **Amazon Associates** | Electronics, books | Product Advertising API |
| **Groupon Getaways API** | Travel, experiences | REST (requires approval) |
| **Honey / Capital One Shopping** | Price comparison | Partner programme |

**Revenue per transaction:** 3–15% commission depending on category. At 1,000 active users making 1 purchase/month averaging $50 → **$1,500–7,500/month passive income from deals alone**.

**Phase 2 — Month 2:** Add deal personalization  
Connect deals to RGY zone + journal keywords. If user's GREEN zone keywords include "travel" and "wellness" → surface only travel and spa deals. This is the contextual moat that generic deal sites don't have.

**Phase 3 — Month 3:** CQ-Verified Local Professionals  
Allow therapists, coaches, designers to list their services. Cubiqo takes 15% booking fee. User pays via Stripe. Service provider gets a CQ Badge. This is the LinkedIn-meets-Groupon-meets-Airbnb layer.

### 6.4 Discount Code Engine (What the User Described)

> "it has a code for discount AND IT knows where exactly to buy and it knows the user for a good contextual recommendation"

This is **exactly** the deals engine but with two additions:

1. **Promo code field** in the deal object (add `promoCode?: string` to the Deal type in `src/lib/deals/types.ts`)
2. **Contextual matching** — already implemented via `detectInterestCategories()`, just needs real data

```typescript
// Proposed enhanced Deal type
interface Deal {
  // ... existing fields ...
  promoCode?: string      // "CUBIQO20" for 20% off
  promoExpiry?: string    // ISO date string
  deepLink?: string       // Direct link with affiliate tracking parameter
  affiliateId?: string    // For attribution tracking
  isPersonalized?: boolean // Flag if this was surfaced by context engine
}
```

---

## Topic 7 — Silver Wire Cube: Implementation + Visual Guide

### 7.1 What Was Built (This PR)

**New file:** `src/components/SilverWireLandingCube.tsx`

The component implements:

```
SILVER WIRE CUBE — TECHNICAL BREAKDOWN
═══════════════════════════════════════════════════════

GEOMETRY:
  BoxGeometry(1.6, 1.6, 1.6, 3, 3, 3)
  — subdivided for smooth morph
  — EdgesGeometry(BoxGeometry(1.6,1.6,1.6)) for crisp lines

MORPH ANIMATION:
  t = 0: Pure cube wireframe
  t = 0.5: Midpoint sphere-ish form
  t = 1: Full sphere (all vertices projected to unit sphere surface)
  Cycle: 4 seconds full cube→sphere→cube via sin(t * 0.5)
  Implementation: per-frame Float32Array lerp between box and sphere positions

COLOR PALETTE:
  Edges: #D8E4F0 (blue-silver, 0.85 opacity)
  Fill mesh: #C8C8D0 (gunmetal silver, wireframe: true, opacity: 0.18)
  Corner spheres: #E8F0FF (near-white specular)
  Corner emissive: #A8C0FF (very subtle blue glow)
  Rings: #B0C8E8 (cool blue-silver, 0.28–0.35 opacity)
  Background: #080A0F (near-black, cooler than pure black)

LIGHTING:
  Ambient: 0.6 intensity, #D8E8FF tint
  Point 1: [4,4,4], intensity 1.8, white
  Point 2: [-4,-2,3], intensity 0.8, #A0B8D8
  Point 3: [0,-4,-3], intensity 0.5, #C8D8F0

EXTRAS:
  3 axis rings (torus geometry) at 0.28–0.35 opacity
  8 corner accent spheres (tiny, 0.028 radius)
  4 corner L-bracket decorative marks (CSS, not WebGL)
  Horizontal rule gradient accent lines (CSS)
```

### 7.2 How to Preview It Right Now

**Option A — URL parameter (no code change needed):**
```
https://your-staging-url.vercel.app/?landing=silver-wireframe
```

**Option B — Set as default:**
```bash
# In your .env.local
NEXT_PUBLIC_LANDING_DEFAULT=silver-wireframe
```

**Option C — Switch in `src/config/landing.ts`:**
```typescript
defaultVariant: 'silver-wireframe'  // change from 'plasma-wave'
```

### 7.3 Design Comparison Table

| Property | Plasma Wave (current) | Tech Wireframe | Silver Wire (new) |
|---|---|---|---|
| Dominant hue | Purple / cyan | Blue / pink / orange | Silver / chrome / blue-silver |
| Energy | High, kinetic | High, electric | Low, meditative, precise |
| User feeling | "Mystical AI" | "Sci-fi tech" | "Premium intelligence tool" |
| Brand fit | Early-stage wow | Hacker/developer | Enterprise / discerning user |
| Animation | Particle storm | Energy pulses | Geometric morph |
| Load weight | High (120K particles) | Medium (shaders) | Low (simple geometry) |
| Mobile performance | Medium | Medium | ✅ Best (lightweight) |
| Conversion hypothesis | Wonder → curiosity | Interest → excitement | Trust → action |

**MO's recommendation:** Run the silver wireframe as Variant B in A/B test. If it wins (which I expect it will for your core solopreneur demographic who values intelligence and precision), set it as default.

### 7.4 Next Enhancements (Post-Launch)

| Enhancement | Complexity | Impact |
|---|---|---|
| Voice-reactive morph speed | Medium | Cube morphs faster when user speaks |
| RGY zone coloring | Low | Edges shift to Red/Yellow/Green based on user's current zone |
| CQ Score pulse | Low | Opacity pulses at rate proportional to user's CQ Score |
| Mouse parallax | Low | Cube tilts toward mouse cursor for depth illusion |
| Click ripple | Low | Tap sends shockwave through cube edges |

---

## Summary Priority Table

| Topic | Key Action | Priority | Owner | Time |
|---|---|---|---|---|
| Tools | Set up GA4 + Clarity + PostHog + Sentry | P0 | Blossom | 2 days |
| Tools | SEMrush subscription + initial keyword audit | P0 | JO + MO | 1 day |
| Tools | Resend drip sequence (3-email welcome series) | P0 | Blossom | 3 days |
| Agencies | PartnerStack affiliate platform integration | P1 | Blossom | 1–2 weeks |
| Domains | 301 redirects from all ccTLDs to cubiqo.com | P0 | D2 | 1 day |
| Domains | Hreflang tags in layout.tsx | P1 | Bubbles | 0.5 day |
| Landing | CTA button overlay on silver wire landing | P0 | Bubbles | 1 day |
| Landing | A/B test: plasma-wave vs silver-wireframe | P1 | Blossom+PostHog | 3 days |
| CQ Score | DB migration for cq_score columns | P1 | Guy | 1 day |
| CQ Score | Recalculation API endpoint | P1 | Blossom | 2 days |
| CQ Score | Profile page CQ Score display | P1 | Bubbles | 1 day |
| CQ Number | Add permanent cq_handle to profiles | P0 | Guy | 0.5 day |
| CQ Number | Onboarding celebratory CQ reveal moment | P1 | Bubbles | 1 day |
| CQ Number | /add/[cq-number] public landing page | P1 | Bubbles | 1 day |
| Commerce | Wire real affiliate API (CJ or Rakuten) | P1 | Blossom | 1 week |
| Commerce | Add promoCode field to Deal type | P0 | Blossom | 0.5 day |
| Silver Cube | ✅ Component built (this PR) | Done | MO | Done |
| Silver Cube | Add CTA button to silver landing | P0 | Bubbles | 1 day |
| Silver Cube | A/B test setup | P1 | Blossom | 2 days |

---

## Section 8 — BYO Mode: The Honest Reality, What True Offline Means, and the Road There

### 8.1 What BYO Mode Actually Does Today (vs What Was Assumed)

There is a common misconception worth clearing up first.

| Dimension | What People Think BYO Does | What It Actually Does |
|---|---|---|
| API call destination | Goes directly from user's browser to Anthropic/OpenAI | User's browser → Cubiqo server (`/api/chat`) → Anthropic/OpenAI (with user's key) |
| Key storage | Key stays in the user's browser only | Key is AES-encrypted and stored in Supabase `profiles.byo_config` column |
| Cloud involvement | None | Cubiqo server is always in the middle — it decrypts and forwards |
| Cost to user | Billed to their API account | Yes — but still routes through Cubiqo infra |
| Privacy | Complete | Cubiqo server sees the decrypted key at decrypt-time in memory |

**Current BYO is a billing model, not a privacy model.** The user pays their own cloud bill. Cubiqo still processes the request server-side. This is fine for Phase 1 and is honest — it's stated correctly in the UI ("encrypted before being sent to our backend"). But it is NOT the same as "no cloud call at all."

---

### 8.2 Three Tiers of "Bring Your Own" — From Now to True Offline

```
TIER 1 (DONE — live now)
┌─────────────────────────────────────────────────────────────┐
│  Browser  →  Cubiqo Server  →  Anthropic/OpenAI             │
│              (user's encrypted key decrypted here)           │
│  ✅ User pays own API bill                                   │
│  ❌ Cubiqo server still in the middle                        │
│  ❌ Not private from Cubiqo infra                            │
│  ❌ NOT offline                                              │
└─────────────────────────────────────────────────────────────┘

TIER 2 (8–12 weeks — browser-side inference)
┌─────────────────────────────────────────────────────────────┐
│  Browser  →  WebLLM (WASM/WebGPU, runs IN browser tab)      │
│              Model: Phi-3-mini-4k (2.3 GB download once)    │
│              or Gemma-2B-IT (1.8 GB)                         │
│  ✅ Zero server roundtrip for inference                      │
│  ✅ Truly private — model runs on user's GPU                 │
│  ✅ Works offline (after first load)                         │
│  ⚠️ Requires WebGPU (Chrome 113+, Edge 113+, no iOS Safari) │
│  ⚠️ Slower than cloud (3–8 tok/s vs 50+ tok/s)             │
│  ❌ Actions (email, calendar) still need internet            │
└─────────────────────────────────────────────────────────────┘

TIER 3 (16–24 weeks — desktop + mobile native apps)
┌─────────────────────────────────────────────────────────────┐
│  Tauri Desktop App  →  Bundled Ollama (llama3.2:3b)         │
│              One-click install, no terminal needed           │
│  ✅ Full offline inference, no WASM limitations              │
│  ✅ File system access for local journal, photos, data       │
│  ✅ Can talk to local services (printer, local server)       │
│  ✅ macOS / Windows / Linux                                  │
│  ⚠️ First download ~4 GB (app + model)                      │
│  React Native + llama.cpp (iOS/Android)                      │
│  ✅ Background inference, native camera, contacts            │
│  ⚠️ App Store approval process (2–4 weeks)                  │
└─────────────────────────────────────────────────────────────┘
```

---

### 8.3 What Already Exists in the Codebase (Useful Foundations)

| Asset | File | Status | Notes |
|---|---|---|---|
| Ollama integration | `src/lib/ai/ollama.ts` | ✅ Working | Server-side only; points to `localhost:11434` |
| AI router (Ollama-first) | `src/lib/ai/router.ts` | ✅ Working | Routes 80% to Ollama, 20% to cloud |
| PWA manifest | `public/manifest.json` | ✅ Done | Icons 192/512, display: standalone |
| Service worker | `public/sw.js` | ✅ Working | Network-first + offline.html fallback |
| ServiceWorkerRegistration | `src/components/ServiceWorkerRegistration.tsx` | ✅ Working | Registers in production |
| PWA install prompt | `src/components/PWAInstallPrompt.tsx` | ✅ Working | Android + iOS manual instructions |
| Offline fallback page | `public/offline.html` | ✅ Done | Basic "you're offline" page |
| BYO key storage | `src/lib/byo/byo-manager.ts` | ✅ Working | AES-encrypted in Supabase |
| BYO UI | `src/components/byo/BYOSettings.tsx` | ✅ Working | WCAG 2.1 AA compliant |

**Key gap**: The Ollama route currently only works when Cubiqo's server has Ollama running locally (`localhost:11434`). That is the server's localhost, not the user's machine. To make it truly client-side offline, the model must run in the browser (WebLLM) or in a native app (Tauri + Ollama).

---

### 8.4 Tier 2 Implementation Plan — Browser-Side Inference (WebLLM)

**Technology**: [MLC-AI WebLLM](https://github.com/mlc-ai/web-llm) — runs quantised LLMs in browser via WebGPU. No Python, no Ollama, no server.

**Step-by-step build plan**:

```
Week 1-2: Research + Proof of Concept
  - Install: npm install @mlc-ai/web-llm
  - Create src/lib/ai/webllm-client.ts
  - Wrap WebLLM engine in a React context (useWebLLM hook)
  - Gate behind feature flag: feature_flag = 'browser_inference'
  - Test with Phi-3-mini-4k-instruct-q4f16_1 (smallest viable model)

Week 3-4: UX for model download
  - First-launch download modal: "Download 2.3 GB AI model once, run forever offline"
  - Progress bar using WebLLM's initProgressCallback
  - Cache model in IndexedDB (WebLLM handles this automatically)
  - Show estimated time remaining

Week 5-6: Feature integration
  - Chat route: if user has browser_inference enabled AND model loaded → use WebLLM
  - Offline detection: navigator.onLine → switch to WebLLM automatically
  - Memory extraction: run locally (smaller prompt, acceptable quality)
  - RGY classification: run locally (keyword-based, already works without cloud)

Week 7-8: Actions bridge
  - Email/calendar/social still need internet → show "action queued" when offline
  - Sync queue: store pending actions in IndexedDB → execute when back online
  - Show user clearly: "Thinking offline ✓ | Will send email when connected ↑"
```

**Browser compatibility gate** (must show before offering):
```typescript
const supportsWebGPU = async (): Promise<boolean> => {
  if (!navigator.gpu) return false;
  const adapter = await navigator.gpu.requestAdapter();
  return !!adapter;
};
```

| Browser | WebGPU Support | Notes |
|---|---|---|
| Chrome 113+ | ✅ Full | Best experience |
| Edge 113+ | ✅ Full | Same Chromium engine |
| Firefox | ⚠️ Partial | Behind flag, unstable |
| Safari 17.4+ | ⚠️ Partial | Metal backend, limited |
| iOS Safari | ❌ None | No WebGPU as of Feb 2026 |
| Android Chrome | ✅ Most devices | Depends on GPU |

**Models to offer (in order of size vs quality)**:

| Model | Size | Speed | Quality | Use Case |
|---|---|---|---|---|
| Phi-3-mini-4k (q4f16) | 2.3 GB | 6–10 tok/s | Good | Default choice |
| Gemma-2B-IT (q4f16) | 1.8 GB | 8–12 tok/s | OK | Smaller devices |
| Llama-3.2-3B (q4f16) | 2.0 GB | 7–11 tok/s | Good | Open weights |
| Phi-3.5-mini (q4f16) | 2.5 GB | 5–8 tok/s | Best | Power users |

---

### 8.5 Tier 3 — Desktop App with Bundled Ollama (Tauri)

**Why Tauri over Electron**: Tauri uses the OS WebView (WebKit/EdgeWebView2) instead of bundling Chromium. App size is ~10 MB vs ~150 MB for Electron. Rust backend is faster and more memory-efficient.

**Architecture**:
```
┌─ Tauri Rust Core ──────────────────────────────────────────┐
│  - Spawn Ollama as a sidecar process                        │
│  - File system access: journals, photos, local data         │
│  - System tray icon: "CubiQo running"                       │
│  - Auto-updater (built-in Tauri updater)                    │
│  - Biometric auth (TouchID / Windows Hello)                 │
│                                                              │
│  ┌─ Next.js frontend (compiled to static) ───────────────┐  │
│  │  - All existing React UI unchanged                     │  │
│  │  - AI calls → localhost:11434 (Ollama sidecar)         │  │
│  │  - Storage → user's local files + SQLite              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**One-click installer experience**:
1. User downloads `CubiQo-1.0.0-setup.exe` (Windows) or `CubiQo-1.0.0.dmg` (macOS)
2. Installer places Ollama binary as a Tauri sidecar
3. First launch: "Downloading your private AI brain... [████████░░] 3.2 GB" (model download)
4. Model cached at `~/.cubiqo/models/` — never re-downloads
5. All AI inference: local. Internet only for actions (email, web search, social posts)

**Timeline**: 16 weeks from decision to App Store submission (macOS/Windows). iOS/Android React Native variant: separate 20-week track.

---

### 8.6 Immediate Next Steps (What to Do Now)

| Priority | Action | Owner | Effort |
|---|---|---|---|
| P0 | Add honest copy to BYO UI: "Your inference still routes through Cubiqo servers" | Bubbles | 0.5 day |
| P0 | Add "True Offline (Beta)" toggle behind feature flag (disabled by default) | Blossom | 1 day |
| P1 | WebLLM PoC: `npm install @mlc-ai/web-llm`, single chat endpoint test | Blossom | 3 days |
| P1 | Enhance service worker: cache chat-related static assets for offline splash | Blossom | 1 day |
| P1 | Offline action queue in IndexedDB for emails/posts when offline | Blossom | 1 week |
| P2 | Tauri desktop app PoC (Next.js static export + Tauri shell) | MO | 2 weeks |
| P2 | React Native shell wrapping current web views | D3 | 2 weeks |

---

## Section 9 — Domain Strategy (cubiqo.ai vs cubiqo.com) + Offline Browser Vision

### 9.1 cubiqo.ai vs cubiqo.com — The Definitive Recommendation

**Short answer: Own both. Primary on `.com`. Brand on `.ai`.**

Here is the full analysis:

#### Arguments for `.com` as primary:
- `.com` has ~48% of all registered domains — the default expectation globally
- Users type `.com` by muscle memory; `.ai` requires deliberate thought
- Trust signals: enterprise buyers, investors, and press default to `.com`
- Better email deliverability reputation (`@cubiqo.com` > `@cubiqo.ai`)
- SEO: Google treats `.com` with no special advantage, but legacy domain authority tends to concentrate there
- Insurance: if `.ai` ever becomes restricted (Anguilla controls it), `.com` is safe

#### Arguments for `.ai` as primary:
- Signal: `.ai` immediately communicates what the product is
- Memorability in the AI space: Perplexity.ai, Character.ai, Poe.ai all use it
- Differentiation from generic `.com` SaaS noise
- Premium positioning: `.ai` domains sell for 3–10× `.com` at resale
- Easier to get: cubiqo.com may be harder to secure if already taken

#### Recommended configuration:

```
Canonical domain:   cubiqo.com          (all SEO juice lives here)
AI brand domain:    cubiqo.ai           (redirects 301 to cubiqo.com)
Alt spellings:      coqo.com / ciqo.com  (redirect to cubiqo.com)
Email:              @cubiqo.com         (primary) + @cubiqo.ai (alias)
```

**One exception**: If cubiqo.com is NOT owned and cubiqo.ai IS — use `.ai` as primary immediately and try to acquire `.com` over time.

#### The 30+ country TLD strategy (from previous analysis):

| Tier | Domains | Action | Reason |
|---|---|---|---|
| Protect | .com .ai .io .co | Own & keep | Core brand assets |
| Redirect | .ca .uk .au .de .fr .in .sg .ae | 301 → .com | Key markets, affordable |
| Hold | .sa .br .mx .za .ng .pk .ph .id | Register if <$50/yr | Emerging markets, option value |
| Release | All others | Let expire | No ROI, maintenance burden |

---

### 9.2 The Offline Browser Vision — What Is Actually Feasible

The CEO described: an offline browser that uses AI search, works with user data offline, does photo/video editing, face tagging, AI model comparison, and data synthesis.

Let me split this into three categories: **Can do now**, **Can do in 6 months**, **Fundamentally hard or impossible**.

---

#### ✅ CAN DO NOW (or within 8 weeks)

**1. Offline-cached web pages (reading mode)**
- Service worker already exists in `public/sw.js`
- Enhancement: add "Save for offline" button → caches full page HTML in IndexedDB
- User can read saved pages without internet
- Effort: 1 week

**2. Local AI search over saved content**
- Run keyword + semantic search over IndexedDB-cached pages
- Use existing TF-IDF or embed with a tiny local model (transformers.js, `all-MiniLM-L6-v2`, 80 MB)
- Effort: 2 weeks

**3. Photo viewing + basic editing offline**
- PWA can access files via File System Access API (Chrome 86+)
- Basic editing (crop, rotate, filter): use `fabric.js` or `jimp` (WASM port)
- No uploads needed — pure client-side
- Effort: 3 weeks

**4. AI model answer comparison**
- Already partially exists: router.ts routes between Claude, OpenAI, Ollama, MiniMax
- UI enhancement: "Compare" button sends same prompt to 2+ providers → side-by-side diff
- Offline: can compare WebLLM models (Phi-3 vs Gemma) without internet
- Effort: 1 week for UI, existing infrastructure handles routing

**5. Local journal + memory synthesis**
- Journal data is in Supabase BUT can be cached in localStorage/IndexedDB on write
- Offline journal: write to IndexedDB → sync to Supabase when back online
- Local synthesis: "Summarise my last 30 days" → WebLLM processes cached journal entries
- Effort: 2 weeks

---

#### ⚠️ FEASIBLE IN 6 MONTHS (with significant effort)

**6. Face tagging in photos**
- Technology: `face-api.js` (TensorFlow.js) — runs in browser, 97% accuracy on aligned faces
- Models: `ssd_mobilenetv1` (face detection) + `face_recognition_model` (128D embeddings)
- Workflow: scan photos → cluster by face vector similarity → user names clusters → persistent in IndexedDB
- Limitation: iOS Safari has poor WASM performance; desktop Chrome is excellent
- Effort: 4–6 weeks

**7. Video editing (basic)**
- `ffmpeg.wasm` runs in browser — can cut, trim, merge, add text overlays, change resolution
- File size limitation: WASM heap is ~2 GB max, so videos >500 MB need chunking
- Real-time preview is slow (not After Effects); good enough for social clips
- Effort: 3–4 weeks for basic editor UI

**8. Proactive contextual recommendations (offline)**
- User's data (journal, RGY capsules, saved pages) processed locally by WebLLM
- "Based on your journal this week, you seem to be focused on job hunting — want me to find openings?"
- Runs as a background Web Worker after WebLLM model is loaded
- Effort: 4 weeks

---

#### ❌ FUNDAMENTALLY HARD OR NOT ADVISABLE

**9. Offline web search (actual search engine)**
- A real search index (like Google's) requires petabytes of data — impossible offline
- What IS possible: cached pages + local index of saved content (not "the web")
- Honest positioning: "Search your saved content offline" not "search the web offline"

**10. Full video editing (After Effects level)**
- GPU-accelerated video processing requires native code (Metal/CUDA) — not available in browser
- WASM is single-threaded-ish; real-time 4K editing is not feasible
- Tauri desktop app with FFmpeg native binary could handle this — separate effort

**11. "Sending emails offline"**
- SMTP requires internet — no workaround; emails queue locally and send when online
- This is fine and the right UX; just be honest about it in the UI

---

### 9.3 The "Cubiqo as AI Browser" Product Vision

Putting it together, here is what a 12-month roadmap for "Cubiqo as AI browser/OS" looks like:

```
PHASE 1 (Now → Launch): Core AI assistant + memory + PWA
  ✅ Chat, journal, agents, BYO keys
  ✅ PWA install on mobile/desktop
  ✅ Basic offline (cached pages, offline.html)

PHASE 2 (Month 1–3): Offline inference + saved content search
  - WebLLM integration (Phi-3-mini in browser)
  - "Save page" button → local AI search
  - Offline journal with sync queue
  - AI model comparison UI

PHASE 3 (Month 4–6): Media tools + face tagging
  - Photo viewer + basic editing (crop/filter/text)
  - Face clustering via face-api.js
  - Video trimmer via ffmpeg.wasm
  - Local media library (not cloud upload)

PHASE 4 (Month 7–12): Desktop + mobile native
  - Tauri desktop app (macOS/Windows) + bundled Ollama
  - React Native mobile app
  - Full offline action queue (email/post queued, sent when online)
  - Local file system access (journal exports, data backups)
```

**Why this is the right direction — the WeChat analogy revisited**:
WeChat succeeded not because it was a great chat app but because it became the infrastructure people lived in. The offline + local-first angle is Cubiqo's version of that:
- Cloud AI (Copilot, ChatGPT, Gemini): always online, always sending your data to servers
- Cubiqo offline mode: your AI runs on YOUR device, your data stays with YOU
- That is a genuine competitive moat — especially in privacy-conscious markets (EU, Canada, enterprise)

---

### 9.4 Implementation Priority Table

| Feature | Feasibility | Effort | Revenue Impact | Privacy Story Value |
|---|---|---|---|---|
| Honest BYO UI copy | ✅ Now | 0.5 day | None | High (trust) |
| Offline action queue | ✅ Now | 1 week | Medium | High |
| Local journal cache | ✅ Now | 1 week | Medium | High |
| WebLLM integration | ✅ 8 weeks | 6 weeks | Very High | Very High |
| AI model comparison UI | ✅ 2 weeks | 1 week | Medium | Medium |
| Photo editor (basic) | ✅ 6 weeks | 4 weeks | High | High |
| Face tagging | ⚠️ 12 weeks | 6 weeks | High | Very High |
| Video trimmer | ⚠️ 12 weeks | 4 weeks | Medium | Medium |
| Tauri desktop app | ⚠️ 20 weeks | 16 weeks | Very High | Very High |
| React Native app | ⚠️ 24 weeks | 20 weeks | Very High | Very High |
| "Search the web" offline | ❌ Not viable | N/A | N/A | N/A |
