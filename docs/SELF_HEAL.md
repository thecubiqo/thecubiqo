# Self-Heal Job Feature

## Overview

The Self-Heal Job is an automated system maintenance feature that runs daily at 10:00 AM (local time) to perform diagnostics, apply safe auto-fixes, and generate comprehensive reports.

## Features

### 1. Automated Diagnostics
- **Memory Health**: Monitors heap usage and RSS memory
- **System Uptime**: Tracks process uptime
- **Environment Check**: Validates required environment variables
- **Process Health**: Monitors CPU usage and system status

### 2. Safe Auto-Fixes
- **Memory Management**: Triggers garbage collection when memory usage is critical (>90%)
- **Environment Alerts**: Logs critical environment variable issues
- **Service Restarts**: (Extensible for future service restart logic)

### 3. Rollback Patches
- Every fix generates a corresponding rollback command
- Rollback patches are saved as executable shell scripts
- Patches include timestamps and safety warnings

### 4. Audit Trail
- Every run is stored in the `self_heal_reports` database table
- Full diagnostics and fixes are preserved in JSONB format
- Cryptographic signatures ensure report authenticity

### 5. Email Reports
- HTML-formatted reports sent to configured recipients
- Status indicators (Success/Partial/Failed)
- Summary statistics and detailed diagnostics
- Verification signature included

### 6. Admin UI
- View last 30 reports at `/admin/self-heal`
- Expandable details for each report
- Manual trigger button for on-demand execution
- Real-time refresh every 30 seconds

## Setup

### 1. Database Migration

Run the migration to create the `self_heal_reports` table:

```bash
supabase db push
```

Or manually execute:
```sql
supabase/migrations/20260215000001_self_heal_reports.sql
```

### 2. Environment Variables

Add to your `.env.local`:

```env
# Email Service (Optional - for email reports)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Self-Heal Secret (Optional - for report signatures)
SELF_HEAL_SECRET=your-secret-key-here
```

Generate a secure secret:
```bash
openssl rand -hex 32
```

### 3. Configure Email Domain

In Resend dashboard:
1. Add and verify your domain (e.g., `cubiqo.ai`)
2. Update the `from` address in `src/lib/self-heal/email.ts` if needed

### 4. Deploy to Vercel

The cron job is automatically configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/self-heal/run",
      "schedule": "0 10 * * *"
    }
  ]
}
```

This runs daily at 10:00 AM UTC. To change the timezone:
- Vercel cron jobs use UTC by default
- Adjust the schedule to match your desired local time

## Usage

### Manual Execution

Visit the admin UI and click "Run Self-Heal Now":
```
https://your-app.com/admin/self-heal
```

Or trigger via API:
```bash
curl -X POST https://your-app.com/api/admin/self-heal/run
```

### Viewing Reports

Admin Dashboard:
```
https://your-app.com/admin/self-heal
```

API Endpoint:
```bash
curl https://your-app.com/api/admin/self-heal/reports
```

### Verifying Reports

Each report includes a cryptographic signature. To verify:

```typescript
import { createHmac } from 'crypto';

const secret = process.env.SELF_HEAL_SECRET;
const reportContent = '...'; // Full JSON report
const signature = createHmac('sha256', secret)
  .update(reportContent)
  .digest('hex');

// Compare with report.signature
```

## Architecture

### Components

1. **Core Logic** (`src/lib/self-heal/core.ts`)
   - Diagnostic runners
   - Auto-fix executors
   - Report generation
   - Artifact creation

2. **Email Service** (`src/lib/self-heal/email.ts`)
   - HTML email formatting
   - Resend integration
   - Delivery tracking

3. **API Endpoints**
   - `/api/admin/self-heal/run` - Execute job
   - `/api/admin/self-heal/reports` - Fetch reports

4. **Admin UI** (`src/app/admin/self-heal/page.tsx`)
   - Report listing
   - Detail viewer
   - Manual trigger

5. **Database** (`supabase/migrations/20260215000001_self_heal_reports.sql`)
   - Audit log table
   - RLS policies

### Data Flow

```
Cron Trigger (10:00 daily)
    ↓
API: /api/admin/self-heal/run
    ↓
