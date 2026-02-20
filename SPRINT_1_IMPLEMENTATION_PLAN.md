# Sprint 1 Implementation Plan

**Sprint:** 1 of 4  
**Duration:** 6 days (1 week)  
**Features:** BYO Mode, Voice State Machine UI, Browser Relay Setup  
**Priority:** P0 (This Week)  
**Owner:** MO (CTO)

---

## Sprint Goals

By end of Sprint 1, users can:
1. ✅ Enable BYO mode and add their own API keys (Claude, OpenAI)
2. ✅ See visual feedback for voice states (idle → listening → thinking → speaking)
3. ✅ Initiate browser automation sessions with explicit consent
4. ✅ View audit logs of browser actions

---

## Team Assignments

### Blossom (Backend - 6 days)
**Day 1-2: BYO AI Router Integration**
- [ ] Modify `src/lib/ai/llm-router.ts` to check BYO config
- [ ] If BYO enabled + keys present, use user's keys
- [ ] If BYO disabled or no keys, use server keys
- [ ] Add BYO key encryption (Web Crypto API)
- [ ] Test BYO flow end-to-end

**Day 3-4: Browser Queue & Pool**
- [ ] Create `src/lib/browser/BrowserQueue.ts` (max 5 concurrent sessions)
- [ ] Create `src/lib/browser/BrowserPool.ts` (reuse browser instances)
- [ ] Add rate limiting (10 sessions/hour per user)
- [ ] Add session timeout (5 min max)

**Day 5: Browser API Endpoints**
- [ ] Create `src/app/api/browser/route.ts` (create session, execute action)
- [ ] Create `src/app/api/browser/consent/route.ts` (approve/deny)
- [ ] Create `src/app/api/browser/queue/route.ts` (queue status)

**Day 6: Consent Manager**
- [ ] Create `src/lib/browser/consent-manager.ts`
- [ ] Implement consent request flow
- [ ] Store consent decisions (audit log)

### Bubbles (Frontend - 3 days)
**Day 1: Voice State UI**
- [ ] Modify `src/components/FullscreenApp.tsx` voice state rendering
- [ ] Add pulsing animations for each state
- [ ] Color-code states (idle=orange, listening=red, thinking=yellow, speaking=green)
- [ ] Test state transitions

**Day 2: Browser Consent Dialog**
- [ ] Create `src/components/browser/ConsentDialog.tsx`
- [ ] Show domain, action, screenshot preview
- [ ] Approve/Deny buttons
- [ ] Remember consent checkbox

**Day 3: BYO Settings Improvements**
- [ ] Add "Test Connection" button (ping API with test request)
- [ ] Add key validation (check format)
- [ ] Show last successful use timestamp
- [ ] Improve error messages

### Guy (DBA - 2 days)
**Day 1: Browser Session Schema**
```sql
-- src/supabase/migrations/YYYYMMDD_browser_sessions.sql

CREATE TABLE browser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL, -- 'pending', 'active', 'completed', 'failed', 'denied'
  consent_given BOOLEAN DEFAULT FALSE,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX idx_browser_sessions_user ON browser_sessions(user_id);
CREATE INDEX idx_browser_sessions_status ON browser_sessions(status);

-- RLS policies
ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON browser_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON browser_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Day 1 (continued): Browser Actions Audit**
```sql
CREATE TABLE browser_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES browser_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'navigate', 'click', 'type', 'screenshot', etc.
  target TEXT, -- URL or selector
  result TEXT,
  success BOOLEAN NOT NULL,
  error TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_browser_actions_session ON browser_actions(session_id);
CREATE INDEX idx_browser_actions_user ON browser_actions(user_id);

-- RLS policies
ALTER TABLE browser_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions"
  ON browser_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own actions"
  ON browser_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Day 2: Consent Records**
