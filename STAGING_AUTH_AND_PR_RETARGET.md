# Staging Auth Diagnosis & PR Retargeting Report

> **Generated:** 2026-02-18  
> **Repository:** thecubiqo/thecubiqo

---

## 1. Auth Issue Diagnosis on Staging (staging0217)

### Root Cause Found ✅

The auth was broken on staging because the `useSession` hook was making **direct Supabase client-side calls** to the `sessions` table, which were being blocked by **Row Level Security (RLS)** policies. Guest/anonymous users don't have permission to insert or query the `sessions` table directly from the browser.

### Fix Already Applied ✅

The fix was committed in **`3da5392`** ("Auth fix: Add guest session API and update useSession hook") and is now live on both `main` and `staging0217` (both at tip `fd97113`).

**What the fix does:**

1. **New API route** (`src/app/api/session/route.ts`) — Added two new actions:
   - `create_guest_session` — Creates guest sessions server-side using `supabaseAdmin` (service role key, bypasses RLS)
   - `get_session` — Retrieves sessions server-side by ID (bypasses RLS)

2. **Updated `useSession` hook** (`src/hooks/useSession.ts`) — Changed all direct Supabase client calls to use the API route instead:
   - `handleGuestUser()` — Now calls `/api/session` with `create_guest_session` and `get_session` actions instead of `supabase.from('sessions').insert()`
   - `refreshSession()` — Now calls `/api/session` with `get_session` action
   - `createGuestSession()` — Now calls `/api/session` with `create_guest_session` action
   - Removed `supabase` from dependency arrays since it's no longer used directly

### CI Failure (Separate Issue)

The CI failure on staging0217 was **not auth-related**. It was a `npm ci` lockfile mismatch (`fs.realpath@1.0.0`, `inflight@1.0.6`, `path-is-absolute@1.0.1` missing from lock file). This was fixed in subsequent commits that updated `package-lock.json`.

### Current Status

| Branch | Tip SHA | Auth Fix | Status |
|--------|---------|----------|--------|
| `main` | `fd97113` | ✅ Included | Working |
| `staging0217` | `fd97113` | ✅ Included | Working |
| `production` | `c0428704` | ❌ Not included | Needs sync |

> **Note:** `main` and `staging0217` are currently at the **identical commit** (`fd97113`). The auth fix is present in both.

---

## 2. PR Retargeting: `main` → `staging0217`

### Why Retarget?

The user requested that open PRs be retargeted from `main` to `staging0217` so changes can be tested on staging before being merged to main for production.

### Current State

All 22 open PRs currently target `main`. Since `main` and `staging0217` are at the same commit, retargeting is safe and won't cause conflicts.

### PRs to Retarget

All open draft PRs should have their base branch changed from `main` to `staging0217`:

| PR | Title | Current Base | New Base |
|----|-------|-------------|----------|
| #84 | OpenClaw provider abstraction | main | **staging0217** |
| #86 | PR merge audit tooling | main | **staging0217** |
| #87 | Vercel Analytics test coverage | main | **staging0217** |
| #90 | ParticleLanding feature flag | main | **staging0217** |
| #104 | Vercel deployment docs | main | **staging0217** |
| #105 | Release strategy docs | main | **staging0217** |
| #106 | RGY capsule system docs | main | **staging0217** |
| #107 | Staging DB infrastructure | main | **staging0217** |
| #109 | Developer agent configs | main | **staging0217** |
| #110 | AI App Factory architecture | main | **staging0217** |
| #111 | Cubiqo email/phone fields | main | **staging0217** |
| #112 | Caching, monitoring, security | main | **staging0217** |
| #113 | Emergent platform foundation | main | **staging0217** |
| #114 | Auth & access control | main | **staging0217** |
| #115 | Admin dashboard | main | **staging0217** |
| #116 | Security framework | main | **staging0217** |
| #117 | RGY intelligent matching | main | **staging0217** |
| #118 | Job Hunt Mode | main | **staging0217** |
| #119 | Daily journal page | main | **staging0217** |
| #120 | Multimodal AI | main | **staging0217** |
| #121 | Test open PRs | main | **staging0217** |
| #122 | Branch analysis (this PR) | main | **staging0217** |

### How to Retarget

For each PR, the base branch needs to be changed via GitHub UI or API:
1. Go to the PR page
2. Click "Edit" next to the base branch
3. Change from `main` to `staging0217`
4. Confirm the change

> **⚠️ Note:** I cannot change PR base branches via the git CLI — this requires GitHub API write access or manual UI changes. The repository owner should perform this action.

---

## 3. Recommended Workflow Going Forward

```
Feature branches (copilot/*)
       ↓ merge PRs
   staging0217 (test here first)
       ↓ after validation
      main (production-ready)
       ↓ deploy
    production
```

1. **All PRs should target `staging0217`** for initial testing
2. **After staging validation**, merge `staging0217` → `main`
3. **Deploy from `main`** to production
4. This prevents untested features from reaching production directly
