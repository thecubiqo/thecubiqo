# CUBIQO/UBIQO Security Architecture
## Technical Architecture & Implementation Roadmap

**Document Owner**: MO (CTO/Tech Architect)  
**Status**: Architecture Analysis & Implementation Plan  
**Last Updated**: 2025-01-XX

---

## Executive Summary

This document provides a comprehensive security architecture analysis for the CUBIQO/UBIQO platform, identifying current implementations, security gaps, and a phased approach to achieving enterprise-grade security posture.

**Current Security Grade**: 🟡 **B- (Good Foundation, Critical Gaps)**

**Key Findings**:
- ✅ Strong foundation: Supabase RLS, OAuth encryption, audit logging
- ⚠️ Critical gaps: Missing security headers, inconsistent API auth, no WAF
- ⚠️ Payment processing: Not implemented (Stripe OAuth only)
- ✅ Data privacy: Excellent (GDPR/CCPA-ready with Journey feature)

---

## Table of Contents

1. [Current Security Posture](#1-current-security-posture)
2. [Security Gap Analysis](#2-security-gap-analysis)
3. [Phased Implementation Roadmap](#3-phased-implementation-roadmap)
4. [Architecture Components](#4-architecture-components)
5. [Recommended Tools & Libraries](#5-recommended-tools--libraries)
6. [Implementation Priorities](#6-implementation-priorities)

---

## 1. Current Security Posture

### 1.1 Authentication & Access Control ✅ (Good)

**What Exists**:
- ✅ Supabase Authentication with JWT sessions
- ✅ Magic link authentication (OTP-based)
- ✅ OAuth 2.0 integration (Gmail, Shopify, Printify, Printful, Stripe, Uber)
- ✅ Session management with automatic refresh via middleware
- ✅ Row-Level Security (RLS) on all database tables
- ✅ Service role isolation for admin operations
- ✅ Email-based RBAC for admin verification

**What's Missing**:
- ❌ Multi-Factor Authentication (MFA/2FA)
- ❌ Biometric authentication support
- ❌ Session device management (view/revoke devices)
- ❌ Suspicious login detection
- ❌ Geographic IP restrictions
- ⚠️ Basic admin header auth (`x-founder-auth`) needs strengthening

**Implementation Status**: 70% Complete

---

### 1.2 WAF & Intrusion Prevention ❌ (Not Implemented)

**What Exists**:
- ✅ Basic rate limiting (in-memory, per-session):
  - Chat API: 100 req/hour
  - TTS API: 10 req/minute
- ✅ Code execution sandboxing (blocks dangerous commands)
- ✅ Path traversal protection in workspace sandbox

**What's Missing**:
- ❌ Web Application Firewall (WAF)
- ❌ DDoS protection
- ❌ Distributed rate limiting (current solution won't scale horizontally)
- ❌ OWASP Top 10 protection layers
- ❌ IP reputation/blocklist checking
- ❌ Request signature validation

**Implementation Status**: 20% Complete  
**Dependency**: Requires infrastructure (Cloudflare, AWS WAF, or similar)

---

### 1.3 Phishing & Fraud Detection ❌ (Not Implemented)

**What Exists**:
- ✅ Audit logging for sensitive actions
- ✅ OAuth state validation (prevents CSRF)

**What's Missing**:
- ❌ Email verification for suspicious activity
- ❌ Device fingerprinting and trust scoring
- ❌ Anomaly detection (unusual login patterns)
- ❌ Account takeover protection
- ❌ Bot detection (CAPTCHA, challenge-response)
- ❌ Risk-based authentication

**Implementation Status**: 10% Complete  
**Dependency**: Requires ML models or 3rd party services (Sift, Arkose Labs)

---

### 1.4 Payment Security ❌ (Not Implemented)

**What Exists**:
- ✅ Stripe OAuth integration (for Connect accounts)
- ✅ AES-256-GCM encryption for OAuth tokens

**What's Missing**:
- ❌ Stripe Payment Intent API integration
- ❌ PCI-DSS compliance measures
- ❌ 3D Secure (SCA) implementation
- ❌ Subscription management
- ❌ Invoice generation
- ❌ Chargeback handling
- ❌ Payment audit trails
- ❌ Webhook signature verification for Stripe events

**Implementation Status**: 5% Complete (OAuth only)  
**Note**: No actual payment processing exists; requires full Stripe SDK integration

---

### 1.5 Data Privacy (GDPR/CCPA) ✅ (Excellent)

**What Exists**:
- ✅ Consent management system (`journey_consents` table)
- ✅ Configurable data retention (1-365 days or forever)
- ✅ Auto-expiry triggers and cleanup functions
- ✅ Data deletion API (individual + bulk)
- ✅ Consent revocation with audit trail
- ✅ RLS policies on all sensitive tables
- ✅ Privacy controls UI component
- ✅ PII minimization in logs/analytics
- ✅ Sensitive data flagging (`is_sensitive`)

**What's Missing**:
- ⚠️ Data export API (GDPR Article 20 - Right to Portability)
- ⚠️ Cookie consent banner (GDPR/CCPA compliance)
- ⚠️ Privacy policy versioning and change notifications
- ⚠️ Automated DSAR (Data Subject Access Request) workflow

**Implementation Status**: 85% Complete

---

### 1.6 Encryption & Data Protection ✅ (Good)

**What Exists**:
- ✅ AES-256-GCM encryption for OAuth tokens (server-side)
- ✅ PBKDF2 key derivation for API keys (client-side)
- ✅ IV + auth tags for encrypted data integrity
- ✅ HTTPS/TLS in transit (via Vercel)
- ✅ Environment variable secrets management
- ✅ Service role key isolation

**What's Missing**:
- ⚠️ End-to-End Encryption (E2E) for messages/memories
- ⚠️ Zero-knowledge architecture
- ⚠️ Hardware Security Module (HSM) integration
- ⚠️ Key rotation policies
- ⚠️ Encryption at rest for Supabase (depends on Supabase plan)

**Implementation Status**: 70% Complete

---

### 1.7 Backend & API Security ⚠️ (Critical Gaps)

**What Exists**:
- ✅ Session-based rate limiting (in-memory)
- ✅ Supabase RLS for multi-tenancy
- ✅ OAuth token encryption
- ✅ CORS headers (overly permissive)
- ✅ Cron job secret validation

**Critical Issues**:
- 🔴 **Unauthenticated admin endpoint** (`/api/admin/journal` - exposes all user analytics!)
- 🔴 **Weak admin auth** (`x-founder-auth: true` header check)
- 🔴 **No input validation schemas** (missing Zod or similar)
- 🔴 **CORS set to `*`** (allows all origins)
- 🔴 **No centralized auth middleware** (each route implements own checks)
- 🔴 **Rate limiting won't scale** (in-memory, breaks with multiple instances)
- ⚠️ Missing security headers (CSP, HSTS, X-Frame-Options)

**Implementation Status**: 50% Complete (major gaps)

---

### 1.8 Monitoring & Incident Response ⚠️ (Partial)

**What Exists**:
- ✅ Audit logging (`audit_logs`, `journey_rollback_logs`)
- ✅ Error handling with error responses
- ✅ Self-healing cron job for automated recovery
- ✅ Event tracking system

**What's Missing**:
- ❌ SIEM (Security Information & Event Management) integration
- ❌ Real-time threat detection
- ❌ Automated alerting for security events
- ❌ Log aggregation and analysis (ELK stack, Datadog, etc.)
- ❌ Incident response playbooks
- ❌ Security dashboard
- ❌ Anomaly detection on API usage

**Implementation Status**: 30% Complete  
**Dependency**: Requires external monitoring services

---

### 1.9 AI Model Security ✅ (Good)

**What Exists**:
- ✅ Spending caps per provider ($200/month)
- ✅ Runtime budget checks before API calls
- ✅ BYO key support (users provide own API keys)
- ✅ Encrypted API key storage (client-side)
- ✅ Graceful fallback chain (MiniMax → Mixtral → Llama → Claude)
- ✅ Sensitive content routing (intimate content → Claude only)
- ✅ Cost tracking and estimation

**What's Missing**:
- ⚠️ Prompt injection protection
- ⚠️ Output sanitization (prevent data leakage)
- ⚠️ Model versioning and rollback
- ⚠️ AI abuse detection (excessive requests, malicious prompts)

**Implementation Status**: 75% Complete

---

## 2. Security Gap Analysis

### 2.1 Critical Gaps (Immediate Action Required) 🔴

| Gap | Impact | Effort | Dependencies |
|-----|--------|--------|--------------|
| **Unauthenticated `/api/admin/journal`** | High - Exposes all user data | Low - Add auth check | None |
| **Weak admin auth** (`x-founder-auth` header) | High - Easy to bypass | Medium - Implement JWT | None |
| **Missing security headers** | Medium - XSS, clickjacking risk | Low - Add to `next.config.ts` | None |
| **No input validation schemas** | High - Injection attacks | Medium - Add Zod schemas | None |
| **CORS set to `*`** | Medium - CSRF attacks | Low - Restrict origins | None |

**Timeline**: Can be fixed in **Phase 1 (1-2 weeks)**

---

### 2.2 High Priority Gaps (Phase 2) 🟡

| Gap | Impact | Effort | Dependencies |
|-----|--------|--------|--------------|
| **MFA/2FA** | Medium - Account takeover risk | High - Full auth flow | Supabase MFA API |
| **Distributed rate limiting** | Medium - DDoS vulnerability | Medium - Redis setup | Redis/Upstash |
| **WAF** | High - OWASP Top 10 attacks | Low - Config only | Cloudflare/AWS |
| **Data export API** (GDPR) | Medium - Compliance risk | Medium - Export logic | None |
| **Centralized auth middleware** | Medium - Inconsistent security | High - Refactor all routes | None |

**Timeline**: **Phase 2 (4-6 weeks)**

---

### 2.3 Medium Priority Gaps (Phase 3) 🟢

| Gap | Impact | Effort | Dependencies |
|-----|--------|--------|--------------|
| **Payment processing** (Stripe SDK) | Low - No payments yet | High - Full integration | Business decision |
| **SIEM integration** | Medium - Blind spots | Medium - Setup & config | Datadog/Splunk |
| **Anomaly detection** | Medium - Missed threats | High - ML models | Sift/Custom ML |
| **E2E encryption** | Low - Privacy enhancement | Very High - Architecture change | Key management system |

**Timeline**: **Phase 3 (2-3 months)**

---

## 3. Phased Implementation Roadmap

### Phase 1: Critical Security Fixes (1-2 Weeks) 🔴

**Goal**: Fix immediate vulnerabilities that can be exploited today.

**Code Changes** (Can be done in this PR or next sprint):

1. **Add Security Headers** (`next.config.ts`)
   ```typescript
   const securityHeaders = [
     { key: 'X-DNS-Prefetch-Control', value: 'on' },
     { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
     { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
     { key: 'X-Content-Type-Options', value: 'nosniff' },
     { key: 'X-XSS-Protection', value: '1; mode=block' },
     { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
     { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
     {
       key: 'Content-Security-Policy',
       value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
     }
   ]
   ```

2. **Fix Unauthenticated Admin Endpoint**
   - Add auth check to `/api/admin/journal`
   - Use existing `getCurrentUser()` pattern

3. **Strengthen Admin Auth**
   - Replace `x-founder-auth` header with JWT-based admin tokens
   - Implement admin role verification via Supabase metadata

4. **Add Input Validation** (Zod schemas)
   ```typescript
   import { z } from 'zod'
   
   const ChatRequestSchema = z.object({
     message: z.string().min(1).max(5000),
     sessionId: z.string().uuid().optional(),
     context: z.record(z.unknown()).optional()
   })
   ```

5. **Restrict CORS**
   - Change `Access-Control-Allow-Origin: '*'` to specific domains
   - Use environment variable for allowed origins

6. **Centralize Rate Limiting**
   - Extract rate limiting logic to shared middleware
   - Prepare for Redis migration (Phase 2)

**Deliverables**:
- ✅ Security headers enabled
- ✅ All admin endpoints authenticated
- ✅ Input validation on all API routes
- ✅ CORS restricted to known origins
- ✅ Code review & security audit passed

---

### Phase 2: Infrastructure & Scaling (4-6 Weeks) 🟡

**Goal**: Scale security controls and add enterprise features.

**Code Changes**:

1. **Distributed Rate Limiting** (Redis/Upstash)
   ```typescript
   import { Ratelimit } from '@upstash/ratelimit'
   import { Redis } from '@upstash/redis'
   
   const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(100, '1h'),
     analytics: true
   })
   ```

2. **Centralized Auth Middleware**
   ```typescript
   // middleware/auth.ts
   export async function requireAuth(req: NextRequest) {
     const supabase = createServerClient()
     const { data: { user }, error } = await supabase.auth.getUser()
     if (error || !user) throw new UnauthorizedError()
     return user
   }
   
   export async function requireAdmin(req: NextRequest) {
     const user = await requireAuth(req)
     const isAdmin = await checkAdminRole(user.id)
     if (!isAdmin) throw new ForbiddenError()
     return user
   }
   ```

3. **MFA/2FA Integration** (Supabase MFA API)
   ```typescript
   // Enable TOTP-based MFA
   const { data, error } = await supabase.auth.mfa.enroll({
     factorType: 'totp'
   })
   
   // Verify TOTP code
   const { data: verified } = await supabase.auth.mfa.verify({
     factorId: data.id,
     code: userInputCode
   })
   ```

4. **Data Export API** (GDPR Compliance)
   ```typescript
   // GET /api/user/export
   export async function GET(req: NextRequest) {
     const user = await requireAuth(req)
     const data = await exportUserData(user.id)
     return new Response(JSON.stringify(data), {
       headers: {
         'Content-Type': 'application/json',
         'Content-Disposition': 'attachment; filename="user-data.json"'
       }
     })
   }
   ```

5. **Enhanced Audit Logging**
   - Log all API access with IP, user agent, timestamp
   - Track failed login attempts
   - Alert on suspicious patterns

**Infrastructure Changes** (Requires DevOps/Infrastructure):

1. **WAF Setup** (Cloudflare or AWS WAF)
   - Enable OWASP ruleset
   - Configure rate limiting at edge
   - Enable bot protection

2. **Redis/Upstash Deployment**
   - Setup Redis instance for distributed rate limiting
   - Configure connection pooling

3. **Monitoring Setup**
   - Vercel Analytics (built-in)
   - Error tracking (Sentry)
   - Log aggregation (Datadog or ELK stack)

**Deliverables**:
- ✅ MFA enabled for all users
- ✅ Distributed rate limiting via Redis
- ✅ WAF enabled with OWASP rules
- ✅ Data export API (GDPR compliance)
- ✅ Centralized auth middleware
- ✅ Enhanced audit logging
- ✅ Monitoring dashboard operational

---

### Phase 3: Advanced Security & Compliance (2-3 Months) 🟢

**Goal**: Enterprise-grade security, AI safety, payment processing.

**Code Changes**:

1. **Payment Processing** (Stripe SDK)
   ```typescript
   import Stripe from 'stripe'
   
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
   
   // Create Payment Intent with 3D Secure
   const paymentIntent = await stripe.paymentIntents.create({
     amount: 2000,
     currency: 'usd',
     payment_method_types: ['card'],
     metadata: { userId: user.id }
   })
   
   // Confirm with SCA
   const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
     payment_method: 'pm_card_visa',
     return_url: 'https://cubiqo.com/payment/complete'
   })
   ```

2. **Webhook Signature Verification**
   ```typescript
   const sig = req.headers['stripe-signature']
   const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
   ```

3. **AI Prompt Injection Protection**
   ```typescript
   import { detectPromptInjection } from '@/lib/ai/safety'
   
   export async function POST(req: NextRequest) {
     const { message } = await req.json()
     const isInjection = await detectPromptInjection(message)
     if (isInjection) return new Response('Prompt injection detected', { status: 400 })
     // Continue...
   }
   ```

4. **SIEM Integration** (Datadog, Splunk, or custom)
   ```typescript
   import { logSecurityEvent } from '@/lib/monitoring/siem'
   
   logSecurityEvent({
     event: 'admin_access',
     userId: user.id,
     ip: req.ip,
     userAgent: req.headers['user-agent'],
     resource: '/api/admin/journal',
     timestamp: new Date()
   })
   ```

5. **Anomaly Detection**
   - Track user behavior patterns
   - Alert on deviations (unusual location, time, frequency)
   - Implement risk scoring

**Infrastructure Changes**:

1. **HSM Integration** (AWS CloudHSM or similar)
   - Store encryption keys in HSM
   - Implement key rotation policies

2. **SIEM Deployment**
   - Setup Datadog/Splunk
   - Configure log forwarding
   - Create security dashboards

3. **Bot Protection** (Cloudflare Turnstile, reCAPTCHA)
   - Add CAPTCHA to sensitive flows
   - Implement device fingerprinting

**Deliverables**:
- ✅ Stripe payment processing with 3D Secure
- ✅ PCI-DSS compliance checklist complete
- ✅ AI prompt injection protection
- ✅ SIEM integration operational
- ✅ Anomaly detection system active
- ✅ Bot protection enabled

---

## 4. Architecture Components

### 4.1 Security Layers Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Web Crypto   │  │  MFA Flow    │  │ Device       │          │
│  │ (API Keys)   │  │  (TOTP)      │  │ Fingerprint  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ▼ HTTPS/TLS
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE (WAF)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ DDoS         │  │ Bot          │  │ OWASP        │          │
│  │ Protection   │  │ Detection    │  │ Ruleset      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Security     │  │ Rate Limiting│  │ CORS         │          │
│  │ Headers      │  │ (Redis)      │  │ Policy       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS MIDDLEWARE                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Session      │  │ Auth Check   │  │ Input        │          │
│  │ Refresh      │  │ (JWT)        │  │ Validation   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ROUTES (SERVER)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ requireAuth  │  │ requireAdmin │  │ Audit        │          │
│  │ Middleware   │  │ Middleware   │  │ Logging      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (DATABASE)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Row Level    │  │ Auth System  │  │ Encrypted    │          │
│  │ Security     │  │ (JWT)        │  │ Storage      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING & SIEM                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Datadog      │  │ Sentry       │  │ Vercel       │          │
│  │ (Logs)       │  │ (Errors)     │  │ Analytics    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Authentication Flow (with MFA)

```
┌─────────┐                          ┌─────────┐
│ Browser │                          │ Server  │
└────┬────┘                          └────┬────┘
     │                                    │
     │  1. Login Request (email/pass)    │
     │ ───────────────────────────────>  │
     │                                    │
     │  2. Verify Credentials            │
     │                                    │ ──> Supabase Auth
     │                                    │
     │  3. Check MFA Enabled?            │
     │                                    │ ──> Check user metadata
     │                                    │
     │  4. Request MFA Code              │
     │ <───────────────────────────────  │
     │                                    │
     │  5. User Enters TOTP Code         │
     │ ───────────────────────────────>  │
     │                                    │
     │  6. Verify TOTP                   │
     │                                    │ ──> Supabase MFA API
     │                                    │
     │  7. Issue JWT + Refresh Token     │
     │ <───────────────────────────────  │
     │                                    │
     │  8. Store Session (Cookie)        │
     │ <───────────────────────────────  │
     │                                    │
     │  9. Redirect to Dashboard         │
     │ <───────────────────────────────  │
     │                                    │
```

---

### 4.3 API Request Flow (with Security Layers)

```
1. [Client Request] ────────────────────────────────────────┐
                                                            │
2. [Cloudflare WAF] ──> Check IP reputation               │
                    ──> Apply OWASP rules                  │
                    ──> Bot detection                      │
                                                            │
3. [Vercel Edge] ────> Rate limiting (Redis)              │
                 ───> Security headers                     │
                 ───> CORS validation                      │
                                                            │
4. [Next.js Middleware] ──> Session refresh               │
                        ──> JWT validation                 │
                                                            │
5. [API Route] ──────────> requireAuth() middleware       │
               ──────────> Input validation (Zod)         │
               ──────────> Business logic                 │
               ──────────> Audit logging                  │
                                                            │
6. [Supabase] ───────────> RLS policy check               │
              ───────────> Query execution                │
              ───────────> Return data                    │
                                                            │
7. [Response] ───────────> Format response                │
              ───────────> Log to SIEM                    │
              ───────────> Send to client                 │
                                                            │
8. [Monitoring] ─────────> Track metrics                  │
                ─────────> Alert on anomalies             │
```

---

## 5. Recommended Tools & Libraries

### 5.1 Code-Level Security (Can Implement in PR)

| Category | Tool | Purpose | Installation |
|----------|------|---------|--------------|
| **Input Validation** | [Zod](https://zod.dev/) | Schema validation | `npm install zod` |
| **Rate Limiting** | [Upstash Rate Limit](https://upstash.com/docs/redis/features/ratelimiting) | Distributed rate limiting | `npm install @upstash/ratelimit @upstash/redis` |
| **Security Headers** | Built-in | CSP, HSTS, etc. | Configure in `next.config.ts` |
| **Encryption** | Node crypto (built-in) | AES-256-GCM | Already implemented |
| **JWT** | Supabase Auth | JWT management | Already integrated |
| **MFA** | Supabase MFA API | TOTP-based 2FA | Already available |
| **API Security** | Custom middleware | Auth checks | Create `lib/middleware/` |

---

### 5.2 Infrastructure Security (Requires External Setup)

| Category | Tool | Purpose | Cost | Effort |
|----------|------|---------|------|--------|
| **WAF** | [Cloudflare](https://www.cloudflare.com/) | DDoS, bot protection | $20-200/mo | Low |
| **WAF** | [AWS WAF](https://aws.amazon.com/waf/) | OWASP protection | $5+ usage | Medium |
| **Monitoring** | [Datadog](https://www.datadoghq.com/) | SIEM, APM, logs | $15+/host | Medium |
| **Monitoring** | [Sentry](https://sentry.io/) | Error tracking | Free-$26/mo | Low |
| **Redis** | [Upstash](https://upstash.com/) | Serverless Redis | Free-$10/mo | Low |
| **Bot Protection** | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) | CAPTCHA alternative | Free | Low |
| **Bot Protection** | [reCAPTCHA](https://www.google.com/recaptcha/) | Google CAPTCHA | Free | Low |
| **Payment** | [Stripe](https://stripe.com/) | Payment processing | 2.9% + 30¢ | High |
| **Fraud Detection** | [Sift](https://sift.com/) | ML-based fraud detection | $500+/mo | High |
| **HSM** | [AWS CloudHSM](https://aws.amazon.com/cloudhsm/) | Hardware key storage | $1.50/hr | High |

---

### 5.3 Recommended Stack (Balanced Cost/Value)

**For Startup Phase** (Minimal Cost):
- ✅ Cloudflare Free Plan (basic WAF + DDoS)
- ✅ Upstash Free Tier (10K requests/day Redis)
- ✅ Sentry Free Tier (5K errors/month)
- ✅ Vercel Analytics (included with Vercel)
- ✅ Supabase Auth + MFA (included)
- **Total Cost**: $0-20/month

**For Growth Phase** (Enterprise-Ready):
- 💰 Cloudflare Pro ($20/month)
- 💰 Upstash Pro ($10/month)
- 💰 Datadog APM ($15/host)
- 💰 Stripe (2.9% + 30¢ per transaction)
- 💰 Sift Fraud Detection ($500+/month)
- **Total Cost**: $600-1000/month

---

## 6. Implementation Priorities

### 6.1 Critical (Do First - This Sprint)

1. ✅ **Fix `/api/admin/journal` auth** (HIGH RISK)
   - Add `requireAdmin()` middleware
   - Test with authenticated + unauthenticated users
   - **Effort**: 30 minutes
   - **Assignee**: Blossom (Backend)

2. ✅ **Add Security Headers** (`next.config.ts`)
   - CSP, HSTS, X-Frame-Options, etc.
   - **Effort**: 1 hour
   - **Assignee**: Bubbles (Frontend)

3. ✅ **Add Zod Validation to All API Routes**
   - Create schemas for each endpoint
   - Replace manual validation with Zod
   - **Effort**: 2-3 days
   - **Assignee**: Blossom (Backend)

4. ✅ **Restrict CORS Origins**
   - Change from `*` to specific domains
   - Use environment variable
   - **Effort**: 30 minutes
   - **Assignee**: Blossom (Backend)

5. ✅ **Strengthen Admin Auth**
   - Replace `x-founder-auth` with JWT admin tokens
   - **Effort**: 1 day
   - **Assignee**: Blossom (Backend)

**Total Effort**: ~4-5 days  
**Can be completed in current sprint**

---

### 6.2 High Priority (Next Sprint - 4-6 Weeks)

1. 🟡 **Setup Distributed Rate Limiting** (Upstash)
   - Create Upstash account
   - Migrate in-memory rate limiting to Redis
   - **Effort**: 2 days
   - **Assignee**: Blossom (Backend) + DevOps

2. 🟡 **Implement MFA/2FA**
   - Use Supabase MFA API
   - Create enrollment flow
   - Add TOTP verification
   - **Effort**: 5 days
   - **Assignee**: Blossom (Backend) + Bubbles (Frontend)

3. 🟡 **Setup WAF** (Cloudflare)
   - Point DNS to Cloudflare
   - Enable OWASP ruleset
   - Configure bot protection
   - **Effort**: 1 day
   - **Assignee**: DevOps

4. 🟡 **Create Data Export API** (GDPR)
   - Build export endpoint
   - Generate JSON/CSV exports
   - **Effort**: 3 days
   - **Assignee**: Blossom (Backend)

5. 🟡 **Centralize Auth Middleware**
   - Create `requireAuth()`, `requireAdmin()` helpers
   - Refactor all routes to use middleware
   - **Effort**: 5 days
   - **Assignee**: Blossom (Backend)

**Total Effort**: ~16 days (3-4 weeks with testing)

---

### 6.3 Medium Priority (Phase 3 - 2-3 Months)

1. 🟢 **Payment Processing** (Stripe SDK)
   - Integrate Stripe Payment Intents
   - Implement 3D Secure
   - Build subscription management
   - **Effort**: 3-4 weeks
   - **Assignee**: Blossom (Backend)

2. 🟢 **SIEM Integration** (Datadog)
   - Setup Datadog account
   - Configure log forwarding
   - Create security dashboards
   - **Effort**: 1 week
   - **Assignee**: DevOps

3. 🟢 **AI Safety** (Prompt Injection Protection)
   - Research detection methods
   - Implement filtering
   - Test edge cases
   - **Effort**: 2 weeks
   - **Assignee**: Blossom (Backend)

4. 🟢 **Anomaly Detection**
   - Track user behavior patterns
   - Implement risk scoring
   - Alert on suspicious activity
   - **Effort**: 3 weeks
   - **Assignee**: Blossom (Backend) + Data Engineer

**Total Effort**: ~9-10 weeks

---

## 7. Decision Matrix: Code vs Infrastructure

| Security Feature | Code Change? | Infrastructure? | Can Do in PR? | Dependencies |
|------------------|--------------|-----------------|---------------|--------------|
| **Security Headers** | ✅ Yes | ❌ No | ✅ Yes | None |
| **Input Validation (Zod)** | ✅ Yes | ❌ No | ✅ Yes | `npm install zod` |
| **Auth Middleware** | ✅ Yes | ❌ No | ✅ Yes | Supabase (exists) |
| **CORS Restriction** | ✅ Yes | ❌ No | ✅ Yes | None |
| **MFA/2FA** | ✅ Yes | ⚠️ Partial (Supabase) | ✅ Yes | Supabase MFA API |
| **Rate Limiting (Redis)** | ✅ Yes | ✅ Yes (Upstash) | ⚠️ Partial | Upstash account |
| **WAF** | ❌ No | ✅ Yes | ❌ No | Cloudflare/AWS |
| **SIEM** | ⚠️ Partial | ✅ Yes | ⚠️ Partial | Datadog/Splunk |
| **Payment Processing** | ✅ Yes | ⚠️ Partial (Stripe) | ✅ Yes | Stripe account |
| **Bot Protection** | ⚠️ Partial | ✅ Yes | ⚠️ Partial | Cloudflare Turnstile |
| **Anomaly Detection** | ✅ Yes | ⚠️ Partial (ML) | ⚠️ Partial | ML models/Sift |

**Legend**:
- ✅ **Can do entirely with code**
- ⚠️ **Requires code + external service (but can integrate)**
- ❌ **Requires infrastructure only (no code changes)**

---

## 8. Summary & Recommendations

### Current State: 🟡 **B- Security Grade**

**Strengths**:
- ✅ Solid authentication foundation (Supabase, JWT, OAuth)
- ✅ Excellent data privacy implementation (GDPR-ready)
- ✅ Good encryption (AES-256-GCM, TLS)
- ✅ AI model security (spending caps, BYO keys)
- ✅ Row-level security (RLS) on all tables

**Critical Gaps**:
- 🔴 Unauthenticated admin endpoint
- 🔴 Weak admin authentication
- 🔴 Missing security headers
- 🔴 No input validation schemas
- 🔴 Overly permissive CORS

**Path to A+ Security Grade**:
1. **Phase 1** (1-2 weeks): Fix critical gaps → **B+ Grade**
2. **Phase 2** (4-6 weeks): Add MFA, WAF, distributed rate limiting → **A- Grade**
3. **Phase 3** (2-3 months): Payment processing, SIEM, AI safety → **A+ Grade**

---

### Immediate Actions (This Sprint)

**Can Start Today**:
1. Add security headers to `next.config.ts`
2. Fix `/api/admin/journal` authentication
3. Strengthen admin auth (JWT-based)
4. Add Zod schemas to API routes
5. Restrict CORS to specific origins

**PR Scope**:
- These are all code changes
- No infrastructure dependencies
- Can be reviewed and merged in 1 week
- Low risk, high impact

**Assignees**:
- **Blossom (Backend)**: API auth, Zod schemas, CORS
- **Bubbles (Frontend)**: Security headers, CSP config
- **Buttercup (QA)**: Test all changes, security audit
- **MO (CTO)**: Review, approve, merge

---

### Beyond This PR (Requires Infrastructure)

**Phase 2 Dependencies**:
- Upstash Redis account (free tier)
- Cloudflare account (free tier)
- Sentry account (free tier)

**Phase 3 Dependencies**:
- Stripe account (payment processing)
- Datadog account (SIEM)
- Sift account (fraud detection) - optional

**Strategic Decision Points**:
1. **Payment Processing**: Do we need this now? If not, defer Phase 3.
2. **SIEM**: Can start with free Sentry, upgrade to Datadog later.
3. **WAF**: Cloudflare free tier is sufficient for now.

---

## Conclusion

The CUBIQO/UBIQO platform has a **solid security foundation** with excellent data privacy implementation and strong authentication patterns. However, **critical gaps in API security** (unauthenticated endpoints, weak admin auth, missing input validation) pose immediate risks.

**Recommended Approach**:
1. **This PR/Sprint**: Fix all code-level security issues (Phase 1)
2. **Next Sprint**: Setup infrastructure dependencies (Upstash, Cloudflare) and implement Phase 2
3. **Future Roadmap**: Payment processing and advanced security features (Phase 3)

**Effort Estimate**:
- Phase 1: 4-5 days (can complete in current sprint)
- Phase 2: 3-4 weeks (next sprint)
- Phase 3: 2-3 months (future roadmap)

**Cost Estimate**:
- Phase 1: $0 (code changes only)
- Phase 2: $0-50/month (free tiers + Cloudflare Pro optional)
- Phase 3: $600-1000/month (payment processing + enterprise tools)

---

**Next Steps**:
1. Review this architecture document with the team
2. Get approval to proceed with Phase 1 fixes
3. Create Jira tickets for each Phase 1 task
4. Assign to Blossom (Backend) and Bubbles (Frontend)
5. Target completion: End of current sprint

---

**Document Control**:
- **Created**: 2025-01-XX
- **Owner**: MO (CTO/Tech Architect)
- **Reviewers**: CEO, JO (Product Owner), Team Leads
- **Status**: Draft → Pending Approval → Approved → In Progress
- **Next Review**: After Phase 1 completion

---

*"Security is not a feature, it's a foundation."*  
— MO, CTO

