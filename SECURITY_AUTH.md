# Security & Authentication — SECURITY_AUTH.md

> Comprehensive security reference for the CubiQo platform.
> Covers authentication, authorisation (RLS), tool sandboxing, workspace isolation, and rate limiting.

---

## Table of Contents

1. [Supabase Authentication](#1-supabase-authentication)
2. [WebAuthn / Passkeys (CubiKey)](#2-webauthn--passkeys-cubikey)
3. [Row-Level Security (RLS)](#3-row-level-security-rls)
4. [Tool Sandboxing](#4-tool-sandboxing)
5. [Workspace Isolation](#5-workspace-isolation)
6. [Rate Limiting](#6-rate-limiting)
7. [Security Checklist](#7-security-checklist)

---

## 1. Supabase Authentication

CubiQo uses **Supabase Auth** as its identity provider.

### 1.1 Auth Flow

```
User enters email → signInWithEmail()
  ↓
Supabase sends magic-link email
  ↓
User clicks link → /auth/callback
  ↓
Next.js middleware refreshes session → getUser()
  ↓
AuthContext fires onAuthStateChange(SIGNED_IN)
  ↓
UI updates immediately
```

### 1.2 Key Files

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Single source of truth for client-side auth state |
| `src/middleware.ts` | Refreshes session on every request; updates cookies |
| `src/lib/supabase/client.ts` | Browser Supabase client (validates config) |
| `src/lib/supabase/server.ts` | Server-side client using `@supabase/ssr` cookies adapter |
| `src/app/auth/callback/route.ts` | OAuth / magic-link callback handler |

### 1.3 Session Security

- Sessions expire after the Supabase-configured window (default 1 hour).
- Refresh tokens are stored in **HTTP-only** cookies.
- The middleware calls `supabase.auth.getUser()` on every request to transparently refresh expired sessions.
- **CSRF protection** is handled by the Supabase SDK and SameSite cookie policy.
- `Secure` cookie flag is set in production.

### 1.4 Server-Side Route Protection

All API routes that access user data must validate the session:

```ts
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

> **Rule:** Never trust client-side auth state for security. Always re-validate on the server.

---

## 2. WebAuthn / Passkeys (CubiKey)

CubiQo supports passwordless authentication via the **WebAuthn** standard, marketed as **CubiKey**.

### 2.1 How It Works

| Step | Endpoint | Description |
|------|----------|-------------|
| 1. Register — options | `GET /api/auth/webauthn/register/options` | Generates a registration challenge |
| 2. Register — verify | `POST /api/auth/webauthn/register/verify` | Verifies attestation and stores credential |
| 3. Login — options | `GET /api/auth/webauthn/login/options` | Generates an authentication challenge |
| 4. Login — verify | `POST /api/auth/webauthn/login/verify` | Verifies assertion and issues session |

### 2.2 Key Files

| File | Purpose |
|------|---------|
| `src/lib/webauthn.ts` | CRUD for `user_authenticators` table (service-role client) |
| `src/lib/webauthn/config.ts` | Dynamic RP ID resolution (dev/staging/prod) |
| `src/app/api/auth/webauthn/**` | API route handlers |

### 2.3 Security Controls

- **Challenge cookies** are `httpOnly`, `Secure` (in prod), `SameSite=strict`, and expire in 5 minutes.
- `attestationType: 'none'` — recommended for privacy and broad compatibility.
- `authenticatorAttachment: 'platform'` — enforces Touch ID / Face ID / Windows Hello.
- `userVerification: 'preferred'` — biometric or PIN required when available.
- The `user_authenticators` table is accessed through the **service-role** client to bypass RLS, which is acceptable because the WebAuthn endpoints validate the Supabase session first.

---

## 3. Row-Level Security (RLS)

Every table that stores user data has **RLS enabled** via Supabase Postgres policies.

### 3.1 Policy Patterns

| Pattern | SQL Guard | Example Tables |
|---------|-----------|----------------|
| Owner-only | `auth.uid() = user_id` | `profiles`, `sessions`, `memory`, `journal_entries`, `cq_numbers` |
| Participant access | `auth.uid() IN (participant_1_id, participant_2_id)` | `cq_conversations`, `direct_messages`, `cq_calls` |
| Public read | `true` (SELECT only) | `feature_flags`, `design_toggles`, `features_catalog` |
| Admin-only | `is_admin(auth.uid())` | `audit_logs` |
| Service-role bypass | `TO service_role USING (true)` | Webhooks, audit log inserts, flag management |

### 3.2 Migrations with RLS

All migrations under `supabase/migrations/` enable RLS on new tables:

```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON my_table FOR SELECT
  USING (auth.uid() = user_id);
```

### 3.3 Tables with RLS Enabled

Core: `profiles`, `sessions`, `conversations`, `messages`, `memory`, `events`
Journey: `journey_consents`, `journey_memories`, `journey_rollback_logs`, `journey_metrics`
CQ System: `cq_numbers`, `cq_friend_requests`, `cq_contacts`, `cq_conversations`, `cq_messages`, `cq_calls`, `cq_notifications`, `cq_privacy_settings`, `cq_voice_synthesis`, `cq_premium_status`
Features: `feature_flags`, `feature_flag_audit`, `feature_flag_webhooks`, `features_catalog`, `user_feature_toggles`, `design_toggles`
Admin: `audit_logs`, `sites`, `flag_overrides`, `oauth_tokens`, `action_templates`, `audit_log`, `feature_events`, `integration_configs`
Other: `connections`, `deployments`, `user_integrations`, `journal_entries`, `journal_analytics`, `email_queue`, `friends`, `direct_messages`

---

## 4. Tool Sandboxing

The code-execution subsystem runs user-provided shell commands in a controlled sandbox.

### 4.1 Architecture

```
User request → POST /api/code/terminal
  ↓
Auth guard (Supabase session required)
  ↓
Rate limiter (20 req/min per user)
  ↓
sanitizeCommand() — blocked-pattern + whitelist check
  ↓
Spawned in per-user workspace directory
  ↓
Timeout enforcement (default 30 s)
```

### 4.2 Key Files

| File | Purpose |
|------|---------|
| `src/lib/code-execution/sandbox.ts` | Command sanitisation, path validation, workspace helpers |
| `src/app/api/code/terminal/route.ts` | Terminal API — auth, rate limit, sandbox integration |
| `src/lib/code-execution/index.ts` | High-level client-side API |

### 4.3 Blocked Patterns

The following patterns are rejected before any command is executed:

| Category | Examples |
|----------|----------|
| Destructive | `rm -rf /`, `rm -rf ~/`, `mkfs`, `dd if=` |
| Privilege escalation | `sudo`, `chmod 777` |
| Remote code execution | `curl … \| bash`, `wget … \| sh` |
| System control | `shutdown`, `reboot`, `init 0`, `init 6`, `iptables` |
| Sensitive file access | `/etc/passwd`, `/etc/shadow` |
| Resource exhaustion | Fork bombs `:(){…}` |

### 4.4 Command Whitelist

Only the following interpreters / commands are allowed:

```
node, python, python3, bash, sh, npm, npx, yarn,
pip, pip3, git, ls, cat, echo, mkdir, touch, pwd,
whoami, which, tsx, tsc
```

Any command whose base name is not in this set is rejected with a descriptive error.

### 4.5 Pipe & Redirect Restrictions

- **Single-pipe (`|`)** is blocked to prevent chaining arbitrary commands.
- **`&&` and `||`** are allowed for standard command chaining.
- **Redirects to system directories** (`> /dev/…`, `> /etc/…`) are blocked.

---

## 5. Workspace Isolation

Each user's code executes inside a dedicated workspace directory, preventing cross-user access.

### 5.1 Directory Layout

```
/tmp/cubiqo-workspaces/          ← WORKSPACE_BASE (configurable via CODE_WORKSPACE_BASE)
  ├── <user-uuid-1>/             ← per-user workspace
  │   ├── src/
  │   └── …
  └── <user-uuid-2>/
      └── …
```

### 5.2 How Isolation Is Enforced

1. **Per-user directories** — the terminal API uses the authenticated user's ID (not a client-supplied session ID) as the workspace key.
2. **Path traversal prevention** — `validatePath()` resolves paths and rejects anything outside the workspace root.
3. **HOME override** — the sandbox sets `HOME` to the workspace directory, preventing access to the host user's home.
4. **TMPDIR restriction** — constrained to `/tmp`.
5. **Process limits** — each command has a configurable timeout (default 30 s) and output buffer limit (default 1 MB).

### 5.3 Workspace Lifecycle

| Function | Description |
|----------|-------------|
| `getWorkspaceDir(id, root?)` | Returns the workspace path for a given identifier |
| `ensureWorkspace(id, root?)` | Creates the workspace directory if it doesn't exist |
| `cleanupWorkspace(id, root?)` | Recursively removes the workspace |

---

## 6. Rate Limiting

CubiQo applies in-memory, per-key rate limiting across its API surface.

### 6.1 Shared Utility — `src/lib/rate-limit.ts`

```ts
import { createRateLimiter } from '@/lib/rate-limit'

const limiter = createRateLimiter({ maxRequests: 60, windowMs: 60_000 })

// In a route handler:
const { allowed, remaining, resetAt } = limiter.check(userId)
if (!allowed) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429, headers: { 'Retry-After': … } }
  )
}
```

### 6.2 Current Rate Limits

| Endpoint / Scope | Limit | Window | Key |
|------------------|-------|--------|-----|
| `/api/code/terminal` | 20 req | 1 min | `user.id` |
| `/api/chat` (MiniMax) | 100 req | 1 hour | `sessionId` |
| `/api/tts` | 10 req | 1 min | `sessionId` |
| `/api/stt` | 20 req | 1 min | `sessionId` |

### 6.3 Spending Caps (Cost-Based Limits)

In addition to request-rate limits, spending caps prevent runaway costs:

| Provider | Monthly Cap | Tracked In |
|----------|-------------|------------|
| Anthropic (Claude) | $200 | `src/lib/spending-caps.ts` |
| ElevenLabs TTS | $200 | `src/lib/spending-caps.ts` |

### 6.4 429 Response Format

Rate-limited responses include standard headers:

```
HTTP/1.1 429 Too Many Requests
Retry-After: <seconds-until-reset>
X-RateLimit-Remaining: 0
```

### 6.5 Production Considerations

The current implementation uses in-memory `Map` objects. For horizontal scaling (multiple serverless instances), replace the backing store with:

- **Upstash Redis** (recommended for Vercel Edge) — `@upstash/ratelimit`
- **Supabase table** with atomic increment via RPC
- **Vercel KV** (built-in Redis)

---

## 7. Security Checklist

| # | Control | Status |
|---|---------|--------|
| 1 | Supabase Auth (magic-link, session refresh) | ✅ Implemented |
| 2 | WebAuthn / Passkeys (CubiKey) | ✅ Implemented |
| 3 | Row-Level Security on all user tables | ✅ Implemented |
| 4 | Tool sandboxing (blocked patterns, command whitelist) | ✅ Implemented |
| 5 | Workspace isolation (per-user dirs, path validation) | ✅ Implemented |
| 6 | Rate limiting (shared utility, per-route limits) | ✅ Implemented |
| 7 | Auth guard on terminal/code-execution endpoints | ✅ Implemented |
| 8 | Spending caps for paid APIs | ✅ Implemented |
| 9 | HTTPS-only cookies in production | ✅ Implemented |
| 10 | Migrate rate limiters to Redis for horizontal scale | ⬜ Planned |

---

*Last updated: 2026-02-19*
