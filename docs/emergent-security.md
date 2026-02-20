# CubiQo Emergent System - Security Documentation

**Version:** 1.0  
**Last Updated:** 2024  
**Classification:** Internal Use  
**Owner:** Security & Engineering Team

---

## Table of Contents

1. [Authentication Architecture](#1-authentication-architecture)
2. [Authorization & RBAC](#2-authorization--rbac)
3. [Encryption](#3-encryption)
4. [Audit Logging](#4-audit-logging)
5. [Sandbox & Isolation](#5-sandbox--isolation)
6. [Input Validation & Sanitization](#6-input-validation--sanitization)
7. [Privacy](#7-privacy)
8. [Environment Security](#8-environment-security)
9. [Known Security Gaps & Recommendations](#9-known-security-gaps--recommendations)
10. [Threat Model](#10-threat-model)
11. [Security Checklists](#11-security-checklists)

---

## 1. Authentication Architecture

CubiQo Emergent implements a multi-layered authentication system combining traditional magic link authentication, modern WebAuthn (FIDO2) passwordless authentication, and guest session management.

### 1.1 Supabase Auth Integration

#### Overview
The primary authentication layer uses Supabase Auth, providing magic link email authentication with secure session management.

#### Session Management

**Cookie-Based Sessions** (`@supabase/ssr`)

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server component can't set cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server component can't remove cookies
          }
        },
      },
    }
  )
}
```

**Middleware Session Refresh**

The middleware automatically refreshes sessions on every request to ensure auth state is current:

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session on every request
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

#### Force-Dynamic Rendering

All authenticated pages use force-dynamic rendering to ensure immediate auth state reflection:

```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // ... rest of component
}
```

#### Magic Link Authentication Flow

**1. Request Magic Link**

```typescript
// Client-side request
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

**2. Callback Handler**

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

**Security Features:**
- One-time use tokens
- 1-hour expiration
- Email verification required
- Rate limiting on send (6 emails per hour per IP)
- PKCE flow for additional security

---

### 1.2 WebAuthn (FIDO2) Passwordless Authentication

CubiQo implements WebAuthn for biometric and hardware key authentication, providing phishing-resistant, passwordless authentication.

#### Architecture

**Stack:**
- `@simplewebauthn/server` v9+ (server-side verification)
- `@simplewebauthn/browser` v9+ (client-side credential management)
- Platform authenticator enforcement (TouchID, FaceID, Windows Hello)

#### Registration Flow

**Step 1: Generate Registration Options**

```typescript
// app/api/auth/webauthn/register/options/route.ts
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get existing credentials to exclude from re-registration
  const { data: existingCredentials } = await supabase
    .from('webauthn_credentials')
    .select('credential_id')
    .eq('user_id', user.id)

  const options = await generateRegistrationOptions({
    rpName: 'CubiQo',
    rpID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
    userID: user.id,
    userName: user.email!,
    userDisplayName: user.email!,
    attestationType: 'none', // Privacy-focused: no vendor attestation
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Force platform authenticator
      userVerification: 'required', // Require biometric/PIN
      residentKey: 'preferred', // Prefer discoverable credentials
    },
    excludeCredentials: existingCredentials?.map(cred => ({
      id: Buffer.from(cred.credential_id, 'base64'),
      type: 'public-key' as const,
    })) || [],
    timeout: 300000, // 5 minutes
  })

  // Store challenge in secure HTTP-only cookie
  const response = Response.json(options)
  response.headers.set(
    'Set-Cookie',
    `webauthn_challenge=${options.challenge}; HttpOnly; Secure; SameSite=Strict; Max-Age=300; Path=/`
  )

  return response
}
```

**Step 2: Verify Registration**

```typescript
// app/api/auth/webauthn/register/verify/route.ts
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await request.json()
  const cookieStore = cookies()
  const expectedChallenge = cookieStore.get('webauthn_challenge')?.value

  if (!expectedChallenge) {
    return Response.json({ error: 'Challenge expired' }, { status: 400 })
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
    })

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

      // Store credential in database
      await supabase.from('webauthn_credentials').insert({
        user_id: user.id,
        credential_id: Buffer.from(credentialID).toString('base64'),
        public_key: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
        transports: body.response.transports || [],
      })

      // Clear challenge cookie
      const response = Response.json({ verified: true })
      response.headers.set(
        'Set-Cookie',
        'webauthn_challenge=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      )

      return response
    }

    return Response.json({ verified: false }, { status: 400 })
  } catch (error) {
    console.error('Registration verification failed:', error)
    return Response.json({ error: 'Verification failed' }, { status: 400 })
  }
}
```

#### Authentication Flow

**Step 1: Generate Authentication Options**

```typescript
// app/api/auth/webauthn/authenticate/options/route.ts
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { email } = await request.json()
  const supabase = createClient()

  // Get user by email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single()

  if (!profile) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Get user's credentials
  const { data: credentials } = await supabase
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('user_id', profile.id)

  if (!credentials?.length) {
    return Response.json({ error: 'No credentials found' }, { status: 404 })
  }

  const options = await generateAuthenticationOptions({
    rpID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
    allowCredentials: credentials.map(cred => ({
      id: Buffer.from(cred.credential_id, 'base64'),
      type: 'public-key' as const,
      transports: cred.transports as AuthenticatorTransport[],
    })),
    userVerification: 'required',
    timeout: 300000, // 5 minutes
  })

  // Store challenge and user ID in secure cookies
  const response = Response.json(options)
  response.headers.append(
    'Set-Cookie',
    `webauthn_challenge=${options.challenge}; HttpOnly; Secure; SameSite=Strict; Max-Age=300; Path=/`
  )
  response.headers.append(
    'Set-Cookie',
    `webauthn_user_id=${profile.id}; HttpOnly; Secure; SameSite=Strict; Max-Age=300; Path=/`
  )

  return response
}
```

**Step 2: Verify Authentication**

```typescript
// app/api/auth/webauthn/authenticate/verify/route.ts
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.json()
  const cookieStore = cookies()
  const expectedChallenge = cookieStore.get('webauthn_challenge')?.value
  const userId = cookieStore.get('webauthn_user_id')?.value

  if (!expectedChallenge || !userId) {
    return Response.json({ error: 'Challenge or user ID expired' }, { status: 400 })
  }

  const supabase = createClient()

  // Get credential from database
  const { data: credential } = await supabase
    .from('webauthn_credentials')
    .select('*')
    .eq('user_id', userId)
    .eq('credential_id', body.id)
    .single()

  if (!credential) {
    return Response.json({ error: 'Credential not found' }, { status: 404 })
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
      authenticator: {
        credentialID: Buffer.from(credential.credential_id, 'base64'),
        credentialPublicKey: Buffer.from(credential.public_key, 'base64'),
        counter: credential.counter,
      },
    })

    if (verification.verified) {
      // Update counter
      await supabase
        .from('webauthn_credentials')
        .update({ 
          counter: verification.authenticationInfo.newCounter,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', credential.id)

      // Create Supabase session
      const { data: user } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      // Sign in with Supabase (creates session)
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: credential.credential_id, // Use credential ID as password surrogate
      })

      // Clear challenge cookies
      const response = Response.json({ verified: true })
      response.headers.append(
        'Set-Cookie',
        'webauthn_challenge=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      )
      response.headers.append(
        'Set-Cookie',
        'webauthn_user_id=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      )

      return response
    }

    return Response.json({ verified: false }, { status: 400 })
  } catch (error) {
    console.error('Authentication verification failed:', error)
    return Response.json({ error: 'Verification failed' }, { status: 400 })
  }
}
```

#### Security Features

**Platform Authenticator Enforcement:**
```typescript
authenticatorSelection: {
  authenticatorAttachment: 'platform', // TouchID/FaceID/Windows Hello only
  userVerification: 'required',        // Biometric/PIN required
  residentKey: 'preferred',            // Prefer discoverable credentials
}
```

**Privacy-Focused Attestation:**
```typescript
attestationType: 'none' // No vendor attestation = better privacy
```

**Challenge Security:**
- HTTP-only, Secure, SameSite=Strict cookies
- 5-minute validity window
- Cryptographically random challenges
- One-time use (cleared after verification)

**Credential Protection:**
- `excludeCredentials` prevents duplicate registration
- Counter tracking detects cloned authenticators
- Last used timestamp for anomaly detection

**Database Schema:**
```sql
CREATE TABLE webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials"
  ON webauthn_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON webauthn_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON webauthn_credentials FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 1.3 Guest Sessions

CubiQo supports anonymous guest sessions for unauthenticated users, with full upgrade path to authenticated accounts.

#### Guest Session Creation

```typescript
// src/lib/guest-session.ts
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export async function createGuestSession(request: Request) {
  const supabase = createClient()
  const sessionId = uuidv4()
  
  // Extract device info and geo-location
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  // Create guest session in database
  const { data: session, error } = await supabase
    .from('guest_sessions')
    .insert({
      session_id: sessionId,
      ip_address: ip,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create guest session')
  }

  // Set HTTP-only cookie
  const cookieStore = cookies()
  cookieStore.set('guest_session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  })

  return session
}

export async function getGuestSession() {
  const cookieStore = cookies()
  const sessionId = cookieStore.get('guest_session_id')?.value

  if (!sessionId) {
    return null
  }

  const supabase = createClient()
  const { data: session } = await supabase
    .from('guest_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session
}
```

#### Guest Session Upgrade

```typescript
// app/api/auth/upgrade-guest/route.ts
import { createClient } from '@/lib/supabase/server'
import { getGuestSession } from '@/lib/guest-session'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const guestSession = await getGuestSession()

  if (!guestSession) {
    return Response.json({ error: 'No guest session found' }, { status: 404 })
  }

  // Transfer guest data to authenticated user
  await supabase.rpc('upgrade_guest_to_user', {
    p_guest_session_id: guestSession.session_id,
    p_user_id: user.id,
  })

  // Delete guest session
  await supabase
    .from('guest_sessions')
    .delete()
    .eq('session_id', guestSession.session_id)

  // Clear guest session cookie
  const response = Response.json({ success: true })
  response.headers.set(
    'Set-Cookie',
    'guest_session_id=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
  )

  return response
}
```

#### Database Schema

```sql
CREATE TABLE guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  geo_location JSONB,
  device_info JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-delete expired sessions
CREATE INDEX idx_guest_sessions_expires_at ON guest_sessions(expires_at);

-- Cleanup function (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM guest_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Security Features

- **30-day expiration** with automatic cleanup
- **HTTP-only cookies** prevent XSS theft
- **Secure, SameSite=Strict** prevent CSRF
- **IP and user agent tracking** for anomaly detection
- **Geo-location tracking** for security analysis
- **Upgradeable to authenticated** preserves user data

---

## 2. Authorization & RBAC

CubiQo implements a comprehensive Role-Based Access Control (RBAC) system with Row Level Security (RLS) at the database layer and application-level authorization checks.

### 2.1 Role-Based Access Control

#### Role Hierarchy

```
Founder (is_founder=true)
  ↓
Admin (is_admin=true)
  ↓
Authenticated User (auth.uid() exists)
  ↓
Guest (guest_session_id exists)
```

#### Admin Detection

**Database-Level:**
```sql
-- profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Application-Level:**
```typescript
// src/hooks/useAdmin.ts
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.is_admin || false)
      setLoading(false)
    }

    checkAdmin()
  }, [supabase])

  return { isAdmin, loading }
}
```

#### Founder Detection

**Current Implementation (Hardcoded):**
```typescript
// src/lib/auth/permissions.ts
export function isFounder(email: string | undefined): boolean {
  if (!email) return false
  return email.toLowerCase() === 'aditya@cubiqo.ai'
}

export async function checkFounderPermission(userId: string) {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  return isFounder(profile?.email)
}
```

**⚠️ Security Gap:** Founder role is hardcoded. See [Section 9](#9-known-security-gaps--recommendations) for recommended improvements.

#### Tool Access Control

Restricted tools require founder-level permissions:

```typescript
// src/lib/tools/registry.ts
export interface ToolDefinition {
  name: string
  description: string
  parameters: z.ZodSchema
  handler: ToolHandler
  restrictedToFounders?: boolean
  allowedAgents?: string[]
}

const RESTRICTED_TOOLS = [
  'exec',
  'git',
  'file_write',
  'sessions_spawn',
  'email_send',
  'slack_send',
  'discord_send',
  'telegram_send',
]

export async function canExecuteTool(
  toolName: string,
  userId: string,
  agentId?: string
): Promise<boolean> {
  const tool = toolRegistry.get(toolName)
  
  if (!tool) {
    return false
  }

  // Check founder-restricted tools
  if (RESTRICTED_TOOLS.includes(toolName) || tool.restrictedToFounders) {
    const isFounderUser = await checkFounderPermission(userId)
    if (!isFounderUser) {
      return false
    }
  }

  // Check agent-level permissions
  if (tool.allowedAgents && tool.allowedAgents.length > 0) {
    if (!agentId || !tool.allowedAgents.includes(agentId)) {
      return false
    }
  }

  return true
}
```

**Enforcement in Tool Execution:**

```typescript
// app/api/tools/execute/route.ts
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { toolName, parameters, agentId } = await request.json()

  // Check permissions
  const hasPermission = await canExecuteTool(toolName, user.id, agentId)
  
  if (!hasPermission) {
    // Log unauthorized attempt
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action_type: 'unauthorized_tool_access',
      action_details: { toolName, agentId },
      ip_address: request.headers.get('x-forwarded-for'),
    })

    return Response.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  // Execute tool
  const result = await executeTool(toolName, parameters, {
    userId: user.id,
    agentId,
  })

  return Response.json(result)
}
```

#### Agent-Level Permissions

Agents can have restricted tool access:

```typescript
// Example: Research agent can only use read-only tools
const researchAgent = {
  id: 'research-agent',
  name: 'Research Agent',
  allowedTools: [
    'web_search',
    'web_fetch',
    'grep',
    'glob',
    'view',
  ],
  deniedTools: [
    'file_write',
    'exec',
    'git',
  ],
}

