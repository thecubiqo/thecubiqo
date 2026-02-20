# Security Implementation: User Stories & Acceptance Criteria
## **Ready for Development**

**Prepared by**: JO (Product Owner - 20% Monetization Stake)  
**For**: MO, Blossom, Bubbles, Buttercup, Guy  
**Status**: BACKLOG — Ready to Pull into Sprints  
**Date**: 2025-01-XX

---

## How to Use This Document

1. **MO**: Review and assign to appropriate team members
2. **Developers**: Pull stories into sprints based on priority
3. **Buttercup**: Write tests based on acceptance criteria
4. **JO**: Review completed stories and accept/reject based on criteria

---

## Wave 1: Critical Security Fixes (LAUNCH BLOCKERS)

### 🔴 STORY-SEC-001: Fix Unauthenticated Admin Endpoint

**Epic**: Security Hardening  
**Priority**: P0 (CRITICAL)  
**Effort**: 1 point (4 hours)  
**Assigned to**: Blossom (Backend)  
**Sprint**: Wave 1  

#### User Story
```
As a security-conscious founder,
I want admin endpoints protected by authentication,
So that user data is never exposed publicly.
```

#### Context
Currently, `/api/admin/journal` is publicly accessible. Anyone can view all user data by simply visiting the URL. This is a **critical security vulnerability** that could lead to:
- Data breach
- GDPR violations
- Reputational damage
- Legal liability

#### Acceptance Criteria
- [ ] All `/api/admin/*` routes require authentication
- [ ] Only users with `admin: true` in Supabase metadata can access
- [ ] Unauthenticated requests return `403 Forbidden` with message: "Admin access required"
- [ ] Unauthorized requests (authenticated but not admin) return `403 Forbidden` with message: "Admin role required"
- [ ] Audit log records all admin access attempts (success + failure)
- [ ] Test: Try accessing `/api/admin/journal` without auth → `403`
- [ ] Test: Try accessing with regular user auth → `403`
- [ ] Test: Try accessing with admin user auth → `200 OK`

#### Technical Implementation
```typescript
// /src/lib/auth/middleware.ts
export async function requireAdmin(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new UnauthorizedError('Authentication required')
  }
  
  // Check admin role in user metadata
  const isAdmin = user.user_metadata?.admin === true
  
  if (!isAdmin) {
    // Log failed admin access attempt
    await logAuditEvent({
      action: 'admin_access_denied',
      userId: user.id,
      resource: req.url,
      ip: req.ip,
      userAgent: req.headers.get('user-agent')
    })
    
    throw new ForbiddenError('Admin role required')
  }
  
  // Log successful admin access
  await logAuditEvent({
    action: 'admin_access_granted',
    userId: user.id,
    resource: req.url
  })
  
  return user
}

// Update all admin routes
// /src/app/api/admin/*/route.ts
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  // ... rest of handler
}
```

#### Testing
```typescript
// /tests/auth/admin-access.test.ts
describe('Admin Authentication', () => {
  it('blocks unauthenticated access to admin endpoints', async () => {
    const response = await fetch('/api/admin/journal')
    expect(response.status).toBe(403)
  })
  
  it('blocks non-admin users from admin endpoints', async () => {
    const regularUser = await signInAsRegularUser()
    const response = await fetch('/api/admin/journal', {
      headers: { Authorization: `Bearer ${regularUser.token}` }
    })
    expect(response.status).toBe(403)
  })
  
  it('allows admin users to access admin endpoints', async () => {
    const adminUser = await signInAsAdmin()
    const response = await fetch('/api/admin/journal', {
      headers: { Authorization: `Bearer ${adminUser.token}` }
    })
    expect(response.status).toBe(200)
  })
})
```

#### Definition of Done
- [ ] Code reviewed by MO
- [ ] Tests pass (Buttercup)
- [ ] Security audit passed (manual)
- [ ] Deployed to staging
- [ ] Verified on staging
- [ ] Story accepted by JO

---

### 🔴 STORY-SEC-002: Add Security Headers

