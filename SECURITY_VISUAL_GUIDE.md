# CUBIQO Security Architecture - Visual Guide

## Security Layers Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              🌐 CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📱 Browser/App                                                              │
│  ├─ 🔐 Web Crypto API (API Key Encryption)                                  │
│  ├─ 📲 MFA/2FA TOTP (Phase 2)                                               │
│  ├─ 🖐️ Device Fingerprinting (Phase 2)                                      │
│  └─ 🍪 Session Cookies (HttpOnly, Secure)                                   │
│                                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ HTTPS/TLS 1.3
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ☁️  CLOUDFLARE (WAF) - Phase 2                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🛡️ DDoS Protection                                                          │
│  🤖 Bot Detection & Challenge                                               │
│  📜 OWASP Top 10 Ruleset                                                     │
│  🚦 Rate Limiting (Edge Level)                                              │
│  🌍 Geographic Blocking (Optional)                                          │
│  📊 Analytics & Threat Intelligence                                         │
│                                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ⚡ VERCEL EDGE NETWORK                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📋 Security Headers (Phase 1) ✅                                            │
│  │  ├─ Content-Security-Policy (CSP)                                        │
│  │  ├─ Strict-Transport-Security (HSTS)                                     │
│  │  ├─ X-Frame-Options                                                      │
│  │  ├─ X-Content-Type-Options                                               │
│  │  └─ X-XSS-Protection                                                     │
│                                                                              │
│  🚦 Rate Limiting (Redis) - Phase 2                                         │
│  🌐 CORS Policy (Phase 1) ✅                                                 │
│  📍 Geo-Location & CDN                                                       │
│                                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      🔄 NEXT.JS MIDDLEWARE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔄 Session Refresh (Auto) ✅                                                │
│  🎟️ JWT Validation ✅                                                        │
│  🔍 User Context Loading                                                     │
│  📝 Request Logging                                                          │
│                                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🚀 API ROUTES (SERVER)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔒 requireAuth() Middleware (Phase 1) 🚧                                    │
│  👑 requireAdmin() Middleware (Phase 1) 🚧                                   │
│  ✅ Input Validation (Zod) - Phase 1 🚧                                      │
│  📊 Audit Logging ✅                                                         │
│  ⚠️ Error Handling                                                           │
│  💰 Spending Cap Checks (AI) ✅                                              │
│                                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       🗄️ SUPABASE (DATABASE)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔐 Authentication System ✅                                                 │
│  │  ├─ Magic Links (OTP) ✅                                                  │
│  │  ├─ OAuth 2.0 (6 providers) ✅                                            │
│  │  ├─ JWT Sessions ✅                                                        │
│  │  └─ MFA/2FA Support (Phase 2)                                            │
│                                                                              │
│  🛡️ Row-Level Security (RLS) ✅                                              │
│  │  ├─ User can view/edit own data                                          │
│  │  ├─ Admin bypass (service role)                                          │
│  │  └─ Multi-tenancy support                                                │
│                                                                              │
│  🔒 Encrypted Storage ✅                                                     │
│  │  ├─ OAuth tokens (AES-256-GCM)                                           │
│  │  ├─ API keys (PBKDF2 + AES-GCM)                                          │
│  │  └─ Sensitive user data                                                  │
│                                                                              │
│  📝 Audit Logs ✅                                                            │
│  📊 Analytics Events ✅                                                      │
│  🗂️ Data Retention Policies ✅                                               │
│                                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   📊 MONITORING & INCIDENT RESPONSE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📈 Vercel Analytics ✅                                                      │
│  🐛 Sentry Error Tracking (Phase 2)                                         │
│  📊 Datadog SIEM (Phase 3)                                                   │
│  🔔 Alerting System (Phase 2)                                               │
│  🔍 Anomaly Detection (Phase 3)                                             │
│  📋 Security Dashboard (Phase 3)                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow with MFA (Phase 2)

