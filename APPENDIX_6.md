# APPENDIX 6: EXHAUSTIVE REQUIREMENTS BLUEPRINT (MISSING & INCOMPLETE FEATURES)

This document is the definitive technical blueprint mapping the gaps between the currently deployed Vercel/Supabase architecture and the target "CUBIQO — Flagship" architectural specification. It details the requirements across Frontend, Backend, Database, and API Integrations for every missing or partially complete feature.

---

## 1. The "SettingsCube" & Voice Configuration
**Status:** Missing (Concept-only)
**Description:** Users must be able to speak to the app to configure lock settings (color/voice lock, geofence, connectors), confirmed via live event-only logs.

*   **Frontend (React/Three.js):**
    *   **UI:** A dedicated 3D visual geometry for the SettingsCube (distinct from the primary cuboid). 
    *   **State:** Context implementation to handle voice-commanded changes in real-time.
*   **Backend (Next.js/Edge):**
    *   **API:** A dedicated intent-parser route (e.g., `/api/voice-config`) mapping transcribed speech to config actions.
*   **Database (Supabase):**
    *   **Schema Update:** User JSONB `preferences` column augmented to store: `color_lock: string | null`, `geo_fenced: boolean`.
*   **API Integrations:** Webhook verification for real-time transcription from STT.

---

## 2. Voice Persona Matrix & Audio Cues
**Status:** Missing (Only generic TTS exists without granular sound design)
**Description:** TTS must dynamically swap voices based on the RGY operational signal (Teal = Professional, Red = Discreet, Yellow = Friendly). Must output micro-audio cues (Wake, Speak start/stop alignment, Error) and support haptics.

*   **Frontend:**
    *   Web Audio API context manager to load specific `<audio>` voices based on `currentMode`.
    *   Implement Sound Design layers: Wake (brief chime), Speak start/stop (soft ticks synced to TTS), Error/Alert (single neutral tick).
    *   Haptics API integration for mobile wrappers.
*   **Backend:**
    *   `/api/chat/route.ts` must pass down a `metadata.voice_preset` flag depending on intent.
*   **API Integrations (ElevenLabs):** Map specific `voice_id` keys to the three modes. Optimize for <200ms latency.

---

## 3. UI ↔ Audio Syncing & "Special Moves"
**Status:** Half-Way (3D model exists, but visual syncing and transitions are disconnected)
**Description:** 3D Cuboid must strictly map to the exact state machine: Listening (Outline) → Thinking (Solid/Pulse) → Speaking (Audio-reactive) → Idle. It requires Special Moves (Resonance, Wink, Deep Focus).

*   **Frontend:**
    *   Connect Web Audio API’s `AnalyserNode` to React Three Fiber (`useFrame`). The audio buffer amplitude must drive the glow/morph logic smoothly.
    *   **Animations:** Author specific Three.js animation interpolations for "Resonance", "Breakthrough", "Trust Earned", "Co-Presence", "Wink" (restricted to Yellow setting), and "Deep Focus".
    *   Enforce <= 200ms token swap, and 150–300ms glow-in/out transitions, respecting CSS `prefers-reduced-motion`.

---

## 4. Universal Connectors (Email, Food, Smart Home, Browser Automation)
**Status:** Missing (Only stub UI exists)
**Description:** CubiQo must interact with the DOM of external sites, send emails, order food, and control smart environments.

*   **Frontend:** Generic "Connector Action Card" component to confirm critical path actions (e.g., "Confirm $14.50 Uber?").
*   **Backend:**
    *   Heavy reliance on Vercel AI SDK Core `tools` configuration to expose external functions to the LLM.
    *   **Worker:** The headless browser web-scraper (Puppeteer) cannot run securely within Vercel edge functions. It requires a continuous Docker worker (e.g., Railway/Render) executing Playwright scripts.
*   **API Integrations:** Google Workspace API (Email/Calendar), Uber/Lyft APIs (Taxi), IoT protocols (Smart Home), Playwright (DOM manipulation).

---

## 5. RGY Routing logic, Direct Override, & Self-Harm Guards
**Status:** Half-Way (Basic router exists, lacks rigorous scoring and strict guardrails)
**Description:** Router must detect intent, score models (reasoning vs code), and auto-failover. Must support Direct Override (forcing a specific model) and strict keyword interception (Self-harm forces Yellow).

*   **Backend:**
    *   **Scoring Engine:** Upgrade fallback array to a true scoring logic.
    *   **Direct Mode (Override):** Accept explicit overrides (`gpt|claude|local`) overriding automated routing.
    *   **Guardrails:** NLP interceptor running before router: if self-harm intent detected -> force `metadata.color = 'YELLOW'`, restrict functional tools, force empathy-response chain.
*   **Database:** Ensure zero-retention on chat queries (contextual recommendations only), ensuring strict session-scoping for keywords.

---

## 6. Auth Advancement: Passkeys
**Status:** Half-Way (Account creation & Magic Link exists, Passkeys missing)
*   **Frontend/Backend:** Integrate WebAuthn standards (Passkeys) using the Supabase Auth or NextAuth adaptors to allow FaceID/TouchID bypassing passwords completely.

---

## 7. Wallet / QR Crypto Payments
**Status:** Missing
**Description:** Wallet/crypto payments including QR-based delayed release functionality.
*   **Frontend:** Secure Wallet Connect UI and QR Code generation component.
*   **Backend/API Integrations:** Blockchain RPC providers (e.g., Alchemy or Infura) or a specific Layer 2 API to handle holding funds and generating delayed-release (Escrow-style) smart contract protocols readable via QR code.

---

## 8. Proactive AI & Offline Engine (True BYO)
**Status:** Missing
**Description:** Local deployment option severing reliance on cloud, indexing user documents locally.
*   **Frontend/Backend Stack:** Package Next.js UI into an **Electron** or **Tauri** desktop wrapper.
*   **Database:** Integrate completely localized SQLite and ChromaDB (for offline semantic search) running directly on the user's hard drive without external database pings.
*   **API Integrations:** Bundle `llama.cpp` node-bindings to execute downloaded `.gguf` quantized models directly using the user's local CPU/GPU limitlessly.