**Epic**: Security Hardening  
**Priority**: P0 (CRITICAL)  
**Effort**: 0.5 points (30 minutes)  
**Assigned to**: Blossom (Backend)  
**Sprint**: Wave 1  

#### User Story
```
As a user browsing CubiQo,
I want my session protected from common web attacks,
So that my data and account are safe.
```

#### Context
Missing security headers expose users to:
- **XSS attacks** (Cross-Site Scripting)
- **Clickjacking** (UI redress attacks)
- **MIME sniffing attacks**
- **Data exfiltration**

Adding headers is a **30-minute fix** with **massive security impact**.

#### Acceptance Criteria
- [ ] `Strict-Transport-Security` header enforces HTTPS (1 year)
- [ ] `X-Frame-Options: SAMEORIGIN` prevents clickjacking
- [ ] `X-Content-Type-Options: nosniff` prevents MIME sniffing
- [ ] `X-XSS-Protection: 1; mode=block` blocks XSS (legacy browsers)
- [ ] `Referrer-Policy: origin-when-cross-origin` limits referrer leakage
- [ ] `Permissions-Policy` restricts camera, microphone, geolocation
- [ ] `Content-Security-Policy` prevents inline scripts (strict)
- [ ] Test: Verify headers on https://securityheaders.com → A+ grade
- [ ] Test: Verify on multiple browsers (Chrome, Firefox, Safari)

#### Technical Implementation
```typescript
// /next.config.ts
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
]

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

#### Testing
```bash
# Manual testing
curl -I https://staging.cubiqo.com | grep -i "strict-transport-security"
curl -I https://staging.cubiqo.com | grep -i "x-frame-options"
curl -I https://staging.cubiqo.com | grep -i "content-security-policy"

# Automated testing with securityheaders.com
open https://securityheaders.com/?q=https://staging.cubiqo.com&followRedirects=on
```

#### Definition of Done
- [ ] Code deployed to staging
- [ ] Headers verified with `curl`
- [ ] securityheaders.com shows A+ grade
- [ ] Story accepted by JO

---

### 🔴 STORY-SEC-003: Add Input Validation with Zod

**Epic**: Security Hardening  
**Priority**: P0 (CRITICAL)  
**Effort**: 3 points (1 day)  
**Assigned to**: Blossom (Backend)  
**Sprint**: Wave 1  

#### User Story
```
As a developer building API integrations,
I want clear input validation errors,
So that I know exactly what data format is expected.
```

#### Context
Without input validation:
- **SQL injection** attacks possible
- **XSS attacks** possible (malicious scripts in input)
- **Data corruption** (invalid data in database)
- **Poor developer experience** (no clear error messages)

#### Acceptance Criteria
- [ ] All API routes validate input with Zod schemas
- [ ] Validation errors return `400 Bad Request` with clear messages
- [ ] Error format: `{ error: "Validation failed", details: [...] }`
- [ ] SQL injection attempts are blocked
- [ ] XSS payloads are sanitized
- [ ] Test: Send malformed JSON → `400 Bad Request`
- [ ] Test: Send SQL injection payload → `400 Bad Request`
- [ ] Test: Send XSS payload → `400 Bad Request`
- [ ] Test: Send valid data → `200 OK`

#### Technical Implementation
```typescript
// /src/lib/schemas/chat.ts
import { z } from 'zod'

export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
  context: z.record(z.unknown()).optional()
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>

