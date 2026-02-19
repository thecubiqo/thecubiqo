# Monitoring System - Quick Start Guide

**⏱️ 5-minute setup**

## 1. Generate Monitoring Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64-character hex string).

## 2. Add GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:
```
APP_URL = https://your-app.vercel.app
MONITORING_SECRET = <paste-your-hex-string>
```

## 3. Add Vercel Environment Variable

Go to: **Vercel Dashboard → Project Settings → Environment Variables**

Add:
```
MONITORING_SECRET = <same-hex-string-from-step-1>
```

Environment: **Production, Preview, Development**

## 4. Run Database Migration

Option A - Using Supabase CLI:
```bash
cd /path/to/thecubiqo
supabase db push
```

Option B - Manual SQL:
1. Go to Supabase Dashboard → SQL Editor
2. Run: `supabase/migrations/20260219000001_monitoring_events.sql`

## 5. Verify Setup

### Test Activity Endpoint
```bash
# Generate current timestamp
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Send test event
curl -X POST https://your-app.vercel.app/api/monitoring/activity \
  -H "Authorization: Bearer YOUR_MONITORING_SECRET" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"health_check\",
    \"timestamp\": \"$TIMESTAMP\",
    \"repository\": \"thecubiqo/thecubiqo\"
  }"
```

Expected response:
```json
{
  "success": true,
  "event_id": "...",
  "message": "Event recorded successfully"
}
```

### Trigger Manual Workflow
1. Go to GitHub → Actions → "Activity Monitor"
2. Click "Run workflow" → "Run workflow"
3. Wait 30 seconds
4. Check workflow summary for activity report

### View Dashboard
```bash
# In browser (must be logged in as admin):
https://your-app.vercel.app/api/monitoring/dashboard
```

## 6. What Gets Monitored

✅ **Branch Activity**
- Pushes to `main` and `staging`
- Commit details and file changes

✅ **PR Activity**
- Opened, closed, merged, synchronized
- Draft status and mergeable state

✅ **Deployments**
- Production and preview deployments
- Deployment status (success, failure, pending)

✅ **Health Checks**
- Runs every 6 hours
- Branch sync status
- Open PR count
- Application health endpoint

## 7. Common Issues

### ❌ "Unauthorized" error from GitHub Actions
**Fix:** Check that `MONITORING_SECRET` matches in GitHub and Vercel

### ❌ "Table not found" in API response
**Fix:** Run database migration (step 4)

### ❌ No events appearing
**Fix:** Verify `APP_URL` is correct and points to your Vercel deployment

## 8. Next Steps

📖 Read full docs: [MONITORING_SYSTEM.md](./MONITORING_SYSTEM.md)
📊 View your dashboard (admin only)
🔔 Set up notifications (future enhancement)

---

**Need help?** Create an issue with label `monitoring`
