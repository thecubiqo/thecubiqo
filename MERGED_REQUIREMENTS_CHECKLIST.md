# 🚀 CUBIQO: Unified Development & Product Checklist (MO + Antigravity)

*This report merges MO's pragmatic audits (including the February 22 "Simple Text" Executive Summary) with Antigravity’s visionary Flagship UI/UX specifications into a single, comprehensive Master Checklist.*

**🔥 Strategic Verdict:** **LAUNCH MVP NOW.** The core works. Launch with the current 40% specs, charge immediately ($29-$99/mo), and use the revenue to fund the remaining architecture over the next 9-13 months.

---

## 🟥 P0: CRITICAL LAUNCH BLOCKERS (Legal, Security, Revenue)
*Do not launch without these. Fix these in Week 1-2 to begin collecting revenue safely.*

### Security & Legal
- [ ] **TFR-002: Terms of Service & Privacy Policy:** Deploy `/terms` and `/privacy` live routes. Add consent checkbox to the signup flow.
- [ ] **TFR-003: Age Gate for RED Zone:** Require 18+ DOB verification before allowing access to explicit/uncensored local models.
- [ ] **TFR-004: Zero-Retention Correction:** Update email copy and marketing to accurately reflect that memories are stored in Supabase with consent (provide a GDPR data deletion endpoint).
- [ ] **TFR-005: Smart-Home Removal:** Remove Smart-Home claims from the UI/Landing pages until implemented.
- [ ] **AG-SEC-1: Remove Hardcoded PINs:** Delete `rescue/page.tsx` and hardcoded `founderspass` bypasses. Replace entirely with Next-Auth/Supabase JWT role validation.
- [ ] **TFR-013 & AG-SEC-2: Social Army Human Review Gate:** Stop `poster.ts` from auto-posting. Require a human approval click to prevent immediate platform bans.

### Revenue Operations
- [ ] **TFR-001: Stripe Billing Integration:** Install `@stripe/stripe-js`, build checkout routes, and set up the `user_subscriptions` DB webhook. Block Pro features for free users.
- [ ] **AG-REV-1: Team & Enterprise Tiers:** Implement the $99/mo (Team) and $299/mo (Enterprise) subscription tiers in Stripe as mandated by the monetization strategy.

### UX Core
- [ ] **AG-UX-1: Mobile Optimization Polish:** Fix responsive design layouts for mobile devices pre-launch (highlighted as a critical gap in the Feb 22 audit).

---

## 🟧 P1: CORE FLAGSHIP CAPABILITIES (Month 1 - 3)
*These features transition the app from a "prototype" to the true CubiQo Flagship OS.*

### AI Orchestration & UI Syncing
- [ ] **TFR-006: CAP Orchestrator Checkout:** All internal sub-domains (Job Hunt, Social Army, Emergent) route through a unified Policy Gateway, inheriting the RGY zone.
- [ ] **AG-UI-1: UI ↔ Audio Analyser Syncing:** Connect Web Audio API’s `AnalyserNode` to the 3D Cuboid in React Three Fiber to pulse to TTS amplitude.
- [ ] **TFR-007 + AG-UI-2: Voice Personas & Audio Cues:** Implement distinct voice mappings (Teal, Red, Yellow) and micro-interactions (Wake chime, ticks, haptics).
- [ ] **AG-ROUTING-1: Direct Overrides & Self-Harm Intercept:** Intercept self-harm intent before routing to force `YELLOW` (empathy) mode and offer crisis resources. Allow direct-model overrides (`gpt|claude|local`).
- [ ] **TFR-009: Missing Special Moves:** Add 3 missing 3D animations: *Wink*, *Trust Earned*, and *Handoff*.

### UX & Retention
- [ ] **TFR-008: Vocspad Unified Input:** Merge voice and text into a single cohesive input surface with live Whisper STT transcription.
- [ ] **TFR-014: 5-Branch Onboarding Flow:** Create an intentional onboarding sequence with persistence (sync LocalStorage with DB).
- [ ] **TFR-011: Spending Caps Persistence:** Migrate the in-memory spending limits to Supabase to prevent reset on deploy.
- [ ] **TFR-012: Analytics Funnel Dashboard:** Expand to a 15-event funnel via PostHog to understand churn and measure against the A/B pivot metrics (e.g., Activation > 20%, NPS > 10).
- [ ] **TFR-010: CQ↔CQ UI Wiring:** Expose CQ numbering system in profiles and enable direct WebRTC WebSockets chat for matched peers.

---

## 🟨 P2: SYSTEM MATURITY & GROWTH (Month 4 - 6)
*Features that build the moat and expand commerce capabilities. Target: $5K - $10K MRR.*

### Connections & Advanced UI
- [ ] **TFR-015: Calendar Connections:** Integrate Google Calendar and Outlook API OAuth scopes.
- [ ] **TFR-016 & AG-COMMERCE-1: Wallet & Escrow Payments:** Set up the `wallet_accounts` DB schema and QR-based delayed-release crypto escrow system.
- [ ] **TFR-019 & AG-UI-3: SettingsCube Voice Validation:** Allow users to say "Lock to Teal mode" and receive a spoken TTS confirmation.
- [ ] **TFR-018: Geofence Radius UI:** Expose the RGY matching distance parameters (e.g., "50km radius") directly to the user panel.
- [ ] **AG-AUTH-1: Passkeys Integration:** Add WebAuthn FaceID/TouchID directly to the Auth module.
- [ ] **TFR-017: Referral Programme:** Generate tracking codes to give users "$10 off / 1 free month" incentives to drive viral growth.
- [ ] **AG-CODE-1: Emergent Professional Tools:** Add integrated debugging, testing framework generation, and deployment pipelines.
- [ ] **TFR-020: Fabric Cuboid Material:** Build the "soft-touch" warm textile 3D variant.

---

## 🟦 P3: THE VISIONARY ROADMAP (Year 2 / Enterprise)
*Massive tech swings outlined in Antigravity's blueprints.*

### Offline, Scale & Super-App
- [ ] **AG-OFFLINE-1: True BYO App Engine:** Migrate Next.js into an Electron or Tauri desktop wrapper.
- [ ] **AG-OFFLINE-2: Local LLM Processing:** Embed `llama.cpp` node-bindings for local GPU execution without cloud APIs.
- [ ] **AG-OFFLINE-3: Semantic Drive Indexing:** Connect ChromaDB/SQLite vector store to index the user's hard drive files.
- [ ] **AG-ARCH-1: Continuous Worker Migration:** Move headless browser automations (Puppeteer) into a continuous Docker container on Render/Railway.
- [ ] **AG-WECHAT-1: Mini-Programs & API Marketplace:** Allow third-party integrations and e-commerce capabilities via CubiKey.