// /src/app/api/chat/route.ts
import { ChatRequestSchema } from '@/lib/schemas/chat'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = ChatRequestSchema.parse(body)
    
    // Use validated data (guaranteed to match schema)
    const response = await processChat(validated)
    return NextResponse.json(response)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    throw error
  }
}
```

#### Schemas to Create
1. `/src/lib/schemas/chat.ts` — Chat API
2. `/src/lib/schemas/auth.ts` — Authentication
3. `/src/lib/schemas/admin.ts` — Admin API
4. `/src/lib/schemas/journey.ts` — Journey feature
5. `/src/lib/schemas/user.ts` — User profile

#### Testing
```typescript
// /tests/api/validation.test.ts
describe('Input Validation', () => {
  it('rejects empty message', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '' })
    })
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Validation failed')
    expect(json.details[0].message).toContain('empty')
  })
  
  it('rejects SQL injection', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: "'; DROP TABLE users; --" })
    })
    expect(response.status).toBe(400)
  })
  
  it('sanitizes XSS payload', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '<script>alert("xss")</script>' })
    })
    expect(response.status).toBe(400)
  })
})
```

#### Definition of Done
- [ ] Zod schemas created for all API routes
- [ ] Validation middleware applied to all routes
- [ ] Tests pass (SQL injection, XSS, malformed data)
- [ ] Code reviewed by MO
- [ ] Story accepted by JO

---

### 🔴 STORY-SEC-004: Restrict CORS to Known Origins

**Epic**: Security Hardening  
**Priority**: P0 (CRITICAL)  
**Effort**: 0.5 points (15 minutes)  
**Assigned to**: Blossom (Backend)  
**Sprint**: Wave 1  

#### User Story
```
As a security engineer,
I want API access restricted to known origins,
So that malicious sites can't abuse our API.
```

#### Context
Currently, CORS is set to `*` (allow all origins). This allows:
- **CSRF attacks** (Cross-Site Request Forgery)
- **Malicious sites** making authenticated requests
- **Data exfiltration** from user sessions

**This is a 15-minute fix with high security impact.**

#### Acceptance Criteria
- [ ] CORS restricted to `cubiqo.com` and `localhost:3000` (dev)
- [ ] Environment variable `ALLOWED_ORIGINS` for configuration
- [ ] Unauthorized origins return `403 Forbidden`
- [ ] OPTIONS preflight requests handled correctly
- [ ] Test: Request from `cubiqo.com` → `200 OK`
- [ ] Test: Request from `localhost:3000` → `200 OK`
- [ ] Test: Request from `evil-site.com` → `403 Forbidden`

#### Technical Implementation
```typescript
// /src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://cubiqo.com',
  'https://www.cubiqo.com',
  'http://localhost:3000',
  'http://localhost:3001'
]

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin')
  
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin)
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    if (!isAllowed) {
      return new NextResponse(null, { status: 403 })
    }
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }
  
  // Add CORS headers to response
  const response = NextResponse.next()
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

export const config = {
  matcher: '/api/:path*'
}
```

#### Environment Variables
```bash
# .env
ALLOWED_ORIGINS=https://cubiqo.com,https://www.cubiqo.com,http://localhost:3000
```

#### Testing
```bash
# Test allowed origin
curl -H "Origin: https://cubiqo.com" -I https://staging.cubiqo.com/api/chat

