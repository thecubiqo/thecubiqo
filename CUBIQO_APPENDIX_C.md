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

## EXECUTIVE SUMMARY — Cubiqo Product State (February 2026)

**Prepared by:** MO — CTO / AI Co-Founder  
**Based on:** Direct code inspection of branch `copilot/investigate-features-and-ui-components` + full analysis corpus (8 documents, 3,100+ lines)

---

### What Cubiqo Is

Cubiqo is an AI-native operating system for solopreneurs and knowledge workers. It routes voice and text input through a policy-aware LLM backend (TEAL/RED/YELLOW zones), orchestrates a suite of integrated tools (Social Army, Journal, Job Hunt, Emergent code editor, RGY peer matching, BYO API keys), and presents itself through a 3D animated cuboid UI that reflects AI state in real time.

---

### Overall Product State at a Glance

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  CUBIQO — PRODUCT READINESS SCORECARD (Feb 2026)                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Flagship Spec Compliance    63%   ████████████░░░░░░░░  (12/33 🟢)        ║
║  Feature Build Completion    58%   ████████████░░░░░░░░  (est. across all) ║
║  Legal / Compliance          10%   ██░░░░░░░░░░░░░░░░░░  (0 ToS, 0 PP)    ║
║  Revenue Infrastructure       5%   █░░░░░░░░░░░░░░░░░░░  (no Stripe)      ║
║  Analytics Coverage          15%   ███░░░░░░░░░░░░░░░░░  (3 events only)  ║
║  Test Coverage               35%   ███████░░░░░░░░░░░░░  (Vitest partial) ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

### 3 Absolute Launch Blockers (Cannot Ship Without These)

| # | Blocker | Why Critical | Est. Effort |
|---|---|---|---|
| 1 | **Stripe billing + CubiKey payment** | CubiKey is placeholder UI — no revenue collection possible | 3 weeks |
| 2 | **Terms of Service + Privacy Policy pages** | GDPR/CCPA requires these before any user data is collected | 3 days |
| 3 | **Age gate for RED zone** | Legal liability — minors can access age-gated/explicit content | 1 week |

**Current verdict: Cubiqo is NOT legally launchable today. These 3 items must ship first.**

---

### What Is Genuinely Production-Ready (Ship Now)

| Area | Confirmation |
|---|---|
| Policy Router (LLM backend, zone detection, failover, safety) | `src/lib/ai/policy-router.ts` — solid, 3-backend failover |
| Color system (TEAL/RED/YELLOW, voice tones, lock commands) | `src/config/colors.ts` + `commands.ts` |
| STT + TTS pipeline (Whisper + ElevenLabs + voice modulation) | `/api/stt/`, `/api/tts/`, `voice-modulation.ts` |
| Auth (magic link, OAuth, WebAuthn/Passkeys) | 4 auth modes fully wired |
| BYO Mode (cloud API keys, AES-256 encryption, routing) | `byo-manager.ts`, `/api/byo/` |
| Browser automation (Puppeteer, consent gate) | `BrowserService.ts`, `/api/browser/` |
| RGY capsule matching (4-signal: colour→intent→keyword→vector) | `capsule-manager.ts`, `discovery-service.ts` |
| Side Panel keywords (per-color RGY lists, session persistence) | `KeywordPanel.tsx` |
| 3D cuboid (wireframe + solid, 5 Special Moves, state-reactive) | `AICuboidGLB.tsx`, `SilverWireLandingCube.tsx` |
| Conscious memory (extraction, storage, journey tracking) | `/api/memory/`, `/api/extract-memories/` |
| Emergent code editor (9 API modules, Monaco, sandboxed preview) | `/api/emergent/` routes |
| Social Army (10 platforms, persona accounts, GFXToolz) | `social-army-service.ts`, `platforms.json` |
| Journal / Rozana (BigBoss prompts, 24h gate, color classification) | `/api/journal/`, `journal-service.ts` |

---

### Pending Work Summary (All Priorities)

| Priority | Count | Items |
|---|---|---|
| 🔴 P0 — Launch Blockers | 5 | Stripe, ToS/PP, Age Gate, Zero-Retention clarification, Smart-home removal or stub |
| 🟡 P1 — 30-Day Post-Launch | 10 | CAP Orchestrator, Audio Cues, Vocspad, 3 Special Moves, CQ↔CQ UI, Spending Caps persistence, Analytics funnel, Social Army review gate, Onboarding branching |
| 🟢 P2 — 90-Day Enhancement | 10 | Calendar API, Wallet/Stripe crypto, Geo-fence UI, SettingsCube spoken confirm, Fabric cube material, CQ Score, Food/taxi live API, Referral programme, Emergent collaborative editing, Structured event logs |

---

### Key Numbers From Code (Ground Truth)

| Metric | Value | Source |
|---|---|---|
| Total API routes | 157 | `find /api -name route.ts` |
| Disabled/stub routes | 17 | `// TODO`, `return NextResponse.json({message:'coming soon'})` |
| TODO / stub markers | 101+ | `grep -r "TODO\|FIXME\|STUB"` |
| Analytics events tracked | 3 | `trackEvent()` call sites |
| Stripe references | 0 | No `stripe` in package.json |
| Social platforms configured | 10 | `platforms.json` |
| DB migrations applied | 18 | `supabase/migrations/` |
| Patent opportunities (≥50% approval) | 4 | See PATENT_OPPORTUNITIES.md |
| Spec compliance (Flagship doc) | 63% | See Section 11 below |

---

## TECHNO-FUNCTIONAL REQUIREMENTS — All Incomplete & Pending Features

> **Format for each TFR:**
> - **Current State** — what exists in code right now
> - **Requirement** — what the feature must do when complete
> - **Technical Approach** — specific implementation path
> - **Changes Needed** — DB schema / API endpoints / UI components
> - **Acceptance Criteria** — how to know it's done
> - **Effort Estimate** — realistic solo developer estimate
> - **Owner** — which agent/role should implement it

---

### TFR-001 — Stripe Billing + CubiKey Subscription Payment

**Priority:** 🔴 P0 — Launch Blocker

**Current State:**
- `src/components/CubiKey.tsx` exists but is placeholder UI only
- `src/lib/cubikey/cubikey-manager.ts` references Stripe but no `stripe` package in `package.json`
- No `/api/billing/` routes exist
- No `subscription_plans` or `user_subscriptions` DB table

**Requirement:**
Users must be able to purchase CubiKey Pro ($29/mo) and CubiKey Max ($79/mo) via Stripe checkout. Subscription status must gate features in real time.

**Technical Approach:**
```
1. npm install stripe @stripe/stripe-js
2. Create Stripe products + price IDs in Stripe dashboard
3. Build /api/billing/checkout  → creates Stripe Checkout Session
4. Build /api/billing/webhook   → handles subscription.created/updated/deleted
5. Build /api/billing/portal    → Stripe Customer Portal for self-serve management
6. Add user_subscriptions table to Supabase
7. Add feature gate check to policy-router.ts (plan tier → model access)
8. Replace CubiKey.tsx placeholder with real checkout button
```

**DB Changes:**
```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,           -- 'free' | 'pro' | 'max'
  status TEXT NOT NULL,            -- 'active' | 'past_due' | 'canceled'
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON user_subscriptions(user_id);
CREATE INDEX ON user_subscriptions(stripe_customer_id);
```

**API Endpoints:**
- `POST /api/billing/checkout` — create Stripe Checkout session, return URL
- `POST /api/billing/webhook` — Stripe webhook handler (must be raw body)
- `GET /api/billing/portal` — create Stripe Customer Portal session
- `GET /api/billing/status` — return current plan for authenticated user

**UI Components:**
- `CubiKeyCheckoutButton.tsx` — Stripe Checkout trigger
- `BillingPortalLink.tsx` — link to manage subscription
- `PlanGateBadge.tsx` — upgrade prompt when feature is gated

**Acceptance Criteria:**
- [ ] Test card `4242 4242 4242 4242` completes checkout in staging
- [ ] Webhook updates `user_subscriptions.status` within 5 seconds
- [ ] Free user cannot access `plan_id='pro'` features
- [ ] Pro user upgrade/downgrade visible in Stripe dashboard

**Effort:** 3 weeks (1 week Stripe setup + webhook; 1 week feature gates; 1 week UI)
**Owner:** Blossom (backend) + Bubbles (UI)

---

### TFR-002 — Terms of Service + Privacy Policy Pages

**Priority:** 🔴 P0 — Launch Blocker

**Current State:**
- No `/terms` or `/privacy` route exists anywhere in the app
- No ToS or Privacy Policy text in the repository
- `magic-link.ts` email template says "Zero-Retention. Private." — contradicts memory storage

**Requirement:**
Legal pages must be live before any user data is collected. Must cover: data storage (memory system), AI processing (third-party LLMs), age restrictions (RED zone), subscription terms, and GDPR/CCPA rights.

**Technical Approach:**
```
1. Create src/app/terms/page.tsx     — static MDX page, dated
2. Create src/app/privacy/page.tsx  — static MDX page, GDPR-compliant
3. Add footer links to both pages across all layouts
4. Add checkbox "I agree to Terms + Privacy Policy" to signup form
5. Store consent timestamp to user profile (GDPR requirement)
6. Fix magic-link.ts email to remove "Zero-Retention" (false claim)
```

**DB Changes:**
```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT DEFAULT '1.0';
```

**10 Required ToS Clauses (minimum):**
1. Subscription terms, refund policy, cancellation
2. AI-generated content disclaimer (not professional advice)
3. Age restriction (18+ for RED zone, 13+ general)
4. Data storage acknowledgement (memory system, Supabase)
5. Third-party LLM processing (OpenAI, Anthropic, ElevenLabs)
6. BYO API keys: user owns and is responsible for their keys
7. Social Army: user is responsible for content posted via their accounts
8. Acceptable use policy (no abuse, spam, illegal content)
9. GDPR/CCPA data subject rights (access, deletion, portability)
10. Limitation of liability + governing law (Ontario, Canada)

**Acceptance Criteria:**
- [ ] `/terms` and `/privacy` render as static pages with correct content
- [ ] Signup flow cannot complete without ToS checkbox checked
- [ ] `terms_accepted_at` is populated for new users
- [ ] Footer links present on landing, dashboard, and onboarding pages

**Effort:** 3 days (legal text from Termly.io template; 1 day engineering)
**Owner:** MO (content) + Bubbles (UI wiring)

---

### TFR-003 — Age Gate for RED Zone

**Priority:** 🔴 P0 — Launch Blocker

**Current State:**
- `src/config/colors.ts` defines RED zone as `emotion: 'age-gated, critical, goal-oriented'`
- `policy-router.ts` routes RED zone to uncensored models (`MIXTRAL_8X22B`, `LLAMA_UNCENSORED`)
- Zero age verification code exists anywhere in the codebase
- Any user can activate RED zone through the color selector

**Requirement:**
Users must confirm they are 18+ before accessing RED zone. Confirmation must be stored and re-validated on session start. Under-18 users must be blocked with a clear message.

