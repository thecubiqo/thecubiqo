# Quick Reference: Branches & Deployment

## 📌 Quick Answers

### 1. Production vs Main Branch?

**Production** 🚀
- **Purpose:** Live production code
- **Vercel:** ✅ Auto-deploys to cubiqo.ai
- **Commits:** Clean, semantic (feat:, fix:, chore:)
- **Status:** Stable, always deployable

**Main** 🔨
- **Purpose:** Development/staging
- **Vercel:** Preview deployments only
- **Commits:** Auto-commits from tools
- **Status:** Testing, integration

**Winner for Auto-Deploy:** `production` branch ✅

---

### 2. Where's the Validated Code?

**Branch:** `copilot/debug-code-issues` ✨

**What's Fixed:**
- ✅ Auth 404 error → Now has proper error page
- ✅ Environment validation → Complete .env.example
- ✅ Sign-in flow → Verified working
- ✅ Documentation → Comprehensive guides
- ✅ Security → 0 vulnerabilities
- ✅ Code review → Passed

**Status:** Ready to merge to production 🎯

---

### 3. What's the Production Tag For?

**Tag:** `v1.0.0-prod`

**Purpose:**
1. 📚 **Version History** - Track releases
2. ⏮️ **Rollback** - Quick revert if needed
3. 📝 **Release Notes** - Document changes
4. 🎯 **Deployment Tracking** - Know what's live

**Usage:**
```bash
# Create new production tag
git tag -a v1.1.0-prod -m "Release notes"
git push origin v1.1.0-prod

# Rollback to previous version
git checkout v1.0.0-prod
vercel deploy --prod
```

---

## 🚀 Common Commands

### Deploy to Production
```bash
# Via PR (recommended)
git checkout copilot/debug-code-issues
git push origin copilot/debug-code-issues
# Create PR → production
# Merge → Auto-deploys via Vercel

# Tag the release
git checkout production
git pull origin production
git tag -a v1.1.0-prod -m "Your release notes"
git push origin v1.1.0-prod
```

### Check Current Status
```bash
# List all branches
git branch -a

# See production commits
git log origin/production --oneline -10

# Compare branches
git log production..main --oneline

# List production tags
git tag -l "*-prod"
```

### Rollback Production
```bash
# Find previous tag
git tag -l "*-prod"

# Checkout previous version
git checkout v1.0.0-prod

# Force push to production (use carefully!)
git push origin HEAD:production --force

# Or revert specific commits
git revert <commit-hash>
git push origin production
```

---

## 📊 Branch Status (2026-02-14)

| Branch | Commit | Status | Action |
|--------|--------|--------|--------|
| production | 94e6e86 | ✅ Live | Current production |
| main | 44aaf99 | 🔨 Dev | Testing ground |
| copilot/debug-code-issues | d12013a | ⭐ Ready | **Merge this!** |

---

## 🎯 Recommended Next Steps

1. **Review the fixes** in `copilot/debug-code-issues`
2. **Create PR** to `production` branch
3. **Merge and deploy** (auto via Vercel)
4. **Tag release** as `v1.1.0-prod`
5. **Monitor** deployment in Vercel dashboard

---

For complete details, see: [BRANCHES.md](./BRANCHES.md)