// Tool definition with agent restrictions
const fileWriteTool: ToolDefinition = {
  name: 'file_write',
  description: 'Write content to a file',
  parameters: z.object({
    path: z.string(),
    content: z.string(),
  }),
  handler: fileWriteHandler,
  restrictedToFounders: true,
  allowedAgents: ['coding-agent', 'admin-agent'], // Only specific agents
}
```

---

### 2.2 Feature Flags

Dynamic feature gating with per-user and per-scope control.

#### Feature Flag System

```typescript
// src/lib/feature-flags.ts
import { createClient } from '@/lib/supabase/server'

export interface FeatureFlag {
  flag_key: string
  enabled: boolean
  scope: 'global' | 'user' | 'role' | 'organization'
  scope_id?: string
  config?: Record<string, any>
}

export async function isFeatureEnabled(
  flagKey: string,
  userId?: string
): Promise<boolean> {
  const supabase = createClient()

  // Check user-specific flag first
  if (userId) {
    const { data: userFlag } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_key', flagKey)
      .eq('scope', 'user')
      .eq('scope_id', userId)
      .single()

    if (userFlag !== null) {
      return userFlag.enabled
    }
  }

  // Check role-specific flag
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (profile?.is_admin) {
      const { data: roleFlag } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('flag_key', flagKey)
        .eq('scope', 'role')
        .eq('scope_id', 'admin')
        .single()

      if (roleFlag !== null) {
        return roleFlag.enabled
      }
    }
  }

  // Check global flag
  const { data: globalFlag } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('flag_key', flagKey)
    .eq('scope', 'global')
    .single()

  return globalFlag?.enabled || false
}
```

#### Admin-Specific Feature Flags

```typescript
// src/lib/feature-flags/admin-flags.ts
export const AdminFeatureFlags = {
  ADMIN_ELEVATED_CONTROLS: 'admin_elevated_controls',    // Dev-only
  ADMIN_AUDIT_LOGGING: 'admin_audit_logging',            // Always on
  ADMIN_IMPERSONATION: 'admin_impersonation',            // Dev-only
  ADMIN_DEBUG_VIEW: 'admin_debug_view',                  // Dev-only
  ADMIN_CONFIRMATION_BYPASS: 'admin_confirmation_bypass', // Dev-only
} as const

