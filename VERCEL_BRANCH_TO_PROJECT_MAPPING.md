# Vercel Branch-to-Project Mapping Guide

**Generated:** 2026-02-17  
**Purpose:** Document which branches connect to which Vercel projects

---

## 🎯 Quick Answer

**Vercel Project:** `cubiqo-repo` (or similar naming in Vercel dashboard)

**Branch Mapping:**
- 🟢 **main** → Production deployment (www.cubiqo.ai or primary domain)
- 🟡 **production** → Preview deployment
- 🟡 **preview** → Preview deployment  
- 🟡 **staging-environment** → Preview deployment
- 🔵 **All other branches** → Automatic preview deployments

---

## 📊 Vercel Deployment Structure

### Current Setup

Based on repository configuration and documentation:

```
Vercel Project: cubiqo-repo
│
├─ Production Deployment (main branch)
│  ├─ Branch: main
│  ├─ Domain: www.cubiqo.ai (or custom domain)
│  └─ Auto-deploys on push to main
│
├─ Preview Deployments (all other branches)
│  ├─ Branch: production
│  │  └─ URL: cubiqo-repo-git-production-cubiqo-projects.vercel.app
│  │
│  ├─ Branch: preview
│  │  └─ URL: cubiqo-repo-git-preview-cubiqo-projects.vercel.app
│  │
│  ├─ Branch: staging-environment
│  │  └─ URL: cubiqo-repo-git-staging-environment-cubiqo-projects.vercel.app
│  │
│  ├─ Branch: copilot/*
│  │  └─ URL: cubiqo-repo-git-[branch-name]-cubiqo-projects.vercel.app
│  │
│  └─ Any feature branch
│     └─ URL: cubiqo-repo-git-[branch-name]-cubiqo-projects.vercel.app
```

---

## 🔗 Branch-to-URL Mapping

### Production Branch

| Branch | Type | Vercel URL | Custom Domain |
|--------|------|------------|---------------|
| **main** | Production | `cubiqo-repo.vercel.app` | www.cubiqo.ai (if configured) |

**Deployment Trigger:** Automatic on push to `main`

---

### Preview Branches

| Branch | Vercel URL | Purpose |
|--------|------------|---------|
| **production** | `cubiqo-repo-git-production-cubiqo-projects.vercel.app` | Production testing branch |
| **preview** | `cubiqo-repo-git-preview-cubiqo-projects.vercel.app` | General preview testing |
| **staging-environment** | `cubiqo-repo-git-staging-environment-cubiqo-projects.vercel.app` | Pre-production staging |
| **backup-main-20260215-224930** | `cubiqo-repo-git-backup-main-20260215-224930-cubiqo-projects.vercel.app` | Backup snapshot |

**Deployment Trigger:** Automatic on push to any of these branches

---

### Feature Branches (Copilot & Others)

All feature branches get automatic preview deployments:

**URL Pattern:**
```
https://cubiqo-repo-git-[branch-name]-cubiqo-projects.vercel.app
```

**Examples:**

| Branch | Preview URL |
|--------|-------------|
| `copilot/debug-code-issues` | `cubiqo-repo-git-copilot-debug-code-issues-cubiqo-projects.vercel.app` |
| `copilot/compare-backup-with-main` | `cubiqo-repo-git-copilot-compare-backup-with-main-cubiqo-projects.vercel.app` |
| `copilot/fix-plasma-wave-visibility` | `cubiqo-repo-git-copilot-fix-plasma-wave-visibility-cubiqo-projects.vercel.app` |
| `feat/top-right-cta-highdef` | `cubiqo-repo-git-feat-top-right-cta-highdef-cubiqo-projects.vercel.app` |

**Deployment Trigger:** Automatic on push to any branch

---

## 🏗️ Planned Multi-Project Setup (From Docs)

The deployment checklist suggests a **future** two-project setup:

### Project A: cubiqo-admin

**Branch:** `production` (or dedicated admin branch)  
**Domain:** admin.cubiqo.com  
**Purpose:** Admin interface with full features

**Environment:**
- `NEXT_PUBLIC_ADMIN_MODE=true`
- Full API management
- Analytics dashboard
- User management
- All API keys

### Project B: cubiqo-public

**Branch:** `production` (or dedicated public branch)  
**Domain:** cubiqo.com  
**Purpose:** Public interface with rate limiting

**Environment:**
- `NEXT_PUBLIC_ADMIN_MODE=false`
- BYO keys mode enabled
- Rate limiting active
- Limited features

**Status:** 📝 Planned but not yet implemented

---

## 🔍 How to Find Your Deployment URLs

### Method 1: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Select your project (likely "cubiqo-repo" or similar)
3. Click "Deployments"
4. Find your branch in the list
5. Click to view deployment URL

### Method 2: GitHub Integration

1. Go to your GitHub repository
2. Click on "Environments" (if configured)
3. Or check PR comments - Vercel bot posts preview URLs

### Method 3: Git Push Response

When you push to any branch, Vercel automatically deploys and the URL appears in:
- GitHub PR comments (if PR exists)
- Vercel dashboard
- Email notifications (if configured)

### Method 4: URL Pattern

Manually construct URL:
```
https://[project-name]-git-[branch-name]-[team-name].vercel.app
```

For this repo:
```
https://cubiqo-repo-git-[your-branch-name]-cubiqo-projects.vercel.app
```