**Technical Approach:**
```
1. Add age_verified: boolean + date_of_birth: date to user_profiles
2. Create AgeVerificationModal.tsx — DOB picker, stores to profile
3. Wrap ColorZoneSelector.tsx — intercept RED selection with gate check
4. Add API middleware: /api/chat/route.ts rejects RED requests if !age_verified
5. Add gate check to policy-router.ts: if zone=RED && !user.age_verified → force YELLOW
```

**DB Changes:**
```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  age_verified BOOLEAN DEFAULT FALSE,
  age_verified_at TIMESTAMPTZ,
  date_of_birth DATE;
```

**UI Components:**
- `AgeVerificationModal.tsx` — DOB picker with clear explanation, stores to Supabase
- `RedZoneGate.tsx` — wrapper that intercepts RED color selection

**Acceptance Criteria:**
- [ ] Unverified user clicking RED zone sees age gate modal
- [ ] DOB entered as <18 shows blocked message, does not unlock RED
- [ ] DOB entered as 18+ stores `age_verified: true` and allows RED access
- [ ] Server-side: `/api/chat` returns 403 if zone=RED and user not age-verified
- [ ] Age verification persists across sessions (stored in DB, not just localStorage)

**Effort:** 1 week
**Owner:** Blossom (backend gate) + Bubbles (modal UI)

---

### TFR-004 — Zero-Retention Spec Clarification + Privacy Policy Correction

**Priority:** 🔴 P0 — Launch Blocker

**Current State:**
- `src/lib/email/templates/magic-link.ts` says "Zero-Retention. Private."
- But `/api/memory/`, `/api/extract-memories/`, `/api/journey/memories/` all store to Supabase
- This is a direct contradiction and a potential GDPR violation (false representation)

**Requirement:**
All marketing copy, onboarding text, and email templates must accurately describe what data is stored. The "zero retention" claim must be scoped correctly or removed entirely.

**Technical Approach:**
```
1. Search all files for "Zero-Retention", "zero retention", "no data stored"
2. Replace with accurate copy:
   "Your conversation routing is private and not logged.
    Your conscious memories are stored with your consent and deletable any time."
3. Add "Delete My Data" button to user profile settings
4. Implement /api/user/delete-data route that cascades deletes across all user tables
```

**Files to Change:**
- `src/lib/email/templates/magic-link.ts` — remove false claim
- Any landing page or onboarding copy referencing zero-retention
- Privacy Policy (TFR-002) must explicitly describe memory storage

**Acceptance Criteria:**
- [ ] No file contains unqualified "zero-retention" or "no data stored" claims
- [ ] Privacy policy accurately describes: what is stored, where, for how long
- [ ] User can request full data deletion from profile settings
- [ ] Data deletion cascades across: memories, capsules, journal, profiles, subscriptions

**Effort:** 3 days
**Owner:** MO (copy) + Blossom (delete-data API)

---

### TFR-005 — Smart-Home Control (Remove from Feature Claims or Implement Stub)

**Priority:** 🔴 P0 — Launch Blocker

**Current State:**
- `src/lib/integrations/integration-registry.ts` lists `smart_home` as an integration type
- `src/data/action-types.ts` has smart home action categories
- Zero implementation: no Google Home, HomeKit, MQTT, or Z-Wave code

**Requirement:**
Either (A) implement a minimum viable smart-home integration (Google Home API or Home Assistant MQTT), OR (B) remove smart-home from all public feature lists and disable the integration registry entry until implemented.

**Recommendation:** Option B — remove from public claims at launch. Implement in P2.

**Technical Approach (Option B — 1 day):**
```
1. Set smart_home entry in integration-registry.ts to available: false
2. Add "Coming Soon" label to any UI that lists smart-home
3. Remove from landing page feature list
4. Add to post-launch roadmap
```

**Technical Approach (Option A — 3 weeks, P2 scope):**
```
1. Integrate Home Assistant REST API (open source, self-hosted, covers most smart devices)
2. Create /api/integrations/smart-home/[action] routes
3. Store Home Assistant URL + API token in BYO keys vault
4. Add device discovery, state read, and command execution
```

**Acceptance Criteria (Option B):**
- [ ] Smart-home not mentioned in any public-facing copy at launch
- [ ] UI shows "Coming Soon" badge, not an active control

**Effort:** 1 day (Option B) / 3 weeks (Option A)
**Owner:** Blossom

---

### TFR-006 — CAP Orchestrator (Central AI Policy Gateway for Sub-Domains)

**Priority:** 🟡 P1 — 30-Day Post-Launch

**Current State:**
- No `cap-orchestrator.ts`, no `/api/cap/` routes, no "World" abstraction
- Each sub-domain (Emergent, Social Army, Job Hunt, Journal) calls OpenAI directly — bypassing zone policy, safety guardrails, and keyword telemetry
- The flagship spec requires all Worlds to route through the CAP Orchestrator, inheriting the chosen backend

**Requirement:**
A unified AI gateway that all internal tools call instead of OpenAI directly. Must inherit the user's current zone (TEAL/RED/YELLOW), apply safety guardrails, route to the correct backend, and pipe keywords back to the Side Panel.

**Technical Approach:**
```
Week 1: src/lib/cap/orchestrator.ts
  - class CAPOrchestrator
  - accepts: { worldId, userId, messages, zoneHint?, tools? }
  - reads active zone from user session
  - passes through PolicyRouter (reuses existing policy-router.ts logic)
  - returns { response, zone, modelUsed, keywords[] }

Week 2: /api/cap/route.ts
  - POST /api/cap/route
  - Auth required, rate-limited
  - All internal tools POST here instead of /api/chat

Week 3: Migrate 3 sub-domains
  - Emergent: replace direct OpenAI calls with /api/cap/route
  - Social Army: caption generation → /api/cap/route
  - Job Hunt: resume parsing + cover letter → /api/cap/route

Week 4: Keyword telemetry pipeline
  - CAP response includes keywords[]
  - Client receives keywords, updates Side Panel via localStorage + WebSocket push
```

**API Endpoint:**
```typescript
// POST /api/cap/route
interface CAPRequest {
  worldId: 'emergent' | 'social-army' | 'job-hunt' | 'journal' | 'rgy'
  messages: ChatMessage[]
  zoneHint?: 'TEAL' | 'RED' | 'YELLOW'
  tools?: ToolDefinition[]
}
interface CAPResponse {
  content: string
  zone: string
  modelUsed: string
  tokensUsed: number
  keywords: string[]      // for Side Panel telemetry
}
```

**Acceptance Criteria:**
- [ ] Emergent editor calls `/api/cap/route` for all AI completions
- [ ] Social Army caption generation calls `/api/cap/route`
- [ ] Self-harm pattern in any World → forces YELLOW zone (guardrail applies globally)
- [ ] Keywords from CAP responses appear in Side Panel within 2 seconds
- [ ] Failover works: primary model down → secondary used transparently

**Effort:** 4 weeks
**Owner:** Blossom (orchestrator + API) + Bubbles (Side Panel telemetry UI)

---

### TFR-007 — Audio Cues (Wake Chime, Speak Ticks, DND Mode)

**Priority:** 🟡 P1 — 30-Day Post-Launch

**Current State:**
- `src/lib/audio/audioContext.ts` — AudioContext manager for gesture-unlock; no sound generation
- `src/lib/audio/audio-score-service.ts` — ambient music oscillators; no UI cues
- Zero wake chime, zero speak ticks, no DND mode anywhere

**Requirement:**
The spec requires: Wake chime on activation, soft ticks at TTS start/stop, single neutral tick on error, plus volume/on-off/DND controls.

**Technical Approach:**
```typescript
// Create: src/lib/audio/ui-cues.ts
// Uses Web Audio API — zero external files needed

export function playWakeChime(ctx: AudioContext) {
  // 220Hz → 440Hz sweep, 80ms, cosine ramp out
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.setValueAtTime(220, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.08)
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(); osc.stop(ctx.currentTime + 0.08)
}

export function playSpeakTick(ctx: AudioContext) { /* 880Hz, 30ms */ }
export function playErrorTick(ctx: AudioContext) { /* 330Hz, 50ms */ }
export function setAudioDND(enabled: boolean) { /* localStorage */ }
export function setAudioVolume(level: 0 | 0.25 | 0.5 | 0.75 | 1.0) { /* gain node */ }
```

**Call Sites:**
- `src/hooks/useAIState.ts` — `playWakeChime()` on `idle → listening` transition
- `src/hooks/useElevenLabsTTS.ts` — `playSpeakTick()` on TTS stream start + end
- `src/app/api/chat/route.ts` error handler → `playErrorTick()` via client event
- `src/components/SettingsCube/SettingsCubeApp.tsx` — DND toggle + volume slider

**Acceptance Criteria:**
- [ ] Wake chime plays when user activates mic (not on page load)
- [ ] Soft tick plays at start of TTS audio; second tick at end
- [ ] Error tick plays on AI failure (not on user input errors)
- [ ] DND mode silences all cues; preference persists across sessions
- [ ] Volume control works independently of system volume
- [ ] `prefers-reduced-motion` users: audio cues still work (audio ≠ animation)

**Effort:** 2 weeks
**Owner:** Bubbles (Web Audio implementation + DND settings UI)

---

### TFR-008 — Vocspad (Unified Type + Talk Input Component)

**Priority:** 🟡 P1 — 30-Day Post-Launch

**Current State:**
- `src/components/chat/ChatContainer.tsx` — standard text input + separate mic button
- `src/app/api/stt/route.ts` — Whisper STT working
- No unified Vocspad component that merges text and voice in one surface

**Requirement:**
A single input surface where users can type and talk simultaneously. STT transcription overlays in the text field live. Mic toggle embedded inline. Graceful fallback to text-only without mic permission.

**Technical Approach:**
```typescript
// Create: src/components/chat/Vocspad.tsx
interface VocspadProps {
  onSubmit: (text: string) => void
  placeholder?: string
  disabled?: boolean
}

// Internal state:
// - isListening: boolean
// - transcript: string (live STT overlay)
// - typedText: string (manual typing)
// - merged: typedText + transcript (displayed together)

// On mic toggle: call useSTT() hook → stream Whisper transcript into textarea
// On Enter/Submit: send merged text
// Graceful fallback: if navigator.mediaDevices unavailable → hide mic button, text-only mode
```

**UI Spec:**
```
┌─────────────────────────────────────────────────┐
│  [🎤 ▶] Type or talk...             [↑ Send]   │
│         ▓▓▓▓▓▓ Live transcription here...       │
└─────────────────────────────────────────────────┘
  - 🎤 icon pulses red when listening
  - Live transcript appears in lighter color
  - Manual typed text appears in full color
  - Both merge on submit
```

**Acceptance Criteria:**
- [ ] User can type text and it appears in Vocspad
- [ ] User can click mic, speak, and live transcript appears as overlay
- [ ] User can mix typing and speaking in same input
- [ ] Submit sends combined text to AI
- [ ] If mic permission denied, text input works normally with no errors
- [ ] Works on mobile (touch-friendly mic toggle)

**Effort:** 2 weeks
**Owner:** Bubbles

---