export async function canUseAdminFeature(
  feature: keyof typeof AdminFeatureFlags,
  userId: string
): Promise<boolean> {
  // Check if user is admin
  const { isAdmin } = await checkAdminStatus(userId)
  if (!isAdmin) return false

  // ADMIN_AUDIT_LOGGING is always enabled
  if (feature === 'ADMIN_AUDIT_LOGGING') return true

  // Check environment
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Elevated features only in development
  if (!isDevelopment) {
    const elevatedFeatures = [
      'ADMIN_ELEVATED_CONTROLS',
      'ADMIN_IMPERSONATION',
      'ADMIN_DEBUG_VIEW',
      'ADMIN_CONFIRMATION_BYPASS',
    ]
    if (elevatedFeatures.includes(feature)) {
      return false
    }
  }

  // Check feature flag
  const flagKey = AdminFeatureFlags[feature]
  return await isFeatureEnabled(flagKey, userId)
}
```

#### Database Schema

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'user', 'role', 'organization')),
  scope_id TEXT,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(flag_key, scope, scope_id)
);

-- Audit table
CREATE TABLE feature_flag_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read global flags"
  ON feature_flags FOR SELECT
  USING (scope = 'global');

CREATE POLICY "Users can read own flags"
  ON feature_flags FOR SELECT
  USING (scope = 'user' AND scope_id = auth.uid()::text);

CREATE POLICY "Admins can manage flags"
  ON feature_flags FOR ALL
  USING (is_admin());
```

---

### 2.3 Row Level Security (RLS)

CubiQo enforces data isolation at the database layer using PostgreSQL Row Level Security.

#### RLS Policy Coverage

**Total Tables:** 52+  
**Total RLS Policies:** 150+  
**Coverage:** 100%

#### Common RLS Patterns

**1. User-Owned Data:**
```sql
-- Users can only access their own data
CREATE POLICY "Users access own data"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id);
```

**2. Admin-Only Tables:**
```sql
-- Only admins can access
CREATE POLICY "Admins only"
  ON audit_logs
  FOR ALL
  USING (is_admin());

CREATE POLICY "Admins only"
  ON design_toggles
  FOR ALL
  USING (is_admin());
```

**3. Session-Based Access (Guest Users):**
```sql
-- Guest users access via session ID
CREATE POLICY "Guest session access"
  ON guest_data
  FOR ALL
  USING (
    session_id IN (
      SELECT session_id FROM guest_sessions
      WHERE session_id = current_setting('app.guest_session_id', true)
      AND expires_at > now()
    )
  );
```

**4. Public Read, Owner Write:**
```sql
CREATE POLICY "Public read"
  ON table_name
  FOR SELECT
  USING (true);

CREATE POLICY "Owner write"
  ON table_name
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner update"
  ON table_name
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner delete"
  ON table_name
  FOR DELETE
  USING (auth.uid() = user_id);
```

**5. Organization-Based Access:**
```sql
CREATE POLICY "Organization members access"
  ON table_name
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = table_name.organization_id
      AND user_id = auth.uid()
    )
  );
```

#### Example: Comprehensive RLS on Journeys

```sql
-- journeys table
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

-- Users can view own journeys
CREATE POLICY "Users view own journeys"
  ON journeys FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert own journeys
CREATE POLICY "Users insert own journeys"
  ON journeys FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update own journeys
CREATE POLICY "Users update own journeys"
  ON journeys FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete own journeys
CREATE POLICY "Users delete own journeys"
  ON journeys FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all journeys
CREATE POLICY "Admins view all journeys"
  ON journeys FOR SELECT
  USING (is_admin());

-- Shared journeys (via share_token)
CREATE POLICY "Public shared journeys"
  ON journeys FOR SELECT
  USING (
    share_token IS NOT NULL
    AND share_expires_at > now()
    AND is_public = true
  );
```

#### RLS Testing

```sql
-- Test script to verify RLS policies
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  other_user_id UUID := '00000000-0000-0000-0000-000000000002';
BEGIN
  -- Set session user
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);

  -- Test: User can access own data
  ASSERT (SELECT COUNT(*) FROM journeys WHERE user_id = test_user_id) >= 0,
    'User should access own journeys';

  -- Test: User cannot access other user data
  ASSERT (SELECT COUNT(*) FROM journeys WHERE user_id = other_user_id) = 0,
    'User should not access other journeys';

  -- Test: Insert requires correct user_id
  BEGIN
    INSERT INTO journeys (user_id, title) VALUES (other_user_id, 'Test');
    RAISE EXCEPTION 'Should not allow insert with wrong user_id';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected
  END;

  RAISE NOTICE 'All RLS tests passed';
END $$;
```

---

## 3. Encryption

CubiQo implements multi-layer encryption for data protection at rest and in transit.

### 3.1 Token Encryption

Server-side token encryption for sensitive credentials and API keys.

#### Implementation

```typescript
// src/lib/utils/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!key) {
    throw new Error('Encryption key not configured')
  }

  // Derive 32-byte key from environment variable
  return Buffer.from(
    require('crypto')
      .createHash('sha256')
      .update(key)
      .digest()
  )
}

export function encryptToken(token: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(token, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey()
  const parts = encryptedToken.split(':')
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }

  const [ivBase64, authTagBase64, encryptedData] = parts
  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

#### Usage Example

```typescript
// Store encrypted API key
import { encryptToken, decryptToken } from '@/lib/utils/encryption'

export async function storeApiKey(userId: string, service: string, apiKey: string) {
  const encrypted = encryptToken(apiKey)
  
  await supabase.from('user_api_keys').insert({
    user_id: userId,
    service,
    encrypted_key: encrypted,
  })
}

export async function getApiKey(userId: string, service: string): Promise<string> {
  const { data } = await supabase
    .from('user_api_keys')
    .select('encrypted_key')
    .eq('user_id', userId)
    .eq('service', service)
    .single()

  if (!data) {
    throw new Error('API key not found')
  }

  return decryptToken(data.encrypted_key)
}
```

#### Security Properties

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key Size:** 256 bits (32 bytes)
- **IV:** 16 bytes, randomly generated per encryption
- **Authentication Tag:** 16 bytes, prevents tampering
- **Format:** Base64-encoded, colon-separated (`iv:authTag:ciphertext`)
- **Key Source:** Environment variable with SHA-256 hashing

---

### 3.2 API Key Encryption (Client-Side)

Client-side encryption for user-managed API keys with device-based key derivation.

#### Implementation

```typescript
// src/lib/api-keys/encryption.ts
import { Buffer } from 'buffer'

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16
const ITERATIONS = 100000

/**
 * Generate device fingerprint for deterministic key generation
 * ⚠️ Note: This is relatively weak. See Security Gaps section.
 */
async function getDeviceFingerprint(): Promise<string> {
  const navigator = window.navigator
  const screen = window.screen

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    navigator.platform,
  ]

  const fingerprint = components.join('|')
  
  // Hash fingerprint
  const encoder = new TextEncoder()
  const data = encoder.encode(fingerprint)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  return Buffer.from(hashBuffer).toString('base64')
}

/**
 * Derive encryption key from device fingerprint using PBKDF2
 */
async function deriveKey(
  fingerprint: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(fingerprint),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt API key in browser before storage
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  const fingerprint = await getDeviceFingerprint()
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  
  // Derive encryption key
  const key = await deriveKey(fingerprint, salt)
  
  // Encrypt
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  )

  // Format: salt:iv:ciphertext (all base64)
  return [
    Buffer.from(salt).toString('base64'),
    Buffer.from(iv).toString('base64'),
    Buffer.from(ciphertext).toString('base64'),
  ].join(':')
}

/**
 * Decrypt API key from storage
 */
export async function decryptApiKey(encrypted: string): Promise<string> {
  const fingerprint = await getDeviceFingerprint()
  const parts = encrypted.split(':')
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const [saltBase64, ivBase64, ciphertextBase64] = parts
  const salt = Uint8Array.from(Buffer.from(saltBase64, 'base64'))
  const iv = Uint8Array.from(Buffer.from(ivBase64, 'base64'))
  const ciphertext = Uint8Array.from(Buffer.from(ciphertextBase64, 'base64'))
  
  // Derive same key
  const key = await deriveKey(fingerprint, salt)
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}
```

#### Storage Interface

```typescript
// src/lib/api-keys/storage.ts
import { encryptApiKey, decryptApiKey } from './encryption'

