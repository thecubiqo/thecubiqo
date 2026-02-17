# CUBIQO Flagship Features - Technical Architecture Review
**MO - Tech Architect / CTO**  
**Date:** 2025-02-15  
**Status:** Strategic Planning Phase

---

## Executive Summary

After conducting a comprehensive technical review of the CUBIQO codebase and Jo's product roadmap, I'm providing this technical strategy document. This covers architecture decisions, implementation priorities, security concerns, and team assignments for the 4-sprint flagship features rollout.

**Bottom Line:** Jo's roadmap is technically feasible with some adjustments. We have solid foundations (BYO partially implemented, browser automation core ready, voice state machine functional), but need architectural clarity on integration orchestration, security hardening, and deployment strategy.

---

## 1. ARCHITECTURE DECISIONS

### 1.1 Branching Strategy

**DECISION: Use Feature Branch → PR → Main → Staging → Production**

**Rationale:**
- Current branch `copilot/implement-cubiqo-features` is appropriate for initial development
- We do NOT need a separate `staging` branch - we'll use Vercel preview deployments
- Main branch should be stable and deployable at all times
- Production deployments happen via tags

**Git Workflow:**
```
copilot/implement-cubiqo-features (current development)
    ↓ PR + Code Review (MO approval)
main (stable, always deployable)
    ↓ Vercel Preview Deployment (automatic)
Staging (Vercel preview URL)
    ↓ Manual promotion after QA
Production (Vercel production deployment)
    ↓ Tagged release (v2.0.0, v2.1.0, etc.)
```

**Branch Rules:**
- `main` - Protected, requires PR approval from MO
- Feature branches - Open development, frequent commits
- No direct pushes to `main` - all changes via PR
- Buttercup (QA) tests preview deployments before merge
- MO reviews and merges all PRs

### 1.2 Deployment Strategy

**DECISION: Feature Flags + Vercel Preview Deployments**

**Why:**
- We already have robust feature flags system (see `FEATURE_FLAGS.md`)
- Vercel automatically creates preview URLs for PRs
- No need for separate staging infrastructure
- Can test features in production with flags disabled

**Deployment Flow:**
1. **Development**: Feature branch + local testing
2. **Preview**: PR triggers Vercel preview deployment
3. **QA**: Buttercup tests preview URL
4. **Staging**: Merge to main → preview deployment with feature flags enabled
5. **Production**: Enable feature flags gradually (5% → 25% → 50% → 100%)

**Feature Flag Strategy:**
```typescript
// Sprint 1 flags
- 'byo_mode_v2'              // BYO API keys settings
- 'voice_state_machine_ui'   // Voice UI indicators
- 'browser_relay_setup'      // Browser automation setup

// Sprint 2 flags
- 'uber_taxi_automation'     // Taxi booking automation
- 'calendar_integration'     // Google Calendar integration

// Sprint 3 flags
- 'food_ordering'            // Food delivery automation
- 'match_algorithm'          // Founder matching

// Sprint 4+ flags
- 'wallet_crypto'            // Crypto wallet integration
- 'smart_home'               // Smart home controls
```

### 1.3 System Architecture - Integration Orchestration

**DECISION: Monolithic Next.js with Modular "Worlds" Pattern**

**Why NOT Microservices:**
- Team size (5 developers) doesn't justify microservices complexity
- Next.js API routes provide clear boundaries
- Shared database (Supabase) simplifies data access
- Vercel deployment optimized for monoliths
- Faster iteration velocity

**Why "Worlds" Pattern:**
- Clear separation of concerns
- Each "world" is a self-contained module (taxi, food, calendar, etc.)
- Easy to add new worlds without affecting existing ones
- Testable in isolation

**Worlds Architecture:**
```typescript
// src/lib/worlds/
worlds/
  ├── core/
  │   ├── WorldOrchestrator.ts     // Coordinates all worlds
  │   ├── WorldRegistry.ts         // Registers available worlds
  │   └── types.ts                 // Shared types
  ├── taxi/
  │   ├── TaxiWorld.ts             // Uber/Lyft integration
  │   ├── services/
  │   │   ├── UberService.ts
  │   │   └── LyftService.ts
  │   └── types.ts
  ├── food/
  │   ├── FoodWorld.ts             // DoorDash/UberEats integration
  │   └── services/
  ├── calendar/
  │   ├── CalendarWorld.ts         // Google Calendar integration
  │   └── services/
  ├── smart-home/
  │   ├── SmartHomeWorld.ts        // Smart home controls
  │   └── services/
  └── wallet/
      ├── WalletWorld.ts           // Crypto wallet integration
      └── services/

// Each World implements common interface:
interface World {
  name: string;
  initialize(): Promise<void>;
  executeCommand(command: WorldCommand): Promise<WorldResult>;
  getStatus(): WorldStatus;
  requiresAuth(): boolean;
  getSupportedCommands(): WorldCommand[];
}
```