### TFR-009 — Special Moves: Wink, Trust Earned, Handoff (3 Missing)

**Priority:** 🟡 P1 — 30-Day Post-Launch

**Current State:**
- `src/components/cube/AICuboidGLB.tsx` implements 5 of 8 Special Moves in animation switch
- Missing: `'Wink'`, `'Trust Earned'`, `'Handoff'`

**Requirement:**
All 8 Special Moves defined in the flagship spec must be implemented. Each is UI-only, does not affect routing, and must respect timing tokens (≤200ms swap, 150–300ms glow).

**Technical Approach:**
Add 3 cases to the `switch (currentMove)` block in `AICuboidGLB.tsx`:

```typescript
case 'Wink':
  // YELLOW-only: quick lateral tilt + emissive blink, ~200ms
  if (color === 'YELLOW') {
    const winkProgress = Math.sin(moveTimerRef.current * 30)
    groupRef.current?.rotation.set(0, 0, winkProgress * 0.15)
    emissiveModifier = winkProgress > 0 ? 1.3 : 0.7
    if (moveTimerRef.current > 0.2) triggerMove(null) // auto-reset after 200ms
  }
  break

case 'Trust Earned':
  // Warm golden pulse + slow scale breathe — acknowledgement moment
  mat.emissive.lerp(new THREE.Color('#ffd700'), 0.08)
  innerRef.current.scale.setScalar(1.0 + Math.sin(moveTimerRef.current * 3) * 0.05)
  mat.emissiveIntensity = 0.6 + Math.sin(moveTimerRef.current * 2) * 0.2
  break

case 'Handoff':
  // Outward scale expansion + fade → signals transition to another agent/World
  const handoffScale = 1.0 + moveTimerRef.current * 0.4
  innerRef.current.scale.setScalar(handoffScale)
  if (mat.transparent) mat.opacity = Math.max(0.1, 1.0 - moveTimerRef.current * 0.6)
  if (moveTimerRef.current > 1.5) triggerMove(null) // auto-reset after fade
  break
```

**Trigger Conditions:**
- `Wink`: trigger in YELLOW zone after playful/humorous AI response
- `Trust Earned`: trigger after user completes first memory save or first RGY match
- `Handoff`: trigger when routing request to another agent or switching Worlds

**Acceptance Criteria:**
- [ ] All 3 moves render without console errors
- [ ] Wink only fires in YELLOW zone (guarded by color check)
- [ ] Trust Earned produces a visible golden pulse (not same as Resonance)
- [ ] Handoff produces visible scale-out + fade
- [ ] All respect `prefers-reduced-motion` (check in parent hook)
- [ ] Timing stays within ≤200ms for instantaneous moves

**Effort:** 1 week
**Owner:** Pushpa (animation) + Bubbles (trigger wiring)

---

### TFR-010 — CQ↔CQ Connections Wired to Main Chat UI

**Priority:** 🟡 P1 — 30-Day Post-Launch

**Current State:**
- `src/lib/cq-to-cq/` module exists: CQ number generator, WebSocket, WebRTC calls
- CQ numbers can be generated programmatically
- Not connected to any UI — users cannot discover their CQ number or connect to others

**Requirement:**
Users must be able to: see their CQ number in their profile, share it, receive connection requests from other CQ numbers, and initiate direct encrypted chat/call with a CQ contact.

**Technical Approach:**
```
1. Profile page: display CQ number prominently (large, copyable)
2. QR code generation for CQ number (qrcode.react)
3. "Connect by CQ" button → input modal for entering another user's CQ number
4. WebSocket-based connection request flow (already exists in cq-to-cq/)
5. Accepted connection → appears in Connections list (new sidebar section)
6. From connection: initiate text chat or WebRTC voice/video call
7. DB: cq_connections table to store accepted connections
```

**DB Changes:**
```sql
CREATE TABLE cq_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_cq TEXT NOT NULL,
  recipient_cq TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'accepted' | 'blocked'
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_cq, recipient_cq)
);
```

**UI Components:**
- `CQNumberDisplay.tsx` — large CQ number + copy button + QR code
- `CQConnectModal.tsx` — enter CQ number, send request
- `CQConnectionsList.tsx` — accepted connections with chat/call buttons

**Acceptance Criteria:**
- [ ] Every user has a CQ number visible in their profile
- [ ] User can copy CQ number to clipboard
- [ ] User can enter another CQ number and send a connection request
- [ ] Recipient sees notification of incoming connection request
- [ ] Accepted connection enables direct chat via existing WebSocket infrastructure
- [ ] WebRTC call button works (uses existing `cq-to-cq/` WebRTC implementation)

**Effort:** 2 weeks
**Owner:** Blossom (backend + WebSocket) + Bubbles (UI)

---

### TFR-011 — Spending Caps Persistence (In-Memory → Supabase)

**Priority:** 🟡 P1 — 30-Day Post-Launch

**Current State:**
- `src/lib/spending/spending-cap-service.ts` uses in-memory `Map` for usage tracking
- Server restart clears all spending cap data — users can accidentally overspend
- No DB table for usage records

**Requirement:**
Spending cap usage must persist across server restarts. Caps must be enforced even after Vercel cold starts. Usage history must be queryable for analytics.

**Technical Approach:**
```
1. Create spending_usage DB table
2. Replace in-memory Map with Supabase read/write in spending-cap-service.ts
3. Add daily/monthly rollup via Supabase cron
4. Cache in Redis (Upstash) for hot-path performance (optional P2)
```

**DB Changes:**
```sql
CREATE TABLE spending_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,  -- start of billing window
  period_end TIMESTAMPTZ NOT NULL,    -- end of billing window
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON spending_usage(user_id, period_start);

CREATE TABLE spending_caps (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_limit_usd NUMERIC(10,2),
  monthly_limit_usd NUMERIC(10,2),
  alert_threshold_pct INTEGER DEFAULT 80,  -- alert at 80% of cap
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Code Changes:**
- `spending-cap-service.ts`: replace `usageMap.get/set` with Supabase upsert calls
- Add `getRemainingBudget(userId)` that reads from DB
- Add cap enforcement to `/api/chat/route.ts` pre-call check

**Acceptance Criteria:**
- [ ] Spending usage persists after server restart (verify by redeploying and checking DB)
- [ ] User hitting 80% of cap receives email/in-app alert
- [ ] User hitting 100% of cap gets 429 response with clear message
- [ ] Usage history queryable in admin dashboard
- [ ] Latency: cap check adds <50ms to chat request (DB read with index)

**Effort:** 1 week
**Owner:** Blossom + Guy (DBA)

---

### TFR-012 — Analytics Funnel Expansion (3 Events → Full Funnel)

**Priority:** 🟡 P1 — 30-Day Post-Launch

**Current State:**
- `trackEvent()` is called in only 3 places across 300+ files
- No visibility into: signup conversion, feature adoption, retention, churn points, upgrade triggers
- Cannot make data-driven decisions without this

**Requirement:**
Instrument all critical user journey events. Enable full funnel analysis from landing → signup → first AI message → memory save → subscription.

**Events to Add (minimum viable set):**

| Event | Trigger | Properties |
|---|---|---|
| `page_view` | Every route change | `path`, `referrer` |
| `signup_started` | Signup form opened | `method` (email/google/github) |
| `signup_completed` | Auth callback success | `method`, `plan` |
| `first_message_sent` | First chat message | `zone`, `inputType` (text/voice) |
| `voice_activated` | Mic button clicked | `zone` |
| `memory_saved` | Memory extract confirmed | `memoryType` |
| `byo_key_added` | BYO key saved | `provider` |
| `social_post_created` | Social Army post queued | `platform`, `contentType` |
| `journal_entry_created` | Journal saved | `colorZone`, `promptUsed` |
| `capsule_matched` | RGY match found | `matchScore`, `zone` |
| `cubikey_viewed` | CubiKey page opened | `currentPlan` |
| `checkout_started` | Stripe checkout opened | `plan`, `billingInterval` |
| `subscription_activated` | Webhook: sub created | `plan`, `mrr` |
| `feature_gate_hit` | Upgrade prompt shown | `featureName`, `currentPlan` |
| `session_ended` | Tab close / 30min idle | `sessionDuration`, `messageCount` |

**Technical Approach:**
```typescript
// Extend src/lib/analytics/analytics.ts (or create if not exists)
// Use PostHog JS SDK (already in stack per Section 1.1)

import posthog from 'posthog-js'

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties)
  }
}
```

**Acceptance Criteria:**
- [ ] All 15 events above fire in PostHog when triggered
- [ ] Signup funnel visible in PostHog Funnel analysis
- [ ] Feature gate events show which features drive upgrades
- [ ] Session duration trackable for retention analysis
- [ ] Events fire in production (not just development)

**Effort:** 1 week (spread across components)
**Owner:** Bubbles (client-side events) + Blossom (server-side events)

---

### TFR-013 — Social Army Poster Review Gate

**Priority:** 🟡 P1 — 30-Day Post-Launch

**Current State:**
- `src/lib/social-army/social-army-service.ts` posts directly to platforms on schedule
- No human review step before posts go live
- No approval workflow, no preview UI before post
- If AI generates off-brand or harmful content, it posts immediately

**Requirement:**
All AI-generated social posts must enter a review queue before being published. User must approve each post (or configure auto-approve for trusted templates). Emergency stop to halt all scheduled posts.

**Technical Approach:**
```
1. Add status column to social_posts table: 'pending_review' | 'approved' | 'posted' | 'rejected'
2. After AI generation → set status='pending_review' (not 'approved')
3. Create SocialArmyReviewQueue.tsx — shows pending posts with preview + approve/reject/edit
4. Only approved posts are dispatched by the scheduler
5. Add "Emergency Stop" toggle in Social Army settings → sets global_pause=true in DB
6. Optional: auto-approve mode for power users who trust their templates
```

**DB Changes:**
```sql
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS
  status TEXT DEFAULT 'pending_review',
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  auto_approved BOOLEAN DEFAULT FALSE;
```

**UI Components:**
- `SocialArmyReviewQueue.tsx` — scrollable list of pending posts, platform icons, preview text/image
- `PostPreviewCard.tsx` — individual post with approve/reject/edit buttons
- `EmergencyStopToggle.tsx` — red button in Social Army settings

**Acceptance Criteria:**
- [ ] New AI-generated posts default to `status='pending_review'`
- [ ] Scheduler only dispatches posts where `status='approved'`
- [ ] User can see all pending posts in review queue UI
- [ ] Approve/reject updates status immediately
- [ ] Edit redirects to post editor (preserves platform/scheduling)
- [ ] Emergency stop halts all scheduled dispatches within 60 seconds
- [ ] User can enable auto-approve mode per persona (stored in persona settings)

**Effort:** 2 weeks
**Owner:** Blossom (scheduler gate) + Bubbles (review queue UI)

---

### TFR-014 — Onboarding Flow with 5-Branch Persona Routing

**Priority:** 🟡 P1 — 30-Day Post-Launch

**Current State:**
- No structured onboarding flow exists
- New users land directly in the main chat after signup
- No persona selection, no feature walkthrough, no Aha moment orchestration

**Requirement:**
After signup, new users complete a 5-question onboarding that routes them to the relevant Cubiqo sub-domain and populates their initial settings.

**Onboarding Flow Design:**
```
Step 1: "What brings you to Cubiqo today?"
  → [A] Run my business better   → Solopreneur track → Social Army + Agents
  → [B] Find a job               → Job Seeker track  → Job Hunt + Resume
  → [C] Process my thoughts      → Wellness track    → Journal + RGY
  → [D] Build something          → Developer track   → Emergent + BYO
  → [E] Connect with people      → Social track      → RGY Matching + CQ Number

