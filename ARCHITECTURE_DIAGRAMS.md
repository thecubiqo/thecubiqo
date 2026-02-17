# CUBIQO Architecture Diagrams

**Author:** MO (CTO)  
**Date:** 2025-02-15  
**Purpose:** Visual reference for technical architecture decisions

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUBIQO PLATFORM                              │
│                    Next.js 16 App Router (Monolith)                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
            ▼                      ▼                      ▼
    ┌──────────────┐       ┌──────────────┐     ┌──────────────┐
    │   Frontend   │       │   Backend    │     │   Database   │
    │              │       │              │     │              │
    │ • React 19   │       │ • API Routes │     │ • Supabase   │
    │ • Tailwind   │◄─────►│ • BYO Keys   │◄───►│ • PostgreSQL │
    │ • Three.js   │       │ • AI Router  │     │ • RLS        │
    │ • Voice UI   │       │ • Browser    │     │ • Auth       │
    └──────────────┘       └──────────────┘     └──────────────┘
            │                      │                      │
            └──────────────────────┼──────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌──────────────────┐          ┌──────────────────┐
          │  External APIs   │          │  External Services│
          │                  │          │                   │
          │ • Claude         │          │ • ElevenLabs TTS  │
          │ • OpenAI         │          │ • Vercel Hosting  │
          │ • Google Cal     │          │ • Puppeteer       │
          │ • Uber/Lyft      │          │                   │
          └──────────────────┘          └──────────────────┘
```

---

## Worlds Architecture Pattern

```
┌───────────────────────────────────────────────────────────────────┐
│                     WorldOrchestrator                              │
│  • Routes commands to appropriate World                            │
│  • Manages user consent and authentication                         │
│  • Coordinates multi-world workflows                               │
│  • Aggregates results and handles errors                           │
└───────────────────────────┬───────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬──────────────┐
        │                   │                   │              │
        ▼                   ▼                   ▼              ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐  ┌────────┐
│  TaxiWorld   │    │CalendarWorld │    │  FoodWorld   │  │ Future │
│              │    │              │    │              │  │ Worlds │
│ • Uber       │    │ • Google Cal │    │ • DoorDash   │  │        │
│ • Lyft       │    │ • Outlook    │    │ • UberEats   │  │ • Wallet│
│              │    │              │    │              │  │ • SmartHome│
└──────────────┘    └──────────────┘    └──────────────┘  └────────┘
        │                   │                   │              │
        ▼                   ▼                   ▼              ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐  ┌────────┐
│UberService   │    │GoogleCalSvc  │    │DoorDashSvc   │  │  ...   │
│LyftService   │    │OutlookSvc    │    │UberEatsSvc   │  │        │
└──────────────┘    └──────────────┘    └──────────────┘  └────────┘
```

**World Interface:**
```typescript
interface World {
  name: string;
  initialize(): Promise<void>;
  executeCommand(command: WorldCommand): Promise<WorldResult>;
  canHandle(command: WorldCommand): boolean;
  getSupportedCommands(): CommandInfo[];
  requiresAuth(): boolean;
  getStatus(): WorldStatus;
  cleanup(): Promise<void>;
}
```

---

## Voice Command Flow

```
User speaks: "Book me an Uber to the airport"
        │
        ▼
┌────────────────────────────────────────────┐
│  Voice Recognition (Browser SpeechAPI)     │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  Command Parser                            │
│  • Extract intent: "book_taxi"            │
│  • Extract entities: destination="airport" │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  WorldOrchestrator                         │
│  • Find World: TaxiWorld.canHandle() ✓    │
│  • Check auth: User logged in ✓           │
│  • Check feature flag: enabled ✓          │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  TaxiWorld.executeCommand()                │
│  • UberService.getEstimate()              │
│  • Return result with consent required     │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  ConsentManager                            │
│  • Show: "Book UberX for $25? ETA: 5 min" │
│  • User approves ✓                         │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  UberService.bookRide()                    │
│  • Browser automation opens Uber           │
│  • Fill pickup/destination                 │
│  • Select ride type                        │
│  • Click "Request Ride"                    │
│  • Audit log all actions                   │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  WorldResult                               │
│  • Success: true                           │
│  • Data: { rideId, driver, eta }          │
│  • Actions: [logged to database]          │
└────────────────┬───────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  Voice Response (ElevenLabs TTS)           │
│  "I've booked your Uber. Driver arriving   │
│   in 5 minutes."                           │
└────────────────────────────────────────────┘
```

---

## Browser Automation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Automation Layer                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│BrowserQueue  │    │ BrowserPool  │    │ConsentManager│
│              │    │              │    │              │
│• Max 5       │    │• Reuse       │    │• Request     │
│  concurrent  │───►│  instances   │───►│  approval    │
│• Priority    │    │• Timeout     │    │• Remember    │
│  queue       │    │  5 min       │    │  choices     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ BrowserService   │
                    │                  │
                    │ • Puppeteer      │
                    │ • Actions        │
                    │ • Screenshots    │
                    │ • Audit logs     │
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Uber.com   │    │DoorDash.com  │    │  Google.com  │
│              │    │              │    │              │
│• Book rides  │    │• Order food  │    │• Calendar    │
│• Check status│    │• Browse menus│    │• Events      │
└──────────────┘    └──────────────┘    └──────────────┘
```

