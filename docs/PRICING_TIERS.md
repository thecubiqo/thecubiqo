# Pricing Tiers - Canonical Reference

**STATUS**: ✅ ACTIVE - Single Source of Truth  
**OWNER**: JO (Product Owner)  
**LAST UPDATED**: February 19, 2026  
**DATABASE SCHEMA**: `subscription_tiers` table (free, pro, lifetime, commander, general)

---

## 🎯 Purpose

This document is the **canonical reference** for Cubiqo's pricing tiers and feature gating. All code, PRs, and documentation must align with this reference. If there's a conflict, this document wins.

---

## 💰 Canonical Tier Definitions

| Tier | Database Value | Price | Target User | Status |
|------|---------------|-------|-------------|--------|
| **Free** | `free` | $0/forever | New users, students, explorers | ✅ Active |
| **Pro** | `pro` | $29/month | Individual professionals, power users | ✅ Active |
| **Lifetime** | `lifetime` | $399/once | Early adopters, lifetime access | ✅ Active |
| **Commander** | `commander` | $499/month | Teams, agencies, power creators | ✅ Active |
| **General** | `general` | $1,999/month | Enterprises, large teams | ✅ Active |

### Tier Hierarchy
```
Free < Pro = Lifetime < Commander < General
```
*(Lifetime has same features as Pro, just one-time payment)*

---

## 🎁 Feature-to-Tier Mapping

### 1. Core Chat & AI
| Feature | Free | Pro | Commander | General |
|---------|------|-----|-----------|---------|
| AI Chat Messages | 20/day | Unlimited | Unlimited | Unlimited |
| Context Window | 4K tokens | 32K tokens | 128K tokens | 128K tokens |
| Response Quality | Standard | Premium | Premium | Premium |
| Chat History | 7 days | Unlimited | Unlimited | Unlimited |
| Custom Instructions | ❌ | ✅ | ✅ | ✅ |
| Multi-model Access | ❌ | ✅ | ✅ | ✅ |

**Feature Gate**: Check `user.subscription_tier` + `daily_message_count`  
**API Routes**: `/api/chat`, `/api/ai/completion`  
**Conversion Trigger**: Show upgrade modal at 18/20 messages (90% usage)

---

### 2. Voice Features
| Feature | Free | Pro | Commander | General |
|---------|------|-----|-----------|---------|
| Voice Input | ❌ | ✅ | ✅ | ✅ |
| Voice Output (TTS) | ❌ | ✅ | ✅ | ✅ |
| Voice Clone | ❌ | ❌ | ✅ | ✅ |
| Custom Voice Models | ❌ | ❌ | ❌ | ✅ |

**Feature Gate**: `subscription_tier !== 'free'` for basic voice  
**API Routes**: `/api/voice/transcribe`, `/api/voice/synthesize`  
**Conversion Trigger**: Show "Unlock Voice" on microphone icon hover (Free users)

---

### 3. Journal Features
| Feature | Free | Pro | Commander | General |
|---------|------|-----|-----------|---------|
| Journal Entries | 1/day | Unlimited | Unlimited | Unlimited |
| Entry History | 7 days | Unlimited | Unlimited | Unlimited |
| AI Insights | ❌ | ✅ | ✅ | ✅ |
| Mood Tracking | Basic | Advanced | Advanced | Advanced |
| Export | ❌ | ✅ (PDF/MD) | ✅ (All formats) | ✅ (All formats) |
| Voice Journal | ❌ | ✅ | ✅ | ✅ |

**Feature Gate**: Check `daily_journal_count` + `subscription_tier`  
**API Routes**: `/api/journal/create`, `/api/journal/insights`  
**Conversion Trigger**: Show upgrade prompt after 1st journal entry (Free users)

---

### 4. Job Hunt Mode
| Feature | Free | Pro | Commander | General |
|---------|------|-----|-----------|---------|
| Job Hunt Mode | 3 searches/week | Unlimited | Unlimited | Unlimited |
| Resume Analysis | ❌ | ✅ | ✅ | ✅ |
| Cover Letter Gen | ❌ | ✅ | ✅ | ✅ |
| Interview Prep | ❌ | ✅ | ✅ | ✅ |
| Job Tracking | ❌ | ✅ | ✅ | ✅ |