Step 2: "How do you prefer to interact?"
  → Voice / Text / Both

Step 3: "Do you want Cubiqo to remember things between sessions?"
  → Yes (enable memory) / No (session-only)

Step 4 (conditional on track A/D): "Do you have your own AI API keys?"
  → Yes → BYO setup prompt / No → continue with Cubiqo keys

Step 5: "Give me your CQ number — share it with people you trust."
  → Display CQ number + QR code + copy button
```

**Technical Approach:**
```
1. Create /onboarding route with multi-step form (5 steps)
2. Store onboarding responses to user_profiles.onboarding_data (JSONB)
3. Based on track selected: pre-configure color zone, feature flags, first suggestion
4. Redirect to track-specific dashboard section after completion
5. Skip link for power users
```

**DB Changes:**
```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_track TEXT,  -- 'solopreneur' | 'job-seeker' | 'wellness' | 'developer' | 'social'
  onboarding_data JSONB DEFAULT '{}';
```

**Acceptance Criteria:**
- [ ] New users redirected to `/onboarding` after first login
- [ ] 5 steps render with clear UX (progress bar, back navigation)
- [ ] Responses stored to `user_profiles.onboarding_data`
- [ ] Track selection configures initial color zone preference
- [ ] Memory preference stored and applied immediately
- [ ] CQ number displayed prominently in Step 5
- [ ] Skip link available (stores `onboarding_completed: true` immediately)
- [ ] Returning users bypass onboarding

**Effort:** 2 weeks
**Owner:** Bubbles (UI flow) + Blossom (data storage + feature flag routing)

---

### TFR-015 — Calendar API Integration (Google + Outlook)

**Priority:** 🟢 P2 — 90-Day Enhancement

**Current State:**
- `src/lib/channels/` has channel type definitions including calendar
- No Google Calendar or Microsoft Graph API calls exist
- The flagship spec lists "Calendar" as a feature

**Requirement:**
Users must be able to connect Google Calendar or Outlook Calendar and have Cubiqo read/create events on their behalf.

**Technical Approach:**
```
1. Add Google Calendar OAuth scope to Supabase Google provider config
2. Create /api/calendar/events GET/POST routes using googleapis SDK
3. For Outlook: use @microsoft/microsoft-graph-client
4. Store calendar tokens in user_byo_keys (reuse BYO vault infrastructure)
5. Add Calendar connection to HandshakeWizard.tsx setup flow
6. AI tools: readCalendar(), createEvent(), findFreeSlot()
```

**Acceptance Criteria:**
- [ ] User can connect Google Calendar via OAuth
- [ ] AI can read upcoming events: "What do I have tomorrow?"
- [ ] AI can create events: "Schedule a call with Sarah on Friday at 3pm"
- [ ] Events appear in Google Calendar after AI creation
- [ ] Token refresh handled transparently

**Effort:** 3 weeks
**Owner:** Blossom

---

### TFR-016 — Wallet / Payments (DB Migration + Stripe Crypto)

**Priority:** 🟢 P2 — 90-Day Enhancement

**Current State:**
- `src/lib/wallet/wallet-service.ts` implements QR-delayed-release escrow logic
- No DB migration for `payments` or `wallet` tables
- No Stripe (for fiat) or crypto gateway (MetaMask/Coinbase) wired

**Requirement:**
Users must be able to hold value in a Cubiqo wallet, make payments to other CQ numbers, and use QR-based delayed release for trust-based transactions.

**DB Changes:**
```sql
CREATE TABLE wallet_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance_usd NUMERIC(12,4) DEFAULT 0,
  balance_crypto JSONB DEFAULT '{}',  -- {ETH: 0.01, SOL: 0.5}
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  amount_usd NUMERIC(12,4),
  currency TEXT DEFAULT 'USD',
  type TEXT,  -- 'send' | 'receive' | 'escrow' | 'release' | 'refund'
  qr_code TEXT,      -- for delayed release
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Effort:** 3 weeks
**Owner:** Blossom + Guy

---

### TFR-017 — Referral Programme

**Priority:** 🟢 P2 — 90-Day Enhancement

**Current State:**
- No referral code system, no referral tracking, no reward logic

**Requirement:**
Every user gets a unique referral link. Successful referral (referred user subscribes) earns the referrer 1 month free or commission credit.

**Technical Approach:**
```
1. Generate referral_code (8-char alphanumeric) on user creation
2. Append ?ref=CODE to invite links
3. Track ref code through signup → first subscription
4. Apply reward: extend subscription_period_end by 30 days
5. Use PartnerStack (see TFR-002 agency table) for affiliate tracking if scaling
```

**DB Changes:**
```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  referral_code TEXT UNIQUE,
  referred_by TEXT REFERENCES user_profiles(referral_code),
  referral_reward_credited_at TIMESTAMPTZ;
```

**Effort:** 1 week
**Owner:** Blossom

---

### TFR-018 — Geo-fence Radius UI in Side Panel / RGY Settings

**Priority:** 🟢 P2 — 90-Day Enhancement

**Current State:**
- `capsule-manager.ts` and `discovery-service.ts` reference geofence in matching logic
- `rgy_capsules` DB table has `geofence_km` column (from migration audit)
- No UI exposes this — users cannot set their location radius preference

**Requirement:**
Users must be able to set their preferred matching radius (e.g., "within 50km") from the Side Panel or RGY settings.

**Technical Approach:**
- Add radius slider (5km / 25km / 50km / 100km / Global) to `ProMatchSettings.tsx` or `KeywordPanel.tsx`
- Store to `user_profiles.match_radius_km`
- Pass radius to `capsule-manager.ts` `findMatches()` call

**Effort:** 1 week
**Owner:** Bubbles

---

### TFR-019 — SettingsCube Spoken Live Confirmation

**Priority:** 🟢 P2 — 90-Day Enhancement

**Current State:**
- `SettingsCubeApp.tsx` shows text result after command execution
- No TTS spoken confirmation: when user says "lock to TEAL," cube changes color silently

**Requirement:**
After a successful SettingsCube command, Cubiqo must speak the confirmation back to the user (e.g., "Done — locked to Teal mode").

**Technical Approach:**
- After `executeCommand()` success in `SettingsCubeApp.tsx`, call `/api/tts/route.ts` with confirmation text
- Use the active color zone's voice tone for the confirmation

**Effort:** 3 days
**Owner:** Bubbles

---

### TFR-020 — Fabric-Soft-Touch Cuboid Material Variant

**Priority:** 🟢 P2 — 90-Day Enhancement

**Current State:**
- Glass ✅, Metal/Chrome ✅, Solid ✅ — all implemented
- Fabric/soft-touch material: not implemented (spec requirement)

**Requirement:**
A cuboid variant with a soft textile appearance — low metalness, high roughness, subtle normal map, warm diffuse color.

**Technical Approach:**
```typescript
// Create: src/components/cube/FabricCube.tsx
// Three.js MeshStandardMaterial:
const mat = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#e8ddd0'),  // warm cream — can be tinted by zone color
  metalness: 0.02,
  roughness: 0.95,
  normalMap: fabricNormalTexture,    // procedural or loaded texture
  normalScale: new THREE.Vector2(0.3, 0.3),
})
```

**Effort:** 1 week
**Owner:** Pushpa

---

### Summary: Complete Pending Work by Priority

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  PENDING FEATURES — PRIORITY MATRIX                                            ║
╠══╦═══════════════════════════════════════════════╦═════════╦════════════════════╣
║  ║ Feature                                       ║ Effort  ║ Owner              ║
╠══╬═══════════════════════════════════════════════╬═════════╬════════════════════╣
║P0║ TFR-001 Stripe Billing + CubiKey              ║ 3 weeks ║ Blossom + Bubbles  ║
║P0║ TFR-002 ToS + Privacy Policy                  ║ 3 days  ║ MO + Bubbles       ║
║P0║ TFR-003 Age Gate for RED Zone                 ║ 1 week  ║ Blossom + Bubbles  ║
║P0║ TFR-004 Zero-Retention Copy Fix               ║ 3 days  ║ MO + Blossom       ║
║P0║ TFR-005 Smart-Home (disable or implement)     ║ 1 day   ║ Blossom            ║
╠══╬═══════════════════════════════════════════════╬═════════╬════════════════════╣
║P1║ TFR-006 CAP Orchestrator                      ║ 4 weeks ║ Blossom + Bubbles  ║
║P1║ TFR-007 Audio Cues (wake/tick/DND)            ║ 2 weeks ║ Bubbles            ║
║P1║ TFR-008 Vocspad Unified Input                 ║ 2 weeks ║ Bubbles            ║
║P1║ TFR-009 3 Missing Special Moves               ║ 1 week  ║ Pushpa + Bubbles   ║
║P1║ TFR-010 CQ↔CQ UI Wiring                      ║ 2 weeks ║ Blossom + Bubbles  ║
║P1║ TFR-011 Spending Caps → Supabase              ║ 1 week  ║ Blossom + Guy      ║
║P1║ TFR-012 Analytics Funnel (3 → 15 events)      ║ 1 week  ║ Bubbles + Blossom  ║
║P1║ TFR-013 Social Army Review Gate               ║ 2 weeks ║ Blossom + Bubbles  ║
║P1║ TFR-014 Onboarding 5-Branch Flow              ║ 2 weeks ║ Bubbles + Blossom  ║
╠══╬═══════════════════════════════════════════════╬═════════╬════════════════════╣
║P2║ TFR-015 Calendar API (Google + Outlook)       ║ 3 weeks ║ Blossom            ║
║P2║ TFR-016 Wallet / Stripe Crypto                ║ 3 weeks ║ Blossom + Guy      ║
║P2║ TFR-017 Referral Programme                    ║ 1 week  ║ Blossom            ║
║P2║ TFR-018 Geo-fence Radius UI                   ║ 1 week  ║ Bubbles            ║
║P2║ TFR-019 SettingsCube Spoken Confirmation      ║ 3 days  ║ Bubbles            ║
║P2║ TFR-020 Fabric-Soft-Touch Cube Material       ║ 1 week  ║ Pushpa             ║
╚══╩═══════════════════════════════════════════════╩═════════╩════════════════════╝

TOTAL EFFORT:
  P0 (all 5):  ~5.5 weeks — DO THESE BEFORE ANY PUBLIC LAUNCH
  P1 (all 9):  ~15 weeks  — Complete within 30 days post-soft-launch
  P2 (all 6):  ~10 weeks  — Complete within 90 days post-launch