**Browser Session Lifecycle:**
```
1. User requests action → Session created (PENDING)
2. ConsentManager requests approval
3. User approves → Session becomes ACTIVE
4. BrowserService executes actions
5. Actions logged to audit table
6. Session completes (COMPLETED) or fails (FAILED)
7. Browser instance returned to pool or closed
```

---

## BYO (Bring Your Own) API Keys Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      User Enables BYO                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  BYO Settings UI                                             │
│  • User enters Claude API key: sk-ant-xxx                   │
│  • User enters OpenAI API key: sk-xxx                       │
│  • User clicks "Save Keys"                                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Encryption (Web Crypto API)                                 │
│  • User prompted for passphrase or uses biometric           │
│  • Keys encrypted with AES-256-GCM                          │
│  • Encrypted keys stored in localStorage                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  localStorage                                                │
│  {                                                           │
│    "cubiqo_byo_config": {                                   │
│      "enabled": true,                                       │
│      "claudeApiKey": "encrypted_blob_1",                    │
│      "openaiApiKey": "encrypted_blob_2"                     │
│    }                                                         │
│  }                                                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  User sends msg  │              │  Server detects  │
│                  │              │  BYO enabled     │
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         ▼                                 ▼
┌────────────────────────────────────────────────────┐
│  AI Router                                          │
│  • Check BYO config                                │
│  • If BYO enabled: use user's keys                 │
│  • If BYO disabled: use server keys                │
│  • Route to appropriate provider (Claude/OpenAI)   │
└────────────────────────┬───────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│  API Request                                        │
│  • Headers: { 'x-api-key': <user_key_or_server> } │
│  • Body: { messages: [...] }                       │
│  • Response: { content: "AI response" }            │
└────────────────────────────────────────────────────┘
```

**Security Benefits:**
- Keys encrypted at rest (not plain text)
- Keys never sent to server (client-side only)
- User has full control (can clear keys anytime)
- Biometric auth option (WebAuthn)

---

## Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  Developer                                                   │
│  • Works on feature branch: copilot/implement-cubiqo-features│
│  • Commits code, pushes to GitHub                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Pull Request                                         │
│  • Create PR to main                                        │
│  • CI runs: tests, linting, type-checking                  │
│  • MO reviews code                                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel Preview Deployment (Automatic)                       │
│  • Unique preview URL: pr-123.cubiqo.vercel.app            │
│  • Environment: staging                                     │
│  • Feature flags: enabled for testing                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  QA Testing (Buttercup)                                      │
│  • Run E2E tests on preview URL                             │
│  • Manual testing of new features                           │
│  • Approve or request changes                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  MO Approval                                                 │
│  • Final code review                                        │
│  • Approve PR                                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Merge to Main                                               │
│  • PR merged                                                │
│  • Main branch is always deployable                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel Production Deployment (Manual)                       │
│  • Deploy to production: cubiqo.com                         │
│  • Environment: production                                  │
│  • Feature flags: disabled by default                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Feature Flag Rollout                                        │
│  • Enable for 5% of users                                   │
│  • Monitor metrics (errors, performance)                    │
│  • Gradually increase: 5% → 25% → 50% → 100%               │
│  • If issues: disable flag instantly                        │
└─────────────────────────────────────────────────────────────┘
```

**Rollback Strategy:**
- Disable feature flag (instant)
- Revert deployment (5 min)
- Rollback database migration (if needed)

---

## Database Schema (Sprint 1)