---

## ⚙️ Vercel Configuration

### vercel.json

Located at: `/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": [
    "iad1"
  ],
  "crons": [
    {
      "path": "/api/cron/self-heal",
      "schedule": "0 10 * * *"
    }
  ]
}
```

**Key Points:**
- Framework: Next.js
- Region: iad1 (US East)
- Cron job configured for self-healing

---

## 🌍 Environment-Specific Deployments

### Production Environment (main branch)

**Variables:**
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://www.cubiqo.ai`
- All API keys (Anthropic, OpenRouter, ElevenLabs, etc.)
- Supabase production credentials

### Preview Environment (all other branches)

**Variables:**
- `VERCEL_ENV=preview`
- Can use separate dev database
- Test with mock data (optional)
- Limited API keys (optional)

**Note:** Preview deployments currently share production Supabase. Consider setting up separate dev database.

---

## 🚀 Deployment Workflow

### Automatic Deployments

```
1. Developer pushes to branch
   ↓
2. GitHub webhook triggers Vercel
   ↓
3. Vercel builds the branch
   ↓
4. Deployment succeeds
   ↓
5. Preview URL available
   ↓
6. (If main) Production updated
```

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy current branch to preview
vercel

# Deploy to production
vercel --prod

# Deploy specific project (if multi-project)
vercel --prod --name cubiqo-admin
```

---

## 📋 Branch Strategy & Deployment Flow

### Recommended Flow

```
feature/new-feature
    ↓ (preview deployment)
    ↓ Test & verify
    ↓
copilot/implement-feature
    ↓ (preview deployment)
    ↓ Code review
    ↓
staging-environment
    ↓ (preview deployment)
    ↓ Final testing
    ↓
main
    ↓ (production deployment)
    ↓ Live on www.cubiqo.ai
```

### Current Practice

Based on branch analysis:
- **62 branches** exist in repository
- **4 active deployment branches**: main, production, staging-environment, preview
- **50+ feature branches** (mostly copilot/*) get preview deployments

---

## 🔐 Environment Variables by Branch

### All Branches (Shared)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Framework-specific variables

### Production Only (main branch)

- All API keys (production)
- Production database credentials
- OAuth secrets
- Analytics keys

### Preview Branches (Optional Separate Config)

- Dev database credentials
- Test API keys
- Mock data flags

**How to set:** Vercel Dashboard → Project Settings → Environment Variables → Select environment (Production/Preview/Development)

---

## 🎯 Quick Reference Card

| What | Where | URL Pattern |
|------|-------|-------------|
| **Production** | main branch | `cubiqo-repo.vercel.app` or custom domain |
| **Staging** | staging-environment | `cubiqo-repo-git-staging-environment-[...].vercel.app` |
| **Preview** | preview branch | `cubiqo-repo-git-preview-[...].vercel.app` |
| **Production Test** | production branch | `cubiqo-repo-git-production-[...].vercel.app` |
| **Any Feature** | any branch | `cubiqo-repo-git-[branch-name]-[...].vercel.app` |

**Project Name:** `cubiqo-repo` (or check your Vercel dashboard)  
**Team/Org:** `cubiqo-projects` (or your Vercel team name)

---

## 🔧 Troubleshooting

### Preview Deployment Not Appearing?

1. **Check Vercel Dashboard** → Deployments → Find your branch
2. **Check GitHub Integration** → Ensure Vercel app is installed
3. **Check Build Logs** → Deployment might have failed
4. **Verify Branch Pushed** → `git push origin [branch-name]`

### Wrong Environment Variables?

1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Select correct environment (Production/Preview/Development)
4. Update variables
5. Redeploy

### Production Not Updating?

1. Verify push went to `main` branch
2. Check Vercel deployment status
3. Check build logs for errors
4. Try manual deployment: `vercel --prod`

---

## 📚 Related Documentation

- **Full Deployment Guide:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Preview Testing:** [PREVIEW_QUICK_REF.txt](PREVIEW_QUICK_REF.txt)
- **Branch Analysis:** [MULTI_BRANCH_ANALYSIS.md](MULTI_BRANCH_ANALYSIS.md)
- **Environment Setup:** [HOW_TO_PREVIEW.md](HOW_TO_PREVIEW.md)

---

## 📞 Need Help?

**Vercel Issues:**
- Check [Vercel Status](https://vercel.com/status)
- Review [Vercel Docs](https://vercel.com/docs)
- Contact Vercel support

**Repository Issues:**
- Check GitHub Actions for CI/CD status
- Review build logs in Vercel
- Tag @mo (CTO) for technical questions

---

## ✅ Summary

**Single Vercel Project Setup:**
- ✅ One Vercel project: `cubiqo-repo`
- ✅ Production: `main` branch
- ✅ Preview: All other branches (automatic)
- ✅ Custom domains: Can be configured per environment

**Multi-Project Setup (Planned):**
- 📝 Two projects planned: `cubiqo-admin` + `cubiqo-public`
- 📝 Separate domains: admin.cubiqo.com + cubiqo.com
- 📝 Different environment configs
- 📝 Not yet implemented

**Current Status:** Single project with automatic preview deployments for all branches.

---

**Generated:** 2026-02-17  
**Last Updated:** Based on current repository state  
**Vercel Version:** Latest (auto-updated)
