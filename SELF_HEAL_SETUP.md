# Self-Heal Daily Job - Cron Configuration

This document explains how to set up the daily self-heal cron job.

## Overview

The self-heal job runs daily at 10:00 local time and performs:
- System diagnostics
- Safe auto-repairs (cache clears, service restarts, migration checks)
- Rollback patch generation
- Audit log creation
- Email report to aditya@cubiqo.ai

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Create a `vercel.json` configuration file with a cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/self-heal",
      "schedule": "0 10 * * *"
    }
  ]
}
```

Note: Vercel cron runs in UTC time. Adjust the schedule as needed for your local timezone.

For example:
- 10:00 UTC = "0 10 * * *"
- 10:00 EST (UTC-5) = "0 15 * * *"
- 10:00 PST (UTC-8) = "0 18 * * *"

### Option 2: GitHub Actions

Create `.github/workflows/self-heal-cron.yml`:

```yaml
name: Daily Self-Heal Job

on:
  schedule:
    # Runs at 10:00 UTC daily
    - cron: '0 10 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  self-heal:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Self-Heal Job
        run: |
          curl -X POST https://your-domain.com/api/cron/self-heal \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

### Option 3: External Cron Service

Use a service like:
- **cron-job.org**
- **EasyCron**
- **Google Cloud Scheduler**
- **AWS EventBridge**

Configure them to send a POST request to:
```
POST https://your-domain.com/api/cron/self-heal
Authorization: Bearer YOUR_CRON_SECRET
```

## Environment Variables

Add to your `.env` or `.env.local`:

```env
# Optional: Protect the cron endpoint with a secret
CRON_SECRET=your-secure-random-string
```

## Testing

### Manual Test (Development)
```bash
# Run the test script
npm run test:self-heal
# or
npx tsx test-self-heal.ts
```

### Manual Trigger via API (Development)
```bash
# GET (dev only)
curl http://localhost:3000/api/cron/self-heal

# POST (works in all environments)
curl -X POST http://localhost:3000/api/cron/self-heal \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Database Setup

Run the migration to create the required tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL file
# supabase/migrations/20260215000001_self_heal_reports.sql
```

## Viewing Reports

After the cron job runs, view reports at:
```
https://your-domain.com/admin/self-heal
```

This page displays:
- Last 30 self-heal reports
- Fixed issues, critical issues, and recommendations
- Detailed diagnostics and repair actions
- Rollback patches
- Email delivery status

## Email Configuration

The current implementation logs email reports to the console. To enable actual email sending:

### Email Addresses

The self-heal system uses two email addresses:

1. **FROM Email** (`SELF_HEAL_EMAIL_FROM`): The sender address for reports
   - Default: `noreply@cubiqo.ai`
   - This should be a valid email address from your domain
   - Configure your email service to authenticate this sender

2. **TO Email** (`SELF_HEAL_EMAIL_TO`): The recipient address for reports
   - Default: `aditya@cubiqo.ai`
   - This is where all self-heal reports will be delivered
   - Can be changed to any valid email address

### Setup Instructions

1. Install an email service package:
   ```bash
   npm install resend
   # or
   npm install nodemailer
   # or
   npm install @sendgrid/mail
   ```

2. Update `src/lib/self-heal/executor.ts` in the `sendEmailReport` function to use the actual email service.

3. Add email service credentials and addresses to your environment variables:
   ```env
   # Self-Heal Email Configuration
   SELF_HEAL_EMAIL_FROM=noreply@cubiqo.ai
   SELF_HEAL_EMAIL_TO=aditya@cubiqo.ai
   
   # Email Service Credentials (choose one)
   RESEND_API_KEY=your_key
   # or
   SENDGRID_API_KEY=your_key
   # or
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASS=your_password
   ```

### Example Implementation with Resend

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailReport(report: SelfHealReport): Promise<boolean> {
  try {
    const htmlContent = formatReportAsHtml(report);
    
    const { data, error } = await resend.emails.send({
      from: report.emailFrom,
      to: report.emailTo,
      subject: `CubiQo Self-Heal Report - ${report.status.toUpperCase()}`,
      html: htmlContent,
    });

    if (error) {
      console.error('[Self-Heal] Email send error:', error);
      return false;
    }

    console.log('[Self-Heal] Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('[Self-Heal] Failed to send email report:', error);
    return false;
  }
}
```

## Monitoring

Monitor the self-heal job execution:

1. **Console Logs**: Check application logs for self-heal execution
2. **Admin Dashboard**: View reports at `/admin/self-heal`
3. **Database**: Query `self_heal_reports` and `self_heal_audit_logs` tables
4. **Email Reports**: Check emails sent to aditya@cubiqo.ai

## Rollback

If a self-heal run causes issues, use the rollback patch:

1. Go to `/admin/self-heal`
2. Click on the problematic report
3. Copy the rollback patch
4. Execute the rollback commands

Example rollback:
```bash
# For bash commands
bash rollback-script.sh

# For SQL statements
psql -d your_database -f rollback.sql
```

## Troubleshooting

### Cron job not running
- Verify the cron configuration is correct
- Check that the endpoint is accessible
- Ensure CRON_SECRET is set correctly (if using authentication)

### Reports not saved to database
- Verify database migration has been applied
- Check Supabase connection credentials
- Review application logs for errors

### Emails not sending
- Verify email service is configured
- Check email service credentials
- Review email logs in the console

### High execution time
- The job should complete in under 5 seconds normally
- If it takes longer, check for slow database queries or network issues
- Consider increasing the `maxDuration` in the API route

## Security Considerations

1. **Protect the endpoint**: Always use CRON_SECRET in production
2. **Rate limiting**: Consider adding rate limiting to prevent abuse
3. **Monitoring**: Set up alerts for failed self-heal runs
4. **Audit logs**: Regularly review the audit logs for unusual activity