```sql
CREATE TABLE browser_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES browser_sessions(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  action_description TEXT NOT NULL,
  approved BOOLEAN NOT NULL,
  reason TEXT,
  remember_choice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_user ON browser_consent_records(user_id);
CREATE INDEX idx_consent_domain ON browser_consent_records(domain);

-- RLS policies
ALTER TABLE browser_consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent records"
  ON browser_consent_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consent records"
  ON browser_consent_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Buttercup (QA - 6 days)
**Day 1: Test Plan**
- [ ] Write test plan for Sprint 1 features
- [ ] Define test cases for BYO mode
- [ ] Define test cases for voice state UI
- [ ] Define test cases for browser automation

**Day 2: BYO Mode Tests**
- [ ] E2E: User enables BYO, adds keys, sends message
- [ ] E2E: User message uses BYO keys (check network requests)
- [ ] E2E: User disables BYO, message uses server keys
- [ ] Unit: BYO config storage/retrieval
- [ ] Integration: AI router key selection logic

**Day 3: Voice State Machine Tests**
- [ ] E2E: User clicks microphone, sees "listening" state
- [ ] E2E: User speaks, sees "thinking" state
- [ ] E2E: AI responds, sees "speaking" state
- [ ] E2E: Returns to "idle" state after response
- [ ] Unit: State transitions logic

**Day 4-5: Browser Automation Tests**
- [ ] E2E: User requests browser action, sees consent dialog
- [ ] E2E: User approves, action executes, logs created
- [ ] E2E: User denies, action cancelled
- [ ] E2E: Queue system works (max 5 concurrent)
- [ ] E2E: Session timeout works (5 min)
- [ ] Integration: Browser API endpoints
- [ ] Integration: Consent manager

**Day 6: Integration Tests for Existing Features**
- [ ] Auth flow (magic link)
- [ ] Chat functionality
- [ ] Voice recording/playback
- [ ] Cube animations

### Pushpa (UI/UX - 2 days)
**Day 1: Voice State Animations**
- [ ] Design pulsing animation for "listening" state
- [ ] Design thinking animation (rotating, flickering)
- [ ] Design speaking animation (waves)
- [ ] Implement in `src/components/cube/`

**Day 2: Consent Dialog & BYO Polish**
- [ ] Design consent dialog (clear, not scary)
- [ ] Show domain favicon + URL
- [ ] Show action description + screenshot preview
- [ ] BYO settings visual polish

---

## Definition of Done (Sprint 1)

**Code Quality:**
- [ ] All TypeScript errors fixed (`ignoreBuildErrors` removed)
- [ ] All ESLint errors fixed (`ignoreDuringBuilds` removed)
- [ ] No `any` types, no `@ts-ignore`
- [ ] Code reviewed and approved by MO

**Testing:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Test coverage ≥ 70%

**Security:**
- [ ] BYO keys encrypted at rest (Web Crypto API)
- [ ] Browser actions audit logged
- [ ] Consent required for all browser sessions
- [ ] Rate limiting enforced (10 sessions/hour)
- [ ] CSRF protection on consent endpoint
- [ ] No XSS vulnerabilities in browser automation

**Documentation:**
- [ ] README updated (BYO mode, browser automation)
- [ ] API docs updated (browser endpoints)
- [ ] Inline comments for complex logic

**Deployment:**
- [ ] Feature flags created (`byo_mode_v2`, `voice_state_machine_ui`, `browser_relay_setup`)
- [ ] Flags disabled by default
- [ ] PR merged to `main`
- [ ] Deployed to Vercel preview
- [ ] QA signed off on preview deployment

**User Experience:**
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Tested on mobile (iOS, Android)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (ARIA labels)
- [ ] No console errors
- [ ] Fast performance (< 3s page load)

---

## Technical Tasks Breakdown

### 1. BYO AI Router Integration

**File:** `src/lib/ai/llm-router.ts`

**Current Logic:**
```typescript
// Uses server API keys
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY
  }
});
```

**New Logic:**
```typescript
// Check BYO config
const byoConfig = useBYO();

const apiKey = byoConfig.isBYOEnabled && byoConfig.config.claudeApiKey
  ? byoConfig.config.claudeApiKey
  : process.env.ANTHROPIC_API_KEY;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': apiKey
  }
});
```

**Encryption:**
```typescript
// src/lib/byo/encryption.ts

export async function encryptKey(key: string, passphrase: string): Promise<string> {
  // Use Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  // ... encryption logic
}