Core: executeSelfHeal()
    ↓
├─ runDiagnostics()
├─ performAutoFixes()
├─ generateReport()
├─ generateRollbackPatch()
└─ saveArtifacts()
    ↓
Store in Database (self_heal_reports)
    ↓
Send Email Report (Resend)
    ↓
Return Success Response
```

## Artifacts

Each run generates:

1. **JSON Report** - `self-heal-artifacts/report-{timestamp}.json`
   - Full diagnostics
   - Applied fixes
   - Issues found
   - Summary statistics

2. **Rollback Patch** - `self-heal-artifacts/rollback-{timestamp}.sh`
   - Bash script with rollback commands
   - Includes safety warnings
   - Executable with proper permissions

3. **Database Entry** - `self_heal_reports` table
   - Searchable audit log
   - JSONB for flexible querying
   - Email delivery status

4. **Email Report** - Sent to configured recipients
   - HTML-formatted
   - Mobile-responsive
   - Includes verification signature

## Extending Diagnostics

Add custom diagnostics in `src/lib/self-heal/core.ts`:

```typescript
// Example: Database connection check
results.push({
  name: 'database',
  status: isConnected ? 'healthy' : 'critical',
  details: {
    connected: isConnected,
    latency_ms: latency,
  },
  timestamp: new Date().toISOString(),
});
```

## Extending Auto-Fixes

Add custom fixes in `src/lib/self-heal/core.ts`:

```typescript
// Example: Clear application cache
if (diagnostic.name === 'cache' && diagnostic.status === 'warning') {
  try {
    await clearCache();
    fixes.push({
      name: 'cache_clear',
      applied: true,
      description: 'Cleared application cache',
      rollbackCommand: 'npm run cache:restore',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Handle error
  }
}
```

## Security

- **RLS Policies**: Only service role can write reports
- **Signature Verification**: All reports are cryptographically signed
- **Environment Secrets**: API keys stored securely in environment variables
- **Rate Limiting**: Consider adding rate limits to prevent abuse
- **Rollback Review**: Always review rollback patches before execution

## Monitoring

- Check email delivery status in admin UI
- Monitor database for failed runs
- Review critical issues in reports
- Set up alerts for consecutive failures

## Troubleshooting

### Email not sending
- Verify `RESEND_API_KEY` is set
- Check domain verification in Resend
- Review API logs for errors

### Cron not running
- Verify `vercel.json` is properly configured
- Check Vercel dashboard → Project Settings → Cron Jobs
- Review function logs in Vercel

### Database errors
- Verify migration was applied
- Check RLS policies
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### Reports not appearing in UI
- Check API endpoint: `/api/admin/self-heal/reports`
- Verify database connection
- Review browser console for errors

## Future Enhancements

- [ ] Slack/Discord notifications
- [ ] Custom diagnostic plugins
- [ ] Scheduled fix windows
- [ ] Multi-recipient email support
- [ ] Report export (PDF/CSV)
- [ ] Trend analysis and charts
- [ ] Automatic rollback on detection
- [ ] Integration with monitoring services

## API Reference

### POST /api/admin/self-heal/run

Execute self-heal job manually.

**Response:**
```json
{
  "success": true,
  "result": {
    "id": "uuid",
    "status": "success",
    "duration_ms": 123,
    "diagnostics_count": 4,
    "fixes_applied": 1,
    "issues_found": 0,
    "report_path": "/path/to/report.json",
    "rollback_patch_path": "/path/to/rollback.sh",
    "email_sent": true,
    "email_message_id": "msg_xxx"
  }
}
```

### GET /api/admin/self-heal/reports

Fetch last 30 self-heal reports.

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "uuid",
      "executed_at": "2026-02-15T10:00:00Z",
      "status": "success",
      "diagnostics": [...],
      "fixes_applied": [...],
      "issues_found": [],
      "email_sent": true,
      "duration_ms": 123
    }
  ],
  "count": 30
}
```

## License

This feature is part of the CubiQo project, released under MIT License.

## Support

For issues or questions:
- GitHub Issues: https://github.com/thecubiqo/thecubiqo/issues
- Email: support@cubiqo.ai