Solo developer path: ~30 weeks total to full spec compliance
2-developer path:    ~16 weeks total
```

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

---

## Section 10 — Who Are Our Users?

*Grounded in actual Cubiqo feature set: Journal (Rozana), Job Hunt automation, RGY matching, Social Army, Emergent platform, in-app agents, BYO mode, Deals engine, Duo/Companion mode, CQ identity system, voice AI, crisis detection.*

---

### 10.1 The Core Question — Why It Matters

"Who is the user?" is the most important question in product development. It determines:
- Which features to build next
- Which marketing channels to invest in
- What pricing model works
- What investor narrative to tell
- What the onboarding flow teaches first

Cubiqo is a **multi-persona product** — intentionally so, because it was built as an "AI OS" that different people use for entirely different reasons. That is a strength (broad TAM) and a risk (unfocused messaging). The answer is **to lead with one persona publicly, serve all privately**.

---

### 10.2 The Seven User Personas

---

#### PERSONA 1 — The Solopreneur Operator
*"I run a one-person business and I need a full team inside an app."*

| Attribute | Detail |
|---|---|
| **Age / Stage** | 28–45, already running a business or side hustle |
| **Location** | North America, UK, Australia, UAE, India (English-first markets) |
| **Market size** | 64M solopreneurs in US alone; 400M+ globally (World Bank 2024) |
| **Income** | $3K–$25K/month revenue, under-resourced |
| **Tech comfort** | Medium-high; uses Notion, Zapier, ChatGPT, Canva |
| **Core pain** | Wears every hat — marketing, ops, client work, admin — simultaneously |
| **Cubiqo features used** | Social Army (posts across 10 platforms), Agents (A1–A7 autonomous tasks), Deals engine (finds tools at discount), BYO mode (controls AI cost), Emergent (launches side projects), Journal (BigBoss accountability prompts) |
| **Aha moment** | Social Army auto-posts to 10 platforms while they sleep; morning shows 47 new impressions, zero effort |
| **Monetization path** | Free → Pro ($29/mo) within 2 weeks once Social Army value clicks; upgrades to Founders Pass for unlimited agents |
| **Acquisition channel** | Twitter/X, Reddit r/entrepreneur, Indie Hackers, Product Hunt |
| **Churn risk** | Low — deeply embedded across social + ops workflows |
| **Investor story value** | ⭐⭐⭐⭐⭐ — the "Zapier + Buffer + ChatGPT in one" narrative for the creator economy |

---

#### PERSONA 2 — The Job Seeker in Transition
*"I need a new job and the process is humiliating, manual, and exhausting."*

| Attribute | Detail |
|---|---|
| **Age / Stage** | 24–40, recently laid off, career-pivoting, or quietly looking while employed |
| **Location** | US, Canada, UK, India, Australia |
| **Market size** | 200M active job seekers globally at any moment (ILO 2024); US unemployment always ≥ 4M |
| **Income** | Variable — either unemployed or $60K–$120K employed and frustrated |
| **Tech comfort** | Medium; uses LinkedIn daily, spreadsheets to track applications |
| **Core pain** | Applies to 50+ jobs manually, hears nothing back, loses track, gets rejected for unknown reasons |
| **Cubiqo features used** | Job Hunt automation (resume upload → auto-apply → status tracking), LinkedIn integration, cover letter AI, interview coaching via voice AI, Journal for rejection processing |
| **Aha moment** | Uploads resume Monday, wakes up Tuesday to 12 applications submitted + 2 interview alerts in inbox |
| **Monetization path** | Free tier for 10 apps/month → Pro ($29/mo) for unlimited auto-apply; crisis persona is emotionally motivated to pay |
| **Acquisition channel** | Reddit r/cscareerquestions r/jobs, LinkedIn job seeker groups, YouTube career coaches, TikTok "job hunt tips" |
| **Churn risk** | Medium — leaves when they get a job (natural churn); re-acquires on next career move |
| **Investor story value** | ⭐⭐⭐⭐ — automated job applications is a hot category; ZipRecruiter is a $2B company |

**Feature gap to fix:** Full autonomous application submission (currently tracks but doesn't auto-submit). This single gap is the difference between "interesting tool" and "life-changing product" for this persona.

---

#### PERSONA 3 — The Emotionally Overwhelmed Professional
*"I am doing okay on paper but I am exhausted, isolated, and have no one to actually talk to."*

| Attribute | Detail |
|---|---|
| **Age / Stage** | 27–45, high-functioning but emotionally depleted |
| **Location** | Urban North America, UK, Australia — high-cost, high-pressure cities |
| **Market size** | 76% of US workers report burnout (Deloitte 2023); 1 in 5 adults experience mental health challenge annually |
| **Income** | $60K–$200K — can afford a therapist but won't commit to one |
| **Tech comfort** | Medium; smartphone-heavy, app-native |
| **Core pain** | No safe space to process stress; therapy stigma or cost barrier; journaling feels juvenile alone |
| **Cubiqo features used** | Journal/Rozana (BigBoss "friend who tells you the truth" prompts), Duo mode (side-by-side companion), voice AI (emotionally modulated responses), crisis detection (self-harm escalation to safe resources), Companion mode |
| **Aha moment** | Journal prompt "Your boss just took credit for your work. Say the unsayable." — they type something raw and Cubiqo responds with exactly the right tone: validating, then redirecting |
| **Monetization path** | Hardest to convert on price alone → convert via **habit** (daily journal streak, weekly emotional summary email) → upgrade for voice companion + unlimited history |
| **Acquisition channel** | Instagram mental health accounts, Reddit r/mentalhealth r/therapy, therapy-adjacent podcasts, TikTok therapist creators |
| **Churn risk** | Very low once habit forms (daily journal creates daily return) |
| **Investor story value** | ⭐⭐⭐ — mental health tech is a $6B market but requires careful positioning to avoid regulatory risk; better to position as "emotional productivity" than "therapy" |

**Critical warning:** This persona triggers real crisis situations. The crisis detection escalation path (`policy-router.ts`) MUST be battle-tested before this persona is publicly targeted. Mental health claims in marketing require legal review.

---

#### PERSONA 4 — The Privacy-Conscious Tech Enthusiast
*"I want powerful AI but I refuse to send my data to Big Tech servers."*

| Attribute | Detail |
|---|---|
| **Age / Stage** | 25–45, developer or highly technical non-developer |
| **Location** | EU (GDPR-native), Canada, Germany, Switzerland, Japan |
| **Market size** | Smaller absolute numbers (~5M globally) but extremely vocal and viral |
| **Income** | $80K–$200K, willing to pay premium for privacy |
| **Tech comfort** | High — runs their own servers, uses Signal, has a VPN, knows what RAG means |
| **Core pain** | Every AI product sends their data to OpenAI/Google; no true privacy option exists at a consumer price point |
| **Cubiqo features used** | BYO mode (own API key, controls data routing), future WebLLM (runs inference entirely in browser), Ollama integration, privacy-first journal |
| **Aha moment** | Sees BYO settings page — "This is the first AI app that lets me use MY key, MY model, and tells me exactly what happens to my data" |
| **Monetization path** | Premium/Enterprise tier — this persona pays for the platform fee + will pay for Founders Pass as status symbol |
| **Acquisition channel** | Hacker News, r/privacy, r/selfhosted, Mastodon, DEF CON community, Lobsters |
| **Churn risk** | Very low — will become an evangelist and pull in 3–5 more users through word of mouth |
| **Investor story value** | ⭐⭐⭐⭐ — EU AI Act compliance + privacy-first positioning is increasingly a competitive moat; powerful for EU expansion narrative |

**Note:** Current BYO still routes through Cubiqo server (only key is user's own). True privacy requires WebLLM (Tier 2, 8 weeks). Do NOT market to this persona as "private" until Tier 2 ships — they will call it out publicly and cause reputational damage.

---

#### PERSONA 5 — The Creator / Social Media Entrepreneur
*"My content is my product and I can't keep up with the pace of posting."*

| Attribute | Detail |
|---|---|
| **Age / Stage** | 20–38, full-time or aspiring creator / influencer |
| **Location** | US, UK, Brazil, India, Philippines, Nigeria |
| **Market size** | 50M+ content creators globally (SignalFire 2023); 2M+ earn full-time income from content |
| **Income** | $1K–$30K/month from content; time-constrained and inconsistent |
| **Tech comfort** | High for social tools; medium for dev tools |
| **Core pain** | Content creation is a daily grind; one person cannot maintain 5+ platforms without burning out |
| **Cubiqo features used** | Social Army (10 platforms × 10 accounts × scheduled posting), GFXToolz integration (images/videos), AI caption generation, persona management (different voice per platform), Deals (sponsored content deal tracking) |
| **Aha moment** | Sets up Social Army once, schedules a week of posts across Instagram/TikTok/Twitter/LinkedIn/YouTube — all from one dashboard |
| **Monetization path** | Pro immediately ($29/mo is trivial if it saves 10 hours/week); potential Founders Pass for white-label client management |
| **Acquisition channel** | YouTube creator economy content, CreatorIQ, Creator Commerce, Beehiiv newsletters for creators |
| **Churn risk** | Medium — churns if Social Army hits API platform restrictions (LinkedIn 1/day, Instagram approval delays) |
| **Investor story value** | ⭐⭐⭐⭐⭐ — creator economy is the hottest B2C market; Buffer is worth $80M, Hootsuite $750M; Cubiqo is Buffer + AI agents |

---

#### PERSONA 6 — The Developer / Technical Builder
*"I want to build and ship products faster without managing 20 different tools."*

| Attribute | Detail |
|---|---|
| **Age / Stage** | 22–40, freelance dev, indie hacker, startup engineer |
| **Location** | Global (English-first); strong in India, Eastern Europe, Southeast Asia, Canada |
| **Market size** | 28M developers globally (Evans Data 2024); 4M freelance devs in US |
| **Income** | $40K–$200K; cost-sensitive on tools, but pays for 10x productivity gains |
| **Tech comfort** | Very high — daily VS Code, GitHub, terminal users |
| **Core pain** | Too many disconnected tools: IDE + hosting + secrets management + deployment + monitoring = cognitive overhead |
| **Cubiqo features used** | Emergent platform (Monaco editor + sandbox + deploy pipeline), BYO mode (own OpenRouter/Groq key for cheap inference), Agents (code review, test generation, deployment), CQ social for dev community |
| **Aha moment** | Opens Emergent, types a project description, watches Cubiqo scaffold a Next.js app, configure secrets, and deploy to Vercel — in one session |
| **Monetization path** | Heavy free user first (builds on Emergent); converts to Pro when projects earn money or team joins; strong Founders Pass candidate for agency use |
| **Acquisition channel** | Hacker News "Show HN", GitHub trending, DEV.to, r/programming, YouTube dev channels (Theo, Fireship) |
| **Churn risk** | Low once Emergent hosts a live project (switching cost = redeployment effort) |
| **Investor story value** | ⭐⭐⭐⭐ — Vercel, Railway, Replit all multi-billion; Cubiqo is the AI-native version of all three |

---

#### PERSONA 7 — The RGY Community Seeker
*"I want to connect with people who are actually on a similar wavelength, not just network for networking's sake."*

| Attribute | Detail |
|---|---|
| **Age / Stage** | 22–45, socially active but disillusioned with LinkedIn/Twitter networking |
| **Location** | Urban global; early adopter in tech / creative / entrepreneurship communities |
| **Market size** | Hard to size directly — this is the "quality connection" persona; target is 50M LinkedIn-frustrated professionals |
| **Income** | Variable — defined more by mindset than income |
| **Tech comfort** | Medium-high |
| **Core pain** | Networking feels transactional; LinkedIn is a spam machine; can't find genuine collaborators or people in the same life chapter |
| **Cubiqo features used** | RGY chat (express intent in colour-coded context: Red=transform, Yellow=grow, Green=stabilise), capsule matching (intent × keyword × vector similarity → anonymous match → consent → reveal), CQ number as identity, CQ-to-CQ direct messaging with voice delivery |
| **Aha moment** | Sets RGY intent to Yellow: "looking for a technical co-founder for a fintech idea in Toronto" → Cubiqo surfaces 3 anonymised matches → all 3 are genuinely relevant → accepts 1 → that match becomes a co-founder |
| **Monetization path** | Free RGY → Pro for unlimited capsules + proactive discovery + video RGY rooms → Premium for concierge matching |
| **Acquisition channel** | RGY is the viral hook — shareable CQ number, RGY colour profile share cards, community subreddits, co-founder matching communities (YC co-founder matching, Indie Hackers) |
| **Churn risk** | Very low — active matching creates weekly return visit; matched connections create emotional ownership of the platform |
| **Investor story value** | ⭐⭐⭐⭐⭐ — LinkedIn was a $26B acquisition; the "next LinkedIn" narrative plus patentable matching algorithm (Patent 3) makes this the single most investor-compelling feature |

---

### 10.3 Persona × Feature Matrix

| Feature | Solopreneur | Job Seeker | Emotional | Privacy | Creator | Developer | RGY Seeker |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Journal / Rozana | ✅ | ✅ | ⭐ | ✅ | — | — | ✅ |
| Job Hunt Automation | — | ⭐ | — | — | — | ✅ | — |
| Social Army | ⭐ | — | — | — | ⭐ | — | ✅ |
| RGY Matching | ✅ | ✅ | ✅ | — | ✅ | ✅ | ⭐ |
| In-App Agents | ⭐ | ✅ | — | ✅ | ✅ | ⭐ | — |
| BYO Mode | ✅ | — | — | ⭐ | — | ⭐ | — |
| Emergent Platform | ✅ | — | — | ✅ | — | ⭐ | — |
| Voice AI | ✅ | ✅ | ⭐ | — | ✅ | — | ✅ |
| Deals Engine | ⭐ | — | — | — | ✅ | ✅ | — |
| Duo / Companion | ✅ | ✅ | ⭐ | — | — | — | ✅ |
| CQ Number / Identity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⭐ |
| Crisis Detection | — | — | ⭐ | — | — | — | — |

*⭐ = primary feature for this persona | ✅ = secondary use*

---

### 10.4 Which Persona to Lead With at Launch

**Lead publicly with: Persona 1 (Solopreneur Operator) + Persona 5 (Creator)**

Reason: These two personas have:
- Highest willingness-to-pay (already spending on Buffer, Zapier, ChatGPT)
- Lowest regulatory risk (no mental health or employment law exposure)
- Most viral distribution (they POST publicly, so Cubiqo gets organic impressions)
- Clearest ROI story ("saves 10 hours/week, worth $29/mo")
- Strongest investor narrative (creator economy + solopreneur market)

**Serve privately at launch, market loudly at Month 3:**
- Persona 2 (Job Seeker) — once auto-apply is complete
- Persona 7 (RGY Community) — once capsule matching has 100+ users to match against

**Serve carefully, never lead marketing with:**
- Persona 3 (Emotional) — position as "emotional productivity" not "mental health tool"; needs legal review first
- Persona 4 (Privacy) — position as "data control" not "privacy"; needs WebLLM shipped first

---

### 10.5 The ONE User Who Represents All Seven

If forced to pick a single archetype for everything — product, marketing, pitch:

> **"Alex, 32, runs a 2-person design + copywriting agency in Toronto. Alex uses Cubiqo to post across 8 social platforms daily, track 3 client projects inside Emergent, decompress after client calls in the journal, and has an RGY Yellow capsule active looking for a dev co-founder to productize the agency's workflows. Alex pays $29/month and would pay $99/month if the voice companion was smarter."**

Alex is real. Alex is everywhere. Alex is the user Cubiqo was built for.

---

### 10.6 What This Means for Onboarding

The onboarding flow MUST ask one question first:

```
"What matters most to you right now?"
  A) Growing my business / brand online      → routes to Social Army + Agents
  B) Finding a new job                        → routes to Job Hunt setup
  C) Building something new                   → routes to Emergent + Agents
  D) Making sense of my day / life            → routes to Journal (Rozana)
  E) Connecting with the right people        → routes to RGY intent setup
