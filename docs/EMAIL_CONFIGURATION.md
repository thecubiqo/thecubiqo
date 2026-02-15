# Email Configuration Guide

This document outlines how to configure branded magic-link emails for CubiQo in Supabase.

## Overview

CubiQo uses Supabase Auth for magic link authentication. Email templates are configured directly in the Supabase dashboard and are **not** version-controlled in this repository.

## Sending Domain Configuration

### Step 1: Configure Custom SMTP (Optional but Recommended)

For production, configure a custom SMTP server in Supabase:

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Use Custom SMTP Server**
4. Configure your SMTP provider:
   - **Host**: Your SMTP host (e.g., `smtp.sendgrid.net`, `smtp.mailgun.org`)
   - **Port**: Usually `587` for TLS or `465` for SSL
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender Email**: `noreply@yourdomain.com`
   - **Sender Name**: `CubiQo`

### Step 2: Verify Sending Domain

To avoid emails going to spam:

1. Add SPF record to your DNS:
   ```
   v=spf1 include:_spf.yourmailprovider.com ~all
   ```

2. Add DKIM record (provided by your email service)

3. Add DMARC record:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

## Email Template Configuration in Supabase

### Update Magic Link Email Template

1. Go to **Supabase Dashboard** → Your Project → **Authentication** → **Email Templates**

2. Select **Magic Link** template

3. Update the **Subject Line**:
   ```
   Your CubiQo Magic Link - Sign In
   ```

4. Update the **Email Body (HTML)**:

   The HTML template is defined in `/src/lib/email/templates/magic-link.ts` in this repository.
   
   **Important**: Supabase provides template variables:
   - `{{ .ConfirmationURL }}` - The magic link URL
   - `{{ .SiteURL }}` - Your app URL from settings
   
   To use our branded template:
   
   ```html
   <!-- Copy the HTML from getMagicLinkHTML() function -->
   <!-- Replace data.magicLink with {{ .ConfirmationURL }} -->
   <!-- Replace data.appUrl with {{ .SiteURL }} -->
   ```

5. **Plain Text Version**:
   
   ```
   Welcome to CubiQo - One Mind. Many Dimensions.

   Click the link below to sign in to your account:

   {{ .ConfirmationURL }}

   This link will expire in 1 hour.

   If you didn't request this email, you can safely ignore it.

   ---
   CubiQo - Your Emotional AI Companion
   {{ .SiteURL }}
   ```

## Brand Colors Used

The email template uses CubiQo's brand colors from the design system:

- **Primary (Orange)**: `#ff6f00` - Fourth Way
- **Secondary (Green-Blue)**: `#00897b` - Sattva  
- **Accent (Yellow)**: `#ffa000` - Rajas
- **Red**: `#c2185b` - Tamas

These colors are also defined in `/src/config/colors.ts`.

## Testing Email Templates

### Preview in Development

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin email preview:
   ```
   http://localhost:3000/api/admin/email-preview
   ```

3. View different formats:
   - HTML: `/api/admin/email-preview?type=html`
   - Plain text: `/api/admin/email-preview?type=text`
   - Subject: `/api/admin/email-preview?type=subject`

### Send Test Email

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Click **Send Test Email** on the Magic Link template
3. Enter your email address
4. Check your inbox for the branded email

## Environment Variables

Ensure these are set in your `.env.local`:

```env
# Required for email templates
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Emails Going to Spam

1. Verify SPF, DKIM, and DMARC records
2. Use a reputable SMTP provider (SendGrid, Mailgun, AWS SES)
3. Warm up your sending domain gradually
4. Monitor sender reputation

### Template Not Updating

1. Clear browser cache
2. Check Supabase dashboard for template changes
3. Verify environment variables are correct
4. Test with `/api/admin/email-preview` endpoint

### Images Not Loading

1. Ensure `NEXT_PUBLIC_APP_URL` is set correctly
2. Verify logo image exists at `/public/icons/icon-192.png`
3. Check that your domain serves images over HTTPS

## Additional Resources

- [Supabase Auth Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email Deliverability Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#smtp)
- [CubiQo Design System](/src/config/colors.ts)
