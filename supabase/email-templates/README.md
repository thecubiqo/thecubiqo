# CubiQo branded email templates

Five HTML email templates for the Supabase auth events. Dark, brand-aligned,
mobile-responsive, accessible. Inline CSS + table layout so they render the
same in Gmail, Outlook, Apple Mail, ProtonMail, etc.

## Files

| File | Supabase event | Subject suggestion |
|------|---------------|---------------------|
| `confirm-signup.html`  | Confirm signup            | `Confirm your CubiQo account` |
| `magic-link.html`      | Magic Link                | `Your CubiQo sign-in link` |
| `reset-password.html`  | Reset Password            | `Reset your CubiQo password` |
| `invite-user.html`     | Invite user               | `You're invited to CubiQo` |
| `change-email.html`    | Change Email Address      | `Confirm your new CubiQo email` |

## Setup — 2 steps, ~10 minutes total

### Step 1 — Paste the templates into Supabase Dashboard

For each file above:

1. **Supabase Dashboard → Authentication → Email Templates**
2. Click the matching template (e.g. *Confirm signup*)
3. Set the **Subject** to the suggestion in the table above
4. Open the corresponding `.html` file in this folder, copy the **entire** contents, paste into the **Message (HTML)** field, click **Save**
5. Repeat for each of the five templates

### Step 2 — Brand the sender (custom SMTP)

Without this, emails come from `noreply@mail.app.supabase.io` which kills the branding even with perfect HTML. Two options:

#### Option A — Resend (recommended — free tier covers 3k emails/month)

1. Sign up at [resend.com](https://resend.com) (free)
2. **Domains → Add Domain** → enter `cubiqo.ai` → follow the DNS records (4 records: SPF, DKIM, DMARC, MX). Add them to whichever DNS provider runs cubiqo.ai. Wait ~5 minutes for verification
3. **API Keys → Create API Key** → copy it
4. **Supabase Dashboard → Project Settings → Auth → SMTP Settings**:
   - Enable Custom SMTP
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: *paste the Resend API key*
   - Sender email: `hello@cubiqo.ai` (or `noreply@cubiqo.ai`)
   - Sender name: `CubiQo`
   - Click **Save**
5. **Test it**: Authentication → Users → invite yourself → check inbox

#### Option B — Postmark / SendGrid / Amazon SES

Same flow. Any SMTP provider that gives you `host / port / user / pass` works. Resend just has the cleanest setup for the volume.

### Step 3 (one-time, also Dashboard) — Site URL + redirect allowlist

Without this, the verification links in your emails will still point to whatever stale value is in the dashboard (often `http://localhost:3000` from initial setup):

**Authentication → URL Configuration**:
- **Site URL** → `https://www.cubiqo.ai`
- **Redirect URLs** → add `https://www.cubiqo.ai/auth/callback` and `https://www.cubiqo.ai/**`

App.js already passes `emailRedirectTo` per-call as a safety net, but fixing the Site URL means the dashboard-driven flows (invite from admin, password reset triggered by admin, etc.) also work correctly.

## Template variables

These are filled in by Supabase at send time. You don't need to change anything in the HTML — they're already wired:

| Variable | Where it appears | Sources |
|----------|-----------------|---------|
| `{{ .Email }}` | Recipient address shown in body | Both confirm-signup, magic-link, reset-password |
| `{{ .NewEmail }}` | Address being changed to | change-email only |
| `{{ .ConfirmationURL }}` | The CTA link + plain-text fallback | All five |
| `{{ .Token }}` | Numeric 6-digit code (if you build an OTP flow later) | Not currently used; leaving the placeholder available |

## Updating the design

All templates share the same wrapper (logo + footer). To re-skin all of them, search/replace in all `.html` files:

```
linear-gradient(135deg,#67e8f9 0%,#a78bfa 100%)   ← the brand gradient
#06060a                                            ← page background
#0c0c12                                            ← card background
#1f1f2a                                            ← border / divider
#f4f4f5                                            ← strong text
#c0c0c8                                            ← body text
#71717a                                            ← muted text
```

Keep table-based layout — Outlook drops modern CSS.

## Verifying the result

After pasting templates + saving SMTP:

1. **Supabase Dashboard → Authentication → Users → Invite a user** → invite a fresh email you control (e.g. yourname+test1@gmail.com)
2. Check the inbox — should arrive from `hello@cubiqo.ai` (your sender) with the CubiQo dark-branded layout
3. Click the button → lands on `https://www.cubiqo.ai/auth/callback` → signed in

If the email arrives unstyled, the template wasn't saved correctly — paste it again. If it arrives from `mail.app.supabase.io`, the SMTP block wasn't enabled — go back to Step 2.
