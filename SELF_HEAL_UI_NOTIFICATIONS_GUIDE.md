# Self-Heal System: UI, Notifications & Antivirus-like Features

## Overview

This document answers key questions about how the self-heal system integrates with the UI, delivers notifications, acts like antivirus software, and can run independently of the main infrastructure.

---

## 1. UI Integration: Where Does It Show Up?

### A. **Admin Dashboard** (`/admin`)
The main admin dashboard provides quick access to system health monitoring:
- Navigation links to Self-Heal Reports
- System Health Monitor access
- Notification badge showing unread alerts

### B. **Self-Heal Reports Page** (`/admin/self-heal`)
**Purpose**: Historical view of all self-heal executions

**Features**:
- ✅ Filter reports by status (success/partial/failed)
- ✅ View key metrics: fixed issues, critical issues, recommendations
- ✅ Detailed modal with diagnostics, repairs, and rollback patches
- ✅ Email delivery status
- ✅ Execution time tracking

**Access**: Only admin users can view

### C. **System Health Monitor** (`/admin/system-health`) ⭐ **NEW**
**Purpose**: Real-time antivirus-like monitoring dashboard

**Features**:
- 🛡️ **Live threat level indicator** (safe/caution/warning/critical)
- 📊 **Real-time metrics**: CPU, memory, disk, sessions, error rate
- 🔍 **Manual scan button** for on-demand diagnostics
- 🔒 **Quarantine section** for critical issues
- ⚡ **Performance metrics** with threshold alerts
- 🎯 **Health score** (0-100) calculated from system metrics

**Visual Design**:
- Color-coded threat levels (green/yellow/orange/red)
- Progress bars for each metric
- Animated scanning interface
- Auto-updating metrics every 3 seconds

---

## 2. Notifications: Where Do They Go?

### A. **Email Notifications** (Current)
**Configured**: Via Resend API
**Recipients**: Admin emails (configurable via `SELF_HEAL_EMAIL_TO`)
**Frequency**: Daily after cron execution (10:00 AM)
**Content**:
- Status summary (success/partial/failed)
- Diagnostic counts (healthy/warnings/critical)
- Fixes applied
- Verification signature

**HTML Email Template**:
- Professional gradient header
- Status badge (✅⚠️❌)
- Summary table with metrics
- Artifact paths
- Cryptographic signature for verification

### B. **In-App Notifications** ⭐ **NEW**
**Database**: `notifications` table in Supabase
**Types**:
- `self_heal_critical` - Critical issues requiring immediate attention
- `self_heal_warning` - Warnings that need review
- `self_heal_success` - Successful repairs
- `system_health` - General system health alerts
- `security_alert` - Security-related notifications
- `performance_issue` - Performance degradation alerts

**Priority Levels**:
- `low` - Informational
- `medium` - Should review
- `high` - Needs attention soon
- `critical` - Immediate action required

**Features**:
- ✅ Persistent storage in database
- ✅ Read/unread tracking
- ✅ Dismiss functionality
- ✅ Expiration dates
- ✅ User-specific and system-wide notifications
- ✅ Action URLs for quick navigation

### C. **Webhook Notifications** ⭐ **NEW**
**Configuration**: `NOTIFICATION_WEBHOOK_URL` environment variable
**Triggers**: High and critical priority alerts
**Payload**:
```json
{
  "id": "uuid",
  "type": "self_heal_critical",
  "priority": "critical",
  "title": "Critical System Issue Detected",
  "message": "Database connection pool exhausted",
  "details": {...},
  "timestamp": "2026-02-19T10:00:00Z"
}
```
**Security**: Optional secret header (`NOTIFICATION_WEBHOOK_SECRET`)

### D. **Slack Integration** ⭐ **NEW**
**Configuration**: `SLACK_WEBHOOK_URL` environment variable
**Triggers**: High and critical priority alerts
**Format**:
- Emoji-based priority indicators (📘📙🟠🔴)
- Structured blocks with title, message, context
- Rich formatting with markdown support

---

## 3. How Does It Act Like Antivirus?

### Antivirus-like Features

#### A. **Real-Time Monitoring**
Like antivirus software that constantly monitors for threats:
- ✅ **Live metrics updates** every 3 seconds
- ✅ **Threshold-based detection** (CPU > 80%, Memory > 85%, etc.)
- ✅ **Threat level scoring** (0-100 health score)
- ✅ **Active issue tracking** with real-time alerts

#### B. **Scheduled Scans**
Like antivirus scheduled scans:
- ✅ **Daily cron job** at 10:00 AM
- ✅ **Comprehensive diagnostics**:
  - Database health check
  - Memory usage analysis
  - Disk space monitoring
  - Agent status verification
  - Session cleanup
- ✅ **Automated reporting**

