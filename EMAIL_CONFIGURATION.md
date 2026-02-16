# Self-Heal Email Configuration Guide

## Overview

The self-heal system sends daily email reports with diagnostics, repairs, and recommendations. This guide explains how email addresses are configured and how to set up email delivery.

## Email Addresses

### FROM Address (Sender)

**Environment Variable**: `SELF_HEAL_EMAIL_FROM`  
**Default**: `noreply@cubiqo.ai`

This is the email address that appears as the sender of self-heal reports.

**Requirements:**
- Must be a valid email address
- Should be from your organization's domain
- Must be authorized in your email service provider
- Typically a "no-reply" or automated system address

**Example values:**
```env
SELF_HEAL_EMAIL_FROM=noreply@cubiqo.ai
SELF_HEAL_EMAIL_FROM=system@yourcompany.com
SELF_HEAL_EMAIL_FROM=alerts@yourdomain.com
```

### TO Address (Recipient)

**Environment Variable**: `SELF_HEAL_EMAIL_TO`  
**Default**: `aditya@cubiqo.ai`

This is the email address that will receive all self-heal reports.

**Requirements:**
- Must be a valid email address
- Should be monitored regularly
- Can be changed to any email address
- Supports only single recipient (for multiple recipients, modify the code)

**Example values:**
```env
SELF_HEAL_EMAIL_TO=aditya@cubiqo.ai
SELF_HEAL_EMAIL_TO=admin@yourcompany.com
SELF_HEAL_EMAIL_TO=devops@yourdomain.com
```

## Configuration Steps

### 1. Set Environment Variables

Add to your `.env.local` (development) or deployment environment (production):

```env
# Self-Heal Email Configuration
SELF_HEAL_EMAIL_FROM=noreply@cubiqo.ai
SELF_HEAL_EMAIL_TO=aditya@cubiqo.ai
```

### 2. Verify in Database

The email addresses are stored in the database with each report:

```sql
SELECT 
  run_date, 
  status, 
  email_from, 
  email_to, 
  email_sent, 
  email_sent_at
FROM self_heal_reports
ORDER BY run_date DESC
LIMIT 10;
```

### 3. Check Admin UI

After a self-heal run, verify the email configuration in the admin UI:

1. Navigate to `/admin/self-heal`
2. Click on any report
3. Scroll to "📧 Email Report" section
4. Verify "From" and "To" addresses are correct

## Email Service Setup

Currently, emails are **mocked** (logged to console only). To enable actual email delivery:

### Option 1: Resend (Recommended)

1. **Install Resend**:
   ```bash
   npm install resend
   ```

