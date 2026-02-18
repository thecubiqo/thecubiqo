# CUBIQO/UBIQO Security Product Roadmap
## Product Owner's Strategic Analysis & Monetization Framework

**Document Owner**: JO (Product Owner - 20% Monetization Stake)  
**Status**: Strategic Analysis & Product Prioritization  
**Last Updated**: 2025-01-XX  
**Focus**: User Trust, Regulatory Compliance, Monetization Enablement

---

## Executive Summary

**Security isn't just a tech checkbox — it's a trust builder, revenue protector, and conversion driver.**

As Product Owner with 20% skin in the game, I'm analyzing this security architecture through three critical lenses:

1. **🚀 MVP Launch Blockers** — What must we have to go live?
2. **💰 Revenue Enablers** — What unlocks paid tiers and protects revenue?
3. **📈 Growth Accelerators** — What builds trust and drives conversion?

**Current Security Grade**: 🟡 **B- (Good Foundation, Critical Gaps)**

**My Verdict**: 
- ✅ **We CAN launch with current security** (70% of MVP requirements met)
- 🔴 **MUST fix 5 critical gaps BEFORE launch** (1-2 weeks work)
- 🟡 **SHOULD add 3 high-priority features within 60 days** (regulatory/trust)
- 🟢 **CAN defer advanced features to post-launch** (enterprise upsells)

---

## Table of Contents