```
┌──────────┐                                      ┌──────────┐
│  User    │                                      │  Server  │
└────┬─────┘                                      └────┬─────┘
     │                                                 │
     │  1. Enter email + password                     │
     ├────────────────────────────────────────────────>
     │                                                 │
     │  2. Verify credentials                         │
     │                                                 ├───> Supabase Auth
     │                                                 │
     │  3. Check if MFA enabled                       │
     │                                                 ├───> User metadata
     │                                                 │
     │  4. Send MFA challenge                         │
     <────────────────────────────────────────────────┤
     │     "Enter your 6-digit code"                  │
     │                                                 │
     │  5. User opens authenticator app               │
     │     (Google Auth, Authy, 1Password)            │
     │                                                 │
     │  6. Enter TOTP code (e.g., 123456)             │
     ├────────────────────────────────────────────────>
     │                                                 │
     │  7. Verify TOTP                                │
     │                                                 ├───> Supabase MFA API
     │                                                 │
     │  8. Issue JWT + Refresh Token                  │
     <────────────────────────────────────────────────┤
     │                                                 │
     │  9. Store session (HttpOnly cookie)            │
     <────────────────────────────────────────────────┤
     │                                                 │
     │  10. Redirect to dashboard                     │
     <────────────────────────────────────────────────┤
     │                                                 │
     │  ✅ Authenticated & Authorized                  │
     │                                                 │
```

---

## API Request Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                               │
│    POST /api/chat                                               │
│    {                                                            │
│      "message": "Hello, AI!",                                   │
│      "sessionId": "uuid"                                        │
│    }                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CLOUDFLARE WAF (Phase 2)                                     │
│    ✅ Check IP reputation                                       │
│    ✅ Apply OWASP rules                                         │
│    ✅ Bot detection                                             │
│    ✅ Rate limit (edge)                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │ ✅ PASS
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. VERCEL EDGE                                                  │
│    ✅ Apply security headers (Phase 1)                          │
│    ✅ Check rate limit (Redis - Phase 2)                        │
│    ✅ Validate CORS origin (Phase 1)                            │
└────────────────────┬────────────────────────────────────────────┘
                     │ ✅ PASS
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. NEXT.JS MIDDLEWARE                                           │
│    ✅ Refresh session (auto)                                    │
│    ✅ Validate JWT                                              │
│    ✅ Load user context                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │ ✅ AUTHENTICATED
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. API ROUTE HANDLER                                            │
│    ✅ requireAuth() check (Phase 1)                             │
│    ✅ Input validation (Zod - Phase 1)                          │
│    ✅ Check spending caps                                       │
│    ✅ Execute business logic                                    │
│    ✅ Log to audit trail                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │ ✅ AUTHORIZED
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. SUPABASE DATABASE                                            │
│    ✅ RLS policy check                                          │
│    ✅ Query execution                                           │
│    ✅ Return data (user-scoped)                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │ ✅ DATA FETCHED
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. RESPONSE                                                     │
│    ✅ Format response                                           │
│    ✅ Add CORS headers                                          │
│    ✅ Log to monitoring                                         │
│    ✅ Send to client                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. MONITORING                                                   │
│    📊 Track metrics (response time, status)                     │
│    🔔 Alert on anomalies                                        │
│    📝 Store in SIEM (Phase 3)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Encryption Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                       DATA AT REST                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📄 User Data (profiles, memories, journal)                     │
│  └─> Supabase encryption (provider level) ✅                    │
│                                                                 │
│  🔑 OAuth Tokens                                                │
│  └─> AES-256-GCM + IV + Auth Tag ✅                             │
│      Encryption key: ENCRYPTION_KEY env var                    │
│                                                                 │
│  🗝️ API Keys (user-provided)                                    │
│  └─> AES-GCM + PBKDF2 (100k iterations) ✅                      │
│      Key derived from device fingerprint                       │
│                                                                 │
│  🔐 Session Tokens                                              │
│  └─> JWT (signed, not encrypted) ✅                             │
│      HttpOnly + Secure cookies                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DATA IN TRANSIT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 Client ↔ Server                                             │
│  └─> HTTPS/TLS 1.3 (Vercel) ✅                                  │
│                                                                 │
│  🔄 Server ↔ Supabase                                           │
│  └─> HTTPS/TLS 1.3 (Supabase) ✅                                │
│                                                                 │
│  🤖 Server ↔ AI APIs                                            │
│  └─> HTTPS/TLS 1.3 ✅                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FUTURE: E2E ENCRYPTION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Phase 3: Zero-Knowledge Architecture                        │
│  ├─> Client-side encryption before upload                      │
│  ├─> Server never sees plaintext                               │
│  ├─> User controls encryption keys                             │
│  └─> Requires key management system                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Implementation Timeline