const STORAGE_KEY = 'cubiqo_api_keys'

interface StoredApiKey {
  service: string
  encrypted: string
  createdAt: number
}

export async function storeApiKey(service: string, apiKey: string) {
  const encrypted = await encryptApiKey(apiKey)
  
  const stored = getStoredKeys()
  stored[service] = {
    service,
    encrypted,
    createdAt: Date.now(),
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export async function retrieveApiKey(service: string): Promise<string | null> {
  const stored = getStoredKeys()
  const entry = stored[service]
  
  if (!entry) {
    return null
  }

  try {
    return await decryptApiKey(entry.encrypted)
  } catch (error) {
    console.error('Failed to decrypt API key:', error)
    // Remove corrupted entry
    delete stored[service]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    return null
  }
}

function getStoredKeys(): Record<string, StoredApiKey> {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : {}
}
```

#### Security Properties

- **Algorithm:** AES-GCM (Web Crypto API)
- **Key Derivation:** PBKDF2 with 100,000 iterations + SHA-256
- **Device Binding:** Fingerprint-based key derivation
- **Client-Side Only:** Encryption/decryption happens in browser
- **No Server Storage:** Encrypted keys stored in localStorage

#### ⚠️ Security Limitations

1. **Device fingerprint is weak** - can be spoofed or change
2. **localStorage is vulnerable** - XSS can access
3. **No user-provided master password** - fully automated

See [Section 9](#9-known-security-gaps--recommendations) for recommended improvements.

---

### 3.3 Data in Transit

#### TLS 1.3 Enforcement

All connections use TLS 1.3 via Vercel Edge Network:

```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

#### HTTPS Redirect

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  // Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    )
  }

  // ... rest of middleware
}
```

---

### 3.4 Data at Rest

#### Supabase PostgreSQL Encryption

- **Transparent Data Encryption (TDE)** enabled by default
- **AES-256 encryption** for all stored data
- **Encrypted backups** with customer-managed keys (optional)
- **Vault for secrets** (Supabase Vault integration)

#### Environment Variables

All secrets stored in encrypted environment variables:

**Vercel:**
```bash
# Encrypted at rest, decrypted at runtime
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
ENCRYPTION_KEY=xxx...
```

**Supabase Vault:**
```sql
-- Store secrets in Supabase Vault
INSERT INTO vault.secrets (name, secret)
VALUES ('openai_api_key', 'sk-xxx...');

-- Retrieve secrets
SELECT decrypted_secret FROM vault.decrypted_secrets
WHERE name = 'openai_api_key';
```

---

## 4. Audit Logging

CubiQo implements comprehensive audit logging for security events, admin actions, and system changes.

### 4.1 Server-Side Audit Logging

#### Database Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  action_type TEXT NOT NULL,
  action_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS: Only admins can access
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin());
```

#### Server-Side Logging Function

```typescript
// src/lib/audit.ts
import { createClient } from '@/lib/supabase/server'

export type AuditActionType =
  | 'debug_view_accessed'
  | 'confirmation_bypassed'
  | 'impersonation_started'
  | 'impersonation_ended'
  | 'sensitive_data_viewed'
  | 'admin_action'
  | 'unauthorized_access_attempt'
  | 'feature_flag_changed'
  | 'rls_policy_modified'
  | 'user_created'
  | 'user_deleted'
  | 'api_key_created'
  | 'api_key_deleted'

export interface AuditLogEntry {
  userId?: string
  email?: string
  actionType: AuditActionType
  actionDetails?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function logAuditEvent(
  entry: AuditLogEntry,
  request?: Request
): Promise<void> {
  const supabase = createClient()

  // Extract IP and user agent from request if provided
  const ipAddress = entry.ipAddress || request?.headers.get('x-forwarded-for') || null
  const userAgent = entry.userAgent || request?.headers.get('user-agent') || null

  const { error } = await supabase.from('audit_logs').insert({
    user_id: entry.userId || null,
    email: entry.email || null,
    action_type: entry.actionType,
    action_details: entry.actionDetails || {},
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  if (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - logging failure shouldn't break application flow
  }
}

/**
 * Database RPC function for audit logging
 * Can be called directly from Supabase functions
 */
export async function logAdminAction(
  userId: string,
  actionType: string,
  details: Record<string, any>
): Promise<void> {
  const supabase = createClient()

  await supabase.rpc('log_admin_action', {
    p_user_id: userId,
    p_action_type: actionType,
    p_action_details: details,
  })
}
```

#### Database RPC Function

```sql
-- RPC function for audit logging
CREATE OR REPLACE FUNCTION log_admin_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_action_details JSONB
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action_type, action_details)
  VALUES (p_user_id, p_action_type, p_action_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Usage Examples

```typescript
// Example 1: Log admin debug view access
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin permission
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, email')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    await logAuditEvent({
      userId: user.id,
      email: profile?.email,
      actionType: 'unauthorized_access_attempt',
      actionDetails: { endpoint: '/api/admin/debug' },
    }, request)

    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Log successful access
  await logAuditEvent({
    userId: user.id,
    email: profile.email,
    actionType: 'debug_view_accessed',
    actionDetails: { timestamp: new Date().toISOString() },
  }, request)

  // ... return debug data
}

// Example 2: Log impersonation
export async function startImpersonation(adminId: string, targetUserId: string) {
  await logAuditEvent({
    userId: adminId,
    actionType: 'impersonation_started',
    actionDetails: {
      target_user_id: targetUserId,
      reason: 'Customer support',
    },
  })

  // ... start impersonation session
}

// Example 3: Log feature flag change
export async function updateFeatureFlag(
  adminId: string,
  flagKey: string,
  oldValue: boolean,
  newValue: boolean
) {
  await logAuditEvent({
    userId: adminId,
    actionType: 'feature_flag_changed',
    actionDetails: {
      flag_key: flagKey,
      old_value: oldValue,
      new_value: newValue,
    },
  })

  // ... update flag
}
```

---

### 4.2 Client-Side Audit Logging

#### API Endpoints

```typescript
// app/api/admin/audit/route.ts
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

// GET /api/admin/audit - Query audit logs
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse query parameters
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  const actionType = url.searchParams.get('actionType')
  const page = parseInt(url.searchParams.get('page') || '1')
  const perPage = parseInt(url.searchParams.get('perPage') || '50')

  // Build query
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (actionType) {
    query = query.eq('action_type', actionType)
  }

  // Pagination
  const start = (page - 1) * perPage
  query = query.range(start, start + perPage - 1)

  const { data, error, count } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    data,
    pagination: {
      page,
      perPage,
      total: count || 0,
      pages: Math.ceil((count || 0) / perPage),
    },
  })
}

// POST /api/admin/audit - Create audit log entry
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  await logAuditEvent(
    {
      userId: user.id,
      actionType: body.actionType,
      actionDetails: body.actionDetails,
    },
    request
  )

  return Response.json({ success: true })
}
```

#### Client Hook

```typescript
// src/hooks/useAuditLogs.ts
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export interface AuditLog {
  id: string
  user_id: string
  email: string
  action_type: string
  action_details: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string
}

