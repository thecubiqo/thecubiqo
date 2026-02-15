# Preview Mode

This document explains how to run CubiQo in preview mode without requiring Supabase configuration.

## Overview

CubiQo can now run in **preview mode** when Supabase credentials are not available. This is useful for:
- Preview deployments (Vercel, Netlify, etc.)
- Local development without database setup
- Testing UI changes without backend configuration
- Demo environments

## How It Works

The application detects missing Supabase environment variables and gracefully handles them:

1. **Proxy Middleware** (`src/proxy.ts`): Skips Supabase session handling if credentials are missing
2. **Server Client** (`src/lib/supabase/server.ts`): Uses placeholder values as fallback
3. **Browser Client** (`src/lib/supabase/client.ts`): Already has placeholder support

## Configuration

### For Local Development

Create a `.env.local` file with placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
```

The application will run, but authentication and data persistence features will not work.

### For Preview Deployments

Preview deployments (e.g., Vercel preview branches) can run without setting Supabase environment variables. The application will:

✅ Load successfully  
✅ Display the UI  
✅ Show guest mode features  
❌ Authentication will not work  
❌ Data persistence will not work  

## Limitations in Preview Mode

When running without real Supabase credentials:

- **No Authentication**: Users cannot sign in or create accounts
- **No Data Persistence**: Journal entries, conversations, and settings are not saved
- **Guest Mode Only**: All features that require authentication are disabled
- **No Real-time Updates**: Database subscriptions are not available

## Full Setup

For full functionality, provide real Supabase credentials:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys from Project Settings → API
3. Set environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
```

4. Run database migrations (see [README.md](./README.md))

## Testing

To test preview mode locally:

```bash
# Start with placeholder credentials
npm run dev

# The app should load at http://localhost:3000
# You'll see guest mode without authentication errors
```

To test with full functionality:

```bash
# Set real Supabase credentials in .env.local
# Then start the dev server
npm run dev
```

## Troubleshooting

### Error: "Your project's URL and Key are required..."

This error should no longer appear after the preview mode changes. If you still see it:

1. Check that you have `.env.local` with placeholder values
2. Restart the dev server
3. Clear Next.js cache: `rm -rf .next`

### Features Not Working

If you need authentication or data persistence:
- Set up a real Supabase project
- Add proper credentials to `.env.local` or deployment environment

## Changes Made

### Files Modified

1. **`src/proxy.ts`**
   - Added check for missing Supabase credentials
   - Returns early if credentials not configured
   - Prevents runtime errors in preview deployments

2. **`src/lib/supabase/server.ts`**
   - Changed from `!` assertion to fallback values
   - Uses placeholder URLs when env vars are missing
   - Maintains compatibility with existing code

3. **`.env.local`** (created, not committed)
   - Provides placeholder values for local development
   - Excluded from git via `.gitignore`

## Related Documentation

- [README.md](./README.md) - Main project documentation
- [PREVIEW_AND_INTEGRATION_GUIDE.md](./PREVIEW_AND_INTEGRATION_GUIDE.md) - Vercel preview deployments
- [AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md) - Authentication issues