```
┌────────────────────────────────────────────────────────────────┐
│                    PHASE 1: Critical Fixes                     │
│                    Timeline: 1-2 Weeks                         │
│                    Status: 🚧 Starting                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Week 1:                                                       │
│  ├─ Day 1-2: Security headers + Admin auth fix               │
│  ├─ Day 3-4: Admin auth strengthening                        │
│  └─ Day 5: Testing & code review                             │
│                                                                │
│  Week 2:                                                       │
│  ├─ Day 1-3: Input validation (Zod)                          │
│  ├─ Day 4: CORS restriction                                  │
│  └─ Day 5: Final testing & deploy                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                 PHASE 2: Infrastructure                        │
│                 Timeline: 4-6 Weeks                            │
│                 Status: ⏳ Pending                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Week 1-2: Distributed rate limiting (Upstash Redis)         │
│  Week 2-3: MFA/2FA implementation (Supabase MFA)             │
│  Week 3-4: WAF setup (Cloudflare)                            │
│  Week 4-5: Data export API (GDPR)                            │
│  Week 5-6: Centralized auth middleware                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────────┐
│              PHASE 3: Advanced Security                        │
│              Timeline: 2-3 Months                              │
│              Status: ⏳ Future                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Month 1: Payment processing (Stripe SDK + 3D Secure)        │
│  Month 2: SIEM integration (Datadog) + Anomaly detection     │
│  Month 3: AI safety + Bot protection + E2E encryption         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Security Grade Progression

```
Current State:     Phase 1:        Phase 2:        Phase 3:
     🟡 B-     →     🟡 B+     →     🟢 A-      →     🟢 A+
     
     ┌──┐          ┌──┐           ┌──┐           ┌──┐
     │  │          │  │           │██│           │██│
     │  │          │██│           │██│           │██│
     │██│          │██│           │██│           │██│
     └──┘          └──┘           └──┘           └──┘
     
   Gaps:          Fixed:         Added:         Complete:
   • No auth      • Auth         • MFA          • Payment
   • No headers   • Headers      • WAF          • SIEM
   • No CORS      • CORS         • Redis        • E2E
   • No validate  • Zod          • Export       • AI Safe
