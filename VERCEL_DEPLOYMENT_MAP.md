# Vercel Deployment Map: Branch → Project → URL

> **Last Updated:** 2026-02-18  
> **Repository:** [thecubiqo/thecubiqo](https://github.com/thecubiqo/thecubiqo)  
> **Vercel Team:** `cubiqo-projects`

---

## Quick Reference

| Git Branch | Vercel Environment | Domain / URL | Supabase DB |
|---|---|---|---|
| **`main`** | **Production** | `cubiqo.ai` / `www.cubiqo.ai` | `cubiqo-production` |
| **`staging0217`** | Preview | `cubiqo-repo-git-staging0217-cubiqo-projects.vercel.app` | `cubiqo-staging` (`naoxezcmcauecawchgjk`) |
| **`production`** | Preview | `cubiqo-repo-git-production-cubiqo-projects.vercel.app` | (uses production keys if configured) |
| **Any other branch** | Preview (auto) | `cubiqo-repo-git-{branch}-cubiqo-projects.vercel.app` | (inherits Preview env vars) |

---

## Detailed Breakdown

### 1. Production Environment — `main` branch

| Setting | Value |
|---|---|
| **Vercel Project** | `cubiqo-repo` (in `cubiqo-projects` team) |
| **Production Branch** | `main` |
| **Auto-Deploy** | ✅ Yes — every push to `main` triggers a production deployment |
| **Custom Domain** | `cubiqo.ai`, `www.cubiqo.ai` |
| **Vercel URL** | `cubiqo-repo.vercel.app` |
| **Supabase Project** | `cubiqo-production` |
| **Key Env Vars** | `NEXT_PUBLIC_SUPABASE_URL` → production Supabase |
|  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` → production anon key |
|  | `SUPABASE_SERVICE_ROLE_KEY` → production service role key |
|  | `NEXT_PUBLIC_RP_ID` → `cubiqo.ai` |
|  | `NEXT_PUBLIC_ORIGIN` → `https://cubiqo.ai` |

> **Note:** The `main` branch is the Vercel production branch. Pushing or merging to `main` triggers a live deployment to `cubiqo.ai`.

---

### 2. Staging Environment — `staging0217` branch

| Setting | Value |
|---|---|
| **Vercel Project** | `cubiqo-repo` (same project, Preview environment) |
| **Branch** | `staging0217` |
| **Auto-Deploy** | ✅ Yes — as a Vercel Preview deployment |
| **Preview URL** | `cubiqo-repo-git-staging0217-cubiqo-projects.vercel.app` |
| **Supabase Project** | `cubiqo-staging` (`naoxezcmcauecawchgjk`) |
| **Key Env Vars** | `NEXT_PUBLIC_SUPABASE_URL` → staging Supabase |
|  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` → staging anon key |
|  | `SUPABASE_SERVICE_ROLE_KEY` → staging service role key |
|  | `NEXT_PUBLIC_RP_ID` → `cubiqo-staging.vercel.app` |
|  | `NEXT_PUBLIC_ORIGIN` → `https://cubiqo-staging.vercel.app` |

> **Note:** `staging0217` is currently identical to `main` (same commit `fd97113`). It uses Preview environment variables in Vercel, pointing to the staging Supabase database.

---

### 3. Legacy Production Branch — `production`

| Setting | Value |
|---|---|
| **Vercel Project** | `cubiqo-repo` (same project, Preview environment) |
| **Branch** | `production` |
| **Auto-Deploy** | ✅ Yes — as a Vercel Preview deployment |
| **Preview URL** | `cubiqo-repo-git-production-cubiqo-projects.vercel.app` |
| **Status** | ⚠️ Behind `main` — missing recent auth fixes and features |

> **Note:** Despite its name, the `production` branch does **not** deploy to the production domain. It deploys as a Preview. The actual production deployment comes from `main`.

---

### 4. Feature/Copilot Branches — Preview Deployments

| Setting | Value |
|---|---|
| **Vercel Project** | `cubiqo-repo` (same project, Preview environment) |
| **Branches** | Any branch pushed to origin |
| **Auto-Deploy** | ✅ Yes — each branch gets an automatic Preview deployment |
| **URL Pattern** | `cubiqo-repo-git-{branch-name}-cubiqo-projects.vercel.app` |

**Example Preview URLs:**

| Branch | Preview URL |
|---|---|
| `copilot/debug-code-issues` | `cubiqo-repo-git-copilot-debug-code-issues-cubiqo-projects.vercel.app` |
| `copilot/verify-branch-features` | `cubiqo-repo-git-copilot-verify-branch-features-cubiqo-projects.vercel.app` |
| `merge-all-features` | `cubiqo-repo-git-merge-all-features-cubiqo-projects.vercel.app` |

> **Note:** Preview deployments use Preview environment variables from Vercel. Branch names with `/` are converted to `-` in the URL.

---

## Planned (Not Yet Active)

The `DEPLOYMENT_CHECKLIST.md` references a planned two-project setup that has **not yet been implemented**:

| Planned Project | Domain | Purpose | Status |
|---|---|---|---|
| `cubiqo-admin` | `admin.cubiqo.com` | Admin interface | ❌ Not created |
| `cubiqo-public` | `cubiqo.com` | Public interface | ❌ Not created |

These would be separate Vercel projects with different environment variables (admin mode enabled vs. BYO keys mode). This is a future enhancement.

---

## Environment Variable Naming

Vercel uses a suffix convention for production vs. staging env vars:

| Variable | Production (main) | Staging (staging0217) |
|---|---|---|
| Supabase URL | `NEXT_PUBLIC_SUPABASE_URL1` or `NEXT_PUBLIC_SUPABASE_URL` | Same key names, different values |
| Supabase Anon Key | `NEXT_PUBLIC_SUPABASE_ANON_KEY1` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same key names, different values |
| Service Role Key | `SUPABASE_SERVICE_ROLE_KEY1` or `SUPABASE_SERVICE_ROLE_KEY` | Same key names, different values |
| MiniMax Key | `MINIMAX_KEY` or `MINIMAX_API_KEY` | Same key names, different values |

> The `1` suffix exists because of Vercel's production environment variable configuration. The codebase supports both with fallback: `process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL`

---

## CI/CD Workflows (GitHub Actions)

These run on GitHub Actions, **not** on Vercel:

| Workflow | Trigger | Branches |
|---|---|---|
| `ci.yml` (Build & Test) | Push + PR | `main`, `develop` |
| `chromatic.yml` (Visual Tests) | Push + PR | `main`, `develop` |
| `self-heal-cron.yml` | Scheduled | (cron) |

---

## How to Verify in Vercel Dashboard

1. Go to [vercel.com/cubiqo-projects](https://vercel.com/cubiqo-projects)
2. Select the `cubiqo-repo` project
3. **Settings → Git → Production Branch** → Should show `main`
4. **Deployments** tab → Shows all branch deployments with URLs
5. **Settings → Environment Variables** → Shows Production vs. Preview vs. Development variable sets