```

Each answer triggers a different onboarding sequence, a different first Aha moment, and a different first 30-day email series. This single onboarding branching decision will likely double activation rate versus a one-size-fits-all tour.

**Current gap:** Onboarding is currently a single generic flow. This branching is a P1 priority — build it in week 3–4 post-launch.

---

### 10.7 Market Size Summary

| Persona | Addressable Market | Realistic TAM (Cubiqo serves) | Conversion at 1% |
|---|---|---|---|
| Solopreneur Operator | 400M globally | 20M English-first, tech-ready | 200K users |
| Job Seeker | 200M active seekers | 10M English-first, tech-ready | 100K users |
| Emotional Professional | 500M+ burnout-affected | 15M willing to use AI for this | 150K users |
| Privacy Enthusiast | 30M privacy-conscious | 5M willing to pay premium | 50K users |
| Creator / Social | 50M creators | 5M with posting automation need | 50K users |
| Developer / Builder | 28M developers | 8M indie/freelance | 80K users |
| RGY Community Seeker | 900M LinkedIn users | 10M disillusioned networkers | 100K users |

**Combined realistic target at 1% TAM conversion: 730,000 users**
**At $29/month average blended ARPU: $21.2M ARR**
**At $15/month average blended ARPU (freemium mix): $131M ARR potential at full TAM**

This is a $100M+ ARR opportunity if Cubiqo executes across all seven personas over 5 years. The near-term focus should be 1,000 users → 10,000 users → first $100K ARR. All three are achievable within 18 months with the right execution.


---

## Section 11 — Flagship Spec Gap Analysis: Where Does Cubiqo Stand?

> **Reference document:** The "CUBIQO — Flagship" product specification provided February 2026.
> **Method:** Every claim below is grounded in direct code inspection of the branch `copilot/investigate-features-and-ui-components`. No assumptions.
>
> **Legend:** 🟢 Complete · 🟡 Partial (skeleton/type/UI only, core not fully wired) · 🔴 Missing · ⚠️ Deviation (works but differently than spec)

---

### 11.1 Overall Scorecard

| Spec Section | Status | Short Verdict |
|---|---|---|
| Color / Voice (UI-level) | 🟢 | TEAL/RED/YELLOW defined with voice tones, lock commands, and per-color animation parameters |
| Input / Output | 🟡 | STT ✅, TTS ✅, state machine ✅; Vocspad input mode ❌ not found anywhere |
| State Machine (L→T→S→I) | 🟢 | `useAIState.ts` implements all 4 states with event logging |
| UI/UX — Wireframe cuboid | 🟢 | Multiple variants: `EnergyCubeWireframe`, `SilverWireLandingCube`, `IsometricCube` |
| UI/UX — Solid cuboid | 🟢 | `AICuboidGLB.tsx` (GLB-loaded, InnerPlasma + OuterGlass), `SettingsCube.tsx` (RoundedBox) |
| UI/UX — Hybrid material + color | 🟡 | GLB has OuterGlass + color; ≤50% color rule NOT enforced |
| UI/UX — Timing tokens | 🟡 | `--duration-normal: 200ms` in CSS; glow 150–300ms tokens not formalized |
| UI/UX — Reduced motion | 🟡 | `motion-safe:` Tailwind used in VoiceStateIndicator; not applied to 3D cube transitions |
| Special Moves (8 total) | 🟡 | 5 of 8 animated (Resonance, Breakthrough, Memory Thread, Deep Focus, Co-Presence); Wink, Trust Earned, Handoff are missing |
| Audio Cues (wake/tick/DND) | 🔴 | AudioContext manager exists for playback; zero wake chime, zero speak ticks, no DND mode |
| Side Panel — Keywords | 🟢 | `KeywordPanel.tsx` with per-color RGY lists, tap-to-edit, session-scoped localStorage |
| Side Panel — Geo-fence | 🟡 | Referenced in `capsule-manager.ts` and `discovery-service.ts`; not surfaced in UI |
| Side Panel — Color lock | 🟢 | `cubiqo.color.lock('RED')` command in `SettingsCube/commands.ts` |
| SettingsCube — Voice config | 🟢 | `cubiqo.voice.set()` command; ElevenLabs per-color voice tones defined |
| SettingsCube — Live confirm | 🟡 | CommandInput shows result; no spoken live confirmation |
| SettingsCube — Event logs | 🟡 | Console logging only; no structured event-only log store |
| RGY Router — Backends | 🟢 | GPT-4o (OpenAI), Claude 3.5 (Anthropic), Ollama (self-hosted), OpenRouter aggregation |
| RGY Router — Intent routing | �� | Zone detection → model selection in `policy-router.ts` |
| RGY Router — Auto-failover | 🟢 | 3-level failover per zone (primary → secondary → ultimate fallback) |
| RGY Router — Scoped to CUBIQO | 🟡 | No `/rgy/route` endpoint; routing is embedded in chat API; Worlds boundary undefined |
| RGY Router — CAP Orchestrator | 🔴 | Not implemented; no file, no route, no reference to this concept |
| RGY Router — Keyword feedback | 🟡 | Session-scoped localStorage only; no DB telemetry pipeline back from sub-domains |
| RGY Router — Direct override | 🟡 | `isFounder` flag routes to Sonnet; no explicit `model:gpt|claude|local` UI toggle |
| RGY Router — Zero retention | ⚠️ | "Zero-Retention" is marketing copy in email template; memory system STORES to Supabase; contradiction |
| Feature — BYO Mode | 🟢 | `byo-manager.ts`, `BYOSettings.tsx`, `/api/byo/route.ts`, AES-256 key encryption |
| Feature — Auth (magic link) | 🟢 | Supabase magic link, `/auth/callback` |
| Feature — Auth (WebAuthn/Passkeys) | 🟢 | 4 WebAuthn routes, `BiometricRegistration.tsx`, `BiometricLogin.tsx` |
| Feature — Email | 🟢 | Resend integration, email templates, `/api/channels/[type]` |
| Feature — Calendar | 🟡 | Channel API exists; no calendar-specific implementation found |
| Feature — Food delivery | 🟡 | `action-types.ts` defines ubereats/doordash platform types; no live API calls |
| Feature — Taxi / ride-share | 🟡 | Mentioned in action-types; no live integration |
| Feature — Browser automation | 🟢 | Puppeteer-based `BrowserService.ts` with navigate, click, type, fill, screenshot, extract |
| Feature — Smart-home | 🔴 | `integration-registry.ts` lists smart_home type; no implementation (Google Home, HomeKit, MQTT) |
| Feature — Intelligent chat/match | 🟢 | RGY capsule system, discovery cron, proactive matching service |
| Feature — CQ↔CQ connections | 🟡 | `cq-to-cq/` module: CQ number generator, WebSocket, WebRTC calls — not connected to UI |
| Feature — Wallet / QR escrow | 🟡 | `wallet-service.ts` with QR delayed release backend; no Stripe, no UI, no DB migration |
| RGY Sub-domain — No coupling | 🟢 | Keywords session-scoped; sub-domains do not force route changes |
| RGY Sub-domain — CAP Orchestrator | 🔴 | As above — not built |
| RGY Sub-domain — Telemetry hint | 🟡 | localStorage session hint; not a structured telemetry pipeline |

---

### 11.2 Detailed Gap Analysis by Spec Section

---

#### COLOR / VOICE (UI-LEVEL) — 🟢 Substantially Complete

**What the spec requires:**
- TEAL (goal-oriented, professional/decisive voice)
- RED (age-gated/explicit, discreet/low-volume voice)
- YELLOW (casual/general, friendly, light sarcasm)
- Color/voice are operational signals; do NOT select models or imply emotion
- Self-harm: force YELLOW, block instructions, offer resources
- User may lock to one color + voice; no cross voice↔color mixing

**What exists in code:**

`src/config/colors.ts` defines all four colors (RED/YELLOW/TEAL/ORANGE) with per-color:
- `voiceTone` strings (e.g. TEAL: "clear, motivating, balanced"; RED: "deep, slow, sensual whisper; discreet")
- `animationSpeed`, `glowIntensity`, `breathingSpeed`, `blinkStyle`

`src/lib/ai/policy-router.ts` correctly forces YELLOW zone and adds support prompt on self-harm detection:
```typescript
if (selfHarmPatterns.test(lastMessageText)) {
  zone = 'YELLOW';
  systemPrompt += " IMPORTANT: ... extremely supportive ... provide help resources.";
}
```

`src/lib/settings-cube/commands.ts` supports:
```typescript
case 'cubiqo.color.lock': { const color = ... if (['RED','YELLOW','TEAL','ORANGE'].includes(color)) ... }
```

**Gaps:**
1. **Color as model selector**: Policy-router DOES route RED zone to uncensored models (`MIXTRAL_8X22B`, `LLAMA_UNCENSORED`). This contradicts the spec rule: "Color does not select models." RED is the policy zone for age-gated content — but the spec says color is UI-only and routing is purely intent-based. **Spec vs implementation mismatch.** ⚠️
2. **Age-gate / age verification**: `colors.ts` says `emotion: 'age-gated, critical, goal-oriented'` for RED, but there is **zero age verification code** anywhere. The RED zone is accessible to all users with no gate.
3. **ORANGE color**: Not in the spec (spec has TEAL/RED/YELLOW only). ORANGE is a Fourth-Way philosophical color that Cubiqo added. This is an extension, not a violation.

**Fix required:**
- Add age-gate middleware check before allowing RED zone access (simple: DOB confirmation modal stored to user profile)
- Document that RED zone uses specific models as a deliberate design decision (or refactor router to be model-agnostic per-zone, using only intent for model scoring)

---

#### INPUT / OUTPUT — 🟡 Partial

**What the spec requires:**
- Input: speech OR **Vocspad** (type or talk)
- Output: on-screen text + synthesized speech; synchronized with status cues
- State machine: Listening → Thinking → Speaking → Idle

**What exists:**

| Requirement | Code Evidence | Status |
|---|---|---|
| Speech input (STT) | `/api/stt/route.ts` using Whisper | 🟢 |
| Text input (chat) | `ChatContainer.tsx`, `/api/chat/route.ts` | 🟢 |
| **Vocspad** (combined type+talk mode) | ❌ No file named Vocspad anywhere in 300+ files | 🔴 |
| TTS output | `/api/tts/route.ts`, ElevenLabs, OpenAI TTS fallback | 🟢 |
| On-screen text | Chat bubbles in `ChatContainer.tsx` | 🟢 |
| Synchronized status cues | `VoiceStateIndicator.tsx` with pulse rings | 🟢 |
| State machine | `useAIState.ts` (idle/listening/thinking/speaking) | 🟢 |

**Vocspad gap:** The spec treats Vocspad as a specific named input mode — a hybrid voice+text pad that lets users type and talk simultaneously. This UX component does not exist. The current chat has separate text input and a mic button, but not a unified Vocspad component that merges both modes in a single surface.

**Fix required (2 weeks):**
Create `src/components/chat/Vocspad.tsx` — a unified input component that:
- Shows a text area with live STT transcription overlaid
- Has a mic toggle button embedded inline
- Falls back gracefully to text-only when no mic permission

---

#### UI/UX — CUBOID FORMS & MATERIALS — 🟡 Partial

**What the spec requires:**

| Form | Description | Code File | Status |
|---|---|---|---|
| Outline-only cuboid (fig1) | Floating isometric wireframe, crisp edges, no fill | `EnergyCubeWireframe.tsx`, `SilverWireLandingCube.tsx` | 🟢 |
| Solid cuboid (fig2) | Filled body, subtle depth, no interior facets | `AICuboidGLB.tsx` (OuterGlass solid), `SettingsCube.tsx` (RoundedBox) | 🟢 |
| Hybrid material + color (fig3) | Material (e.g. metal/glass) + operational color overlay | `AICuboidGLB.tsx` (OuterGlass + InnerPlasma + color param) | 🟡 |
| ≤50% color visible area rule | Hero/transition hybrid must show ≤50% color | ❌ Not enforced | 🔴 |
| Glass material | For aesthetics only, high contrast | `GlassyAgentCube.tsx`, `NeonGlassCube.tsx` | 🟢 |
| Metal material | For aesthetics only | `SilverWireLandingCube.tsx` (chrome/silver) | 🟢 |
| Fabric-soft-touch material | For aesthetics only | ❌ Not implemented | 🔴 |
| Wireframe/Neon Outline variant | Compact/overlays, UI-only, router unchanged | `EnergyCubeWireframe.tsx`, neon demo page | 🟢 |
| Split Material/Color hero variant | ≤50% color coverage | AICuboidGLB partial | 🟡 |

**Timing Tokens:**

| Token | Spec | Code | Status |
|---|---|---|---|
| Color/material swap | ≤200ms | `--duration-normal: 200ms` in `globals.css` | 🟢 |
| Glow-in/glow-out | 150–300ms | Not formalized as CSS variable | 🟡 |
| Reduced motion respect | All animations | `motion-safe:` in VoiceStateIndicator; missing on 3D cube lerp transitions | 🟡 |

**Fabric-soft-touch fix (1 week):** Create a `FabricCube.tsx` variant using a Three.js `MeshStandardMaterial` with low metalness, high roughness, and a subtle normal map to simulate soft textile.

**≤50% color rule enforcement:** Add a CSS custom property `--cube-color-coverage` and enforce via a shader uniform `uColorCoverage` clamped to 0.5 in the GLB material.

---

#### SPECIAL MOVES — 🟡 5 of 8 Implemented

**What the spec requires:** 8 named Special Moves, all UI-only, respecting timing tokens.

| Move | Spec | Code in `AICuboidGLB.tsx` | Status |
|---|---|---|---|
| Resonance | Rapid pulse | `emissiveModifier = 1.0 + Math.sin(t * 10) * 0.5` | 🟢 |
| Breakthrough | Flash | `(Math.floor(t * 20) % 2) ? 1.5 : 0.5` | 🟢 |
| Trust Earned | (unspecified visual) | ❌ Not in switch statement | 🔴 |
| Co-Presence | (unspecified visual) | `innerRef.current.rotation.z = t * 2` | 🟢 |
| Wink | YELLOW-only | ❌ Not in switch statement | 🔴 |
| Deep Focus | (unspecified visual) | `scale.setScalar(0.8 + Math.sin(t * 2) * 0.1)` | 🟢 |
| Memory Thread | (unspecified visual) | `rotationMultiplier = 5.0` | 🟢 |
| Handoff | (unspecified visual) | ❌ Not in switch statement | 🔴 |

**Fix required (1 week):** Add 3 missing cases to `AICuboidGLB.tsx` animation switch:
```typescript
case 'Trust Earned':
  // Warm golden pulse + scale breathe — acknowledgement moment
  mat.emissive.lerp(new THREE.Color('#ffd700'), 0.1)
  innerRef.current.scale.setScalar(1.0 + Math.sin(t * 3) * 0.05)
  break