**WorldOrchestrator:**
- Routes voice commands to appropriate world
- Manages authentication and consent
- Coordinates multi-world workflows (e.g., "Order food and book taxi")
- Handles errors and retries

### 1.4 Browser Automation Relay

**DECISION: In-Process Puppeteer with Queue System**

**Why NOT Separate Service:**
- Current implementation (`src/lib/browser/`) is solid
- Puppeteer runs well on Vercel (with adjustments)
- In-process = simpler debugging, no network overhead
- Queue system prevents resource exhaustion

**Architecture:**
```typescript
// src/lib/browser/
browser/
  ├── BrowserService.ts          // Existing - good foundation
  ├── BrowserQueue.ts            // NEW - queue management
  ├── BrowserPool.ts             // NEW - connection pooling
  ├── consent-manager.ts         // NEW - user consent flow
  └── command-parser.ts          // Existing - voice to actions

// API endpoint
app/api/browser/
  ├── route.ts                   // Main browser API
  ├── queue/route.ts             // Queue status
  └── consent/route.ts           // Consent flow
```

**Consent Flow:**
```
User: "Book me an Uber to airport"
    ↓
Voice Command Parser
    ↓
Browser Automation Request
    ↓
Consent Manager: "I need to open Uber and book a ride. Allow?"
    ↓ User approves
Browser Service executes
    ↓
Result returned to user
```

**Security:**
- User must explicitly approve each browser session
- No automatic form submission without consent
- Screenshot confirmation before sensitive actions
- Rate limiting per user (10 automation sessions/hour)
- Audit logging of all browser actions

---

## 2. IMPLEMENTATION PRIORITIES - TECHNICAL ASSESSMENT

### Sprint 1: BYO Mode, Voice State Machine UI, Browser Relay Setup (P0 - This Week)

**Technical Feasibility: ✅ HIGH**

**Existing Foundations:**
- ✅ BYO Settings UI exists (`src/components/byo/BYOSettings.tsx`)
- ✅ BYO types and storage (`src/lib/byo/types.ts`)
- ✅ Voice state machine in FullscreenApp (`idle → listening → thinking → speaking`)
- ✅ Browser service core (`src/lib/browser/browser-service.ts`)
- ✅ Puppeteer dependency installed

**What's Missing:**
- ❌ BYO integration with AI router (currently uses server keys)
- ❌ Voice state UI indicators (no visual feedback for states)
- ❌ Browser queue and pooling
- ❌ Browser consent manager
- ❌ Browser API endpoints

**Technical Blockers: NONE**

**Recommended Changes to Jo's Plan:**
- **Accept** - All three features are achievable this week
- **Add** - BYO API key encryption (security requirement)
- **Add** - Voice state persistence (UX improvement)

**Team Assignment:**
- **Blossom (Backend)**: 
  - Integrate BYO keys with AI router
  - Build browser queue and pool system
  - Create browser API endpoints
  - Implement consent manager
- **Bubbles (Frontend)**:
  - Voice state UI indicators (pulsing, color changes)
  - Browser consent dialog UI
  - BYO settings improvements (test connection, key validation)
- **Guy (DBA)**:
  - Schema for browser session audit logs
  - Schema for browser consent records
  - RLS policies for user isolation
- **Pushpa (UI/UX)**:
  - Voice state animations (idle/listening/thinking/speaking)
  - Consent dialog design
  - BYO settings polish

**Estimated Effort:**
- BYO Mode completion: 2 days (Blossom + Bubbles)
- Voice State Machine UI: 1 day (Bubbles + Pushpa)
- Browser Relay Setup: 3 days (Blossom + Guy)
- **Total: 6 days** (fits in 1 week with parallel work)

**Definition of Done:**
- [ ] User can add BYO keys and they're used for AI requests
- [ ] Voice states show clear visual feedback (cube color, animations)
- [ ] Browser automation requires explicit user consent
- [ ] Browser sessions are queued and pooled
- [ ] All browser actions are audit logged
- [ ] Tests pass (unit + integration)

---

### Sprint 2: Uber/Taxi Automation, Calendar Integration (P1 - Next Week)

**Technical Feasibility: ✅ HIGH (with caveats)**

**Existing Foundations:**
- ✅ Uber service stub (`src/lib/verbal-commands/uber-service.ts`)
- ✅ Browser automation core
- ✅ Gmail OAuth exists (can extend to Calendar API)