#### C. **Manual Scan**
Like antivirus "Scan Now" button:
- ✅ **On-demand scanning** via UI button
- ✅ **Progress indicator** with animation
- ✅ **Immediate results** displayed in quarantine section
- ✅ **Scan history** tracking

#### D. **Quarantine System**
Like antivirus quarantine for threats:
- ✅ **Isolated issue storage** in quarantine section
- ✅ **Detailed threat information** (title, description, severity)
- ✅ **One-click resolution** buttons
- ✅ **Safe handling** of critical issues

#### E. **Auto-Repair**
Like antivirus automatic fixes:
- ✅ **Safe repair actions**:
  - Cache clearing
  - Service restarts
  - Session cleanup
  - Migration re-application
- ✅ **Rollback patches** for all changes
- ✅ **Audit trail** of all actions

#### F. **Threat Classification**
Like antivirus threat levels:
- 🟢 **SAFE** (90-100 score): System healthy
- 🟡 **CAUTION** (70-89 score): Minor issues
- 🟠 **WARNING** (50-69 score): Attention needed
- 🔴 **CRITICAL** (0-49 score): Immediate action required

#### G. **Visual Indicators**
Like antivirus dashboard:
- ✅ Color-coded health status
- ✅ Progress bars for metrics
- ✅ Real-time threat counter
- ✅ System resource monitoring
- ✅ Animated scanning visual

---

## 4. Infrastructure: Running Outside Main CubiQo

### Current Setup: **Integrated** (Part of Main Infrastructure)

**Current Implementation**:
- Self-heal runs as API route within Next.js app
- Triggered by Vercel Cron or GitHub Actions
- Shares database and resources with main app
- No isolation from main application

### Option 1: **External Cron Service** (Recommended)

**Setup with External Trigger**:

```bash
# 1. Use external cron service (cron-job.org, EasyCron, etc.)
# Configure to hit endpoint:
POST https://your-app.com/api/cron/self-heal
Authorization: Bearer YOUR_CRON_SECRET

# 2. Or use GitHub Actions (already configured)
# .github/workflows/self-heal-cron.yml runs daily

# 3. Or use serverless functions (AWS Lambda, etc.)
# Deploy function to call self-heal endpoint
```

**Pros**:
- ✅ Minimal changes needed
- ✅ Still uses existing infrastructure
- ✅ External trigger provides some isolation

**Cons**:
- ❌ Still shares main app resources
- ❌ Can't run if main app is down

### Option 2: **Standalone Service** (Maximum Isolation)

**Architecture**:
```
┌─────────────────────────┐
│  Main CubiQo App        │
│  (Next.js)              │
│  Port: 3000             │
└─────────┬───────────────┘
          │
          │ API Calls
          ▼
┌─────────────────────────┐
│  Self-Heal Service      │
│  (Standalone Node.js)   │
│  Port: 3001             │
│  - Diagnostics          │
│  - Repairs              │
│  - Reporting            │
└─────────┬───────────────┘
          │
          │ Database
          ▼
┌─────────────────────────┐
│  Shared Supabase        │
│  (PostgreSQL)           │
└─────────────────────────┘
```

**Implementation Steps**:

1. **Create Standalone Service**:
```bash
# Create new Node.js project
mkdir self-heal-service
cd self-heal-service
npm init -y
npm install express @supabase/supabase-js resend node-cron
```

2. **Move Self-Heal Logic**:
```typescript
// server.ts
import express from 'express';
import cron from 'node-cron';
import { executeSelfHeal } from './self-heal';

const app = express();
const PORT = 3001;

// API endpoint
app.post('/heal', async (req, res) => {
  const result = await executeSelfHeal();
  res.json(result);
});

// Scheduled job
cron.schedule('0 10 * * *', async () => {
  console.log('Running scheduled self-heal...');
  await executeSelfHeal();
});

app.listen(PORT, () => {
  console.log(`Self-heal service running on port ${PORT}`);
});
```

3. **Docker Container** (for deployment):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

4. **Docker Compose** (for local development):
```yaml
version: '3.8'
services:
  main-app:
    build: ./main-app
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
  
  self-heal:
    build: ./self-heal-service
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CRON_SECRET=${CRON_SECRET}
    restart: unless-stopped
```

**Pros**:
- ✅ Complete isolation from main app
- ✅ Independent scaling
- ✅ Runs even if main app is down
- ✅ Separate resource allocation
- ✅ Can use different runtime (Node.js, Python, Go)

**Cons**:
- ❌ More complex deployment
- ❌ Additional infrastructure cost
- ❌ Needs separate monitoring

### Option 3: **Serverless Functions**

**Deploy to AWS Lambda / Vercel / Cloudflare Workers**:

```typescript
// lambda-handler.ts
export async function handler(event: any) {
  const result = await executeSelfHeal();
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}
```

**Trigger via EventBridge/CloudWatch**:
```yaml
# serverless.yml
functions:
  selfHeal:
    handler: lambda-handler.handler
    events:
      - schedule: cron(0 10 * * ? *)
    timeout: 300
```

**Pros**:
- ✅ No server management
- ✅ Automatic scaling
- ✅ Pay per execution
- ✅ Isolated from main app

**Cons**:
- ❌ Cold starts
- ❌ Execution time limits
- ❌ More complex debugging

---

## Configuration & Environment Variables

### Required (Current Setup)
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cron Protection
CRON_SECRET=your_random_secret

# Email Notifications
RESEND_API_KEY=your_resend_api_key
SELF_HEAL_EMAIL_FROM=noreply@cubiqo.ai
SELF_HEAL_EMAIL_TO=admin@cubiqo.ai
```

### Optional (New Features)
```bash
# Webhook Notifications
NOTIFICATION_WEBHOOK_URL=https://your-webhook.com/notify
NOTIFICATION_WEBHOOK_SECRET=your_webhook_secret

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# System Health Monitoring
ENABLE_REALTIME_METRICS=true
METRICS_UPDATE_INTERVAL=3000
```

---

## Usage Guide

### For Administrators

#### View Self-Heal Reports
1. Navigate to `/admin/self-heal`
2. Use filters to find specific reports
3. Click report card for detailed view
4. Review diagnostics, repairs, and rollback patches

#### Monitor System Health (Antivirus-like)
1. Navigate to `/admin/system-health`
2. View real-time threat level and health score
3. Monitor live metrics (CPU, memory, disk, etc.)
4. Click "Run Manual Scan" for immediate diagnostics
5. Review quarantined issues and resolve

#### Configure Notifications
1. Set up email notifications (Resend API)
2. Configure Slack webhook (optional)
3. Set up external webhook (optional)
4. Adjust notification preferences in user profile

### For Developers

#### Send Custom Notifications
```typescript
import { NotificationService } from '@/lib/notifications/service';

await NotificationService.send({
  type: 'self_heal_critical',
  priority: 'critical',
  title: 'Database Connection Lost',
  message: 'Unable to connect to primary database',
  details: { error: 'ECONNREFUSED', retries: 3 },
  actionUrl: '/admin/system-health',
  actionLabel: 'View System Health',
  expiresInHours: 24,
});
```

#### Trigger Manual Scan
```bash
# Via API
curl -X POST https://your-app.com/api/admin/system-health/scan \
  -H "Authorization: Bearer YOUR_TOKEN"

# Via UI
Navigate to /admin/system-health and click "Run Manual Scan"
```

---

## Security Considerations

### When Running Integrated
- ✅ Uses existing authentication
- ✅ Admin-only access via RLS policies
- ✅ CRON_SECRET protects endpoint
- ⚠️ Shares resources with main app

### When Running as Separate Service
- ✅ Complete resource isolation
- ✅ Independent authentication
- ✅ Network-level security
- ⚠️ Needs separate authentication mechanism
- ⚠️ Requires secure service-to-service communication

**Best Practices**:
1. Always use HTTPS
2. Rotate CRON_SECRET regularly
3. Use strong authentication for standalone service
4. Monitor logs for unauthorized access
5. Set up rate limiting on endpoints

---

## Monitoring & Alerts

### Metrics to Track
- Self-heal execution success rate
- Average execution time
- Number of critical issues detected
- Notification delivery rate
- System health score trends

### Alert Conditions
- Self-heal job failure (3 consecutive)
- Critical health score (< 50)
- High error rate (> 5%)
- Resource exhaustion (CPU > 90%, Memory > 95%)

---

## Roadmap

### Phase 1: Current ✅
- Email notifications
- Historical reports
- Manual diagnostics

### Phase 2: In Progress 🚧
- Real-time monitoring dashboard
- In-app notifications
- Webhook/Slack integration

### Phase 3: Future 📋
- Machine learning for anomaly detection
- Predictive issue prevention
- Auto-scaling recommendations
- Integration with monitoring tools (DataDog, NewRelic)

---

## Summary

| Question | Answer |
|----------|--------|
| **Where is the UI?** | `/admin/self-heal` (reports) + `/admin/system-health` (live monitoring) |
| **Where do notifications go?** | Email + In-app + Webhooks + Slack (configurable) |
| **How is it like antivirus?** | Real-time monitoring, threat detection, quarantine, auto-repair, manual scans |
| **Can it run separately?** | Yes - via external cron, standalone service, or serverless functions |

The self-heal system now provides comprehensive **antivirus-like protection** for your CubiQo platform with **multiple notification channels** and **flexible deployment options**.