export async function decryptKey(encryptedKey: string, passphrase: string): Promise<string> {
  // ... decryption logic
}
```

---

### 2. Voice State UI Indicators

**File:** `src/components/FullscreenApp.tsx`

**Current State Management:**
```typescript
const [animationState, setAnimationState] = useState<AnimationState>('idle')
```

**New Visual Feedback:**
```tsx
// Color mapping
const stateColors: Record<AnimationState, ColorName> = {
  idle: 'ORANGE',
  listening: 'RED',
  thinking: 'YELLOW',
  speaking: 'GREEN',
};

// Render cube with state color
<EnergyCubeScene
  color={stateColors[animationState]}
  animationState={animationState}
  isPulsing={animationState !== 'idle'}
/>

// Add state label
<div className="absolute bottom-10 left-1/2 -translate-x-1/2">
  <span className={`text-sm font-medium ${getStateTextColor(animationState)}`}>
    {animationState.toUpperCase()}
  </span>
</div>
```

---

### 3. Browser Queue System

**File:** `src/lib/browser/BrowserQueue.ts`

**Implementation:**
```typescript
interface QueuedSession {
  id: string;
  userId: string;
  url: string;
  purpose: string;
  priority: number;
  createdAt: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export class BrowserQueue {
  private queue: QueuedSession[] = [];
  private activeSessionsCount = 0;
  private readonly maxConcurrent = 5;

  async enqueue(session: Omit<QueuedSession, 'status' | 'createdAt'>): Promise<string> {
    const queuedSession: QueuedSession = {
      ...session,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.queue.push(queuedSession);
    this.processQueue();
    
    return queuedSession.id;
  }

  private async processQueue(): Promise<void> {
    if (this.activeSessionsCount >= this.maxConcurrent) {
      return; // Queue is full
    }

    const nextSession = this.queue.find(s => s.status === 'pending');
    if (!nextSession) {
      return; // No pending sessions
    }

    nextSession.status = 'active';
    this.activeSessionsCount++;

    try {
      await this.executeSession(nextSession);
      nextSession.status = 'completed';
    } catch (error) {
      nextSession.status = 'failed';
    } finally {
      this.activeSessionsCount--;
      this.processQueue(); // Process next session
    }
  }

  private async executeSession(session: QueuedSession): Promise<void> {
    // Execute browser automation
  }

  getQueueStatus(): { pending: number; active: number; completed: number } {
    return {
      pending: this.queue.filter(s => s.status === 'pending').length,
      active: this.activeSessionsCount,
      completed: this.queue.filter(s => s.status === 'completed').length,
    };
  }
}
```

---

### 4. Browser Consent Manager

**File:** `src/lib/browser/consent-manager.ts`

**Implementation:**
```typescript
interface ConsentRequest {
  sessionId: string;
  domain: string;
  actionDescription: string;
  screenshot?: string;
}

interface ConsentResponse {
  approved: boolean;
  remember: boolean;
  reason?: string;
}

export class ConsentManager {
  private pendingConsents: Map<string, ConsentRequest> = new Map();

  async requestConsent(request: ConsentRequest): Promise<boolean> {
    // Check if user has previously approved this domain
    const remembered = await this.checkRememberedConsent(request.domain);
    if (remembered) {
      await this.logConsent(request, true, 'Previously approved');
      return true;
    }

    // Store request and wait for user response
    this.pendingConsents.set(request.sessionId, request);

    // Send to frontend
    await this.notifyFrontend(request);

    // Wait for response (with timeout)
    return await this.waitForResponse(request.sessionId);
  }

  async approveConsent(
    sessionId: string,
    remember: boolean,
    reason?: string
  ): Promise<void> {
    const request = this.pendingConsents.get(sessionId);
    if (!request) {
      throw new Error('Consent request not found');
    }

    if (remember) {
      await this.rememberConsent(request.domain);
    }

    await this.logConsent(request, true, reason);
    this.pendingConsents.delete(sessionId);
  }

  async denyConsent(sessionId: string, reason?: string): Promise<void> {
    const request = this.pendingConsents.get(sessionId);
    if (!request) {
      throw new Error('Consent request not found');
    }

    await this.logConsent(request, false, reason);
    this.pendingConsents.delete(sessionId);
  }

  private async checkRememberedConsent(domain: string): Promise<boolean> {
    // Check browser_consent_records table
    const { data } = await supabase
      .from('browser_consent_records')
      .select('approved, remember_choice')
      .eq('domain', domain)
      .eq('remember_choice', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.approved === true;
  }

  private async logConsent(
    request: ConsentRequest,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    await supabase.from('browser_consent_records').insert({
      session_id: request.sessionId,
      domain: request.domain,
      action_description: request.actionDescription,
      approved,
      reason,
    });
  }
}
```

---

## API Endpoint Specifications

### POST /api/browser/session

**Create a new browser session**

**Request:**
```json
{
  "url": "https://uber.com",
  "purpose": "book_ride",
  "requiresConsent": true
}
```

**Response:**
```json
{
  "sessionId": "session-123",
  "status": "pending_consent",
  "consentRequest": {
    "domain": "uber.com",
    "action": "Navigate to Uber and book a ride",
    "screenshot": "data:image/png;base64,..."
  }
}
```

---

### POST /api/browser/action

**Execute a browser action**

**Request:**
```json
{
  "sessionId": "session-123",
  "action": {
    "type": "click",
    "selector": "button[aria-label='Request ride']"
  }
}
```

**Response:**
```json
{
  "success": true,
  "screenshot": "data:image/png;base64,..	.",
  "result": {
    "url": "https://uber.com/confirm",
    "timestamp": 1708195200000
  }
}
```

---

### POST /api/browser/consent

**Approve or deny browser action**

**Request:**
```json
{
  "sessionId": "session-123",
  "approved": true,
  "remember": false,
  "reason": "User approved booking"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent recorded"
}
```

---

## Daily Standup Agenda

**Time:** 10:00 AM daily  
**Duration:** 15 minutes max  
**Format:** Async (Slack) or Sync (video call)

**Each team member reports:**
1. **Yesterday:** What I completed
2. **Today:** What I'm working on
3. **Blockers:** Any issues blocking progress

**MO's role:**
- Unblock team
- Make technical decisions
- Coordinate dependencies

---

## Risk Register

### 🔴 CRITICAL RISKS

**Risk 1: BYO Key Security**
- **Description:** User API keys stored in localStorage can be stolen by XSS
- **Mitigation:** Encrypt keys with Web Crypto API + user passphrase
- **Owner:** Blossom
- **Status:** In Progress

**Risk 2: Puppeteer Resource Exhaustion**
- **Description:** Too many browser instances crash server
- **Mitigation:** Queue system (max 5 concurrent), session timeouts
- **Owner:** Blossom
- **Status:** In Progress

### 🟡 HIGH RISKS

**Risk 3: TypeScript Build Errors**
- **Description:** `ignoreBuildErrors: true` hides type issues
- **Mitigation:** Dedicate time to fix all errors
- **Owner:** All team
- **Status:** Ongoing

**Risk 4: Browser Automation Flakiness**
- **Description:** Headless Chrome can be flaky on Vercel
- **Mitigation:** Retry logic, health checks, fallback to manual
- **Owner:** Blossom
- **Status:** Monitor

### 🟢 MEDIUM RISKS

**Risk 5: Voice State UI Performance**
- **Description:** Animations may drop frames on low-end devices
- **Mitigation:** Use CSS animations (GPU-accelerated), profile performance
- **Owner:** Pushpa
- **Status:** Monitor

---

## Sprint Review (End of Week)

**Agenda:**
1. **Demo:** Show completed features to Jo
2. **Retrospective:** What went well, what didn't
3. **Metrics:** Velocity, test coverage, deployment success
4. **Planning:** Adjust Sprint 2 plan based on learnings

**Success Criteria:**
- All Sprint 1 features complete
- All tests passing
- Deployed to Vercel preview
- QA signed off
- Jo approves to proceed to Sprint 2

---

**MO's Commitment:**  
I will review every PR, unblock the team daily, and ensure we ship high-quality code on time.

**Sprint 1 Start:** Monday, Week 1  
**Sprint 1 End:** Friday, Week 1  
**Sprint 1 Review:** Friday, 4:00 PM