**Feature Gate**: `weekly_job_search_count` + `subscription_tier`  
**API Routes**: `/api/job-hunt/*`  
**Conversion Trigger**: After 2nd job search in week, show Pro benefits

---

### 5. RGY Chat Rooms & ProMatch
| Feature | Free | Pro | Commander | General |
|---------|------|-----|-----------|---------|
| Browse Chat Rooms | ✅ | ✅ | ✅ | ✅ |
| Join Public Rooms | ✅ (1 at a time) | ✅ (5 at a time) | ✅ (Unlimited) | ✅ (Unlimited) |
| Create Rooms | ❌ | ✅ | ✅ | ✅ |
| ProMatch Access | ❌ | ✅ | ✅ | ✅ |
| Private Rooms | ❌ | ✅ | ✅ | ✅ |
| Room Moderation | ❌ | ❌ | ✅ | ✅ |

**Feature Gate**: `subscription_tier` check for room actions  
**API Routes**: `/api/rgy/rooms/*`, `/api/promatch/*`  
**Conversion Trigger**: Show "Upgrade to Create Rooms" on create button (Free users)

---

### 6. Emergent (AI App Builder)
| Feature | Free | Pro | Commander | General |
|---------|------|-----|-----------|---------|
| Build Apps | ❌ | 5 apps | Unlimited | Unlimited |
| Deploy Apps | ❌ | ✅ | ✅ | ✅ |
| Custom Domains | ❌ | ❌ | ✅ | ✅ |
| White Label | ❌ | ❌ | ❌ | ✅ |
| Team Collaboration | ❌ | ❌ | ✅ | ✅ |

**Feature Gate**: Check `app_count` against tier limits  
**API Routes**: `/api/emergent/*`  
**Conversion Trigger**: Show "Unlock App Builder" on Emergent page (Free users)

---

### 7. Social Army (Creator Tools)
| Feature | Free | Pro | Commander | General |
|---------|------|-----|-----------|---------|
| Social Army Access | ❌ | ❌ | ✅ | ✅ |
| Content Generation | ❌ | ❌ | 100/month | Unlimited |
| Multi-platform Post | ❌ | ❌ | 5 platforms | 10 platforms |
| Analytics | ❌ | ❌ | Basic | Advanced |
| Team Accounts | ❌ | ❌ | 3 users | 10 users |

**Feature Gate**: `subscription_tier in ['commander', 'general']`  
**API Routes**: `/api/social-army/*`  
**Conversion Trigger**: Show "Upgrade to Commander" on Social Army page (Pro users)

---

### 8. Enterprise Security & Compliance
| Feature | Free | Pro | Commander | General |
|---------|------|-----|-----------|---------|
| Data Encryption | ✅ (AES-256) | ✅ | ✅ | ✅ |
| SOC 2 Compliance | ✅ | ✅ | ✅ | ✅ |
| GDPR Compliance | ✅ | ✅ | ✅ | ✅ |
| SSO / SAML | ❌ | ❌ | ❌ | ✅ |
| Advanced Permissions | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ | ✅ |
| Custom SLA | ❌ | ❌ | ❌ | ✅ |

**Note**: Security is a baseline feature, not a monetization lever. All tiers get core security.

---

### 9. Admin & Monitoring (Founders Pass)
| Feature | Free | Pro | Commander | General | Founders Pass |
|---------|------|-----|-----------|---------|---------------|
| Admin Dashboard | ❌ | ❌ | ❌ | ❌ | ✅ |
| System Monitoring | ❌ | ❌ | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ |
| Feature Flags | ❌ | ❌ | ❌ | ❌ | ✅ |
| Analytics Dashboard | ❌ | ❌ | ❌ | ❌ | ✅ |

**Feature Gate**: `user.founders_pass === true` (separate from subscription tiers)  
**API Routes**: `/api/admin/*`

---