```sql
-- Browser Sessions
browser_sessions
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── url (TEXT)
├── purpose (TEXT)
├── status (TEXT) -- 'pending', 'active', 'completed', 'failed'
├── consent_given (BOOLEAN)
├── consent_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
├── completed_at (TIMESTAMPTZ)
└── metadata (JSONB)

-- Browser Actions Audit Log
browser_actions
├── id (UUID, PK)
├── session_id (UUID, FK → browser_sessions)
├── user_id (UUID, FK → auth.users)
├── action_type (TEXT) -- 'navigate', 'click', 'type', etc.
├── target (TEXT) -- URL or selector
├── result (TEXT)
├── success (BOOLEAN)
├── error (TEXT)
├── screenshot_url (TEXT)
├── created_at (TIMESTAMPTZ)
└── metadata (JSONB)

-- Consent Records
browser_consent_records
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── session_id (UUID, FK → browser_sessions)
├── domain (TEXT)
├── action_description (TEXT)
├── approved (BOOLEAN)
├── reason (TEXT)
├── remember_choice (BOOLEAN)
└── created_at (TIMESTAMPTZ)
```

**RLS Policies:**
- Users can only see their own sessions/actions/consents
- Admin can see all (via service role key)
- No public access

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Authentication (Supabase Auth)                     │
│  • Magic link email                                         │
│  • Session management                                       │
│  • JWT tokens                                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Authorization (RLS Policies)                       │
│  • Row-level security on all tables                         │
│  • Users can only access their own data                     │
│  • Admin access via service role key                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Input Validation                                   │
│  • Sanitize all user inputs                                 │
│  • Validate command parameters                              │
│  • Prevent XSS, SQL injection                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Rate Limiting                                      │
│  • 100 requests/hour per user (API calls)                   │
│  • 10 browser sessions/hour per user                        │
│  • Prevent abuse and DoS                                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Audit Logging                                      │
│  • Log all browser actions                                  │
│  • Log all consent decisions                                │
│  • Compliance and forensics                                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 6: Consent Management                                 │
│  • Explicit user approval for sensitive actions             │
│  • Screenshot preview before execution                      │
│  • Remember choices (optional)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Flag System

```
┌─────────────────────────────────────────────────────────────┐
│  Admin UI (/admin/feature-flags)                             │
│  • Create/update/delete feature flags                       │
│  • Toggle enabled/disabled                                  │
│  • Set rollout percentage (0-100%)                          │
│  • Target specific users/sites                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Database (feature_flags table)                     │
│  • id, name, enabled, scope, target_id, config, ...        │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  Client Hook     │              │  Server Check    │
│  useFeatureFlag  │              │  checkFeatureFlag│
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         └─────────────────┬───────────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │  Feature Enabled? │
                 │  • Yes: Show      │
                 │  • No: Hide       │
                 └──────────────────┘
```

**Sprint 1 Feature Flags:**
- `byo_mode_v2` - BYO API keys
- `voice_state_machine_ui` - Voice state indicators
- `browser_relay_setup` - Browser automation

**Rollout Strategy:**
1. Deploy with flag disabled
2. Enable for 5% of users (monitor 24h)
3. If stable, increase to 25% (monitor 48h)
4. If stable, increase to 50% (monitor 48h)
5. If stable, increase to 100% (monitor 1 week)
6. If 100% stable, remove flag from code

---

## Team Communication Flow

```
           ┌─────────────────────────┐
           │    MO (CTO)             │
           │  • Code reviews         │
           │  • Architecture         │
           │  • Unblock team         │
           └────────┬────────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Blossom  │  │ Bubbles  │  │   Guy    │
│ Backend  │  │ Frontend │  │   DBA    │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
┌──────────┐            ┌──────────┐
│Buttercup │            │ Pushpa   │
│   QA     │            │  UI/UX   │
└──────────┘            └──────────┘
      │                         │
      └────────────┬────────────┘
                   │
                   ▼
           ┌─────────────┐
           │      Jo     │
           │ Product Owner│
           └─────────────┘
```

**Daily Standup (10 AM, 15 min):**
- What I did yesterday
- What I'm doing today
- Any blockers?

**PR Reviews:**
- Developer → MO
- MO reviews within 4 hours
- Feedback or approval
- Developer addresses feedback
- MO merges when ready

**Coordination:**
- Blossom ↔ Bubbles: API contracts
- Bubbles ↔ Pushpa: UI designs
- Guy ↔ Blossom: Database schema
- Buttercup: Tests everyone's code

---

**Maintained by:** MO (CTO)  
**Last Updated:** 2025-02-15  
**Status:** Living Document (update as architecture evolves)