# Test disallowed origin
curl -H "Origin: https://evil-site.com" -I https://staging.cubiqo.com/api/chat
```

#### Definition of Done
- [ ] CORS middleware implemented
- [ ] Environment variable configured
- [ ] Tests pass (allowed/disallowed origins)
- [ ] Story accepted by JO

---

## Wave 2: Trust Builders (MONETIZATION ENABLERS)

### 🟡 STORY-SEC-005: Data Export API (GDPR Article 20)

**Epic**: GDPR Compliance  
**Priority**: P1 (HIGH)  
**Effort**: 5 points (5 days)  
**Assigned to**: Blossom (Backend) + Guy (Database)  
**Sprint**: Wave 2  

#### User Story
```
As a user exercising my GDPR rights,
I want to download all my data in a portable format,
So that I can move to another service if I choose.
```

#### Context
GDPR Article 20 (Right to Data Portability) requires:
- Users can export their data
- Data is in a structured, machine-readable format (JSON)
- Export includes all personal data

**This is legally required for EU users.**

#### Acceptance Criteria
- [ ] User can click "Download My Data" in settings
- [ ] Exports JSON file with all user data
- [ ] Includes: profile, messages, memories, journey entries, integrations, settings
- [ ] File named: `cubiqo-data-{user-id}-{timestamp}.json`
- [ ] Export logged in audit trail
- [ ] Rate limited to 1 export per hour (prevent abuse)
- [ ] Email sent with download link (expires in 24 hours)
- [ ] Test: Download, verify JSON structure, re-import on test account

#### Data Structure
```json
{
  "export_date": "2025-01-XX",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01",
    "metadata": {}
  },
  "profile": {
    "display_name": "John Doe",
    "avatar_url": "https://..."
  },
  "memories": [
    {
      "id": "uuid",
      "content": "...",
      "created_at": "2024-01-01",
      "tags": []
    }
  ],
  "journal_entries": [...],
  "integrations": [...],
  "settings": {...}
}
```

#### Technical Implementation
```typescript
// /src/app/api/user/export/route.ts
export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  
  // Rate limit: 1 export per hour
  const lastExport = await getLastExportTime(user.id)
  if (lastExport && Date.now() - lastExport < 3600000) {
    return NextResponse.json(
      { error: 'Rate limit: 1 export per hour' },
      { status: 429 }
    )
  }
  
  // Collect all user data
  const data = await exportUserData(user.id)
  
  // Log export in audit trail
  await logAuditEvent({
    action: 'data_exported',
    userId: user.id
  })
  
  // Generate download link (S3 or similar)
  const downloadUrl = await generateExportFile(user.id, data)
  
  // Send email with link
  await sendEmail({
    to: user.email,
    subject: 'Your CubiQo Data Export',
    body: `Download link: ${downloadUrl} (expires in 24 hours)`
  })
  
  return NextResponse.json({ downloadUrl })
}
```

#### Definition of Done
- [ ] API endpoint implemented
- [ ] UI button added to settings
- [ ] Rate limiting works
- [ ] Email sent with download link
- [ ] Tests pass (export, rate limit, email)
- [ ] Story accepted by JO

---

### 🟡 STORY-SEC-006: Cookie Consent Banner

**Epic**: GDPR Compliance  
**Priority**: P1 (HIGH)  
**Effort**: 3 points (3 days)  
**Assigned to**: Bubbles (Frontend)  
**Sprint**: Wave 2  

#### User Story
```
As a user in the EU,
I want to control which cookies are set,
So that I comply with GDPR and protect my privacy.
```

#### Context
GDPR requires explicit consent for non-essential cookies. Without a cookie banner:
- **Legal risk** (GDPR fines up to €20M)
- **Can't use analytics** (Google Analytics requires consent)
- **Can't market to EU users**

#### Acceptance Criteria
- [ ] Banner appears on first visit (bottom of page)
- [ ] Three cookie categories: Essential, Analytics, Marketing
- [ ] Two buttons: "Accept All" and "Reject All"
- [ ] "Customize" button opens modal with granular controls
- [ ] Choice stored in cookie: `__cubiqo_consent` (1 year)
- [ ] Google Analytics only loads if "Analytics" accepted
- [ ] Banner doesn't appear again after choice
- [ ] Test: Reject all → verify no analytics scripts load
- [ ] Test: Accept analytics → verify Google Analytics loads
- [ ] Test: Revisit after 1 year → banner appears again

#### Design
```
┌─────────────────────────────────────────────────────┐
│ 🍪 We use cookies to improve your experience       │
│                                                     │
│ [Customize] [Reject All] [Accept All]              │
└─────────────────────────────────────────────────────┘
```

#### Technical Implementation
```typescript
// /src/components/CookieConsent.tsx
'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'