case 'Wink':
  // YELLOW-only: quick rotation tilt + emissive blink, 200ms duration
  if (color === 'YELLOW') {
    groupRef.current?.rotation.set(0, 0, Math.sin(t * 30) * 0.15)
    emissiveModifier = Math.sin(t * 40) > 0 ? 1.3 : 0.7
  }
  break
case 'Handoff':
  // Outward scale + fade → signals transition to another agent/world
  innerRef.current.scale.setScalar(1.0 + moveTimerRef.current * 0.3)
  mat.opacity = Math.max(0, 1.0 - moveTimerRef.current * 0.5)
  break
```

---

#### AUDIO CUES — 🔴 Not Implemented

**What the spec requires:**
- **Wake**: brief chime on activation (optional haptics)
- **Speak start/stop**: soft ticks aligned to TTS start and end
- **Error/Alert**: single neutral tick
- **Controls**: volume slider, on/off toggle, DND mode

**What exists:**
- `src/lib/audio/audioContext.ts`: AudioContext manager — handles playback unlocking on user gesture. No sound files, no generated tones.
- `src/lib/audio/audio-score-service.ts`: Background ambient scoring — oscillators for ambient music. No UI cues.
- `src/lib/multimodal/audio.ts`: STT recording helpers. No cue sounds.

**Nothing implements any of the required audio cues.**

**Fix required (2 weeks):**

Create `src/lib/audio/ui-cues.ts`:
```typescript
// Uses Web Audio API oscillators — zero external files needed
export function playWakeChime() { /* 220Hz → 440Hz, 80ms, ramp out */ }
export function playSpeakTick() { /* 880Hz, 30ms, soft envelope */ }
export function playErrorTick() { /* 330Hz, 50ms, neutral */ }