**What's Missing:**
- ❌ Uber/Lyft account authentication flow
- ❌ Google Calendar API integration (OAuth exists, but not Calendar-specific)
- ❌ Voice command NLP for taxi/calendar actions
- ❌ Location services integration
- ❌ Calendar event creation/update logic

**Technical Blockers:**
- **Uber Authentication**: Requires user to log in to Uber first (browser automation)
- **Calendar Scopes**: Need to request Calendar scope in OAuth (requires re-auth)
- **Location Services**: Browser geolocation API, requires HTTPS

**Recommended Changes to Jo's Plan:**
- **Accept** - Both features achievable
- **Add** - Lyft as alternative to Uber (hedge against API changes)
- **Add** - Calendar read-only first, then write (phased rollout)
- **Add** - Location permission flow (UX consideration)

**Team Assignment:**
- **Blossom (Backend)**:
  - Extend UberService with full auth flow
  - Add LyftService (similar pattern)
  - Google Calendar API integration
  - Calendar event CRUD operations
  - Location services backend
- **Bubbles (Frontend)**:
  - Taxi booking UI (destination picker, ride type selector)
  - Calendar event UI (create, edit, view)
  - Location permission dialog
  - OAuth re-auth flow UI
- **Guy (DBA)**:
  - Schema for saved locations (home, work)
  - Schema for calendar sync settings
  - Schema for taxi booking history
- **Pushpa (UI/UX)**:
  - Taxi booking flow design
  - Calendar event card design
  - Location picker component

**Estimated Effort:**
- Uber/Taxi Automation: 4 days (Blossom + Bubbles)
- Calendar Integration: 3 days (Blossom + Bubbles)
- **Total: 7 days** (1.5 weeks with parallel work)

**Definition of Done:**
- [ ] User can say "Book me an Uber to [location]" and see ride estimate
- [ ] User can confirm ride booking with explicit consent
- [ ] User can view today's calendar events
- [ ] User can create calendar events via voice
- [ ] User can edit/cancel calendar events
- [ ] All actions require OAuth consent
- [ ] Tests pass

---

### Sprint 3: Food Ordering, Match Algorithm (P1-P2 - Week 3)

**Technical Feasibility: ⚠️ MEDIUM**

**Existing Foundations:**
- ✅ Browser automation (can automate DoorDash, UberEats)
- ❌ No food ordering code exists

**What's Missing:**
- ❌ DoorDash/UberEats API integration (no official APIs - must use browser automation)
- ❌ Restaurant search and menu scraping
- ❌ Order placement flow
- ❌ Match algorithm design (what are we matching? founders? features? problems?)
- ❌ Matching criteria and scoring logic

**Technical Blockers:**
- **Food APIs**: DoorDash and UberEats have no public APIs - must use browser automation (brittle)
- **Match Algorithm**: Needs product clarity from Jo (what are we matching?)
- **Payment**: Food ordering requires payment methods (Stripe integration?)

**Recommended Changes to Jo's Plan:**
- **Challenge** - Food ordering is HIGH RISK due to no APIs (browser automation will break often)
- **Alternative** - Integrate with services that have APIs (Uber Eats has Partner API for businesses)
- **Defer** - Consider P2 instead of P1
- **Clarify** - What is the Match Algorithm? (founders? skills? problems? Need ADR)

**Team Assignment:**
- **Blossom (Backend)**:
  - Research food delivery APIs (Uber Eats Partner API?)
  - Browser automation for DoorDash (if no API)
  - Match algorithm implementation (once defined)
- **Bubbles (Frontend)**:
  - Restaurant search UI
  - Menu browsing UI
  - Order review and confirm UI
  - Match results display (once algorithm defined)
- **Guy (DBA)**:
  - Schema for favorite restaurants
  - Schema for order history
  - Schema for match profiles (once algorithm defined)
- **Pushpa (UI/UX)**:
  - Food ordering flow design
  - Match UI design (once algorithm defined)

**Estimated Effort:**
- Food Ordering: 5-7 days (HIGH RISK - browser automation is brittle)
- Match Algorithm: 3-5 days (depends on complexity)
- **Total: 8-12 days** (2-3 weeks with parallel work)

**Definition of Done:**
- [ ] User can search for restaurants by cuisine/location
- [ ] User can browse menus
- [ ] User can place orders (with consent)
- [ ] Match algorithm defined and implemented
- [ ] Match results displayed to user
- [ ] Tests pass

