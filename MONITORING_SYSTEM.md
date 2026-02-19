# Monitoring System Documentation

**Version:** 1.0
**Last Updated:** 2026-02-19
**Owner:** MO (CTO)

---

## Overview

The Cubiqo monitoring system provides comprehensive activity tracking across:
- **GitHub Branches** (main, staging)
- **Pull Requests** (open, closed, merged, synchronized)
- **Vercel Deployments** (production, preview environments)
- **Application Health** (periodic checks every 6 hours)

All monitoring data is collected via GitHub Actions workflows and stored in the `monitoring_events` table.

---

## Architecture

### Components

1. **GitHub Actions Workflow** (`.github/workflows/activity-monitor.yml`)
   - Triggered by: push, pull_request, deployment_status, schedule, workflow_dispatch
   - Collects activity data and sends to API endpoint
   - Runs health checks every 6 hours

2. **Monitoring API** (`/api/monitoring/activity`)
   - POST: Receives events from GitHub Actions
   - GET: Retrieves events (admin only)
   - Authentication: Bearer token (MONITORING_SECRET)

3. **Dashboard API** (`/api/monitoring/dashboard`)
   - Provides aggregated monitoring data
   - Shows activity summaries, recent events, branch status, PR status
   - Admin-only access

4. **Database** (`monitoring_events` table)
   - Stores all monitoring events
   - Indexed for fast queries
   - RLS policies for security

---

## Setup

### 1. Environment Variables

Add these secrets to your GitHub repository and Vercel:

**GitHub Secrets** (Settings → Secrets and variables → Actions):
```
APP_URL=https://your-app.vercel.app
MONITORING_SECRET=<generate-a-secure-token>
```

**Vercel Environment Variables** (Project Settings → Environment Variables):
```
MONITORING_SECRET=<same-as-github-secret>
```

Generate a secure monitoring secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Migration

Run the monitoring events migration in your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or manually run this SQL in Supabase SQL Editor:
# supabase/migrations/20260219000001_monitoring_events.sql
```

### 3. Verify Setup

Test the monitoring system:

```bash
# Trigger a test event
curl -X POST https://your-app.vercel.app/api/monitoring/activity \
  -H "Authorization: Bearer YOUR_MONITORING_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "health_check",
    "timestamp": "2026-02-19T10:00:00Z",
    "repository": "thecubiqo/thecubiqo"
  }'

# Check dashboard
curl https://your-app.vercel.app/api/monitoring/dashboard \
  -H "Cookie: your-auth-cookie"
```

---

## Monitoring Events

### Event Types

#### 1. Branch Push
Triggered when code is pushed to main or staging branches.

**Payload:**
```json
{
  "type": "branch_push",
  "branch": "main",
  "sha": "abc123...",
  "actor": "username",
  "timestamp": "2026-02-19T10:00:00Z",
  "repository": "thecubiqo/thecubiqo"
}
```

#### 2. PR Activity
Triggered on PR open, close, merge, sync, or ready_for_review.

**Payload:**
```json
{
  "type": "pr_activity",
  "pr_number": 115,
  "action": "opened",
  "title": "Add admin dashboard",
  "author": "username",
  "base": "main",
  "head": "feature/admin-dashboard",
  "draft": false,
  "merged": false,
  "timestamp": "2026-02-19T10:00:00Z",
  "url": "https://github.com/...",
  "repository": "thecubiqo/thecubiqo"
}
```

#### 3. Deployment
Triggered when Vercel deployment status changes.

**Payload:**
```json
{
  "type": "deployment",
  "environment": "production",
  "state": "success",
  "ref": "main",
  "sha": "abc123...",
  "target_url": "https://your-app.vercel.app",
  "timestamp": "2026-02-19T10:00:00Z",
  "repository": "thecubiqo/thecubiqo"
}
```

#### 4. Health Check
Triggered every 6 hours by scheduled workflow.

**Payload:**
```json
{
  "type": "health_check",
  "timestamp": "2026-02-19T10:00:00Z",
  "repository": "thecubiqo/thecubiqo"
}
```

---

## API Reference

### POST /api/monitoring/activity

Record a monitoring event.

**Authentication:** Bearer token (MONITORING_SECRET)

**Request:**
```json
{
  "type": "branch_push" | "pr_activity" | "deployment" | "health_check",
  "timestamp": "ISO 8601 timestamp",
  "repository": "owner/repo",
  ... additional event-specific fields
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "uuid",
  "message": "Event recorded successfully"
}
```

**Error Responses:**
- 401: Unauthorized (missing or invalid token)
- 400: Invalid event data
- 500: Internal server error

---

### GET /api/monitoring/activity

Retrieve monitoring events (admin only).

**Authentication:** Requires admin user session

**Query Parameters:**
- `type` (optional): Filter by event type
- `limit` (optional): Max results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "event_type": "branch_push",
      "event_data": { ... },
      "repository": "thecubiqo/thecubiqo",
      "created_at": "2026-02-19T10:00:00Z"
    },
    ...
  ],
  "count": 50
}
```

