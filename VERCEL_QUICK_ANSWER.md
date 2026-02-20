# Vercel Branch Mapping - Quick Reference

**Quick answer to: "What branch connects to which project in Vercel?"**

---

## 🎯 THE ANSWER

**One Vercel Project:** `cubiqo-repo` (or similar name in your dashboard)

**All branches deploy automatically:**

```
main              → Production (www.cubiqo.ai)
production        → Preview (cubiqo-repo-git-production-*.vercel.app)
preview           → Preview (cubiqo-repo-git-preview-*.vercel.app)
staging-environment → Preview (cubiqo-repo-git-staging-environment-*.vercel.app)
[any-branch]      → Preview (cubiqo-repo-git-[branch-name]-*.vercel.app)
```

---

## 📋 Branch-to-URL Table

| Branch | Type | URL |
|--------|------|-----|
| **main** | 🟢 Production | `cubiqo-repo.vercel.app` or custom domain |
| **production** | 🟡 Preview | `cubiqo-repo-git-production-cubiqo-projects.vercel.app` |
| **preview** | 🟡 Preview | `cubiqo-repo-git-preview-cubiqo-projects.vercel.app` |
| **staging-environment** | 🟡 Preview | `cubiqo-repo-git-staging-environment-cubiqo-projects.vercel.app` |
| **copilot/[name]** | 🔵 Preview | `cubiqo-repo-git-copilot-[name]-cubiqo-projects.vercel.app` |
| **Any other branch** | 🔵 Preview | `cubiqo-repo-git-[branch-name]-cubiqo-projects.vercel.app` |

---

## 🏗️ Project Structure

### Current Setup (Active)

```
Vercel Project: cubiqo-repo
│
├─ Production: main branch
│  └─ Domain: www.cubiqo.ai (or default .vercel.app)
│
└─ Preview: All other branches
   └─ Auto-generated URLs
```

### Planned Setup (Not Yet Implemented)

```
Project 1: cubiqo-admin
├─ Branch: production
└─ Domain: admin.cubiqo.com

Project 2: cubiqo-public  
├─ Branch: production
└─ Domain: cubiqo.com
```

**Status:** Single project only (for now)

---

## 🔍 How to Find Your URL

### Method 1: Pattern
```
https://cubiqo-repo-git-[your-branch-name]-cubiqo-projects.vercel.app
```

### Method 2: Vercel Dashboard
1. Go to vercel.com
2. Click your project
3. Click "Deployments"
4. Find your branch

### Method 3: GitHub PR
- Vercel bot comments with preview URL on PRs

---

## ⚡ Quick Commands

```bash
# Deploy current branch (preview)
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# Check which branch
git branch
```

---

## 📊 Deployment Flow

```
Push to branch
    ↓
Vercel auto-builds
    ↓
If main → Production
If other → Preview
```

---

## 🎯 Examples

**Production:**
```
Branch: main
URL: https://cubiqo-repo.vercel.app
or: https://www.cubiqo.ai (if custom domain set)
```

**Preview (production branch):**
```
Branch: production
URL: https://cubiqo-repo-git-production-cubiqo-projects.vercel.app
```

**Preview (copilot branch):**
```
Branch: copilot/compare-backup-with-main
URL: https://cubiqo-repo-git-copilot-compare-backup-with-main-cubiqo-projects.vercel.app
```

---

## 🔑 Key Points

1. ✅ **One project** handles all branches
2. ✅ **Automatic deployments** on every push
3. ✅ **main** = production
4. ✅ **Everything else** = preview
5. ✅ Each branch gets unique URL

---

## 📚 Full Details

See: [VERCEL_BRANCH_TO_PROJECT_MAPPING.md](VERCEL_BRANCH_TO_PROJECT_MAPPING.md)

---

**Generated:** 2026-02-17  
**Status:** Active single-project setup  
**Total Branches:** 62 (all get previews)
