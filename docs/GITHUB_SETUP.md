# GitHub OAuth Setup Guide

This guide walks you through setting up GitHub OAuth for the CubiQo Founder Portal.

## 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name**: `CubiQo - Founder Portal`
   - **Homepage URL**: `http://localhost:3000` (for development) or your production URL
   - **Authorization callback URL**: `http://localhost:3000/api/admin/connections/github/callback`
   - **Description**: `GitHub integration for CubiQo founder portal`

4. Click **"Register application"**

## 2. Get Your Credentials

After creating the app, you'll see:
- **Client ID** - Copy this
- Click **"Generate a new client secret"**
- **Client Secret** - Copy this (you'll only see it once!)

## 3. Configure Environment Variables

Add to your `.env.local`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here

# Encryption Key (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

**Generate encryption key:**
```bash
openssl rand -base64 32
```

## 4. Run Database Migration

Apply the user_integrations table migration:

```bash
# If using Supabase CLI
npx supabase db push

# Or manually run the SQL in Supabase Dashboard:
# Open supabase/migrations/20240209_user_integrations.sql
# Copy and run it in the SQL Editor
```

## 5. Update Callback URL for Production

When deploying to production:

1. Go to your GitHub OAuth app settings
2. Update the callback URL to: `https://your-domain.com/api/admin/connections/github/callback`
3. Update `NEXT_PUBLIC_APP_URL` in your production environment variables

## 6. Test the Flow

1. Start your dev server: `npm run dev`
2. Go to `/admin` (Founder Portal)
3. Click **"Connect GitHub"**
4. Authorize the app on GitHub
5. You should be redirected back with a success message
6. Click **"View Repositories"** to see your repos

## How It Works

### OAuth Flow

```
1. User clicks "Connect GitHub" 
   → Redirects to GitHub OAuth authorization page

2. User authorizes the app on GitHub
   → GitHub redirects to: /api/admin/connections/github/callback?code=...

3. Callback route exchanges code for access token
   → Fetches GitHub user info
   → Encrypts token with AES-256-GCM
   → Stores in user_integrations table

4. User returns to Founder Portal
   → Connection status shows "Connected"
   → Can view repositories
```

### Security Features

- **Token encryption**: OAuth tokens are encrypted using AES-256-GCM before storage
- **Row-level security**: Users can only access their own integrations
- **State parameter**: OAuth flow includes state parameter for CSRF protection
- **Scoped access**: Only requests `repo` and `read:user` scopes

### Database Schema

```sql
user_integrations {
  id: UUID (primary key)
  user_id: UUID (foreign key → profiles)
  provider: TEXT ('github', 'vercel', etc.)
  access_token: TEXT (encrypted)
  provider_user_id: TEXT
  provider_username: TEXT
  metadata: JSONB
  connected_at: TIMESTAMPTZ
  last_synced_at: TIMESTAMPTZ
}
```

## API Routes

- `GET /api/admin/connections/status` - Get all connection statuses
- `GET /api/admin/connections/github/callback` - OAuth callback handler
- `GET /api/admin/connections/github/repos` - List user's repositories

## Troubleshooting

### "OAuth not configured" error
- Check that `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in `.env.local`
- Restart your dev server after adding environment variables

### "Token expired or invalid" error
- The access token may have been revoked
- Ask user to disconnect and reconnect GitHub

### "Failed to store integration" error
- Check that the database migration has been applied
- Verify the user is authenticated

### Can't see repositories
- Check the token has the correct scopes (`repo`, `read:user`)
- Verify the token is being decrypted correctly
- Check browser console for errors

## Next Steps

- Add token refresh flow for long-lived connections
- Implement webhook handlers for repo events
- Add support for GitHub Apps (more granular permissions)
- Extend to other providers (Vercel, Linear, etc.)