```

---

## Cost Breakdown

```
┌────────────────────────────────────────────────────────────────┐
│                     PHASE 1: FREE                              │
├────────────────────────────────────────────────────────────────┤
│  ✅ Code changes only                            $0            │
│  ✅ Supabase (existing)                          $0            │
│  ✅ Vercel (existing)                            $0            │
│                                                                │
│  Total: $0/month                                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                  PHASE 2: $0-50/MONTH                          │
├────────────────────────────────────────────────────────────────┤
│  ☁️ Cloudflare (Free tier)                      $0-20         │
│  📦 Upstash Redis (Free tier)                   $0-10         │
│  🐛 Sentry (Free tier)                          $0-26         │
│  📊 Vercel Analytics (included)                 $0            │
│                                                                │
│  Total: $0-50/month                                            │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│               PHASE 3: $600-1000/MONTH                         │
├────────────────────────────────────────────────────────────────┤
│  💳 Stripe (2.9% + 30¢/txn)                     Variable      │
│  📊 Datadog SIEM                                $200+         │
│  🛡️ Cloudflare Pro                              $20           │
│  🔍 Sift Fraud Detection                        $500+         │
│  🤖 Bot Protection                              $100+         │
│                                                                │
│  Total: $600-1000/month                                        │
└────────────────────────────────────────────────────────────────┘
```

---

## Decision Matrix: What Can We Do Now?

```
┌─────────────────────────┬───────┬──────────┬──────────┬────────┐
│ Feature                 │ Code  │ Infra    │ Can Do   │ Phase  │
│                         │ Only  │ Required │ In PR?   │        │
├─────────────────────────┼───────┼──────────┼──────────┼────────┤
│ Security Headers        │  ✅   │    ❌    │   ✅     │   1    │
│ Input Validation (Zod)  │  ✅   │    ❌    │   ✅     │   1    │
│ Admin Auth Middleware   │  ✅   │    ❌    │   ✅     │   1    │
│ CORS Restriction        │  ✅   │    ❌    │   ✅     │   1    │
│ Fix Admin Endpoints     │  ✅   │    ❌    │   ✅     │   1    │
├─────────────────────────┼───────┼──────────┼──────────┼────────┤
│ MFA/2FA                 │  ✅   │    ⚠️    │   ✅     │   2    │
│ Rate Limiting (Redis)   │  ✅   │    ✅    │   ⚠️     │   2    │
│ WAF                     │  ❌   │    ✅    │   ❌     │   2    │
│ Data Export API         │  ✅   │    ❌    │   ✅     │   2    │
├─────────────────────────┼───────┼──────────┼──────────┼────────┤
│ Payment Processing      │  ✅   │    ⚠️    │   ✅     │   3    │
│ SIEM Integration        │  ⚠️   │    ✅    │   ⚠️     │   3    │
│ Anomaly Detection       │  ✅   │    ⚠️    │   ⚠️     │   3    │
│ E2E Encryption          │  ✅   │    ⚠️    │   ⚠️     │   3    │
└─────────────────────────┴───────┴──────────┴──────────┴────────┘

Legend:
✅ = Can do entirely           ⚠️ = Partial/needs setup
❌ = Cannot do without infra   
```

---

## Key Takeaways

### ✅ What's Good
1. **Strong foundation** - Supabase Auth + RLS
2. **Data privacy** - GDPR-ready implementation
3. **Encryption** - AES-256-GCM for sensitive data
4. **AI security** - Spending caps + BYO keys

### 🔴 What's Critical
1. **Unauthenticated admin endpoint** - Fix immediately
2. **Weak admin auth** - Strengthen with JWT
3. **No input validation** - Add Zod schemas
4. **Missing security headers** - Add to Next.js config
5. **CORS too permissive** - Restrict origins

### 🎯 What's Next
1. **Phase 1** (1-2 weeks) - Fix critical gaps [Code only, $0]
2. **Phase 2** (4-6 weeks) - Add infrastructure [$0-50/mo]
3. **Phase 3** (2-3 months) - Enterprise features [$600-1000/mo]

---

## Quick Start

```bash
# 1. Read the docs
cat SECURITY_ARCHITECTURE.md        # Full analysis
cat SECURITY_PHASE1_IMPLEMENTATION.md # Step-by-step guide
cat SECURITY_QUICK_REF.md            # Quick reference

# 2. Install dependencies
npm install zod

# 3. Start with Task 1: Security Headers
# Edit: next.config.ts
# See: SECURITY_PHASE1_IMPLEMENTATION.md → Task 1

# 4. Run tests
npm run test

# 5. Deploy
git add .
git commit -m "Security Phase 1: Critical fixes"
git push origin main
```

---

**Document Created**: 2025-01-XX  
**Status**: Ready for Implementation  
**Next Action**: Start Phase 1 implementation