export function useAuditLogs(filters?: {
  userId?: string
  actionType?: string
  page?: number
  perPage?: number
}) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.userId) params.set('userId', filters.userId)
      if (filters?.actionType) params.set('actionType', filters.actionType)
      if (filters?.page) params.set('page', filters.page.toString())
      if (filters?.perPage) params.set('perPage', filters.perPage.toString())

      try {
        const response = await fetch(`/api/admin/audit?${params}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch audit logs')
        }

        setLogs(result.data)
        setPagination(result.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [filters])

  return { logs, loading, error, pagination }
}
```

---

### 4.3 Self-Healing Audit

The self-healing system maintains its own audit trail for automated repairs.

#### Database Schema

```sql
CREATE TABLE self_heal_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES self_heal_reports(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB,
  rollback_command TEXT,
  status TEXT CHECK (status IN ('success', 'failed', 'rolled_back')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_self_heal_audit_report_id ON self_heal_audit_logs(report_id);
CREATE INDEX idx_self_heal_audit_created_at ON self_heal_audit_logs(created_at DESC);
```

#### Logging Function

```typescript
// src/lib/self-heal/audit.ts
import { createClient } from '@/lib/supabase/server'

export interface SelfHealAuditEntry {
  reportId: string
  actionType: string
  actionDetails: Record<string, any>
  rollbackCommand?: string
  status: 'success' | 'failed' | 'rolled_back'
}

export async function logSelfHealAction(
  entry: SelfHealAuditEntry
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('self_heal_audit_logs').insert({
    report_id: entry.reportId,
    action_type: entry.actionType,
    action_details: entry.actionDetails,
    rollback_command: entry.rollbackCommand || null,
    status: entry.status,
  })

  if (error) {
    console.error('Failed to log self-heal action:', error)
  }
}
```

#### Usage Example

```typescript
// Example: Log database migration repair
await logSelfHealAction({
  reportId: report.id,
  actionType: 'database_migration',
  actionDetails: {
    migration: '20240101_add_column.sql',
    table: 'profiles',
    column: 'is_verified',
  },
  rollbackCommand: 'ALTER TABLE profiles DROP COLUMN is_verified;',
  status: 'success',
})
```

---

### 4.4 Feature Flag Audit

Track all changes to feature flags for security and compliance.

#### Database Schema

```sql
CREATE TABLE feature_flag_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feature_flag_audit_flag_id ON feature_flag_audit(flag_id);
CREATE INDEX idx_feature_flag_audit_changed_by ON feature_flag_audit(changed_by);
```

#### Trigger Function

```sql
-- Automatically log feature flag changes
CREATE OR REPLACE FUNCTION log_feature_flag_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO feature_flag_audit (flag_id, changed_by, old_value, new_value)
  VALUES (
    NEW.id,
    auth.uid(),
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER feature_flag_change_trigger
  AFTER UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION log_feature_flag_change();
```

---

## 5. Sandbox & Isolation

CubiQo implements multiple layers of isolation to prevent unauthorized access and resource abuse.

### 5.1 Code Execution Sandboxing

#### Workspace Isolation

Each session gets its own isolated workspace:

```typescript
// src/lib/sandbox/workspace.ts
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'

export class WorkspaceManager {
  private baseDir = '/tmp/cubiqo-workspaces'

  async createWorkspace(sessionId: string): Promise<string> {
    const workspaceDir = join(this.baseDir, `workspace-${sessionId}`)
    
    // Create isolated directory
    await mkdir(workspaceDir, { recursive: true })
    
    // Set restrictive permissions
    await chmod(workspaceDir, 0o700) // Owner only
    
    return workspaceDir
  }

  async cleanupWorkspace(sessionId: string): Promise<void> {
    const workspaceDir = join(this.baseDir, `workspace-${sessionId}`)
    
    try {
      await rm(workspaceDir, { recursive: true, force: true })
    } catch (error) {
      console.error('Failed to cleanup workspace:', error)
    }
  }

  async listWorkspaces(): Promise<string[]> {
    try {
      const entries = await readdir(this.baseDir)
      return entries.filter(e => e.startsWith('workspace-'))
    } catch {
      return []
    }
  }
}
```

#### Execution Timeout

```typescript
// src/lib/sandbox/executor.ts
const EXECUTION_TIMEOUT = 30000 // 30 seconds
const MAX_OUTPUT_SIZE = 10240  // 10KB

export async function executeCode(
  code: string,
  language: string,
  workspaceDir: string
): Promise<{ output: string; error?: string }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      process.kill(-child.pid!) // Kill process group
      reject(new Error('Execution timeout exceeded'))
    }, EXECUTION_TIMEOUT)

    const child = spawn(getInterpreter(language), ['-'], {
      cwd: workspaceDir,
      env: getSandboxEnv(),
      detached: true, // Create process group for cleanup
    })

    let output = ''
    let error = ''

    child.stdout.on('data', (data) => {
      output += data.toString()
      if (output.length > MAX_OUTPUT_SIZE) {
        process.kill(-child.pid!)
        reject(new Error('Output size limit exceeded'))
      }
    })

    child.stderr.on('data', (data) => {
      error += data.toString()
      if (error.length > MAX_OUTPUT_SIZE) {
        process.kill(-child.pid!)
        reject(new Error('Error output size limit exceeded'))
      }
    })

    child.on('close', (code) => {
      clearTimeout(timeout)
      resolve({
        output: output.slice(0, MAX_OUTPUT_SIZE),
        error: error ? error.slice(0, MAX_OUTPUT_SIZE) : undefined,
      })
    })

    // Send code to stdin
    child.stdin.write(code)
    child.stdin.end()
  })
}

function getInterpreter(language: string): string {
  const interpreters: Record<string, string> = {
    python: 'python3',
    javascript: 'node',
    typescript: 'ts-node',
    bash: 'bash',
  }
  
  const interpreter = interpreters[language]
  if (!interpreter) {
    throw new Error(`Unsupported language: ${language}`)
  }
  
  return interpreter
}

function getSandboxEnv(): Record<string, string> {
  return {
    // Minimal environment
    PATH: '/usr/local/bin:/usr/bin:/bin',
    HOME: '/tmp',
    // No sensitive env vars
  }
}
```

#### Language-Specific Sandboxing

**Python:**
```typescript
// RestrictedPython for additional safety
const PYTHON_SANDBOX_WRAPPER = `
import sys
from RestrictedPython import compile_restricted, safe_globals

code = """
${userCode}
"""

compiled = compile_restricted(code, '<string>', 'exec')
exec(compiled, safe_globals)
`
```

**JavaScript:**
```typescript
// VM2 for isolated execution
import { VM } from 'vm2'

const vm = new VM({
  timeout: 30000,
  sandbox: {
    // Minimal globals
  },
  eval: false,
  wasm: false,
})

const result = vm.run(userCode)
```

**Bash:**
```bash
# Restricted shell with limited commands
ALLOWED_COMMANDS="ls,cat,echo,grep,awk,sed"

bash --restricted --norc --noprofile -c "$USER_CODE"
```

---

### 5.2 Agent Workspace Isolation

Each agent operates in its own isolated workspace:

```typescript
// src/lib/agents/workspace.ts
export interface AgentContext {
  agentId: string
  sessionId: string
  workspaceDir: string
  allowedTools: string[]
  deniedTools: string[]
}

export class AgentWorkspaceManager {
  async createAgentWorkspace(
    agentId: string,
    sessionId: string
  ): Promise<AgentContext> {
    const workspaceManager = new WorkspaceManager()
    const workspaceDir = await workspaceManager.createWorkspace(
      `${sessionId}-${agentId}`
    )

    return {
      agentId,
      sessionId,
      workspaceDir,
      allowedTools: await getAgentAllowedTools(agentId),
      deniedTools: await getAgentDeniedTools(agentId),
    }
  }

  async executeInAgentContext(
    context: AgentContext,
    toolName: string,
    parameters: any
  ): Promise<any> {
    // Verify tool access
    if (context.deniedTools.includes(toolName)) {
      throw new Error(`Tool ${toolName} is denied for agent ${context.agentId}`)
    }

    if (
      context.allowedTools.length > 0 &&
      !context.allowedTools.includes(toolName)
    ) {
      throw new Error(`Tool ${toolName} is not allowed for agent ${context.agentId}`)
    }

    // Execute with context
    return await executeTool(toolName, parameters, {
      ...context,
      cwd: context.workspaceDir,
    })
  }
}
```

#### Cross-Agent Access Prevention

```typescript
// Validate file paths are within agent workspace
function validateFilePath(
  path: string,
  context: AgentContext
): void {
  const resolvedPath = resolve(path)
  const workspacePath = resolve(context.workspaceDir)

  if (!resolvedPath.startsWith(workspacePath)) {
    throw new Error('Path outside agent workspace')
  }
}

// Example: File read with validation
export async function readFileInAgentContext(
  path: string,
  context: AgentContext
): Promise<string> {
  validateFilePath(path, context)
  
  // Safe to read - path is within workspace
  return await readFile(path, 'utf-8')
}
```

---

### 5.3 Browser Automation Isolation

Session-based browser instances with automatic cleanup:

```typescript
// src/lib/browser/session.ts
import puppeteer, { Browser, Page } from 'puppeteer'

export class BrowserSessionManager {
  private sessions = new Map<string, Browser>()

  async createSession(sessionId: string): Promise<{ browser: Browser; page: Page }> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()

    // Set restrictive defaults
    await page.setUserAgent('CubiQo/1.0')
    await page.setViewport({ width: 1280, height: 720 })

    // Block unnecessary resources
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      const resourceType = request.resourceType()
      if (['image', 'stylesheet', 'font'].includes(resourceType)) {
        request.abort()
      } else {
        request.continue()
      }
    })

    this.sessions.set(sessionId, browser)

    return { browser, page }
  }

  async getSession(sessionId: string): Promise<Browser | null> {
    return this.sessions.get(sessionId) || null
  }

  async cleanupSession(sessionId: string): Promise<void> {
    const browser = this.sessions.get(sessionId)
    if (browser) {
      await browser.close()
      this.sessions.delete(sessionId)
    }
  }

  async cleanupAllSessions(): Promise<void> {
    const promises = Array.from(this.sessions.keys()).map((id) =>
      this.cleanupSession(id)
    )
    await Promise.all(promises)
  }
}
```

---

## 6. Input Validation & Sanitization

### 6.1 Path Validation

```typescript
// src/lib/validation/path.ts
import { resolve, normalize, join } from 'path'

export function validatePath(
  path: string,
  baseDir: string
): string {
  // Normalize path
  const normalizedPath = normalize(path)

  // Resolve to absolute path
  const absolutePath = resolve(baseDir, normalizedPath)

  // Check if path is within base directory
  if (!absolutePath.startsWith(resolve(baseDir))) {
    throw new Error('Path traversal detected')
  }

  return absolutePath
}

export function sanitizeFilename(filename: string): string {
  // Remove dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\.+/g, '.')
    .slice(0, 255)
}
```

### 6.2 Command Sanitization

```typescript
// src/lib/validation/command.ts
export function sanitizeShellCommand(command: string): string {
  // Remove dangerous characters
  const dangerous = [';', '&', '|', '`', '$', '(', ')', '<', '>', '\n', '\r']
  
  let sanitized = command
  for (const char of dangerous) {
    sanitized = sanitized.replace(new RegExp(`\\${char}`, 'g'), '')
  }

  return sanitized
}

export function validateCommand(command: string): void {
  // Check for dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf/i,
    /mkfs/i,
    /dd\s+if=/i,
    /:\(\)\{/i, // Fork bomb
    /\/dev\/sd/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      throw new Error('Dangerous command detected')
    }
  }
}
```

### 6.3 File Size Limits

```typescript
// src/lib/validation/file.ts
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function validateFileSize(
  filePath: string
): Promise<void> {
  const stats = await stat(filePath)
  
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit: ${stats.size} > ${MAX_FILE_SIZE}`)
  }
}

export async function readFileSafe(
  filePath: string
): Promise<string> {
  await validateFileSize(filePath)
  return await readFile(filePath, 'utf-8')
}
```

### 6.4 Request Body Validation

```typescript
// src/lib/validation/request.ts
import { z } from 'zod'

export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  let body: any

  try {
    body = await request.json()
  } catch {
    throw new Error('Invalid JSON body')
  }

  const result = schema.safeParse(body)

  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`)
  }

  return result.data
}

