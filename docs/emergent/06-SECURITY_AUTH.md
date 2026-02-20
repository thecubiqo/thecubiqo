# Security & Authentication Requirements

## Status: ~75% Implemented

## Overview

The CubiQo platform implements multi-layer security through Supabase authentication, WebAuthn biometrics, Row Level Security (RLS), and encrypted communications. The Emergent Engine extends these with agent-level access control and tool sandboxing.

## Authentication Layer

### Implemented ✅

| Feature | Implementation | Source |
|---------|---------------|--------|
| Supabase Auth | Email/magic link + OAuth | `src/lib/auth/`, `src/app/auth/` |
| WebAuthn/Passkeys | Biometric passwordless login | `@simplewebauthn/browser`, `@simplewebauthn/server` |
| Session management | JWT-based via Supabase | `src/hooks/useAuth.ts`, `src/hooks/useSession.ts` |
| Auth middleware | Route protection | `src/middleware.ts` |
| Founders Pass | Gated access for early users | `src/app/founderpass/`, `src/app/founderspass/` |

### Configuration
```
NEXT_PUBLIC_RP_ID=cubiqo.ai          # WebAuthn Relying Party ID
NEXT_PUBLIC_SUPABASE_URL=xxx         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx    # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=xxx        # Supabase service role (server-side)
```

## Database Security (RLS)

### Required Policies

```sql
-- Admin sees all
CREATE POLICY "admin_all" ON agents FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users see own sessions
CREATE POLICY "user_own_sessions" ON sessions FOR ALL
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Users see own messages
CREATE POLICY "user_own_messages" ON messages FOR ALL
  USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );
```

**Status**: ⚠️ RLS enabled on existing tables; agent-specific policies not yet applied.

## Agent Security

### Tool Sandboxing (Not Implemented ❌)

Each tool must enforce security boundaries:

| Tool | Security Requirement |
|------|---------------------|
| `exec` | Sandboxed shell execution with 30s timeout, restricted to agent workspace |
| `file_read` / `file_write` | Restricted to agent's workspace path, 10MB file limit |
| `browser` | Headless browser isolation, no access to local resources |
| `git` | Only allowed in designated repository paths |
| `deploy` | Requires admin approval for production deployments |

### Agent Workspace Isolation (Not Implemented ❌)

```
Per the spec:
- All agents can READ each other's workspaces
- All agents WRITE only to their own workspace
- HENRY (A1) merges results across workspaces
```

### Tool Approval System (Not Implemented ❌)

```typescript
interface Tool {
  requiresApproval?: boolean;    // Dangerous operations need user OK
  allowedAgents?: string[];      // Which agents can use this tool
}
```

## API Security

### Implemented ✅
- HTTPS/TLS 1.3 encryption (via Vercel)
- Zero Trust database access via Supabase RLS
- Environment variable management for API keys
- CORS configuration in `next.config.js`

### Not Implemented ❌
- API rate limiting per user/agent
- API key management interface (Admin panel)
- Request validation/sanitization middleware
- Audit logging for sensitive operations

## Infrastructure Security

### Architecture ("The Fortress")
From `docs/ARCHITECTURE_V1.md`:
- **Core Brain**: Next.js on Vercel (production + staging)
- **Control Room**: Admin-only routes with elevated access
- **Zero Trust**: All database access through RLS policies
- **TLS 1.3**: All communications encrypted

### Deployment Security
- Staging → Production pipeline
- Feature flags for gradual rollout (`src/config/feature-flags.ts`)
- Production fallback environment
- Environment-specific configuration

## Antivirus & Threat Protection

### Dashboard Status (Implemented ✅)
The user dashboard (`src/app/dashboard/page.tsx`) and admin security page (`src/app/admin/security/page.tsx`) display:
- Real-time antivirus protection status
- Threat scan results and history
- AES-256 data encryption status
- WebAuthn/Passkey configuration status
- Input sanitization, XSS protection, SQL injection prevention

## Implementation Priority

1. **High**: Tool sandboxing (exec, file operations)
2. **High**: Agent workspace isolation
3. **Medium**: API rate limiting
4. **Medium**: Audit logging
5. **Low**: API key management interface

## References
- Source: `src/app/admin/security/page.tsx`
- Source: `src/app/dashboard/page.tsx`
- Source: `docs/ARCHITECTURE_V1.md`
- Source: `CUBIQO_SELF_CODING_ENGINE.md` Part 4 (RLS)
- Source: `src/middleware.ts`