1. [Product Lens: Security as a Feature](#1-product-lens-security-as-a-feature)
2. [MVP Launch Requirements](#2-mvp-launch-requirements)
3. [Feature Prioritization Matrix](#3-feature-prioritization-matrix)
4. [User-Facing vs Backend Security](#4-user-facing-vs-backend-security)
5. [Founders Pass Security Dashboard](#5-founders-pass-security-dashboard)
6. [Monetization Impact Analysis](#6-monetization-impact-analysis)
7. [User Stories & Acceptance Criteria](#7-user-stories--acceptance-criteria)
8. [Competitive Analysis](#8-competitive-analysis)
9. [Product Roadmap](#9-product-roadmap)

---

## 1. Product Lens: Security as a Feature

### 1.1 Why Security Matters to Our Bottom Line

Security isn't just for compliance — it directly impacts our core metrics:

| Security Feature | Product Impact | Metric |
|-----------------|----------------|--------|
| **Magic Link Auth** | Reduces signup friction | +20% conversion (no password fatigue) |
| **GDPR Compliance** | Opens EU market | 450M potential users |
| **Payment Security (PCI-DSS)** | Enables monetization | Unlocks $XX,XXX MRR |
| **2FA/MFA** | Reduces fraud, builds trust | -60% account takeover, +15% retention |
| **Data Privacy Controls** | User empowerment | +25% trust score (surveys) |
| **Audit Logs** | Transparency for enterprises | Unlocks B2B tier ($XX/mo) |

**My 20% stake depends on**:
- **User acquisition** (security builds trust → higher signup rate)
- **User retention** (data privacy → users stay longer)
- **Monetization** (payment security → we can charge)
- **Market expansion** (GDPR/CCPA → EU/CA markets unlocked)

---

### 1.2 The Three-Tier Security Model

I'm proposing we think about security in three tiers that map to our product strategy:

#### 🔴 **Tier 1: Launch Blockers (Must-Have)**
Features we CANNOT launch without (legal, user trust, basic security):
- ✅ Authentication (magic link)
- ✅ Session management
- ✅ HTTPS/TLS
- ❌ **Security headers** (XSS, clickjacking protection)
- ❌ **Admin auth fix** (currently vulnerable!)
- ❌ **Input validation** (SQL injection, XSS)
- ❌ **CORS restriction** (currently allows all origins)
- ⚠️ **GDPR data export** (Article 20 - Right to Portability)

**Timeline**: 1-2 weeks | **Blocks**: Public launch

#### 🟡 **Tier 2: Trust Builders (Should-Have)**
Features that unlock monetization and build user trust:
- MFA/2FA (reduces fraud, enterprise requirement)
- Payment security (PCI-DSS, 3D Secure)
- WAF (DDoS, bot protection)
- Distributed rate limiting (scale to 10K+ users)
- Data export API (GDPR compliance)
- Audit logs UI (transparency for paid users)

**Timeline**: 4-6 weeks | **Unlocks**: Paid tiers, EU market, B2B

#### 🟢 **Tier 3: Enterprise Upsells (Nice-to-Have)**
Features we can charge a premium for:
- E2E encryption (privacy-focused users)
- SSO/SAML (enterprise requirement)
- SIEM integration (enterprise logging)
- Advanced anomaly detection (AI-powered fraud prevention)
- Custom data retention policies (compliance-heavy industries)

**Timeline**: 2-3 months | **Unlocks**: Enterprise tier ($XXX+/mo)

---

## 2. MVP Launch Requirements

### 2.1 What We Have (Current State)

**✅ Good News** — We've got a solid foundation:

1. **Authentication & Access** (70% complete)
   - ✅ Magic link authentication (great UX!)
   - ✅ Supabase JWT sessions
   - ✅ Row-Level Security (RLS) on all tables
   - ✅ OAuth integrations (Gmail, Stripe, Shopify, etc.)
   - ✅ Service role isolation

2. **Data Privacy** (85% complete) 🏆
   - ✅ Consent management system
   - ✅ Configurable retention (1-365 days)
   - ✅ Auto-expiry triggers
   - ✅ Data deletion API
   - ✅ Privacy controls UI
   - ⚠️ Missing: Data export API (GDPR Article 20)

3. **Encryption** (70% complete)
   - ✅ AES-256-GCM for OAuth tokens
   - ✅ HTTPS/TLS in transit
   - ✅ Environment secrets management

4. **Audit Logging** (75% complete)
   - ✅ Audit trails for sensitive actions
   - ✅ Rollback logs for Journey feature
   - ❌ No UI for users to view their own audit logs

---

### 2.2 What We MUST Fix Before Launch 🔴

**Critical Gaps** — These are security vulnerabilities that could hurt users or our reputation:

#### 🔴 **Gap 1: Unauthenticated Admin Endpoint**
- **Issue**: `/api/admin/journal` is publicly accessible — ANYONE can view all user data!
- **Risk**: Data breach, GDPR violation, reputational damage
- **Impact**: High (Critical)
- **Effort**: Low (1 hour fix)
- **Fix**: Add `requireAuth()` + `requireAdmin()` middleware

**User Story**:
```
As a security-conscious founder,
I want admin endpoints protected by authentication,
So that user data is never exposed publicly.

Acceptance Criteria:
- [ ] All `/api/admin/*` routes require authentication
- [ ] Only users with admin role can access
- [ ] Unauthorized requests return 403 Forbidden
- [ ] Audit log records all admin access attempts
```

#### 🔴 **Gap 2: Weak Admin Authentication**
- **Issue**: Admin check is `x-founder-auth: true` header (easily spoofed!)
- **Risk**: Anyone can bypass admin checks
- **Impact**: High (Critical)
- **Effort**: Medium (4 hours)
- **Fix**: Implement JWT-based admin tokens + Supabase metadata role check

**User Story**:
```
As a founder managing the platform,
I want admin access secured with proper authentication,
So that only authorized team members can perform admin actions.

Acceptance Criteria:
- [ ] Admin role stored in Supabase user metadata
- [ ] Admin access verified via JWT claims
- [ ] Admin sessions have shorter expiry (1 hour)
- [ ] Admin actions logged with IP + user agent
```

#### 🔴 **Gap 3: Missing Security Headers**
- **Issue**: No CSP, HSTS, X-Frame-Options, etc.
- **Risk**: XSS attacks, clickjacking, data exfiltration
- **Impact**: Medium (High)
- **Effort**: Low (30 minutes)
- **Fix**: Add security headers to `next.config.ts`

**User Story**:
```
As a user browsing CubiQo,
I want my session protected from common web attacks,
So that my data and account are safe.

Acceptance Criteria:
- [ ] CSP header prevents inline scripts
- [ ] HSTS enforces HTTPS
- [ ] X-Frame-Options prevents clickjacking
- [ ] X-Content-Type-Options prevents MIME sniffing
- [ ] Security headers verified with securityheaders.com
```

#### 🔴 **Gap 4: No Input Validation**
- **Issue**: API routes don't validate input schemas (SQL injection, XSS risk)
- **Risk**: Code injection, data corruption, account takeover
- **Impact**: High (Critical)
- **Effort**: Medium (8 hours)
- **Fix**: Add Zod schemas to all API routes

**User Story**:
```
As a developer building API integrations,
I want clear input validation errors,
So that I know exactly what data format is expected.

Acceptance Criteria:
- [ ] All API routes validate input with Zod schemas
- [ ] Validation errors return clear messages (e.g., "email must be valid")
- [ ] SQL injection attempts are blocked
- [ ] XSS payloads are sanitized
```

#### 🔴 **Gap 5: CORS Set to `*` (Allow All Origins)**
- **Issue**: CORS allows all origins (CSRF attack risk)
- **Risk**: Malicious sites can make authenticated requests
- **Impact**: Medium (High)
- **Effort**: Low (15 minutes)
- **Fix**: Restrict CORS to allowed domains (env variable)

**User Story**:
```
As a security engineer,
I want API access restricted to known origins,
So that malicious sites can't abuse our API.

Acceptance Criteria:
- [ ] CORS restricted to cubiqo.com and localhost (dev)
- [ ] Environment variable for allowed origins
- [ ] Unauthorized origins return 403 Forbidden
- [ ] OPTIONS preflight requests handled correctly
```

---

### 2.3 Nice-to-Have for MVP (Can Launch Without)

These are important but not blockers:

- ⚠️ **Data Export API** (GDPR Article 20) → Can add within 30 days post-launch
- ⚠️ **Cookie Consent Banner** (GDPR) → Can add within 30 days
- ⚠️ **Distributed Rate Limiting** → Current in-memory solution works for <1K users
- ⚠️ **WAF** → Cloudflare free tier provides basic protection
- ⚠️ **MFA/2FA** → Not required for MVP, add within 60 days

---

## 3. Feature Prioritization Matrix

### 3.1 Prioritization Framework

I'm using the **ICE Score** (Impact × Confidence ÷ Effort) to prioritize:

| Feature | Impact (1-10) | Confidence (1-10) | Effort (1-10) | ICE Score | Priority |
|---------|--------------|-------------------|--------------|-----------|----------|
| **Fix admin auth** | 10 | 10 | 2 | 50 | 🔴 P0 |
| **Security headers** | 9 | 10 | 1 | 90 | 🔴 P0 |
| **Input validation** | 10 | 10 | 3 | 33 | 🔴 P0 |
| **CORS restriction** | 8 | 10 | 1 | 80 | 🔴 P0 |
| **Data export API** | 7 | 8 | 4 | 14 | 🟡 P1 |
| **Cookie consent** | 6 | 9 | 2 | 27 | 🟡 P1 |
| **MFA/2FA** | 8 | 9 | 7 | 10 | 🟡 P2 |
| **Payment security** | 9 | 7 | 8 | 8 | 🟡 P2 |
| **WAF** | 7 | 9 | 2 | 32 | 🟡 P2 |
| **Distributed rate limiting** | 6 | 8 | 5 | 10 | 🟡 P2 |
| **E2E encryption** | 5 | 5 | 10 | 2.5 | 🟢 P3 |
| **SIEM integration** | 6 | 7 | 6 | 7 | 🟢 P3 |
| **Anomaly detection** | 7 | 5 | 9 | 4 | 🟢 P3 |

**Legend**:
- **Impact**: How much does this affect user trust, conversion, or revenue?
- **Confidence**: How confident are we in the impact estimate?
- **Effort**: How long will this take? (1=hours, 10=months)
- **ICE Score**: Impact × Confidence ÷ Effort (higher = better ROI)

---

### 3.2 Three-Wave Rollout Strategy

#### **Wave 1: Launch Prep (1-2 Weeks)** 🔴
**Goal**: Fix critical vulnerabilities, achieve "B" security grade

- Fix admin auth (2 days)
- Add security headers (1 day)
- Add input validation (3 days)
- Restrict CORS (1 day)
- Security audit + code review (2 days)

**Outcome**: Safe to launch publicly

#### **Wave 2: Trust & Scale (4-6 Weeks)** 🟡
**Goal**: Build user trust, unlock monetization, meet regulatory requirements

- Data export API (5 days) — GDPR Article 20
- Cookie consent banner (3 days) — GDPR/CCPA
- MFA/2FA (10 days) — User security + enterprise requirement
- Payment security (15 days) — PCI-DSS, 3D Secure, Stripe integration
- WAF setup (2 days) — DDoS + bot protection
- Distributed rate limiting (5 days) — Scale to 10K+ users

**Outcome**: EU market unlocked, paid tiers enabled, enterprise-ready

#### **Wave 3: Enterprise Upsells (2-3 Months)** 🟢
**Goal**: Unlock premium tiers, differentiate from competitors

- E2E encryption (30 days) — Privacy-focused tier
- SIEM integration (10 days) — Enterprise logging
- Anomaly detection (20 days) — AI-powered fraud prevention
- SSO/SAML (15 days) — Enterprise requirement
- Advanced audit logs (10 days) — Compliance tier

**Outcome**: Enterprise tier launched ($XXX+/mo)

---

## 4. User-Facing vs Backend Security

### 4.1 What Users Should See

**Users care about security when it builds trust or gives them control.**

#### **✅ User-Visible Security Features**

1. **Privacy Controls Dashboard** (ALREADY BUILT! 🏆)
   - Data retention settings (1-365 days or forever)
   - Consent management (opt in/out of data collection)
   - Data deletion button ("Delete My Data")
   - Shows what data we collect and why
   - **Why user-visible?** Builds trust, GDPR compliance, user empowerment

2. **MFA/2FA Setup (PLANNED - Wave 2)**
   - QR code for TOTP setup (Google Authenticator, Authy)
   - Backup codes generation
   - Device management (view/revoke sessions)
   - **Why user-visible?** User security, reduces account takeover

3. **Session Management (PLANNED - Wave 2)**
   - See all active sessions (device, location, IP)
   - Revoke any session remotely
   - "Logout all devices" button
   - **Why user-visible?** User control, security transparency

4. **Data Export (PLANNED - Wave 2)**
   - "Download My Data" button
   - JSON export of all user data
   - Includes: messages, memories, integrations, settings
   - **Why user-visible?** GDPR Article 20, user empowerment

5. **Activity Log (PLANNED - Wave 2)**
   - View recent account activity
   - Login history (IP, device, time)
   - OAuth connections/revocations
   - Data exports/deletions
   - **Why user-visible?** Transparency, detect suspicious activity

6. **Cookie Consent Banner (PLANNED - Wave 2)**
   - Granular consent (essential, analytics, marketing)
   - Remembers user choice
   - Link to privacy policy
   - **Why user-visible?** GDPR/CCPA legal requirement

---

### 4.2 What Users Shouldn't See (Backend-Only)

**Backend security is invisible to users — it just works.**

#### **❌ Backend-Only Security Features**

1. **Security Headers** (Wave 1)
   - CSP, HSTS, X-Frame-Options, etc.
   - **Why backend?** Browser enforcement, no user interaction needed

2. **Input Validation** (Wave 1)
   - Zod schemas, SQL injection prevention
   - **Why backend?** Developer-facing, users just see error messages

3. **Rate Limiting** (Wave 1 & 2)
   - Prevents brute-force attacks, DDoS
   - **Why backend?** Users only notice if they're rate-limited (error message)

4. **WAF** (Wave 2)
   - OWASP ruleset, bot detection, DDoS protection
   - **Why backend?** Infrastructure-level, invisible to users

5. **Audit Logging (Admin-Facing)** (Wave 2)
   - Logs all API requests, admin actions
   - **Why backend?** Admin tool, not user-facing (unless we add "Activity Log" UI)

6. **Encryption** (Ongoing)
   - AES-256-GCM for tokens, HTTPS/TLS
   - **Why backend?** Automatic, users just see 🔒 in browser

7. **Admin Role Checks** (Wave 1)
   - JWT-based admin authentication
   - **Why backend?** Access control, not visible to end users

---

### 4.3 The User Experience Balance

**Principle**: Security should be **felt, not seen** — users should feel safe without being overwhelmed by security jargon.

**Good UX**:
- ✅ "Your data is encrypted" (simple, reassuring)
- ✅ "Enable two-factor authentication" (clear, actionable)
- ✅ "Download your data" (GDPR compliance, user empowerment)

**Bad UX**:
- ❌ "AES-256-GCM encryption enabled" (too technical)
- ❌ "JWT session token refreshed" (confusing)
- ❌ "CORS policy applied" (irrelevant to users)

---

## 5. Founders Pass Security Dashboard

### 5.1 Admin Security Features (Founders Pass)

The **Founders Pass** is our admin portal. Here's what security features admins should have:

#### **Current State** (What Exists)
- ✅ PIN-based authentication (PIN: 2026)
- ✅ Feature flag management
- ✅ Gmail integration toggles (demo)
- ✅ Preview mode (cookie-based flag testing)

#### **Proposed Additions** (What We Should Build)

**Priority 1: Admin Security Controls (Wave 1)**

1. **Security Dashboard** (`/founderspass/security`)
   - Real-time threat monitoring
   - Failed login attempts (last 24h)
   - Active admin sessions
   - Recent audit log entries
   - System health indicators

2. **User Management** (`/founderspass/users`)
   - View all users
   - Ban/suspend accounts
   - Reset passwords
   - View user activity
   - Impersonate user (for support, with audit trail)

3. **Audit Log Viewer** (`/founderspass/audit-logs`)
   - Filter by: user, action, date range
   - Export logs (CSV, JSON)
   - Search functionality
   - Show IP, user agent, timestamp for each action

4. **Rate Limit Dashboard** (`/founderspass/rate-limits`)
   - See current rate limit buckets
   - View blocked IPs
   - Manually ban/unban IPs
   - Adjust rate limit thresholds

5. **OAuth Connection Manager** (`/founderspass/integrations`)
   - View all OAuth connections (Gmail, Stripe, etc.)
   - Revoke any connection
   - See token expiry dates
   - Re-encrypt all tokens (key rotation)

**Priority 2: Compliance Tools (Wave 2)**

6. **GDPR Dashboard** (`/founderspass/gdpr`)
   - Data export requests (pending/completed)
   - Data deletion requests (pending/completed)
   - Consent audit trail
   - User retention settings

7. **Payment Dashboard** (`/founderspass/payments`)
   - View all transactions
   - Refund management
   - Chargeback alerts
   - Payment fraud scoring

8. **Security Alerts** (`/founderspass/alerts`)
   - Real-time security notifications
   - Suspicious activity alerts
   - Failed login attempts (threshold breaches)
   - DDoS attack alerts (if WAF enabled)

---

### 5.2 User Stories for Founders Pass

#### **User Story: Security Dashboard**
```
As a founder monitoring the platform,
I want to see real-time security metrics,
So that I can quickly identify and respond to threats.

Acceptance Criteria:
- [ ] Dashboard shows failed login attempts (last 24h)
- [ ] Displays active admin sessions
- [ ] Shows recent audit log entries (last 10)
- [ ] Indicates system health (healthy/warning/critical)
- [ ] Auto-refreshes every 10 seconds
- [ ] Click any metric to drill down into details
```

#### **User Story: User Management**
```
As an admin handling a security incident,
I want to ban a user account,
So that I can prevent further abuse.

Acceptance Criteria:
- [ ] Search for user by email or ID
- [ ] View user profile (created date, last login, activity)
- [ ] Ban/suspend with reason (dropdown + notes)
- [ ] Banned user cannot log in (shows "Account suspended" message)
- [ ] Audit log records ban action (admin ID, reason, timestamp)
- [ ] Admins can unban users later
```

#### **User Story: Audit Log Viewer**
```
As a founder investigating a security incident,
I want to filter audit logs by user and date,
So that I can trace what happened.

Acceptance Criteria:
- [ ] Filter by: user, action type, date range
- [ ] Search by keyword (e.g., "oauth revoked")
- [ ] Sort by timestamp (newest/oldest first)
- [ ] Export filtered logs as CSV or JSON
- [ ] Logs show: user, action, IP, user agent, timestamp
- [ ] Click any log entry to see full details
```

---

## 6. Monetization Impact Analysis

### 6.1 How Security Unlocks Revenue

Security isn't a cost center — it's a **revenue enabler**. Here's how:

| Security Feature | Monetization Impact | Revenue Potential |
|-----------------|---------------------|-------------------|
| **Payment Security (PCI-DSS)** | Enables paid subscriptions | $XX,XXX MRR |
| **MFA/2FA** | Required for enterprise sales | Unlocks B2B tier ($XX/user/mo) |
| **GDPR Compliance** | Opens EU market (450M users) | +30% addressable market |
| **E2E Encryption** | Premium tier feature | $XX/mo (privacy tier) |
| **SSO/SAML** | Enterprise requirement | $XXX/mo (enterprise tier) |
| **SIEM Integration** | Compliance-heavy industries | $XXX/mo (compliance tier) |
| **Audit Logs UI** | Transparency for paid users | Retention driver (-20% churn) |
| **Data Privacy Controls** | Builds trust → higher conversion | +15% free-to-paid |

**Total Revenue Impact**: $XX,XXX+ MRR unlocked by security features

---

### 6.2 Freemium Tier Security

**What's free, what's paid?**

#### **Free Tier (All Users)**
- ✅ Magic link authentication
- ✅ Session management
- ✅ Basic data privacy controls
- ✅ Data deletion
- ✅ HTTPS/TLS encryption
- ✅ GDPR compliance (data export, consent)

**Why free?** Legal requirements, builds trust, drives adoption

#### **Pro Tier ($XX/mo)**
- ✅ MFA/2FA
- ✅ Session device management (view/revoke)
- ✅ Activity log (view recent account activity)
- ✅ Priority support (security issues)
- ✅ Extended audit log retention (90 days vs. 7 days)

**Why paid?** Advanced security, reduces fraud costs, enterprise-lite

#### **Enterprise Tier ($XXX+/mo)**
- ✅ SSO/SAML
- ✅ E2E encryption
- ✅ SIEM integration
- ✅ Custom data retention policies
- ✅ Dedicated security support
- ✅ Advanced anomaly detection
- ✅ SOC 2 compliance certification

**Why paid?** Enterprise requirements, high value, low volume

---

### 6.3 Competitive Differentiation

**How do we stand out?**

| Competitor | Our Advantage |
|------------|---------------|
| **Notion** | We have better data privacy controls (configurable retention) |
| **Obsidian** | We have cloud sync with GDPR compliance (they're local-first) |
| **Roam Research** | We have audit logs UI (they don't expose this to users) |
| **Mem.ai** | We have better OAuth security (AES-256-GCM encryption) |

**Positioning**: *"The only AI journaling platform with enterprise-grade security and GDPR compliance out of the box."*

---

## 7. User Stories & Acceptance Criteria

### 7.1 Wave 1: Launch Prep (Critical Fixes)

#### **Story 1: Fix Unauthenticated Admin Endpoint**
```
**Epic**: Security Hardening
**Priority**: P0 (Critical)
**Effort**: 1 hour
**Sprint**: Wave 1

As a security-conscious founder,
I want admin endpoints protected by authentication,
So that user data is never exposed publicly.

Acceptance Criteria:
- [ ] All `/api/admin/*` routes require authentication
- [ ] Only users with admin role can access
- [ ] Unauthorized requests return 403 Forbidden
- [ ] Audit log records all admin access attempts
- [ ] Test: Try accessing `/api/admin/journal` without auth → 403

Technical Notes:
- Add `requireAdmin()` middleware to all admin routes
- Check user metadata for admin role
- Return clear error: "Admin access required"
```

#### **Story 2: Add Security Headers**
```
**Epic**: Security Hardening
**Priority**: P0 (Critical)
**Effort**: 30 minutes
**Sprint**: Wave 1

As a user browsing CubiQo,
I want my session protected from common web attacks,
So that my data and account are safe.

Acceptance Criteria:
- [ ] CSP header prevents inline scripts
- [ ] HSTS enforces HTTPS (1 year)
- [ ] X-Frame-Options prevents clickjacking
- [ ] X-Content-Type-Options prevents MIME sniffing
- [ ] Referrer-Policy set to origin-when-cross-origin
- [ ] Permissions-Policy restricts camera/mic/geolocation
- [ ] Test: Verify headers on securityheaders.com → A+ grade

Technical Notes:
- Add headers to `next.config.ts`
- Test on multiple browsers (Chrome, Firefox, Safari)
```

#### **Story 3: Add Input Validation (Zod Schemas)**
```
**Epic**: Security Hardening
**Priority**: P0 (Critical)
**Effort**: 8 hours (1 day)
**Sprint**: Wave 1

As a developer building API integrations,
I want clear input validation errors,
So that I know exactly what data format is expected.

Acceptance Criteria:
- [ ] All API routes validate input with Zod schemas
- [ ] Validation errors return 400 Bad Request with clear message
- [ ] SQL injection attempts are blocked
- [ ] XSS payloads are sanitized
- [ ] Test: Send malformed JSON → 400 with "email must be valid"

Technical Notes:
- Create schemas in `/src/lib/schemas/`
- Use `z.object()` for request bodies
- Add to routes: `/api/chat`, `/api/auth/*`, `/api/admin/*`
```

#### **Story 4: Restrict CORS to Known Origins**
```
**Epic**: Security Hardening
**Priority**: P0 (Critical)
**Effort**: 15 minutes
**Sprint**: Wave 1

As a security engineer,
I want API access restricted to known origins,
So that malicious sites can't abuse our API.

Acceptance Criteria:
- [ ] CORS restricted to cubiqo.com and localhost (dev)
- [ ] Environment variable `ALLOWED_ORIGINS` for config
- [ ] Unauthorized origins return 403 Forbidden
- [ ] OPTIONS preflight requests handled correctly
- [ ] Test: Request from evil-site.com → 403

Technical Notes:
- Add to `next.config.ts` or middleware
- Read from `process.env.ALLOWED_ORIGINS`
- Default: `cubiqo.com,localhost:3000`
```

---

### 7.2 Wave 2: Trust & Scale (High Priority)

#### **Story 5: Data Export API (GDPR Article 20)**
```
**Epic**: GDPR Compliance
**Priority**: P1 (High)
**Effort**: 5 days
**Sprint**: Wave 2

As a user exercising my GDPR rights,
I want to download all my data in a portable format,
So that I can move to another service if I choose.

Acceptance Criteria:
- [ ] User can click "Download My Data" in settings
- [ ] Exports JSON file with all user data
- [ ] Includes: profile, messages, memories, integrations, settings
- [ ] File named: `cubiqo-data-{user-id}-{timestamp}.json`
- [ ] Export logged in audit trail
- [ ] Rate limited to 1 export per hour (prevent abuse)
- [ ] Test: Download, verify JSON structure, re-import on test account

Technical Notes:
- Endpoint: `GET /api/user/export`
- Query all user data from Supabase
- Format as JSON (GDPR-compliant structure)
- Set `Content-Disposition: attachment`
```

#### **Story 6: Cookie Consent Banner (GDPR/CCPA)**
```
**Epic**: GDPR Compliance
**Priority**: P1 (High)
**Effort**: 3 days
**Sprint**: Wave 2

As a user in the EU,
I want to control which cookies are set,
So that I comply with GDPR and protect my privacy.

Acceptance Criteria:
- [ ] Banner appears on first visit (bottom or top of page)
- [ ] Three options: Essential, Analytics, Marketing
- [ ] "Accept All" and "Reject All" buttons
- [ ] "Customize" opens modal with granular controls
- [ ] Choice stored in cookie: `__cubiqo_consent`
- [ ] Google Analytics only loads if "Analytics" is accepted
- [ ] Banner doesn't appear again after choice is made
- [ ] Test: Reject all → verify no analytics scripts load

Technical Notes:
- Use library: `@consent-manager/core` or custom
- Store consent in cookie (1 year expiry)
- Update privacy policy with cookie descriptions
```

#### **Story 7: MFA/2FA with TOTP**
```
**Epic**: User Security
**Priority**: P2 (Medium)
**Effort**: 10 days
**Sprint**: Wave 2

As a user with sensitive data,
I want to enable two-factor authentication,
So that my account is protected even if my password is compromised.

Acceptance Criteria:
- [ ] User can enable MFA in account settings
- [ ] Shows QR code for TOTP setup (Google Authenticator, Authy)
- [ ] Generates 10 backup codes (download as PDF)
- [ ] On next login, prompts for 6-digit TOTP code
- [ ] Invalid code shows "Invalid code, please try again"
- [ ] Can disable MFA (requires current password)
- [ ] Test: Enable MFA, logout, login with TOTP → success

Technical Notes:
- Use Supabase MFA API (`supabase.auth.mfa.enroll()`)
- Generate TOTP secret with `otplib` or similar
- Store backup codes encrypted in database
```

#### **Story 8: Payment Security (Stripe Integration)**
```
**Epic**: Monetization
**Priority**: P2 (Medium)
**Effort**: 15 days
**Sprint**: Wave 2

As a user ready to upgrade to Pro,
I want to enter my payment details securely,
So that I can subscribe without worrying about fraud.

Acceptance Criteria:
- [ ] Payment form uses Stripe Elements (tokenized, PCI-compliant)
- [ ] 3D Secure (SCA) enabled for EU cards
- [ ] Payment Intent created with metadata (user ID, plan)
- [ ] Webhook verifies payment status
- [ ] Successful payment grants Pro access immediately
- [ ] Failed payment shows clear error message
- [ ] Test: Pay with test card → Pro access granted

Technical Notes:
- Use Stripe SDK (`stripe.paymentIntents.create()`)
- Enable 3D Secure: `payment_method_options: { card: { request_three_d_secure: 'automatic' } }`
- Webhook: `POST /api/webhooks/stripe` (verify signature)
- Update user role in Supabase on success
```

---

### 7.3 Wave 3: Enterprise Upsells (Nice-to-Have)

#### **Story 9: E2E Encryption (Privacy Tier)**
```
**Epic**: Enterprise Features
**Priority**: P3 (Low)
**Effort**: 30 days
**Sprint**: Wave 3

As a privacy-conscious user,
I want my messages and memories encrypted end-to-end,
So that even CubiQo admins can't read my data.

Acceptance Criteria:
- [ ] User can enable E2E encryption in settings
- [ ] Generates encryption key pair (public/private)
- [ ] Private key stored locally (never sent to server)
- [ ] All messages encrypted before upload
- [ ] Decrypted only on user's device
- [ ] Shows "🔒 E2E Encrypted" badge in UI
- [ ] Test: Admin cannot read encrypted messages in database

Technical Notes:
- Use Web Crypto API (`crypto.subtle.generateKey()`)
- Store private key in IndexedDB (encrypted with user password)
- Encrypt with AES-256-GCM
- This is a MAJOR architectural change — requires careful planning
```

#### **Story 10: SSO/SAML (Enterprise Tier)**
```
**Epic**: Enterprise Features
**Priority**: P3 (Low)
**Effort**: 15 days
**Sprint**: Wave 3

As an enterprise IT admin,
I want employees to log in with SSO (Okta, Azure AD),
So that I can manage access centrally.

Acceptance Criteria:
- [ ] Support SAML 2.0 protocol
- [ ] Admin can configure SSO in Founders Pass
- [ ] Users see "Continue with SSO" button
- [ ] Redirects to IdP (Okta, Azure AD) for authentication
- [ ] Returns to CubiQo after successful login
- [ ] User provisioning (auto-create accounts)
- [ ] Test: Login with Okta test account → success

Technical Notes:
- Use library: `@boxyhq/saml-jackson` or similar
- Supabase supports SAML via third-party providers
- Requires enterprise plan (only for $XXX+/mo customers)
```

---

## 8. Competitive Analysis

### 8.1 How Competitors Handle Security

| Competitor | MFA | E2E Encryption | GDPR | Data Export | Audit Logs | SSO/SAML |
|------------|-----|----------------|------|-------------|------------|----------|
| **Notion** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ⚠️ Paid only | ✅ Enterprise |
| **Obsidian** | N/A (local) | ✅ Yes (local) | N/A | N/A | N/A | N/A |
| **Roam Research** | ✅ Yes | ❌ No | ⚠️ Partial | ❌ No | ❌ No | ❌ No |
| **Mem.ai** | ❌ No | ❌ No | ⚠️ Partial | ❌ No | ❌ No | ❌ No |
| **CubiQo** (Current) | ❌ No | ❌ No | ✅ Yes (85%) | ⚠️ Missing | ⚠️ Backend only | ❌ No |
| **CubiQo** (Wave 2) | ✅ Yes | ❌ No | ✅ Yes (100%) | ✅ Yes | ✅ Yes | ❌ No |
| **CubiQo** (Wave 3) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

**Insight**: After Wave 2, we'll be competitive with Notion (our main competitor). After Wave 3, we'll have the most comprehensive security in the space.

---

### 8.2 Pricing Comparison

| Feature | Notion | Roam Research | Mem.ai | CubiQo (Proposed) |
|---------|--------|---------------|--------|-------------------|
| **Free Tier** | Yes | No ($15/mo min) | Yes | Yes |
| **Pro Tier** | $10/mo | $15/mo | $10/mo | **$XX/mo** |
| **Enterprise Tier** | Custom | $500+/mo | N/A | **$XXX/mo** |
| **MFA** | Pro+ | All | N/A | **Pro+** |
| **SSO** | Enterprise | Enterprise | N/A | **Enterprise** |
| **E2E Encryption** | N/A | N/A | N/A | **Enterprise** |

**Positioning**: We can charge a premium for security features (MFA in Pro, SSO/E2E in Enterprise).

---

## 9. Product Roadmap

### 9.1 Timeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY ROADMAP                          │
└─────────────────────────────────────────────────────────────────┘

WAVE 1: Launch Prep (1-2 Weeks) 🔴
├─ Fix admin auth ✓
├─ Add security headers ✓
├─ Add input validation ✓
├─ Restrict CORS ✓
└─ Security audit ✓
   👉 OUTCOME: Safe to launch publicly (B+ security grade)

WAVE 2: Trust & Scale (4-6 Weeks) 🟡
├─ Data export API ✓
├─ Cookie consent banner ✓
├─ MFA/2FA ✓
├─ Payment security (Stripe) ✓
├─ WAF setup ✓
├─ Distributed rate limiting ✓
└─ Founders Pass security dashboard ✓
   👉 OUTCOME: EU market unlocked, paid tiers enabled

WAVE 3: Enterprise Upsells (2-3 Months) 🟢
├─ E2E encryption ✓
├─ SIEM integration ✓
├─ Anomaly detection ✓
├─ SSO/SAML ✓
└─ Advanced audit logs ✓
   👉 OUTCOME: Enterprise tier launched ($XXX+/mo)
```

---

### 9.2 Milestone Targets

| Milestone | Target Date | Revenue Impact | Key Features |
|-----------|-------------|----------------|--------------|
| **MVP Launch** | Week 0 (Now) | $0 (free only) | Magic link, RLS, privacy controls |
| **Wave 1 Complete** | Week 2 | $0 (still free) | Fixed critical gaps, safe to launch |
| **Wave 2 Complete** | Week 8 | $X,XXX MRR | Paid tiers enabled, EU market open |
| **Wave 3 Complete** | Week 20 | $XX,XXX MRR | Enterprise tier, advanced security |

---

### 9.3 Success Metrics

**How do we measure security's impact?**

| Metric | Baseline | Target (Wave 2) | Target (Wave 3) |
|--------|----------|-----------------|-----------------|
| **Security Grade** | B- | A- | A+ |
| **User Trust Score** | N/A | 8.5/10 (survey) | 9.5/10 |
| **Conversion Rate (Free → Paid)** | N/A | 3% | 5% |
| **Enterprise Deals** | 0 | 2 | 10 |
| **EU Users (%)** | 0% | 25% | 35% |
| **Churn Rate** | N/A | <5% | <3% |
| **Account Takeover Incidents** | 0 | 0 | 0 |
| **GDPR Complaints** | 0 | 0 | 0 |

---

## Summary: The Bottom Line

### What I Recommend (Product Owner Verdict)

**For Launch (Wave 1)**:
- ✅ Fix 5 critical gaps (1-2 weeks work)
- ✅ Achieve B+ security grade
- ✅ Launch publicly with confidence

**For Growth (Wave 2)**:
- ✅ Add MFA, payment security, GDPR export (4-6 weeks)
- ✅ Unlock paid tiers and EU market
- ✅ Reach A- security grade

**For Enterprise (Wave 3)**:
- ✅ Add E2E encryption, SSO, SIEM (2-3 months)
- ✅ Launch $XXX+/mo enterprise tier
- ✅ Achieve A+ security grade

**Revenue Projection**:
- Wave 1: $0 MRR (free only)
- Wave 2: $X,XXX MRR (paid tiers enabled)
- Wave 3: $XX,XXX MRR (enterprise tier)

**My 20% stake depends on executing Wave 2 — that's where the money is.**

---

**JO (Product Owner)**  
*"Security isn't just a tech requirement — it's a trust builder, conversion driver, and revenue protector."*