**⚠️ MO's Technical Concern:**
Food ordering via browser automation is BRITTLE. DoorDash/UberEats change their DOM frequently. This will require ongoing maintenance. I recommend:
1. **Push back to Jo** - Is this truly P1? Or can we defer to P2?
2. **Alternative** - Partner with food delivery service that has API
3. **Risk Mitigation** - If we proceed, budget 20% time for maintenance and breakage fixes

---

### Sprint 4+: Wallet/Crypto, Smart Home (P1-P2 - Future)

**Technical Feasibility: ⚠️ MEDIUM to ❌ LOW**

**Existing Foundations:**
- ❌ Nothing exists for crypto/wallet
- ❌ Nothing exists for smart home

**What's Missing:**
- ❌ Everything - this is greenfield

**Technical Blockers:**
- **Crypto**: High security requirements, regulatory concerns, wallet custody
- **Smart Home**: Requires integration with multiple platforms (Google Home, Alexa, HomeKit, etc.)

**Recommended Changes to Jo's Plan:**
- **Defer** - These are P2 at minimum, possibly P3
- **Crypto**: Requires security audit, legal review, insurance
- **Smart Home**: Requires device partnerships or OAuth integrations
- **Focus**: Nail Sprint 1-3 features first before expanding

**MO's Recommendation:**
Let's not plan Sprint 4+ in detail yet. Focus on delivering Sprint 1-3 with high quality. After Sprint 3, we reassess based on:
1. User feedback
2. Technical debt accumulated
3. Revenue impact
4. Team velocity

---

## 3. CODE QUALITY & SECURITY

### 3.1 Security Review - Current Vulnerabilities

**🔴 CRITICAL:**
1. **BYO Keys in localStorage** - Unencrypted API keys
   - **Fix**: Encrypt keys with user passphrase or biometric
   - **Owner**: Blossom
   - **Timeline**: Sprint 1

2. **No Browser Action Audit Log** - Can't trace who did what
   - **Fix**: Create audit table, log all browser actions
   - **Owner**: Guy + Blossom
   - **Timeline**: Sprint 1

3. **Puppeteer XSS Risk** - Page.evaluate() can inject malicious code
   - **Fix**: Sanitize all inputs to browser automation
   - **Owner**: Blossom
   - **Timeline**: Sprint 1

**🟡 HIGH:**
4. **No Rate Limiting on Browser API** - Can be abused
   - **Fix**: Add rate limiting (10 sessions/hour per user)
   - **Owner**: Blossom
   - **Timeline**: Sprint 1

5. **OAuth Token Storage** - Refresh tokens in database unencrypted
   - **Fix**: Encrypt OAuth tokens in Supabase
   - **Owner**: Guy + Blossom
   - **Timeline**: Sprint 2

6. **No CSRF Protection on Browser Consent** - Can trick user into approving actions
   - **Fix**: CSRF tokens on consent endpoints
   - **Owner**: Blossom
   - **Timeline**: Sprint 1

**🟢 MEDIUM:**
7. **TypeScript `ignoreBuildErrors: true`** - Hides type errors
   - **Fix**: Fix type errors, remove flag
   - **Owner**: All team
   - **Timeline**: Ongoing

8. **ESLint `ignoreDuringBuilds: true`** - Hides code quality issues
   - **Fix**: Fix linting errors, remove flag
   - **Owner**: All team
   - **Timeline**: Ongoing

### 3.2 Testing Strategy

**DECISION: Test Pyramid with Focus on Integration Tests**

**Why:**
- Unit tests catch logic errors
- Integration tests catch API contract issues
- E2E tests catch user flow issues
- We already have Vitest configured

**Test Coverage Goals:**
- **Unit Tests**: 70% coverage (lib/, utils/, hooks/)
- **Integration Tests**: 80% coverage (API routes, database)
- **E2E Tests**: Critical user flows (voice → browser automation → result)

**Testing Ownership:**
- **Buttercup (QA)**: Owns E2E tests, writes test plans
- **Blossom/Bubbles**: Write unit/integration tests for their code
- **MO**: Reviews test coverage in PRs

**Test Strategy per Sprint:**

**Sprint 1:**
```typescript
// BYO Mode
- Unit: BYO config storage/retrieval
- Integration: BYO keys used in AI router
- E2E: User enables BYO, adds keys, sends message

// Voice State Machine
- Unit: State transitions (idle → listening → thinking → speaking)
- Integration: Voice state sync with AI responses
- E2E: User speaks, sees state changes, hears response

// Browser Relay
- Unit: Command parsing, action execution
- Integration: Browser API endpoints, queue system
- E2E: User requests browser action, approves consent, sees result
```