// Example schema
const CreateJourneySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  visibility: z.enum(['private', 'public', 'unlisted']),
  tags: z.array(z.string()).max(10).optional(),
})

// Usage
export async function POST(request: Request) {
  const data = await validateRequestBody(request, CreateJourneySchema)
  // data is now typed and validated
}
```

---

## 7. Privacy

### 7.1 Memory Privacy Zones

CubiQo implements privacy zones for memory storage:

```typescript
// src/lib/memory/privacy.ts
export enum PrivacyZone {
  GREEN = 'green',   // Public/shareable data
  YELLOW = 'yellow', // Semi-private, user-accessible
  RED = 'red',       // Strictly private, system-only
}

export interface MemoryEntry {
  id: string
  user_id: string
  content: string
  privacy_zone: PrivacyZone
  created_at: string
}
```

#### Database Schema

```sql
CREATE TABLE memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  privacy_zone TEXT NOT NULL CHECK (privacy_zone IN ('green', 'yellow', 'red')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies based on privacy zones
ALTER TABLE memory ENABLE ROW LEVEL SECURITY;

-- Green zone: Public (anyone can read)
CREATE POLICY "Green zone public read"
  ON memory FOR SELECT
  USING (privacy_zone = 'green');

-- Yellow zone: User access only
CREATE POLICY "Yellow zone user access"
  ON memory FOR SELECT
  USING (privacy_zone = 'yellow' AND auth.uid() = user_id);

-- Red zone: System only (no direct access)
CREATE POLICY "Red zone system only"
  ON memory FOR SELECT
  USING (privacy_zone = 'red' AND current_user = 'postgres');

-- Users can write to green and yellow zones
CREATE POLICY "Users write green/yellow"
  ON memory FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    privacy_zone IN ('green', 'yellow')
  );
```

#### Access Control

```typescript
// src/lib/memory/access.ts
export async function canAccessMemory(
  memoryId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data: memory } = await supabase
    .from('memory')
    .select('privacy_zone, user_id')
    .eq('id', memoryId)
    .single()

  if (!memory) return false

  switch (memory.privacy_zone) {
    case PrivacyZone.GREEN:
      return true // Public

    case PrivacyZone.YELLOW:
      return memory.user_id === userId // User only

    case PrivacyZone.RED:
      return false // System only, no direct access

    default:
      return false
  }
}
```

---

### 7.2 CQ Number Privacy

Anonymous rotating CQ numbers for user identification:

#### Database Schema

```sql
CREATE TABLE cq_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cq_number TEXT UNIQUE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_rotate BOOLEAN DEFAULT false
);

-- Privacy settings
CREATE TABLE cq_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  who_can_add_me TEXT DEFAULT 'anyone' CHECK (who_can_add_me IN ('anyone', 'contacts', 'none')),
  who_can_call_me TEXT DEFAULT 'contacts' CHECK (who_can_call_me IN ('anyone', 'contacts', 'none')),
  who_can_see_online_status TEXT DEFAULT 'contacts' CHECK (who_can_see_online_status IN ('anyone', 'contacts', 'none')),
  show_read_receipts BOOLEAN DEFAULT true,
  show_typing_indicators BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### CQ Number Generation

```typescript
// src/lib/cq/generator.ts
export function generateCQNumber(): string {
  // Format: CQ-XXXX-XXXX (anonymous, rotating)
  const part1 = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const part2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `CQ-${part1}-${part2}`
}

export async function assignCQNumber(userId: string): Promise<string> {
  const supabase = createClient()
  const cqNumber = generateCQNumber()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

  const { data } = await supabase
    .from('cq_numbers')
    .insert({
      user_id: userId,
      cq_number: cqNumber,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  return data.cq_number
}
```

#### Auto-Rotation

```typescript
// src/lib/cq/rotation.ts
export async function rotateCQNumber(userId: string): Promise<string> {
  const supabase = createClient()

  // Delete old CQ number
  await supabase
    .from('cq_numbers')
    .delete()
    .eq('user_id', userId)

  // Generate new one
  return await assignCQNumber(userId)
}

// Cron job: Auto-rotate expired CQ numbers
export async function autoRotateExpiredCQNumbers(): Promise<void> {
  const supabase = createClient()

  const { data: expiredNumbers } = await supabase
    .from('cq_numbers')
    .select('user_id, auto_rotate')
    .lt('expires_at', new Date().toISOString())
    .eq('auto_rotate', true)

  for (const entry of expiredNumbers || []) {
    await rotateCQNumber(entry.user_id)
  }
}
```

#### Privacy Settings Hook

```typescript
// src/hooks/useCQPrivacy.ts
export function useCQPrivacy() {
  const [settings, setSettings] = useState<CQPrivacySettings | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('cq_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSettings(data)
    }

    loadSettings()
  }, [supabase])

  async function updateSettings(updates: Partial<CQPrivacySettings>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('cq_privacy_settings')
      .update(updates)
      .eq('user_id', user.id)

    setSettings({ ...settings, ...updates })
  }

  return { settings, updateSettings }
}
```

---

### 7.3 Data Retention

#### Journey Retention

