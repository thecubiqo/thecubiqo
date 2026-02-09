# 🚀 Deployment #4: GitHub Connection - Checklist

## ✅ Completed

### 1. Database Migration
- [x] Created `user_integrations` table schema
- [x] Added RLS policies for security
- [x] Added indexes for performance
- [x] Created auto-update trigger for `updated_at`

**File:** `supabase/migrations/20240209_user_integrations.sql`

### 2. Token Encryption
- [x] Implemented AES-256-GCM encryption
- [x] Created `encryptToken()` function
- [x] Created `decryptToken()` function
- [x] Uses ENCRYPTION_KEY from environment

**File:** `src/lib/utils/encryption.ts`

### 3. API Routes
- [x] Created OAuth callback handler
- [x] Implemented token exchange with GitHub
- [x] Fetch and store GitHub user info
- [x] Encrypt tokens before database storage
- [x] Created repos listing endpoint
- [x] Created connection status endpoint

**Files:**
- `src/app/api/admin/connections/github/callback/route.ts`
- `src/app/api/admin/connections/github/repos/route.ts`
- `src/app/api/admin/connections/status/route.ts`

### 4. UI Components
- [x] Updated ConnectionsPanel with real API calls
- [x] Show connection status dynamically
- [x] Display connected GitHub username
- [x] "View Repositories" button
- [x] Repository listing with details
- [x] Loading states
- [x] Error handling

**File:** `src/components/admin/ConnectionsPanel.tsx`

### 5. Types
- [x] Added `user_integrations` to database types
- [x] Proper TypeScript interfaces

**File:** `src/types/database.types.ts`

### 6. Documentation
- [x] Created GitHub setup guide
- [x] OAuth flow documentation
- [x] Security features explained
- [x] Troubleshooting guide

**File:** `docs/GITHUB_SETUP.md`

### 7. Environment Variables
- [x] Updated `.env.example` with GitHub OAuth vars
- [x] Added ENCRYPTION_KEY requirement

**File:** `.env.example`

---

## 🔧 Setup Required

### 1. Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Name: `CubiQo - Founder Portal`
   - Homepage: `http://localhost:3000` (dev) or your production URL
   - Callback: `http://localhost:3000/api/admin/connections/github/callback`
4. Click "Register application"
5. Copy **Client ID** and **Client Secret**

### 2. Configure Environment

Add to `.env.local`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here

# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your_32_char_key_here
```

**Generate encryption key:**
```bash
openssl rand -base64 32
```

### 3. Apply Database Migration

**Option A: Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy contents of: `supabase/migrations/20240209_user_integrations.sql`
3. Paste and run in SQL Editor

**Option B: Run helper script**
```bash
node scripts/apply-migration.js
# Follow instructions to copy SQL and run manually
```

### 4. Test the Flow

```bash
npm run dev
```

1. Navigate to `/admin`
2. Click "Connect GitHub"
3. Authorize on GitHub
4. Verify redirect back with success
5. Click "View Repositories"
6. Confirm repos are displayed

---

## 🚨 Pre-Deployment Checklist

- [ ] GitHub OAuth app created
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Encryption key generated and set
- [ ] Tested OAuth flow locally
- [ ] Verified tokens are encrypted in database
- [ ] Tested repository listing
- [ ] Verified RLS policies work
- [ ] Updated callback URL for production
- [ ] Committed all changes
- [ ] Ready to deploy

---

## 🎯 What This Deployment Includes

### OAuth Flow
1. User clicks "Connect GitHub" → Redirects to GitHub
2. User authorizes → GitHub redirects to callback
3. Callback exchanges code for token
4. Token encrypted with AES-256-GCM
5. Stored securely in `user_integrations` table
6. User sees "Connected" status

### Security Features
- ✅ AES-256-GCM encryption for tokens
- ✅ Row-level security (users can only see their own integrations)
- ✅ State parameter for CSRF protection
- ✅ Scoped access (only `repo` and `read:user`)
- ✅ Service role key separated from client code

### UI Features
- ✅ Real-time connection status
- ✅ Display GitHub username
- ✅ View repositories button
- ✅ Repository details (name, description, language, stars, forks)
- ✅ Private repo indicator
- ✅ Loading states
- ✅ Error handling

---

## 📝 Commit Message

```
feat: GitHub OAuth connection flow for Founder Portal

Implements complete GitHub OAuth integration:
- OAuth callback with token exchange
- AES-256-GCM token encryption
- User integrations database table
- Repository listing API
- ConnectionsPanel UI updates
- Comprehensive documentation

Security features:
- Encrypted token storage
- Row-level security policies
- CSRF protection with state parameter

Files added:
- src/app/api/admin/connections/github/callback/route.ts
- src/app/api/admin/connections/github/repos/route.ts
- src/app/api/admin/connections/status/route.ts
- src/lib/utils/encryption.ts
- supabase/migrations/20240209_user_integrations.sql
- docs/GITHUB_SETUP.md

Files modified:
- src/components/admin/ConnectionsPanel.tsx
- src/types/database.types.ts
- .env.example

Ready to deploy ✅
```

---

## 🔄 Next Steps (Future Enhancements)

- [ ] Add token refresh flow
- [ ] Implement disconnect functionality
- [ ] Add webhook handlers for repo events
- [ ] Support GitHub Apps for granular permissions
- [ ] Add Vercel OAuth integration
- [ ] Add Linear integration
- [ ] Show recent commits/activity
- [ ] Auto-deploy on push to connected repo