**Sprint 2:**
```typescript
// Uber/Taxi
- Unit: UberService command execution
- Integration: Uber API mocking, location services
- E2E: User books Uber via voice, approves, sees confirmation

// Calendar
- Unit: Calendar event CRUD operations
- Integration: Google Calendar API mocking
- E2E: User creates event via voice, sees in calendar
```

**Sprint 3:**
```typescript
// Food Ordering
- Unit: Restaurant search, menu parsing
- Integration: Food ordering flow (mocked)
- E2E: User searches restaurants, places order, sees confirmation

// Match Algorithm
- Unit: Matching logic, scoring
- Integration: Match API endpoint
- E2E: User requests match, sees results
```

### 3.3 Code Review Checkpoints

**PR Review Checklist (MO enforces this):**

**Architecture:**
- [ ] Follows Worlds pattern (if applicable)
- [ ] Clear separation of concerns
- [ ] No circular dependencies
- [ ] Appropriate abstractions (not over-engineered)

**Code Quality:**
- [ ] Clean code (readable, self-documenting)
- [ ] SOLID principles followed
- [ ] DRY - no copy/paste code
- [ ] Proper error handling (no swallowed errors)
- [ ] TypeScript types (no `any`, no `@ts-ignore`)

**Security:**
- [ ] Input validation on all user inputs
- [ ] No secrets in code (use env vars)
- [ ] Proper auth checks (no bypassing RLS)
- [ ] CSRF protection on state-changing endpoints
- [ ] Rate limiting on expensive operations

**Performance:**
- [ ] No N+1 queries
- [ ] Efficient algorithms (no O(n²) where avoidable)
- [ ] Lazy loading where appropriate
- [ ] No unnecessary re-renders (React)
- [ ] Bundle size impact considered

**Testing:**
- [ ] Unit tests for new logic
- [ ] Integration tests for API endpoints
- [ ] E2E test for critical flows
- [ ] All tests pass locally
- [ ] Test coverage maintained or improved

**Documentation:**
- [ ] README updated (if applicable)
- [ ] API docs updated (if applicable)
- [ ] Inline comments for complex logic
- [ ] ADR written for major architectural decisions

**Accessibility:**
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast meets WCAG AA

**Mobile:**
- [ ] Responsive design (works on mobile)
- [ ] Touch targets are large enough (44x44px min)
- [ ] No horizontal scrolling
- [ ] Fast on 3G network

---

## 4. SYSTEM BOUNDARIES - API DESIGN

### 4.1 Worlds Orchestration API

**WorldOrchestrator Public Interface:**
```typescript
// src/lib/worlds/core/WorldOrchestrator.ts

class WorldOrchestrator {
  /**
   * Execute a command across one or more worlds
   */
  async executeCommand(
    command: VoiceCommand,
    context: UserContext
  ): Promise<WorldResult>

  /**
   * Get status of all worlds
   */
  getWorldsStatus(): WorldStatus[]

  /**
   * Register a new world
   */
  registerWorld(world: World): void

  /**
   * Unregister a world
   */
  unregisterWorld(worldName: string): void
}

// Types
interface VoiceCommand {
  text: string;                    // Raw voice input
  intent: string;                  // Parsed intent (book_taxi, create_event, etc.)
  entities: Record<string, any>;   // Extracted entities (location, time, etc.)
  userId: string;
  timestamp: number;
}

interface UserContext {
  userId: string;
  sessionId: string;
  location?: { lat: number; lng: number };
  timezone: string;
  preferences: Record<string, any>;
  byoKeys?: {
    claudeApiKey?: string;
    openaiApiKey?: string;
  };
}

interface WorldResult {
  success: boolean;
  worldName: string;
  data?: any;
  error?: string;
  requiresConsent?: boolean;
  consentMessage?: string;
  actions?: WorldAction[];         // Actions taken
  metadata?: Record<string, any>;
}

interface WorldAction {
  type: string;                    // 'browser_navigate', 'api_call', etc.
  description: string;
  timestamp: number;
  result?: any;
}
```

### 4.2 Browser Automation API

**API Endpoints:**
```typescript
// POST /api/browser/session
// Create a new browser session
interface CreateSessionRequest {
  url: string;
  purpose: string;                 // "book_uber", "order_food", etc.
  requiresConsent: boolean;
}

interface CreateSessionResponse {
  sessionId: string;
  status: 'pending_consent' | 'active';
  consentUrl?: string;             // If consent required
}

// POST /api/browser/action
// Execute a browser action
interface BrowserActionRequest {
  sessionId: string;
  action: BrowserAction;           // Defined in types.ts
  waitForConsent?: boolean;
}

interface BrowserActionResponse {
  success: boolean;
  result?: any;
  screenshot?: string;             // Base64 screenshot
  error?: string;
}

// POST /api/browser/consent
// User approves/denies browser action
interface ConsentRequest {
  sessionId: string;
  approved: boolean;
  reason?: string;
}

// DELETE /api/browser/session/:sessionId
// Close a browser session
```