export function CookieConsent() {
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    const consent = Cookies.get('__cubiqo_consent')
    if (!consent) setShow(true)
  }, [])
  
  const handleAcceptAll = () => {
    Cookies.set('__cubiqo_consent', JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true
    }), { expires: 365 })
    setShow(false)
    loadAnalytics()
  }
  
  const handleRejectAll = () => {
    Cookies.set('__cubiqo_consent', JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false
    }), { expires: 365 })
    setShow(false)
  }
  
  if (!show) return null
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4">
      <p>🍪 We use cookies to improve your experience</p>
      <button onClick={handleRejectAll}>Reject All</button>
      <button onClick={handleAcceptAll}>Accept All</button>
    </div>
  )
}
```

#### Definition of Done
- [ ] Banner component implemented
- [ ] Consent stored in cookie
- [ ] Analytics only load if consented
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Story accepted by JO

---

### 🟡 STORY-SEC-007: MFA/2FA with TOTP

**Epic**: User Security  
**Priority**: P2 (MEDIUM)  
**Effort**: 8 points (10 days)  
**Assigned to**: Blossom (Backend) + Bubbles (Frontend)  
**Sprint**: Wave 2  

#### User Story
```
As a user with sensitive data,
I want to enable two-factor authentication,
So that my account is protected even if my password is compromised.
```

#### Context
MFA reduces account takeover risk by **60%** and is:
- **Required for enterprise customers** (compliance requirement)
- **Expected by security-conscious users**
- **Reduces fraud costs** (support tickets, chargebacks)

#### Acceptance Criteria
- [ ] User can enable MFA in account settings
- [ ] Shows QR code for TOTP setup (Google Authenticator, Authy)
- [ ] Generates 10 backup codes (download as PDF)
- [ ] On next login, prompts for 6-digit TOTP code
- [ ] Invalid code shows "Invalid code, please try again"
- [ ] 3 failed attempts → temporary lockout (15 minutes)
- [ ] Can disable MFA (requires current password + TOTP code)
- [ ] Test: Enable MFA, logout, login with TOTP → success
- [ ] Test: Login with wrong TOTP → error message

#### User Flow
```
1. Settings → Enable MFA
2. Scan QR code with Google Authenticator
3. Enter TOTP code to verify setup
4. Download 10 backup codes (PDF)
5. MFA enabled ✓
6. Next login → Email/password + TOTP code
```

#### Technical Implementation
```typescript
// /src/app/api/auth/mfa/enroll/route.ts
export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  const supabase = createServerClient()
  
  // Generate TOTP secret
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  })
  
  if (error) throw error
  
  // Generate backup codes
  const backupCodes = generateBackupCodes(10)
  await storeBackupCodes(user.id, backupCodes)
  
  return NextResponse.json({
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    backupCodes
  })
}

// /src/app/api/auth/mfa/verify/route.ts
export async function POST(req: NextRequest) {
  const { factorId, code } = await req.json()
  const supabase = createServerClient()
  
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    code
  })
  
  if (error) {
    // Track failed attempts
    await trackFailedMFAAttempt(user.id)
    return NextResponse.json(
      { error: 'Invalid code' },
      { status: 400 }
    )
  }
  
  return NextResponse.json({ success: true })
}
```

#### Definition of Done
- [ ] MFA enrollment flow implemented
- [ ] QR code generation works
- [ ] Backup codes generated and downloadable
- [ ] Login flow prompts for TOTP
- [ ] Failed attempts tracked (lockout after 3)
- [ ] Tests pass (enable, login, disable)
- [ ] Story accepted by JO

---

## Summary

### Total Effort by Wave

| Wave | Stories | Total Points | Timeline | Outcome |
|------|---------|--------------|----------|---------|
| **Wave 1** | 4 | 5 points | 1 week | Safe to launch (B+ grade) |
| **Wave 2** | 3 | 16 points | 3 weeks | GDPR compliant, paid tiers enabled |
| **Total** | 7 | 21 points | 4 weeks | Ready for monetization |

### Sprint Planning

**Sprint 1 (Wave 1)**: Week 1
- SEC-001: Fix admin auth (4h)
- SEC-002: Security headers (30m)
- SEC-003: Input validation (1 day)
- SEC-004: CORS restriction (15m)

**Sprint 2 (Wave 2)**: Week 2-3
- SEC-005: Data export API (5 days)
- SEC-006: Cookie consent banner (3 days)

**Sprint 3 (Wave 2)**: Week 4-5
- SEC-007: MFA/2FA (10 days)

---

**Ready to assign and execute!**

**JO (Product Owner)**  
*"Ship fast. Iterate faster."*
