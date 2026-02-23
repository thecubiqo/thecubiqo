# APPENDIX 3: FLAGSHIP ARCHITECTURE GAP ANALYSIS (EXISTING VS. PENDING)

Based on the official "CUBIQO — Flagship" architectural documentation provided, here is a definitive, line-by-line audit of what is currently functional in the codebase vs. what remains to be built or refactored.

## 1. PURPOSE & CORE ORCHESTRATION
**Requirement:** Primary voice/text assistant orchestrating worlds/tools. Runs routing, guardrails, outputs; exposes Side Panel (keywords) and SettingsCube.
*   **Exists:** 
    *   Text assistant is fully functional. 
    *   Side Panel (Keywords) UI exists.
*   **Gap (Pending):** 
    *   The "SettingsCube" voice admin interface is not implemented.
    *   Orchestration of external "Worlds" is stubbed; currently, it functions as a single central chat.

## 2. COLOR / VOICE SEMANTICS (UI-Level Only)
**Requirement:** Color/voice are strictly operational signals (UI-only), not backend routing determinants. TEAL (Goal-oriented/Professional), RED (Age-gated/Explicit but goal-oriented), YELLOW (Casual/Time-killing/Friendly). Self-harm forces YELLOW support.
*   **Exists:** 
    *   The UI effectively changes colors based on user keywords (RGY system is visually present).
*   **Gap (Pending):** 
    *   **Semantic Mismatch:** The current codebase defines Red as "Urgent/Action" and Green as "Creative". The new spec requires **TEAL** (Goal), **RED** (Age-gated/Explicit), and **YELLOW** (Casual). The intent mapping needs a rewrite to match this new paradigm.
    *   **Age-Gating & Self-Harm Guards:** There is currently no age-check wall for RED, and no intercept logic that forces self-harm intents specifically to YELLOW.
    *   **Voice Personas:** TTS uses one generic voice. We need to map discrete ElevenLabs/OpenAI voices to Teal (Professional), Red (Discreet/Low-volume), and Yellow (Friendly/Sarcastic).

## 3. INPUT / OUTPUT & STATE MACHINE
**Requirement:** Speech/Vocspad input. Output synced with synthesized speech. State machine: Listening → Thinking → Speaking → Idle.
*   **Exists:** 
    *   Vocspad (text input) works. 
*   **Gap (Pending):** 
    *   Real-time speech-to-text (Listening) and text-to-speech (Speaking) exist in UI components but lack the robust State Machine synchronization (visuals reacting perfectly to the exact word being spoken). 

## 4. UI / UX (ISOMETRIC CUBOID & EFFECTS)
**Requirement:** Outline-only cuboid vs Solid cuboid. Hybrid material mapping (≤50% color visible). Swift transition tokens (≤200ms). Audio cues (Wake, Speak start/stop, Error). Special Moves (Resonance, Wink, Deep Focus).
*   **Exists:** 
    *   The 3D Cuboid itself exists (implemented via Three.js/React Three Fiber in the landing page). 
*   **Gap (Pending):** 
    *   The specific isometric wireframe vs. solid toggle is not fully mapped to these exact design constraints. 
    *   **Audio Cues & Special Moves:** None of the micro-interaction audio cues (soft ticks, chimes) or the "Special Moves" (Wink, Handoff) are programmed into the UI layer yet.

## 5. SIDE PANEL & SETTINGS
**Requirement:** Visible keyword lists. User can lock to one color/voice (UI-only). Geo-fencing support. SettingsCube updates via voice.
*   **Exists:** 
    *   Side Panel exists visually.
*   **Gap (Pending):** 
    *   "Locking" a color/voice state is not persisted in the database.
    *   Geo-fencing logic is completely unwritten.
    *   Voice-commanded settings updates ("SettingsCube") do not exist.

## 6. RGY ROUTER (BACKENDS & GATEWAY)
**Requirement:** Detect intent → score models → choose backend (GPT, Claude, Local). Auto-failover. RGY is UI/Telemetry only; it does NOT select models directly. 
*   **Exists:** 
    *   **Auto-Failover:** The backend fallback chain (`/api/chat/route.ts`) is highly functional (MiniMax → Mixtral → Llama → Claude → OpenAI).
*   **Gap (Pending):** 
    *   The system currently relies on a sequential fallback chain rather than dynamic scoring based on intent (e.g., routing immediately to Claude for code based on intent scoring). 
    *   Strict enforcement that RGY is *UI-only* and doesn't pollute the backend context needs review. 

## 7. FEATURE SET (CONNECTORS & PAYMENTS)
**Requirement:** BYO Mode, Auth, Email/Calendar, Food/Taxi, Smart-home, Browser automation, Chat-match (Geo-fence), Wallet/Crypto payments.
*   **Exists:** 
    *   **Auth:** Account creation & passwordless magic-link are fully working.
    *   **BYO Mode:** UI exists for users to input custom keys.
*   **Gap (Pending):** 
    *   **Connectors:** Email, Calendar, Food delivery, Taxi, and Smart-home APIs are entirely stubbed/missing.
    *   **Browser automation:** Puppeteer POC exists, but not wired for user proxying (booking tickets).
    *   **Wallet/Crypto:** No delayed-release crypto wallet or QR implementation exists in the repo.
    *   **Geo-fenced Chat-match:** Requires location services and vector matching against other users' CQ profiles, which is currently unbuilt.

### VERDICT ON APPENDIX 3:
The foundational "chassis" (Auth, LLM Fallback Chain, Next.js architecture, 3D Canvas) is built. However, the specific **Integrations** (Food, Crypto, Smart Home) and the **Strict RGY Redefinition** (Teal/Red/Yellow voice mappings and age-gates) require a dedicated "Phase 2" development sprint.