### 4.3 Worlds API

**API Endpoints:**
```typescript
// POST /api/worlds/execute
// Execute a command via WorldOrchestrator
interface ExecuteCommandRequest {
  command: VoiceCommand;
  context: UserContext;
}

interface ExecuteCommandResponse {
  result: WorldResult;
  suggestions?: string[];          // Next action suggestions
}

// GET /api/worlds/status
// Get status of all worlds
interface WorldsStatusResponse {
  worlds: WorldStatus[];
}

// POST /api/worlds/taxi
// Taxi-specific endpoint
interface TaxiRequest {
  action: 'estimate' | 'book' | 'status';
  pickup?: string;
  destination?: string;
  rideType?: 'pool' | 'x' | 'xl' | 'black';
}

// POST /api/worlds/calendar
// Calendar-specific endpoint
interface CalendarRequest {
  action: 'list' | 'create' | 'update' | 'delete';
  eventId?: string;
  event?: CalendarEvent;
  start?: string;
  end?: string;
}

// POST /api/worlds/food
// Food ordering endpoint
interface FoodRequest {
  action: 'search' | 'menu' | 'order';
  query?: string;
  restaurantId?: string;
  orderId?: string;
  items?: OrderItem[];
}
```

---

## 5. TECHNICAL RISKS & MITIGATION

### 5.1 High-Risk Items

**🔴 CRITICAL RISK: Food Ordering Browser Automation**
- **Risk**: DoorDash/UberEats DOM changes break automation
- **Impact**: Feature stops working, user frustration
- **Probability**: HIGH (sites change weekly)
- **Mitigation**:
  1. Implement DOM selectors with fallbacks
  2. Add health checks that detect breakage
  3. Alert team when selectors fail
  4. Budget 20% time for maintenance
  5. **Alternative**: Partner with food delivery service with API

**🟡 HIGH RISK: OAuth Token Security**
- **Risk**: Refresh tokens leaked from database
- **Impact**: Account takeover
- **Probability**: MEDIUM (if database compromised)
- **Mitigation**:
  1. Encrypt tokens at rest
  2. RLS policies on token access
  3. Short-lived access tokens
  4. Audit logging of token usage

**🟡 HIGH RISK: Browser Automation Resource Exhaustion**
- **Risk**: Too many Puppeteer instances crash server
- **Impact**: Service downtime
- **Probability**: MEDIUM (if no queue system)
- **Mitigation**:
  1. Queue system (max 5 concurrent sessions)
  2. Connection pooling
  3. Timeout on sessions (5 min max)
  4. Resource monitoring and alerts

**🟢 MEDIUM RISK: Voice Command NLP Accuracy**
- **Risk**: Misinterpret user commands
- **Impact**: Wrong action executed (book wrong ride, etc.)
- **Probability**: MEDIUM (NLP is hard)
- **Mitigation**:
  1. Confirmation step before executing actions
  2. Show parsed command to user ("I heard: book Uber to airport")
  3. Easy undo/cancel
  4. Learn from corrections

### 5.2 Technical Debt

**Current Tech Debt (Must Fix):**
1. **TypeScript Build Errors Ignored** - `ignoreBuildErrors: true`
   - **Impact**: Type safety compromised
   - **Fix**: Dedicate 2 days to fix all TypeScript errors
   - **Owner**: All team
   - **Timeline**: Before Sprint 1 completion

2. **ESLint Errors Ignored** - `ignoreDuringBuilds: true`
   - **Impact**: Code quality degraded
   - **Fix**: Fix linting errors incrementally
   - **Owner**: All team
   - **Timeline**: Ongoing

3. **No Integration Tests for Existing Features** - Missing test coverage
   - **Impact**: Regressions not caught
   - **Fix**: Buttercup writes integration tests for core features
   - **Owner**: Buttercup
   - **Timeline**: Sprint 1

**Tech Debt We'll Accrue (Acceptable):**
1. **Browser Automation Brittle** - Will break when sites change
   - **Acceptable**: If we budget maintenance time
   - **Monitor**: Add health checks

2. **WorldOrchestrator Not Fully Generic** - Tailored to specific commands
   - **Acceptable**: Can refactor later if needed
   - **Monitor**: Watch for duplication