---

### GET /api/monitoring/dashboard

Get monitoring dashboard data (admin only).

**Authentication:** Requires admin user session

**Response:**
```json
{
  "dashboard": {
    "summary": {
      "total_events": 1234,
      "branch_pushes": 456,
      "pr_activities": 789,
      "deployments": 123,
      "health_checks": 56
    },
    "recent_activity": [
      {
        "type": "branch_push",
        "timestamp": "2026-02-19T10:00:00Z",
        "description": "Push to main by username"
      },
      ...
    ],
    "branch_status": {
      "main": {
        "last_push": "2026-02-19T10:00:00Z",
        "last_deployment": "2026-02-19T10:05:00Z"
      },
      "staging": {
        "last_push": "2026-02-19T09:00:00Z",
        "last_deployment": "2026-02-19T09:05:00Z"
      }
    },
    "pr_status": {
      "open_prs": 5,
      "merged_today": 2,
      "closed_today": 1
    }
  },
  "generated_at": "2026-02-19T10:15:00Z"
}
```

---

## GitHub Actions Workflow

### Triggers

- **Push to main or staging** → Branch activity job
- **Pull request events** → PR activity job
- **Deployment status change** → Deployment status job
- **Schedule (every 6 hours)** → Health check job
- **Manual trigger** → All jobs

### Job Outputs

All jobs write summaries to `$GITHUB_STEP_SUMMARY` for visibility in GitHub Actions UI.

Example summary:
```
## Branch Activity Report

**Branch:** main
**Event:** Push
**Commit SHA:** abc123...
**Pusher:** @username
**Timestamp:** 2026-02-19 10:00:00 UTC

**Commit Message:** feat: Add monitoring system
**Author:** John Doe
**Files Changed:** 7

### Changed Files
.github/workflows/activity-monitor.yml
src/app/api/monitoring/activity/route.ts
...
```

---

## Monitoring Best Practices

### 1. Alert on Critical Events

Set up alerts for:
- Deployment failures
- High error rates
- Multiple failed PRs
- No activity for extended periods

### 2. Review Dashboard Regularly

- Check dashboard daily for anomalies
- Review recent activity trends
- Monitor branch synchronization status

### 3. Investigate Discrepancies

If monitoring shows:
- Main and staging out of sync → Check for merge conflicts
- High PR close rate → Review team workflow
- Deployment failures → Check Vercel logs

### 4. Archive Old Events

Set up a cleanup job to archive events older than 90 days:

```sql
-- Archive events older than 90 days
DELETE FROM monitoring_events
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## Troubleshooting

### Problem: Events not appearing in database

**Possible causes:**
1. MONITORING_SECRET not configured in Vercel
2. Database migration not run
3. RLS policies blocking inserts

**Solution:**
```bash
# Check Vercel environment variables
vercel env ls

# Re-run migration
supabase db push

# Check API logs
vercel logs --follow
```

---

### Problem: 401 Unauthorized from GitHub Actions

**Possible causes:**
1. MONITORING_SECRET mismatch between GitHub and Vercel
2. APP_URL pointing to wrong environment

**Solution:**
```bash
# Verify secrets match
echo $MONITORING_SECRET | openssl dgst -sha256

# Update GitHub secret
gh secret set MONITORING_SECRET --body "new-secret"

# Update Vercel environment variable
vercel env add MONITORING_SECRET
```

---

### Problem: Dashboard showing "table not found"

**Possible cause:** Migration not applied

**Solution:**
```bash
# Check if table exists
psql $DATABASE_URL -c "\dt monitoring_events"

# Run migration
supabase db push
```

---

## Future Enhancements

### Phase 2: Notification System
- [ ] Slack integration for critical events
- [ ] Discord webhook support
- [ ] Email alerts for deployment failures
- [ ] SMS alerts for production incidents

### Phase 3: Advanced Analytics
- [ ] Deployment frequency metrics
- [ ] PR merge time tracking
- [ ] Build duration trends
- [ ] Error rate correlation

### Phase 4: Predictive Monitoring
- [ ] ML-based anomaly detection
- [ ] Proactive failure prediction
- [ ] Auto-remediation for common issues

---

## Support

For issues or questions:
- **Technical Lead:** MO (CTO)
- **Documentation:** This file + inline code comments
- **Issues:** Create GitHub issue with `monitoring` label

---

*Last updated: 2026-02-19 by MO*