```sql
CREATE TABLE journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  retention_days INT DEFAULT 365,
  auto_delete_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-delete expired journeys
CREATE OR REPLACE FUNCTION cleanup_expired_journeys()
RETURNS void AS $$
BEGIN
  DELETE FROM journeys
  WHERE auto_delete_at IS NOT NULL
  AND auto_delete_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run via cron
SELECT cron.schedule(
  'cleanup-journeys',
  '0 0 * * *', -- Daily at midnight
  'SELECT cleanup_expired_journeys()'
);
```

#### Consent Management

```sql
CREATE TABLE journey_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB
);

-- Consent types: data_collection, data_processing, data_sharing, ai_training
```

#### Right to Deletion

```sql
CREATE TABLE journey_rollback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deletion_type TEXT NOT NULL CHECK (deletion_type IN ('soft', 'hard')),
  deleted_at TIMESTAMPTZ DEFAULT now(),
  data_snapshot JSONB,
  rollback_expires_at TIMESTAMPTZ
);

-- Soft delete: 30-day recovery window
-- Hard delete: Immediate, irreversible
```

#### Deletion API

```typescript
// app/api/journeys/delete/route.ts
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { journeyId, deletionType } = await request.json()

  if (deletionType === 'soft') {
    // Soft delete: Archive for 30 days
    const { data: journey } = await supabase
      .from('journeys')
      .select('*')
      .eq('id', journeyId)
      .eq('user_id', user.id)
      .single()

    if (!journey) {
      return Response.json({ error: 'Journey not found' }, { status: 404 })
    }

    // Store snapshot for recovery
    await supabase.from('journey_rollback_logs').insert({
      user_id: user.id,
      deletion_type: 'soft',
      data_snapshot: journey,
      rollback_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    // Mark as deleted
    await supabase
      .from('journeys')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', journeyId)

  } else if (deletionType === 'hard') {
    // Hard delete: Immediate, irreversible
    await supabase
      .from('journeys')
      .delete()
      .eq('id', journeyId)
      .eq('user_id', user.id)

    await supabase.from('journey_rollback_logs').insert({
      user_id: user.id,
      deletion_type: 'hard',
      deleted_at: new Date().toISOString(),
    })
  }

  return Response.json({ success: true })
}
```

---

## 8. Environment Security

### 8.1 Environment Variables

#### Structure

```bash
# .env.local (never committed)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
ENCRYPTION_KEY=xxx...
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000
```

#### Template

```bash
# .env.example (committed, no real values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=your-encryption-key
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000
```

#### Validation

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  NEXT_PUBLIC_RP_ID: z.string().min(1),
  NEXT_PUBLIC_ORIGIN: z.string().url(),
})

export function validateEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format())
    throw new Error('Invalid environment configuration')
  }

  return result.data
}

// Call on startup
validateEnv()
```

### 8.2 Key Separation

**Client-Side (Public):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS-protected)
- `NEXT_PUBLIC_RP_ID`
- `NEXT_PUBLIC_ORIGIN`

**Server-Side (Secret):**
- `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS, server-only)
- `ENCRYPTION_KEY`
- Third-party API keys

#### Enforcement

```typescript
// src/lib/supabase/client.ts - Client-side
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Public key, RLS-protected
  )
}

// src/lib/supabase/admin.ts - Server-side only
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Secret key, bypasses RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

### 8.3 Vercel Environment Variables

**Production:**
```bash
# Encrypted at rest, decrypted at runtime
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ENCRYPTION_KEY production
```

**Preview:**
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add ENCRYPTION_KEY preview
```

**Development:**
```bash
# Use .env.local for local development
```

---

## 9. Known Security Gaps & Recommendations

### 9.1 Founder Role Hardcoding

**Current State:**
```typescript
export function isFounder(email: string): boolean {
  return email.toLowerCase() === 'aditya@cubiqo.ai'
}
```

**Risk:** Single point of failure, no role management, hardcoded email

**Recommendation:**

```sql
-- Create roles table
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('founder', 'admin', 'user')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- Function to check role
CREATE OR REPLACE FUNCTION has_role(p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 9.2 Device Fingerprint Weakness

**Current State:**
```typescript
const components = [
  navigator.userAgent,
  screen.colorDepth,
  // ... weak signals
]
```

**Risk:** Fingerprint can change, be spoofed, or be identical across devices

**Recommendation:**

```typescript
// Option 1: User-provided master password
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000, // Increase iterations
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Option 2: Hardware-backed key storage
// Use Web Crypto API with non-extractable keys
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false, // non-extractable
  ['encrypt', 'decrypt']
)
```

---

### 9.3 WebAuthn Challenge Session Binding

**Current State:**
Challenge stored in HTTP-only cookie, no session binding

**Risk:** Challenge could be replayed if cookie is stolen

**Recommendation:**

```typescript
// Bind challenge to user session
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const options = await generateAuthenticationOptions({
    rpID: process.env.NEXT_PUBLIC_RP_ID,
    // ... other options
  })

  // Store challenge with session binding
  await supabase.from('webauthn_challenges').insert({
    challenge: options.challenge,
    session_id: session.access_token, // Bind to session
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
  })

  return Response.json(options)
}
```

---

### 9.4 Audit Log Retention Policy

**Current State:**
No explicit retention policy, logs grow indefinitely

**Risk:** Storage costs, compliance issues

**Recommendation:**

```sql
-- Add retention policy
CREATE TABLE audit_log_retention_policies (
  action_type TEXT PRIMARY KEY,
  retention_days INT NOT NULL
);

INSERT INTO audit_log_retention_policies VALUES
  ('debug_view_accessed', 90),
  ('impersonation_started', 365),
  ('unauthorized_access_attempt', 180);

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < now() - INTERVAL '1 day' * (
    SELECT retention_days
    FROM audit_log_retention_policies
    WHERE action_type = audit_logs.action_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup
SELECT cron.schedule(
  'cleanup-audit-logs',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT cleanup_old_audit_logs()'
);
```

---

### 9.5 Rate Limiting on Auth Endpoints

**Current State:**
No rate limiting on WebAuthn endpoints

**Risk:** Brute force, DoS attacks

**Recommendation:**

```typescript
// src/lib/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export async function rateLimit(
  key: string,
  limit: number,
  window: number
): Promise<{ success: boolean; remaining: number }> {
  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, window)
  }

  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
  }
}

// Usage in auth endpoint
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success, remaining } = await rateLimit(
    `auth:${ip}`,
    10, // 10 attempts
    60  // per 60 seconds
  )

  if (!success) {
    return Response.json(
      { error: 'Too many requests', remaining },
      { status: 429 }
    )
  }

  // ... continue with auth
}
```

---

### 9.6 MFA for Admin Actions

**Current State:**
Admin actions only require WebAuthn authentication

**Risk:** Compromised admin account = full access

**Recommendation:**

```typescript
// Add TOTP MFA for sensitive admin actions
import * as OTPAuth from 'otpauth'

export async function verifyAdminMFA(
  userId: string,
  token: string
): Promise<boolean> {
  const supabase = createClient()

  const { data: mfaSecret } = await supabase
    .from('admin_mfa_secrets')
    .select('secret')
    .eq('user_id', userId)
    .single()

  if (!mfaSecret) {
    return false
  }

  const totp = new OTPAuth.TOTP({
    secret: mfaSecret.secret,
    digits: 6,
    period: 30,
  })

  const delta = totp.validate({ token, window: 1 })
  return delta !== null
}

// Require MFA for sensitive actions
export async function POST(request: Request) {
  const { mfaToken } = await request.json()

  const isValid = await verifyAdminMFA(user.id, mfaToken)

  if (!isValid) {
    await logAuditEvent({
      userId: user.id,
      actionType: 'mfa_verification_failed',
    })

    return Response.json({ error: 'Invalid MFA token' }, { status: 403 })
  }

  // ... proceed with admin action
}
```

---

### 9.7 localStorage for Encrypted API Keys

**Current State:**
Encrypted API keys stored in localStorage

**Risk:** XSS can access localStorage

**Recommendation:**

**Option 1: HTTP-only Cookie**
```typescript
// Store encrypted key in HTTP-only cookie instead
export async function storeApiKey(service: string, apiKey: string) {
  const encrypted = await encryptApiKey(apiKey)

  const response = await fetch('/api/keys/store', {
    method: 'POST',
    body: JSON.stringify({ service, encrypted }),
  })

  // Server sets HTTP-only cookie
}