3. **BYO Keys in localStorage** - Not ideal long-term
   - **Acceptable**: For MVP, with encryption
   - **Monitor**: Consider server-side storage later

---

## 6. TEAM ASSIGNMENTS & WORKLOAD

### Blossom (Backend Engineer)
**Sprint 1:**
- Integrate BYO keys with AI router (2 days)
- Build browser queue and pool system (2 days)
- Create browser API endpoints (1 day)
- Implement consent manager (1 day)
- **Total: 6 days**

**Sprint 2:**
- Extend UberService with full auth flow (2 days)
- Add LyftService (1 day)
- Google Calendar API integration (2 days)
- Calendar event CRUD operations (1 day)
- **Total: 6 days**

**Sprint 3:**
- Research food delivery APIs (1 day)
- Browser automation for food ordering (3 days)
- Match algorithm implementation (2 days)
- **Total: 6 days**

### Bubbles (Frontend Engineer)
**Sprint 1:**
- Voice state UI indicators (1 day)
- Browser consent dialog UI (1 day)
- BYO settings improvements (1 day)
- **Total: 3 days**

**Sprint 2:**
- Taxi booking UI (2 days)
- Calendar event UI (2 days)
- Location permission dialog (0.5 day)
- OAuth re-auth flow UI (0.5 day)
- **Total: 5 days**

**Sprint 3:**
- Restaurant search UI (1 day)
- Menu browsing UI (1 day)
- Order review and confirm UI (1 day)
- Match results display (1 day)
- **Total: 4 days**

### Guy (Database Engineer)
**Sprint 1:**
- Schema for browser session audit logs (1 day)
- Schema for browser consent records (0.5 day)
- RLS policies for user isolation (0.5 day)
- **Total: 2 days**

**Sprint 2:**
- Schema for saved locations (0.5 day)
- Schema for calendar sync settings (0.5 day)
- Schema for taxi booking history (0.5 day)
- Encrypt OAuth tokens (1 day)
- **Total: 2.5 days**

**Sprint 3:**
- Schema for favorite restaurants (0.5 day)
- Schema for order history (0.5 day)
- Schema for match profiles (1 day)
- **Total: 2 days**

### Buttercup (QA Engineer)
**Sprint 1:**
- E2E tests for BYO mode (1 day)
- E2E tests for voice state machine (1 day)
- E2E tests for browser automation (2 days)
- Integration tests for existing features (2 days)
- **Total: 6 days**

**Sprint 2:**
- E2E tests for taxi booking (2 days)
- E2E tests for calendar integration (2 days)
- **Total: 4 days**

**Sprint 3:**
- E2E tests for food ordering (2 days)
- E2E tests for match algorithm (1 day)
- **Total: 3 days**

### Pushpa (UI/UX Specialist)
**Sprint 1:**
- Voice state animations (1 day)
- Consent dialog design (0.5 day)
- BYO settings polish (0.5 day)
- **Total: 2 days**

**Sprint 2:**
- Taxi booking flow design (1 day)
- Calendar event card design (1 day)
- Location picker component (0.5 day)
- **Total: 2.5 days**

**Sprint 3:**
- Food ordering flow design (1.5 days)
- Match UI design (1 day)
- **Total: 2.5 days**

### MO (CTO/Architect)
**All Sprints:**
- Code reviews (1 hour/day)
- Architecture decisions (ad-hoc)
- Unblock team (ad-hoc)
- Coordinate with Jo (2 hours/week)
- Security reviews (2 hours/sprint)
- Write ADRs (2 hours/sprint)

---

## 7. CONCERNS & RECOMMENDATIONS TO JO

### 7.1 Pushback on Food Ordering (Sprint 3)

**MO's Recommendation: Defer Food Ordering to P2 or Find API Partner**

**Why:**
- No official APIs from DoorDash, UberEats, Grubhub
- Browser automation is EXTREMELY brittle (breaks weekly)
- Requires ongoing maintenance (20% time)
- High risk of user frustration if feature breaks

**Alternative Options:**
1. **Partner with Uber Eats** - They have Partner API for businesses
2. **Defer to P2** - Focus on Taxi and Calendar (more stable)
3. **Accept Risk** - Proceed, but budget maintenance time

**Decision Needed from Jo:**
- Is Food Ordering truly P1?
- Are we willing to allocate 20% ongoing maintenance?
- Can we explore API partnerships?

### 7.2 Clarification Needed on Match Algorithm

**MO's Question: What Are We Matching?**

**Possible Interpretations:**
1. **Founder Matching** - Match entrepreneurs with co-founders
2. **Skill Matching** - Match users needing help with experts
3. **Problem Matching** - Match problems with solutions
4. **Feature Matching** - Match users with relevant features

