# Founders Pass Dashboard Fix

## Problem
The FoundersPass dashboard shows: **"Failed to fetch catalog: 500"**

## Root Cause
The `features_catalog` and `user_feature_toggles` tables don't exist in your production Supabase database yet. The migration file exists but hasn't been applied.

---

## Quick Fix (Temporary)
I've added a fallback in the code that will show an empty catalog with a message instead of crashing.

---

## Permanent Solution: Run the Migration

### Step 1: Apply to Production Database

**Option A: Via Supabase Dashboard (Easiest)**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
2. Copy the entire contents of: `supabase/migrations/20260216000001_features_catalog.sql`
3. Paste and click "Run"

**Option B: Via Supabase CLI**
```bash
# Make sure you're logged in
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to production
supabase db push
```

### Step 2: Verify
After running the migration, refresh the dashboard at:
`https://cubiqo.ai/founderspass/dashboard`

You should see the features catalog populated with:
- Social features (Share Journey, Friend Connections, etc.)
- Communication features (Voice Chat, Text Chat, etc.)
- Utility features (Journal, Mood Tracking, etc.)
- Visual design variants (Plasma Wave, Tech Wireframe, etc.)
- Admin features (Feature Dashboard, Analytics, etc.)

---

## What the Migration Does

Creates two tables:

1. **`features_catalog`** - Master list of all features
   - Feature toggles (voice chat, journal, etc.)
   - Design variants (plasma wave, wireframes, etc.)
   - Admin controls

2. **`user_feature_toggles`** - Per-user overrides
   - Users can enable/disable features individually
   - Personal design preferences

---

## Alternative: Local Development

If you want to test locally first:

```bash
# Start local Supabase
supabase start

# Migration will auto-apply
# Dev server will use local DB

# Test at http://localhost:3000/founderspass/dashboard
```

---

## Files Modified
- ✅ `src/app/api/founderspass/catalog/route.ts` - Added fallback
- 📋 Migration exists at: `supabase/migrations/20260216000001_features_catalog.sql`