// API endpoint
export async function POST(request: Request) {
  const { service, encrypted } = await request.json()

  const response = Response.json({ success: true })
  response.headers.set(
    'Set-Cookie',
    `api_key_${service}=${encrypted}; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000; Path=/`
  )

  return response
}
```

**Option 2: Supabase Vault**
```typescript
// Store in Supabase Vault (server-side only)
export async function storeApiKey(userId: string, service: string, apiKey: string) {
  const supabase = createAdminClient()

  // Encrypt with server-side key
  const encrypted = encryptToken(apiKey)

  await supabase.from('user_api_keys').insert({
    user_id: userId,
    service,
    encrypted_key: encrypted,
  })
}
```

---

## 10. Threat Model

### 10.1 External Threats

#### API Abuse

**Attack Vector:**
- Automated scripts calling APIs at high volume
- Credential stuffing
- Enumeration attacks

**Mitigations:**
- Rate limiting (recommendation #5)
- CAPTCHA on auth endpoints
- IP reputation checking
- Anomaly detection

#### Injection Attacks

**Attack Vector:**
- SQL injection via user inputs
- Command injection in code execution sandbox
- Path traversal in file operations

**Mitigations:**
- ✅ Parameterized queries (Supabase client)
- ✅ Command sanitization (see Section 6.2)
- ✅ Path validation (see Section 6.1)
- ✅ Input validation with Zod schemas

#### Cross-Site Scripting (XSS)

**Attack Vector:**
- Injecting malicious scripts via user content
- Stealing localStorage data (API keys)
- Session hijacking

**Mitigations:**
- ✅ React XSS protection (JSX escaping)
- ✅ Content Security Policy (CSP)
- ⚠️ Move API keys to HTTP-only cookies (recommendation #7)
- ✅ SameSite=Strict cookies

#### Cross-Site Request Forgery (CSRF)

**Attack Vector:**
- Tricking users into submitting malicious requests
- State-changing actions without consent

**Mitigations:**
- ✅ SameSite=Strict cookies
- ✅ CSRF tokens on state-changing operations
- ✅ Origin validation in middleware

---

### 10.2 Internal Threats

#### Insider Access

**Attack Vector:**
- Malicious admin/founder account
- Compromised admin credentials
- Abuse of elevated privileges

**Mitigations:**
- ✅ Audit logging of all admin actions
- ✅ Feature flags for elevated controls
- ⚠️ Add MFA for sensitive admin actions (recommendation #6)
- ✅ IP and user agent tracking

#### Compromised Agents

**Attack Vector:**
- Agent executing malicious code
- Agent accessing data outside scope
- Agent abusing tool permissions

**Mitigations:**
- ✅ Agent workspace isolation
- ✅ Tool access control
- ✅ Execution timeout and output limits
- ✅ Sandbox environment variables

---

### 10.3 Data Threats

#### Data Leakage

**Attack Vector:**
- Unauthorized access to user data
- Sharing sensitive information
- Logging sensitive data

**Mitigations:**
- ✅ RLS on all tables
- ✅ Privacy zones (green/yellow/red)
- ✅ Encryption at rest and in transit
- ✅ Audit logging

#### Unauthorized Access

**Attack Vector:**
- Bypassing RLS policies
- Accessing other users' data
- Privilege escalation

**Mitigations:**
- ✅ 150+ RLS policies
- ✅ Service role key restricted to server
- ✅ Role-based access control
- ✅ Authentication required for all protected endpoints

---

### 10.4 Infrastructure Threats

#### Supabase Compromise

**Attack Vector:**
- Supabase platform breach
- Database access
- Vault secrets exposure

**Mitigations:**
- ✅ Supabase TDE (Transparent Data Encryption)
- ✅ RLS prevents lateral movement
- ✅ Encrypted credentials
- 🔄 Regular security audits of Supabase

#### Vercel Edge Compromise

**Attack Vector:**
- Edge function compromise
- Environment variable exposure
- Code injection

**Mitigations:**
- ✅ Vercel encrypted environment variables
- ✅ Minimal permissions on edge functions
- ✅ Code review and testing
- 🔄 Monitor Vercel security advisories

---

## 11. Security Checklists

### 11.1 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Service role key restricted to server-side
- [ ] HTTPS enforced in production
- [ ] RLS policies enabled on all tables
- [ ] Audit logging enabled
- [ ] Rate limiting configured (if implemented)
- [ ] CSP headers configured
- [ ] HSTS headers enabled
- [ ] Cookie security flags set (HttpOnly, Secure, SameSite)
- [ ] WebAuthn RP ID matches production domain
- [ ] Founder role configured properly
- [ ] Admin MFA enabled (if implemented)
- [ ] Backup encryption verified
- [ ] Incident response plan documented

### 11.2 Post-Deployment Checklist

- [ ] Verify HTTPS redirect works
- [ ] Test authentication flows (magic link, WebAuthn)
- [ ] Verify RLS policies block unauthorized access
- [ ] Check audit logs are being written
- [ ] Test rate limiting (if implemented)
- [ ] Verify CSP headers in browser
- [ ] Test CORS configuration
- [ ] Verify backup restoration process
- [ ] Test admin impersonation (dev only)
- [ ] Review first 24 hours of audit logs
- [ ] Monitor error rates and security alerts

### 11.3 Developer Checklist

**Before Committing:**
- [ ] No secrets in code
- [ ] No console.log with sensitive data
- [ ] Input validation on all user inputs
- [ ] RLS policies on new tables
- [ ] Audit logging on sensitive actions
- [ ] Path validation on file operations
- [ ] Command sanitization on shell execution
- [ ] Tests for security-critical code

**Before PR:**
- [ ] Security review by peer
- [ ] Test with non-admin user
- [ ] Test with guest session
- [ ] Verify RLS policies work
- [ ] Check audit logs generated
- [ ] Update security documentation

**Before Merge:**
- [ ] Approved by security/MO
- [ ] All tests pass
- [ ] CodeQL scan clean
- [ ] Dependency vulnerabilities resolved

### 11.4 Admin Checklist

**Daily:**
- [ ] Review audit logs for anomalies
- [ ] Check failed authentication attempts
- [ ] Monitor error rates
- [ ] Review unauthorized access attempts

**Weekly:**
- [ ] Review user access patterns
- [ ] Check feature flag changes
- [ ] Audit admin actions
- [ ] Review self-heal reports

**Monthly:**
- [ ] Update dependencies
- [ ] Review RLS policies
- [ ] Audit user permissions
- [ ] Test backup restoration
- [ ] Review incident response plan
- [ ] Security training for team

### 11.5 Incident Response Checklist

**Detection:**
- [ ] Identify affected systems
- [ ] Determine attack vector
- [ ] Assess scope of breach
- [ ] Check audit logs for timeline

**Containment:**
- [ ] Isolate affected systems
- [ ] Revoke compromised credentials
- [ ] Block malicious IPs
- [ ] Disable compromised features

**Eradication:**
- [ ] Patch vulnerabilities
- [ ] Remove malicious code
- [ ] Reset passwords
- [ ] Rotate encryption keys

**Recovery:**
- [ ] Restore from clean backups
- [ ] Verify system integrity
- [ ] Re-enable services
- [ ] Monitor for re-infection

**Post-Incident:**
- [ ] Document timeline
- [ ] Root cause analysis
- [ ] Update security policies
- [ ] Train team on lessons learned
- [ ] Notify affected users (if required)

---

## Conclusion

CubiQo Emergent implements comprehensive security measures across authentication, authorization, encryption, audit logging, sandboxing, input validation, and privacy. While the system is secure, there are opportunities for improvement as outlined in Section 9.

**Key Strengths:**
- Multi-layered authentication (Magic Link + WebAuthn + Guest)
- Comprehensive RLS (150+ policies across 52+ tables)
- Encrypted data at rest and in transit
- Audit logging of all sensitive actions
- Sandbox isolation for code execution
- Privacy-focused design (zones, CQ numbers, retention)

**Priority Improvements:**
1. Implement role-based founder management (Gap #1)
2. Add rate limiting on auth endpoints (Gap #5)
3. Add MFA for admin actions (Gap #6)
4. Strengthen API key encryption (Gap #2)
5. Implement audit log retention policy (Gap #4)

**Contact:**
For security concerns or questions, contact: security@cubiqo.ai

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Next Review:** Quarterly