**Decision Needed from Jo:**
- What is the Match Algorithm?
- What are the matching criteria?
- What data do we need to collect?
- What is the success metric?

**Recommendation:**
Let's write an ADR (Architecture Decision Record) together defining the Match Algorithm before Sprint 3 starts.

### 7.3 Sprint 4+ Deferral

**MO's Recommendation: Defer Wallet/Crypto and Smart Home to Later**

**Why:**
- Focus on nailing Sprint 1-3 first
- Crypto requires security audit, legal review, insurance
- Smart Home requires device partnerships
- Team capacity is fully utilized with Sprint 1-3

**Recommendation:**
After Sprint 3, let's reassess:
1. User feedback on existing features
2. Technical debt accumulated
3. Revenue impact
4. Team velocity and morale

Then decide if Sprint 4+ features are still priorities.

---

## 8. NEXT STEPS

### Immediate Actions (This Week)

**MO:**
1. ✅ Complete this architecture review
2. [ ] Review with Jo - align on priorities
3. [ ] Write ADR for Worlds Architecture
4. [ ] Set up PR templates with review checklist
5. [ ] Create Sprint 1 GitHub Project board

**Team:**
1. [ ] Blossom: Start BYO AI router integration
2. [ ] Bubbles: Start voice state UI
3. [ ] Guy: Create browser audit schema
4. [ ] Buttercup: Write test plan for Sprint 1
5. [ ] Pushpa: Design voice state animations

**By End of Week:**
1. [ ] Sprint 1 features scoped and assigned
2. [ ] GitHub issues created for all Sprint 1 work
3. [ ] ADR written for Worlds Architecture
4. [ ] PR review process documented
5. [ ] Daily standup scheduled (15 min, 10am)

---

## 9. DEFINITIONS OF DONE

### Sprint 1 (BYO Mode, Voice State UI, Browser Relay)

**Done = Production Ready:**
- [ ] All code merged to `main`
- [ ] All tests passing (unit + integration + E2E)
- [ ] Feature flags created and disabled by default
- [ ] Documentation updated (README, API docs)
- [ ] Code reviewed and approved by MO
- [ ] QA signed off by Buttercup
- [ ] Performance benchmarked (no regression)
- [ ] Security reviewed (no critical vulnerabilities)
- [ ] Deployed to Vercel preview
- [ ] Tested on mobile and desktop
- [ ] Accessibility checked (WCAG AA)

### Sprint 2 (Taxi, Calendar)

**Done = Production Ready:**
- [ ] All Sprint 1 criteria met
- [ ] OAuth flows tested end-to-end
- [ ] Location services tested on HTTPS
- [ ] Rate limiting verified
- [ ] User consent flows tested
- [ ] Calendar sync working
- [ ] Taxi booking working (with consent)

### Sprint 3 (Food, Match)

**Done = Production Ready:**
- [ ] All Sprint 2 criteria met
- [ ] Food ordering tested on multiple restaurants
- [ ] Health checks for browser automation
- [ ] Match algorithm tested and validated
- [ ] Performance acceptable (< 3s response time)

---

## 10. CONCLUSION

Jo's roadmap is **technically feasible** with the following adjustments:

**✅ Approved:**
- Sprint 1: BYO Mode, Voice State UI, Browser Relay - **GO**
- Sprint 2: Taxi, Calendar - **GO**

**⚠️ Concerns:**
- Sprint 3: Food Ordering - **HIGH RISK** (recommend defer or API partnership)
- Sprint 3: Match Algorithm - **NEEDS CLARITY** (ADR required)

**❌ Defer:**
- Sprint 4+: Wallet/Crypto, Smart Home - **TOO EARLY** (focus on Sprint 1-3 first)

**Technical Foundations:**
- ✅ Architecture solid (Worlds pattern, feature flags, Vercel deployment)
- ✅ Team capacity sufficient (5 developers, well-specialized)
- ✅ Security strategy defined (encryption, audit logs, consent)
- ✅ Testing strategy defined (unit + integration + E2E)

**Next Steps:**
1. Review this document with Jo
2. Get approval on Sprint 1-2 (defer 3+)
3. Clarify Match Algorithm
4. Decide on Food Ordering (defer or proceed with risk)
5. Kick off Sprint 1 development

**Timeline:**
- Sprint 1: Week 1 (6 days)
- Sprint 2: Week 2-3 (7 days)
- Sprint 3: TBD (pending Jo's decision)

---

**MO's Signature:**  
*"Good architecture is about the future, not just today."*

**Status:** Awaiting Jo's approval to proceed.