## 🚪 Feature Gating Implementation

### Middleware Pattern
```typescript
// /middleware/featureGate.ts
export function requireTier(minTier: SubscriptionTier) {
  return (req, res, next) => {
    const userTier = req.user.subscription_tier;
    if (!hasAccess(userTier, minTier)) {
      return res.status(403).json({
        error: 'Upgrade required',
        userTier,
        requiredTier: minTier,
        upgradeUrl: '/pricing'
      });
    }
    next();
  };
}
```

### API Route Examples
```typescript
// /api/voice/transcribe - Requires Pro+
app.post('/api/voice/transcribe', requireTier('pro'), handler);

// /api/social-army/* - Requires Commander+
app.use('/api/social-army', requireTier('commander'));

// /api/chat - Free tier with usage limits
app.post('/api/chat', checkDailyLimit('messages', 20), handler);
```

---

## 💡 Conversion Triggers

### 1. Usage-Based Triggers
- **18/20 daily messages** (Free) → "Upgrade to Pro for unlimited"
- **1 journal entry used** (Free) → "Upgrade for unlimited journaling"
- **2/3 job searches used** (Free) → "Unlock unlimited job searches"

### 2. Feature Discovery Triggers
- **Hover on microphone icon** (Free) → "Unlock voice features with Pro"
- **Click "Create Room"** (Free) → "Upgrade to create custom chat rooms"
- **Visit Emergent page** (Free) → "Build 5 apps with Pro"
- **Visit Social Army** (Pro) → "Upgrade to Commander for creator tools"

### 3. Value-Based Triggers
- **After 7 days of daily use** (Free) → "You're a power user! Unlock Pro features"
- **After 5 journal entries** (Free, over multiple days with workarounds) → "Get unlimited journaling"
- **After 3 voice interactions** (Pro) → "Try voice cloning with Commander"

---

## ⚠️ Important Notes

### PR #132 Pricing Conflict
**STATUS**: ❌ PR #132 proposes conflicting pricing (Free/$19 Premium/$99 Enterprise)  
**ACTION REQUIRED**: Update PR #132 to match this canonical reference OR close and resubmit  
**REASON**: Database schema and production code use free/pro/commander/general tiers

### Database Schema Alignment
The `subscription_tiers` table uses these values:
- `free`
- `pro`
- `lifetime` (equivalent to `pro` features, different payment model)
- `commander`
- `general`

All feature checks MUST use these exact values.

### Founders Pass Exception
`founders_pass` is a separate boolean flag, NOT a subscription tier. It grants admin access regardless of subscription level.

---

## 📊 Conversion Funnel

```
Free User → Pro ($29/mo)
  Triggers: Daily limits, voice features, unlimited journal
  
Pro User → Commander ($499/mo)
  Triggers: Social Army, unlimited apps, team features
  
Commander → General ($1,999/mo)
  Triggers: SSO/SAML, advanced analytics, custom SLA, white label
```

---

## 🔄 Maintenance

**This document must be updated whenever:**
1. New features are added
2. Pricing changes are proposed
3. Feature gates are modified
4. New tiers are introduced

**Review Frequency**: Monthly (JO ownership)  
**Stakeholders**: JO (owner), MO (technical approval), CEO (business approval)

---

## 🚀 Quick Reference for Developers

| I need to gate... | Check this | Min Tier |
|-------------------|------------|----------|
| AI chat | `daily_message_count` | free (limited) |
| Voice features | `subscription_tier` | pro |
| Journal insights | `subscription_tier` | pro |
| Unlimited journal | `subscription_tier` | pro |
| Room creation | `subscription_tier` | pro |
| ProMatch | `subscription_tier` | pro |
| Emergent apps | `subscription_tier` + `app_count` | pro (5 max) |
| Social Army | `subscription_tier in ['commander', 'general']` | commander |
| Admin features | `founders_pass === true` | N/A |

---

**END OF CANONICAL PRICING REFERENCE**

*This document is the single source of truth. When in doubt, refer here.*  
*Questions? Tag @JO in PR comments or Slack.*