// DND mode — stored to user preferences
export function setDNDAudio(enabled: boolean) { ... }
export function setAudioVolume(level: 0 | 0.25 | 0.5 | 0.75 | 1.0) { ... }
```

Call sites:
- `useAIState.ts`: call `playWakeChime()` on `idle → listening` transition
- `useElevenLabsTTS.ts`: call `playSpeakTick()` on TTS stream start/end
- Chat error handler: call `playErrorTick()` on AI failure

---

#### SIDE PANEL & SETTINGSCUBE — 🟢 Substantially Complete (2 minor gaps)

**What the spec requires + code evidence:**

| Requirement | Code | Status |
|---|---|---|
| Keywords panel with per-color lists | `KeywordPanel.tsx` — RGY cards with tap-to-edit and session keywords | 🟢 |
| User can add intent keywords | Add/remove in KeywordPanel; stored to localStorage per session | 🟢 |
| Company / collaboration / trade intents | `CARD_CONFIG` in `RGYColorSelector.tsx` maps contexts | 🟢 |
| Geo-fence for match | `capsule-manager.ts` and `discovery-service.ts` reference geofence | 🟡 (not in UI) |
| Color lock | `cubiqo.color.lock('TEAL')` in SettingsCube commands | 🟢 |
| Voice lock with color | `cubiqo.voice.set({...})` command | 🟢 |
| No cross voice↔color mixing | Lock command sets both; no mixing API exposed | 🟢 |
| Speak to update config | SettingsCubeApp accepts typed/voiced commands | 🟢 |
| Live confirmations | CommandInput shows result text; no spoken TTS confirmation | �� |
| Event-only logs | Console.log only; no structured event store | 🟡 |

**Gap: Geo-fence UI.** The geofence data model exists in `rgy_capsules` table (from previous migration analysis) but the KeywordPanel and RGY settings do not expose a "set my location radius" control. Fix: add a geo-fence radius slider to `ProMatchSettings.tsx`.

**Gap: Spoken live confirmation.** When a user says "lock to TEAL," the cube changes color but Cubiqo does not speak a confirmation back. Fix: after `executeCommand()` succeeds in `SettingsCubeApp.tsx`, call the TTS API with the confirmation text.

---

#### RGY ROUTER — 🟡 Mostly Complete; CAP Orchestrator and Zero-Retention Critical Gaps

**Backends and failover:**

| Requirement | Code | Status |
|---|---|---|
| GPT backend | `callOpenAI()` in `router.ts`, OpenRouter GPT-4o in `policy-router.ts` | 🟢 |
| Claude backend | `callClaude()` in `router.ts`, Claude 3.5 Sonnet in `policy-router.ts` | 🟢 |
| Self-hosted LLM (Ollama) | `callOllamaWithFallback()`, `isOllamaAvailable()` in `ollama.ts` | 🟢 |
| Auto-failover on errors | 3-level try/catch chains per zone in `policy-router.ts` | 🟢 |
| SLA breach failover | ❌ No SLA timer / timeout threshold | 🟡 |
| Direct override (`model:gpt\|claude\|local`) | `isFounder` → Sonnet; no explicit per-message model: field in UI | 🟡 |
| Reasoning flag | `reasoning: true` → DeepSeek R1 → Opus | 🟢 |

**CAP Orchestrator — 🔴 Critical Gap:**

The spec defines a "CAP Orchestrator" that Worlds (sub-domains/tools) use, inheriting the chosen backend without calling `/rgy/route` directly. This concept does not exist in the codebase. There is:
- No `cap-orchestrator.ts` file
- No `/api/cap/` routes
- No "World" abstraction in code
- The agents system (`engine/agent.ts`) is the closest concept but it routes to external LLMs directly, bypassing zone/policy logic entirely

This is the **largest architectural gap** in the spec. The CAP Orchestrator is the integration boundary that would allow Emergent, Social Army, Job Hunt, Journal and other sub-domains to route through the same policy-aware backbone as the main Cubiqo chat. Without it, every sub-domain calls its own LLM independently with no shared zone policy, no shared keyword telemetry pipeline, and no shared safety guardrails.

**Build plan for CAP Orchestrator (4 weeks):**
```
Week 1: Define `CAPOrchestrator` class in `src/lib/cap/orchestrator.ts`
         - Accepts: worldId, userId, messages, zoneHint?
         - Inherits active zone from user session
         - Passes through PolicyRouter with CUBIQO-scoped config
Week 2: Expose `/api/cap/route` endpoint
         - All internal tools/Worlds call this instead of OpenAI directly
Week 3: Migrate Emergent, Social Army to use CAP endpoint
Week 4: Add keyword telemetry pipeline: CAP → session store → Side Panel push
```

**Zero-Retention Contradiction — ⚠️ Spec vs Implementation:**

The spec states: "Zero retention; contextual recommendations only; adaptive within session; no stored profiles."

But the codebase has:
- `/api/memory/route.ts` — stores and retrieves memory from Supabase
- `/api/extract-memories/route.ts` — extracts and persists memories from conversations
- `/api/journey/memories/route.ts` — journey memory with embeddings stored in DB
- `magic-link.ts` email template says "Zero-Retention. Private." as marketing

**This is a fundamental contradiction.** The product's memory system IS its competitive differentiator (conscious memory, journey tracking). The spec's "zero retention" language was likely written for the ROUTING layer (router doesn't store conversation content), not the entire product.

**Resolution needed:** Clarify the spec to say "Zero retention at the routing layer" — the router itself does not store conversation data. The conscious memory system, when enabled by the user, stores memories with explicit consent. Update the privacy policy accordingly.

---

#### FEATURE SET — Status by Feature

| Feature | Spec Requirement | Code Evidence | Status | Gap |
|---|---|---|---|---|
| BYO Mode | Cloud + API keys | `byo-manager.ts`, `/api/byo/`, AES-256 | 🟢 | None |
| Magic-link auth | Passwordless | Supabase + Resend templates | 🟢 | None |
| OAuth / OIDC | Account creation | Supabase OAuth providers | 🟢 | None |
| Passkeys | WebAuthn | 4 WebAuthn routes + UI components | 🟢 | None |
| Email | Send/receive | Resend + channel API | 🟢 | Receive via webhook only |
| Calendar | Read/write events | Channel type exists; no iCal/Google Calendar API | 🟡 | 3–4 weeks to wire Google/Outlook Calendar API |
| Food delivery | Order placement | `action-types.ts` defines platform types; `HandshakeWizard.tsx` shows Uber Eats | 🟡 | No live API calls; needs UberEats/DoorDash developer account |
| Taxi / ride-share | Book rides | `action-types.ts` type only | 🟡 | Uber/Lyft API or browser automation fallback |
| Browser access | Navigate/interact | `BrowserService.ts` Puppeteer, `/api/browser/` | 🟢 | Puppeteer not available on Vercel Edge; needs server |
| Smart-home control | Device control | Integration registry type only | 🔴 | Needs Google Home/HomeKit/MQTT SDK |
| Browser automation (tickets) | Form fill, navigate | BrowserService navigate+click+fillForm | 🟢 | Consent gate wired correctly |
| Intelligent chat/match | RGY capsule matching | Capsule manager + discovery cron + RGY rooms | 🟢 | Proactive matching not user-triggered |
| CQ↔CQ permanent connections | P2P messaging | `cq-to-cq/` module: CQ number, WebSocket, WebRTC | 🟡 | Module exists; not wired to main chat UI |
| Geo-fence for match | Location-aware matching | Referenced in capsule-manager; no UI control | 🟡 | Geo-fence radius picker missing from Side Panel |
| Wallet payments | Crypto + fiat | `wallet-service.ts` with escrow | 🟡 | No Stripe; no crypto payment gateway (MetaMask/Coinbase) |
| QR-based delayed release | Escrow via QR | `wallet-service.ts` — QR code + held/released status | 🟡 | DB migration for `payments` table not found |

---

#### 11.3 Top Priority Gaps to Close Before Launch

| Priority | Gap | Effort | Risk if Skipped |
|---|---|---|---|
| 🔴 P0 | Age gate for RED zone access | 1 week | Legal liability if minors access explicit content |
| 🔴 P0 | Zero-retention spec clarification + privacy policy update | 3 days | Regulatory (GDPR) and trust damage if users believe no data is stored but it is |
| 🔴 P0 | Smart-home: spec lists it as a feature | 3 weeks | False advertising if listed in feature set at launch |
| 🟡 P1 | CAP Orchestrator (routing unification) | 4 weeks | Sub-domains bypass safety guardrails; keyword telemetry broken |
| 🟡 P1 | Audio cues (wake, tick, DND) | 2 weeks | Poor UX; voice mode feels unpolished |
| 🟡 P1 | Vocspad unified input | 2 weeks | Core UX element missing from spec |
| 🟡 P1 | Special Moves 3 missing (Wink, Trust Earned, Handoff) | 1 week | Incomplete product spec delivery |
| 🟡 P1 | CQ↔CQ connection to main chat UI | 2 weeks | CQ number system exists but users can't use it |
| 🟡 P2 | Wallet DB migration + Stripe | 3 weeks | No monetization beyond CubiKey |
| 🟡 P2 | Calendar API (Google/Outlook) | 3 weeks | Email without calendar is half a productivity suite |
| 🟡 P2 | Spoken SettingsCube confirmations | 3 days | Minor UX polish |
| 🟡 P2 | Geo-fence UI in Side Panel | 1 week | RGY match is less accurate without user location |

---

#### 11.4 What Is Actually Production-Ready Against This Spec

Despite the gaps, the following flagship-spec components are **genuinely production-ready**:

1. **Policy Router** — zone detection, 3-backend failover, self-harm safety, language adaptation, founder mode, reasoning path, freedom path, search-all. This is solid.
2. **Color system** — TEAL/RED/YELLOW with per-color voice tones, animation parameters, lock commands. Fully wired.
3. **State machine** — 4-state (idle/listening/thinking/speaking) with event logging.
4. **Cuboid 3D forms** — wireframe and solid variants working; GLB-loaded AICuboidGLB with 5 Special Moves.
5. **STT + TTS pipeline** — Whisper STT, ElevenLabs TTS with voice modulation (Madhyama Marg), OpenAI TTS fallback.
6. **BYO Mode** — complete with AES-256 key encryption, per-model routing, test endpoint.
7. **Auth** — magic link, OAuth/OIDC, WebAuthn/Passkeys — all four auth modes.
8. **Browser automation** — Puppeteer service with consent gate, form fill, navigate, screenshot.
9. **RGY capsule matching** — 4-signal matching (colour → intent → keyword → vector), proactive discovery cron.
10. **Side Panel keywords** — per-color RGY keyword lists with session persistence.

---

#### 11.5 Spec Alignment Summary

```
SPEC COVERAGE: ~63% Complete

Completely built:     12 / 33 requirements   ████████░░░░░░░░░░░░  36%
Partially built:      15 / 33 requirements   ████████████░░░░░░░░  45%
Not built:             6 / 33 requirements   ████░░░░░░░░░░░░░░░░  18%
Spec deviation:        1 / 33 requirements   █░░░░░░░░░░░░░░░░░░░   3%

Launch-blocker gaps: 3 (age gate, zero-retention clarification, smart-home)
Post-launch gaps: 10 (CAP Orchestrator, audio cues, Vocspad, wallet, etc.)

Estimated engineering to reach 100% spec compliance:
  - 2 developers × 8 weeks OR 1 developer × 16 weeks
  - Estimated cost: $24K–$48K if contracted out
```