2. **Get API Key**:
   - Sign up at [resend.com](https://resend.com)
   - Create an API key
   - Verify your sending domain

3. **Add to Environment**:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```

4. **Update Code** (`src/lib/self-heal/executor.ts`):
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

### Option 2: SendGrid

1. **Install SendGrid**:
   ```bash
   npm install @sendgrid/mail
   ```

2. **Get API Key**:
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Create an API key
   - Verify sender identity

3. **Add to Environment**:
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   ```

4. **Update Code**:
   ```typescript
   import sgMail from '@sendgrid/mail';
   
   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
   
   export async function sendEmailReport(report: SelfHealReport): Promise<boolean> {
     try {
       const htmlContent = formatReportAsHtml(report);
       
       await sgMail.send({
         from: report.emailFrom,
         to: report.emailTo,
         subject: `CubiQo Self-Heal Report - ${report.status.toUpperCase()}`,
         html: htmlContent,
       });
   
       console.log('[Self-Heal] Email sent successfully');
       return true;
     } catch (error) {
       console.error('[Self-Heal] Failed to send email report:', error);
       return false;
     }
   }
   ```

### Option 3: Nodemailer (SMTP)

1. **Install Nodemailer**:
   ```bash
   npm install nodemailer
   ```

2. **Add SMTP Credentials**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

3. **Update Code**:
   ```typescript
   import nodemailer from 'nodemailer';
   
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT || '587'),
     secure: process.env.SMTP_SECURE === 'true',
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   });
   
   export async function sendEmailReport(report: SelfHealReport): Promise<boolean> {
     try {
       const htmlContent = formatReportAsHtml(report);
       
       await transporter.sendMail({
         from: report.emailFrom,
         to: report.emailTo,
         subject: `CubiQo Self-Heal Report - ${report.status.toUpperCase()}`,
         html: htmlContent,
       });
   
       console.log('[Self-Heal] Email sent successfully');
       return true;
     } catch (error) {
       console.error('[Self-Heal] Failed to send email report:', error);
       return false;
     }
   }
   ```

## Testing Email Configuration

### 1. Test Script

Run the test script to verify email configuration (mock mode):

```bash
npm run test:self-heal
```

Look for output like:
```
From: noreply@cubiqo.ai
To: aditya@cubiqo.ai
Subject: CubiQo Self-Heal Report - SUCCESS
```

### 2. Manual API Test

Trigger a self-heal run manually:

```bash
curl -X POST http://localhost:3000/api/cron/self-heal \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check logs for email details.

### 3. Production Verification

After the cron runs at 10:00:
1. Check admin UI at `/admin/self-heal`
2. Verify email was sent (`email_sent: true`)
3. Check recipient's inbox for the report
4. Verify sender address is correct

## Email Report Format

### Subject Line
```
CubiQo Self-Heal Report - SUCCESS
CubiQo Self-Heal Report - PARTIAL
CubiQo Self-Heal Report - FAILED
```

### HTML Email Includes:
- Status badge (color-coded)
- Run date and execution time
- Fixed issues (green)
- Critical issues (red)
- Recommendations (yellow)
- Diagnostic results table
- Repair actions table
- Link to admin UI

### Text Email Includes:
- Same content as HTML
- Plain text formatting
- Suitable for email clients without HTML support

## Troubleshooting

### Email Not Sending

1. **Check Environment Variables**:
   ```bash
   echo $SELF_HEAL_EMAIL_FROM
   echo $SELF_HEAL_EMAIL_TO
   ```

2. **Verify Email Service Credentials**:
   - API key is valid
   - Sender domain is verified
   - Rate limits not exceeded

3. **Check Logs**:
   ```bash
   # Look for email-related errors
   grep "Self-Heal.*Email" /var/log/your-app.log
   ```

4. **Test Email Service**:
   - Send a test email outside of self-heal
   - Verify service is working independently

### Wrong Email Addresses

1. **Update Environment Variables**:
   ```env
   SELF_HEAL_EMAIL_FROM=correct@domain.com
   SELF_HEAL_EMAIL_TO=correct@recipient.com
   ```

2. **Restart Application**:
   ```bash
   # Ensure new environment variables are loaded
   pm2 restart your-app
   # or
   systemctl restart your-service
   ```

3. **Verify in Next Report**:
   - Wait for next cron run
   - Or trigger manually
   - Check admin UI for updated addresses

### Emails Marked as Spam

1. **Configure SPF Record**:
   ```
   v=spf1 include:_spf.youremailprovider.com ~all
   ```

2. **Configure DKIM**:
   - Add DKIM records from your email provider

3. **Configure DMARC**:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

4. **Use Reputable FROM Domain**:
   - Use your organization's verified domain
   - Avoid free email services for FROM address

## Security Best Practices

1. **Protect API Keys**:
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

2. **Validate Email Addresses**:
   - Ensure FROM address is authorized
   - Validate TO address format
   - Consider allowlist for recipients

3. **Monitor Email Delivery**:
   - Track delivery failures
   - Alert on repeated failures
   - Review bounce rates

4. **Secure SMTP Credentials**:
   - Use app-specific passwords
   - Enable 2FA on email accounts
   - Limit SMTP access by IP if possible

## Multiple Recipients (Advanced)

To send reports to multiple recipients, modify the types and code:

1. **Update Type** (`src/lib/self-heal/types.ts`):
   ```typescript
   export interface SelfHealReport {
     // ... other fields
     emailTo: string | string[]; // Allow array
   }
   ```

2. **Update Report Generation** (`src/lib/self-heal/report.ts`):
   ```typescript
   const emailTo = process.env.SELF_HEAL_EMAIL_TO?.split(',') || ['aditya@cubiqo.ai'];
   ```

3. **Update Email Sending** (`src/lib/self-heal/executor.ts`):
   ```typescript
   const to = Array.isArray(report.emailTo) ? report.emailTo : [report.emailTo];
   
   await resend.emails.send({
     from: report.emailFrom,
     to: to,
     // ... rest of email
   });
   ```

## Summary

- **FROM Email**: Configured via `SELF_HEAL_EMAIL_FROM` (default: `noreply@cubiqo.ai`)
- **TO Email**: Configured via `SELF_HEAL_EMAIL_TO` (default: `aditya@cubiqo.ai`)
- **Current State**: Mock implementation (logs only)
- **Production**: Requires email service setup (Resend/SendGrid/Nodemailer)
- **Verification**: Check admin UI at `/admin/self-heal` for email details
- **Testing**: Use `npm run test:self-heal` to verify configuration

For additional support, refer to your email service provider's documentation or contact the development team.
